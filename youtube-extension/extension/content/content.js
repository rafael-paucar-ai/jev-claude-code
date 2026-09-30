(function () {
  const Adapter = globalThis.YTJevAdapter;
  if (!Adapter) return;

  const BATCH_SIZE = 8;
  const BATCH_WAIT_MS = 220;
  const SCAN_DEBOUNCE_MS = 180;
  const MAX_CONCURRENT_BATCHES = 2;
  const cardState = new WeakMap();
  const cardsByVideo = new Map();
  const results = new Map();
  const queuedIds = new Set();
  const inflightIds = new Set();
  const queue = [];
  let mutationTimer;
  let batchTimer;
  let activeBatches = 0;
  let debugEnabled = true;

  const stats = {
    detected: 0,
    queued: 0,
    evaluated: 0,
    cached: 0,
    errors: 0,
    latencyMs: 0
  };

  const intersection = new IntersectionObserver(onIntersect, {
    root: null,
    rootMargin: '1200px 0px',
    threshold: 0.01
  });

  function onIntersect(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const state = cardState.get(entry.target);
      if (state) enqueue(state.metadata, entry.target, entry.intersectionRatio > 0 ? 0 : 1);
      intersection.unobserve(entry.target);
    }
  }

  function registerCard(card) {
    const metadata = Adapter.extract(card);
    if (!metadata) return;
    const previous = cardState.get(card);
    if (previous?.metadata.videoId === metadata.videoId && previous.metadata.title === metadata.title) return;
    if (previous) {
      const previousSet = cardsByVideo.get(previous.metadata.videoId);
      previousSet?.delete(card);
      if (previousSet?.size === 0) cardsByVideo.delete(previous.metadata.videoId);
    }
    clearDecoration(card);
    cardState.set(card, { metadata });
    if (!cardsByVideo.has(metadata.videoId)) cardsByVideo.set(metadata.videoId, new Set());
    cardsByVideo.get(metadata.videoId).add(card);
    stats.detected += 1;
    const cached = results.get(metadata.videoId);
    if (cached) applyResult(card, cached);
    else intersection.observe(card);
  }

  function scan() {
    if (!Adapter.isHome()) {
      removeDebugPanel();
      return;
    }
    for (const [videoId, cardSet] of cardsByVideo) {
      for (const card of cardSet) {
        if (!card.isConnected) cardSet.delete(card);
      }
      if (cardSet.size === 0) cardsByVideo.delete(videoId);
    }
    Adapter.cards().forEach(registerCard);
    renderDebug();
  }

  function scheduleScan() {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(scan, SCAN_DEBOUNCE_MS);
  }

  function enqueue(metadata, card, priority) {
    const id = metadata.videoId;
    if (results.has(id)) return applyResult(card, results.get(id));
    if (queuedIds.has(id) || inflightIds.has(id)) return;
    queuedIds.add(id);
    queue.push({ metadata, priority, queuedAt: performance.now() });
    queue.sort((a, b) => a.priority - b.priority || a.queuedAt - b.queuedAt);
    stats.queued += 1;
    markPending(id);
    renderDebug();
    if (queue.length >= BATCH_SIZE) drain();
    else if (!batchTimer) batchTimer = setTimeout(drain, BATCH_WAIT_MS);
  }

  function drain() {
    clearTimeout(batchTimer);
    batchTimer = null;
    while (activeBatches < MAX_CONCURRENT_BATCHES && queue.length) {
      const batch = queue.splice(0, BATCH_SIZE);
      batch.forEach(({ metadata }) => {
        queuedIds.delete(metadata.videoId);
        inflightIds.add(metadata.videoId);
      });
      activeBatches += 1;
      scoreBatch(batch).finally(() => {
        activeBatches -= 1;
        if (queue.length) drain();
      });
    }
  }

  async function scoreBatch(batch) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'YT_JEV_SCORE_BATCH',
        videos: batch.map((item) => item.metadata)
      });
      if (!response?.ok) throw new Error(response?.error || 'score_failed');
      stats.latencyMs = response.latencyMs || 0;
      for (const result of response.results || []) {
        inflightIds.delete(result.videoId);
        results.set(result.videoId, result);
        stats.evaluated += 1;
        if (result.cached) stats.cached += 1;
        applyToVideo(result.videoId, result);
      }
    } catch (error) {
      stats.errors += batch.length;
      batch.forEach(({ metadata }) => {
        inflightIds.delete(metadata.videoId);
        markError(metadata.videoId, error.message);
      });
    } finally {
      renderDebug();
    }
  }

  function level(score) {
    if (score >= 90) return { key: 'priority', label: 'PRIORITARIO' };
    if (score >= 70) return { key: 'review', label: 'REVISAR' };
    if (score >= 40) return { key: 'low', label: 'BAJA PRIORIDAD' };
    return { key: 'ignore', label: 'IGNORAR' };
  }

  function ensureOverlay(card) {
    let overlay = card.querySelector(':scope > .yt-jev-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'yt-jev-overlay';
    overlay.setAttribute('aria-live', 'off');
    const badge = document.createElement('span');
    badge.className = 'yt-jev-badge';
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'yt-jev-reveal';
    reveal.textContent = 'Mostrar';
    reveal.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      card.classList.toggle('yt-jev-revealed');
      reveal.textContent = card.classList.contains('yt-jev-revealed') ? 'Atenuar' : 'Mostrar';
      reveal.setAttribute('aria-pressed', String(card.classList.contains('yt-jev-revealed')));
    });
    overlay.append(badge, reveal);
    card.append(overlay);
    return overlay;
  }

  function applyResult(card, result) {
    clearDecoration(card);
    const state = level(result.score);
    card.classList.add('yt-jev-card', `yt-jev-${state.key}`);
    card.dataset.ytJevScore = String(result.score);
    const overlay = ensureOverlay(card);
    overlay.querySelector('.yt-jev-badge').textContent = `${state.label} · ${result.score}`;
    overlay.querySelector('.yt-jev-reveal').hidden = state.key !== 'ignore';
  }

  function applyToVideo(videoId, result) {
    cardsByVideo.get(videoId)?.forEach((card) => applyResult(card, result));
  }

  function markPending(videoId) {
    cardsByVideo.get(videoId)?.forEach((card) => {
      card.classList.add('yt-jev-card', 'yt-jev-pending');
      ensureOverlay(card).querySelector('.yt-jev-badge').textContent = 'Evaluando…';
    });
  }

  function markError(videoId, message) {
    cardsByVideo.get(videoId)?.forEach((card) => {
      card.classList.remove('yt-jev-pending');
      const badge = ensureOverlay(card).querySelector('.yt-jev-badge');
      badge.textContent = 'Sin evaluar';
      badge.title = message;
    });
  }

  function clearDecoration(card) {
    card.classList.remove('yt-jev-card', 'yt-jev-pending', 'yt-jev-priority', 'yt-jev-review', 'yt-jev-low', 'yt-jev-ignore', 'yt-jev-revealed');
    delete card.dataset.ytJevScore;
    card.querySelector(':scope > .yt-jev-overlay')?.remove();
  }

  function renderDebug() {
    if (!debugEnabled || !Adapter.isHome()) return removeDebugPanel();
    let panel = document.getElementById('yt-jev-debug');
    if (!panel) {
      panel = document.createElement('aside');
      panel.id = 'yt-jev-debug';
      panel.setAttribute('aria-label', 'Estado de YouTube Jev Relevance');
      document.documentElement.append(panel);
    }
    panel.innerHTML = `
      <strong>Jev · Home</strong>
      <dl>
        <div><dt>Detected</dt><dd>${stats.detected}</dd></div>
        <div><dt>Queued</dt><dd>${queue.length}</dd></div>
        <div><dt>Evaluated</dt><dd>${stats.evaluated}</dd></div>
        <div><dt>Cached</dt><dd>${stats.cached}</dd></div>
        <div><dt>Errors</dt><dd>${stats.errors}</dd></div>
        <div><dt>Jev latency</dt><dd>${stats.latencyMs ? `${stats.latencyMs} ms` : '—'}</dd></div>
      </dl>`;
  }

  function removeDebugPanel() {
    document.getElementById('yt-jev-debug')?.remove();
  }

  chrome.storage.local.get({ debugEnabled: true }, (stored) => {
    debugEnabled = stored.debugEnabled;
    renderDebug();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.debugEnabled) {
      debugEnabled = changes.debugEnabled.newValue;
      renderDebug();
    }
  });

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('yt-navigate-finish', scheduleScan);
  scan();
})();

