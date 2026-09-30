import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const preferencesUrl = new URL('../preferences.json', import.meta.url);

export async function loadPreferences() {
  const raw = await readFile(preferencesUrl, 'utf8');
  const preferences = JSON.parse(raw);
  for (const key of ['interests', 'prioritize', 'penalize']) {
    if (!Array.isArray(preferences[key]) || preferences[key].some((item) => typeof item !== 'string')) {
      throw new Error(`Invalid preferences.${key}`);
    }
  }
  const normalized = JSON.stringify(preferences);
  const version = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return { preferences, version };
}

