import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPreferences } from '../src/config.js';

test('preferences are valid and produce a stable version', async () => {
  const first = await loadPreferences();
  const second = await loadPreferences();
  assert.equal(first.version, second.version);
  assert.equal(first.version.length, 16);
  assert.ok(first.preferences.interests.includes('Claude Code'));
});

