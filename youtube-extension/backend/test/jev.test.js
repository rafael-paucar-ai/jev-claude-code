import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreVideos } from '../src/jev.js';

test('maps Jev Noul probabilities to 0-100 scores without exposing the key', async () => {
  let request;
  const fetchImpl = async (_url, options) => {
    request = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        model: 'jev-latest',
        answers: {
          video_0: { noul: 0.934 },
          video_1: { noul: 0.121 }
        }
      })
    };
  };
  const response = await scoreVideos({
    apiKey: 'test-secret',
    preferences: { interests: ['AI'], prioritize: ['demos'], penalize: ['generic'] },
    videos: [
      { videoId: 'a', title: 'Demo práctica', channel: 'Dev', views: '10K', publishedAt: 'hoy', url: 'https://youtube.com/watch?v=a' },
      { videoId: 'b', title: 'Tema lejano', channel: 'Other', views: '', publishedAt: '', url: 'https://youtube.com/watch?v=b' }
    ],
    fetchImpl
  });
  assert.deepEqual(response.results, [
    { videoId: 'a', score: 93 },
    { videoId: 'b', score: 12 }
  ]);
  assert.equal(JSON.stringify(request).includes('test-secret'), false);
  assert.equal(Object.keys(request.questions).length, 2);
});
