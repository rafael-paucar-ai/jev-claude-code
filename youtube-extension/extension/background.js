const BACKEND_URL = 'http://127.0.0.1:8788';
const CACHE_KEY = 'ytJevSessionCache';
const CACHE_LIMIT = 1_500;
const inflight = new Map();
let cache = new Map();
let cacheReady;
let lastConfigVersion = null;

async function loadCache() {
  if (cacheReady) return cacheReady;
  cacheReady = chrome.storage.session.get(CACHE_KEY).then((stored) => {
    const raw = stored[CACHE_KEY];
    if (raw && typeof raw === 'object') cache = new Map(Object.entries(raw));
  });
  return cacheReady;
}

let saveTimer;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    const entries = [...cache.entries()].slice(-CACHE_LIMIT);
    await chrome.storage.session.set({ [CACHE_KEY]: Object.fromEntries(entries) });
  }, 500);
}

async function fetchHealth() {
  const response = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  return response.json();
}

function metadataKey(video, configVersion) {
  return `${configVersion}:${video.videoId}:${video.title}:${video.channel}:${video.views}:${video.publishedAt}`;
}

async function scoreBatch(videos) {
  await loadCache();
  const health = await fetchHealth();
  if (!health.ok || !health.typesafeKeyPresent) throw new Error('backend_not_ready');
  if (lastConfigVersion && lastConfigVersion !== health.configVersion) {
    cache.clear();
    scheduleSave();
  }
  lastConfigVersion = health.configVersion;

  const results = [];
  const misses = [];
  for (const video of videos) {
    const key = metadataKey(video, health.configVersion);
    const hit = cache.get(key);
    if (hit) results.push({ ...hit, cached: true });
    else misses.push({ video, key });
  }
  if (!misses.length) {
    return { results, configVersion: health.configVersion, latencyMs: 0, jevCalled: false };
  }

  const signature = misses.map((item) => item.key).sort().join('|');
  let request = inflight.get(signature);
  if (!request) {
    request = fetch(`${BACKEND_URL}/v1/score`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ videos: misses.map((item) => item.video) })
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `backend_${response.status}`);
      return data;
    });
    inflight.set(signature, request);
  }

  try {
    const data = await request;
    for (const result of data.results || []) {
      const miss = misses.find((item) => item.video.videoId === result.videoId);
      if (!miss) continue;
      cache.set(miss.key, result);
      results.push(result);
    }
    scheduleSave();
    return {
      results,
      configVersion: data.configVersion,
      latencyMs: data.latencyMs || 0,
      jevCalled: Boolean(data.jevCalled)
    };
  } finally {
    inflight.delete(signature);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'YT_JEV_SCORE_BATCH') {
    scoreBatch(message.videos || [])
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === 'YT_JEV_HEALTH') {
    fetchHealth()
      .then((health) => sendResponse({ ok: true, health }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  return false;
});

