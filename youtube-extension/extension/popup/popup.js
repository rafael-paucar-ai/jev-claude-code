const debug = document.getElementById('debug');
const health = document.getElementById('health');
const status = document.getElementById('status');

chrome.storage.local.get({ debugEnabled: true }, (stored) => {
  debug.checked = stored.debugEnabled;
});

debug.addEventListener('change', () => {
  chrome.storage.local.set({ debugEnabled: debug.checked });
});

health.addEventListener('click', async () => {
  health.disabled = true;
  status.textContent = 'Comprobando…';
  try {
    const response = await chrome.runtime.sendMessage({ type: 'YT_JEV_HEALTH' });
    status.textContent = response?.ok && response.health?.ok
      ? `Backend listo · config ${response.health.configVersion}`
      : `No disponible · ${response?.error || 'falta la API key'}`;
  } finally {
    health.disabled = false;
  }
});

