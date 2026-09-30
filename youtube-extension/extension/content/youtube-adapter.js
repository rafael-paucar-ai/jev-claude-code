(function () {
  const CARD_SELECTORS = [
    'ytd-rich-item-renderer',
    'ytd-rich-grid-media'
  ];

  function isHome() {
    return location.hostname === 'www.youtube.com' && location.pathname === '/';
  }

  function cards(root = document) {
    if (!isHome()) return [];
    const found = new Set();
    for (const selector of CARD_SELECTORS) {
      root.querySelectorAll?.(selector).forEach((node) => {
        const card = node.closest('ytd-rich-item-renderer') || node;
        if (card.querySelector('a[href*="/watch?v="]')) found.add(card);
      });
    }
    return [...found];
  }

  function text(root, selectors) {
    for (const selector of selectors) {
      const node = root.querySelector(selector);
      const value = (node?.getAttribute('title') || node?.textContent || '').replace(/\s+/g, ' ').trim();
      if (value) return value;
    }
    return '';
  }

  function metadataParts(card) {
    const legacy = [...card.querySelectorAll('#metadata-line span')]
      .map((node) => node.textContent?.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (legacy.length) return legacy;
    return [...card.querySelectorAll('yt-content-metadata-view-model span')]
      .map((node) => node.textContent?.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  function extract(card) {
    const link = card.querySelector('a#video-title-link[href*="/watch?v="], a#video-title[href*="/watch?v="], a[href*="/watch?v="]');
    if (!link) return null;
    let url;
    try {
      url = new URL(link.getAttribute('href'), location.origin);
    } catch {
      return null;
    }
    const videoId = url.searchParams.get('v');
    const title = text(card, ['#video-title', '#video-title-link', 'h3 a']);
    if (!videoId || !title) return null;
    const parts = metadataParts(card);
    return {
      videoId,
      title: title.slice(0, 500),
      channel: text(card, [
        'ytd-channel-name a',
        '#channel-name a',
        'yt-content-metadata-view-model a[href^="/@"]',
        'a[href^="/@"]'
      ]).slice(0, 300),
      views: (parts[0] || '').slice(0, 100),
      publishedAt: (parts[1] || '').slice(0, 100),
      url: `${location.origin}/watch?v=${encodeURIComponent(videoId)}`
    };
  }

  globalThis.YTJevAdapter = { isHome, cards, extract };
})();

