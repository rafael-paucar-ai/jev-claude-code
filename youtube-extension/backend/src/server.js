import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { loadPreferences } from './config.js';
import { scoreVideos } from './jev.js';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number.parseInt(process.env.PORT || '8788', 10);
const MAX_VIDEOS = 10;
const MAX_BODY_BYTES = 64 * 1024;
const CACHE_LIMIT = 2_000;
const cache = new Map();
let activeRequest = Promise.resolve();

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store'
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, { ...corsHeaders(), 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('body_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function cleanString(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validateVideos(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_VIDEOS) return null;
  const seen = new Set();
  const videos = [];
  for (const raw of value) {
    const videoId = cleanString(raw?.videoId, 32);
    const title = cleanString(raw?.title, 500);
    const url = cleanString(raw?.url, 1_000);
    if (!videoId || !title || !url || seen.has(videoId)) continue;
    seen.add(videoId);
    videos.push({
      videoId,
      title,
      channel: cleanString(raw.channel, 300),
      views: cleanString(raw.views, 100),
      publishedAt: cleanString(raw.publishedAt, 100),
      url
    });
  }
  return videos.length ? videos : null;
}

function cacheKey(video, configVersion) {
  return createHash('sha256')
    .update(configVersion)
    .update('\0')
    .update(JSON.stringify(video))
    .digest('hex');
}

function remember(key, result) {
  cache.set(key, result);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
}

async function handleScore(request, response) {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: 'typesafe_key_missing' });

  let body;
  try {
    body = await readJson(request);
  } catch (error) {
    return sendJson(response, error.message === 'body_too_large' ? 413 : 400, { error: error.message });
  }
  const videos = validateVideos(body?.videos);
  if (!videos) return sendJson(response, 400, { error: 'invalid_videos' });

  const { preferences, version: configVersion } = await loadPreferences();
  const results = [];
  const misses = [];
  for (const video of videos) {
    const key = cacheKey(video, configVersion);
    const hit = cache.get(key);
    if (hit) results.push({ ...hit, cached: true });
    else misses.push({ video, key });
  }

  let latencyMs = 0;
  let model = 'jev-latest';
  if (misses.length) {
    console.log(`[jev] request batch=${misses.length}`);
    const call = () => scoreVideos({
      apiKey,
      videos: misses.map((item) => item.video),
      preferences
    });
    const pending = activeRequest.then(call, call);
    activeRequest = pending.then(() => undefined, () => undefined);
    const scored = await pending;
    latencyMs = scored.latencyMs;
    model = scored.model;
    for (const fresh of scored.results) {
      const miss = misses.find((item) => item.video.videoId === fresh.videoId);
      const result = { ...fresh, cached: false };
      remember(miss.key, result);
      results.push(result);
    }
    console.log(`[jev] success batch=${misses.length} latency_ms=${latencyMs}`);
  } else {
    console.log(`[cache] hit batch=${videos.length}`);
  }

  const order = new Map(videos.map((video, index) => [video.videoId, index]));
  results.sort((a, b) => order.get(a.videoId) - order.get(b.videoId));
  sendJson(response, 200, {
    results,
    configVersion,
    latencyMs,
    model,
    provider: 'typesafe',
    jevCalled: misses.length > 0
  });
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (request.method === 'GET' && url.pathname === '/health') {
      const { version: configVersion } = await loadPreferences();
      return sendJson(response, 200, {
        ok: Boolean(process.env.TYPESAFE_API_KEY),
        typesafeKeyPresent: Boolean(process.env.TYPESAFE_API_KEY),
        configVersion
      });
    }
    if (request.method === 'POST' && url.pathname === '/v1/score') {
      return await handleScore(request, response);
    }
    return sendJson(response, 404, { error: 'not_found' });
  } catch (error) {
    const code = error?.name === 'AbortError' ? 'typesafe_timeout' : String(error?.message || 'internal_error');
    console.error(`[error] ${code}`);
    return sendJson(response, 502, { error: code });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[server] listening http://${HOST}:${PORT}`);
  console.log(`[server] TYPESAFE_API_KEY present=${Boolean(process.env.TYPESAFE_API_KEY)}`);
});

