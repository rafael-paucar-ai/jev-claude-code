# YouTube Jev Relevance — MVP

Extensión local Manifest V3 que puntúa las cards del Home de YouTube mediante
Jev y aplica tratamientos visuales reversibles según su relevancia.

El proyecto tiene dos partes:

- `extension/`: extensión unpacked de Chrome.
- `backend/`: servidor local Node.js que conserva `TYPESAFE_API_KEY` y llama
  directamente a la API de Jev.

## Requisitos

- Node.js 22 o superior.
- Una variable de entorno `TYPESAFE_API_KEY` disponible para el proceso del
  backend.
- Chrome o Chromium compatible con Manifest V3.

## Arrancar el backend

Desde `youtube-jev-mvp/backend`:

```powershell
npm run check
npm test
npm start
```

El proceso debe heredar `TYPESAFE_API_KEY`. Puedes confirmar su presencia sin
mostrarla:

```powershell
[bool]$env:TYPESAFE_API_KEY
```

Si la variable se configuró a nivel de usuario después de abrir la terminal,
abre una terminal nueva antes de ejecutar `npm start`.

Por defecto escucha en `http://127.0.0.1:8788`. La clave nunca se devuelve al
navegador ni se imprime. Para verificar salud y versión de configuración:

```powershell
Invoke-RestMethod http://127.0.0.1:8788/health
```

## Cargar la extensión

1. Abre `chrome://extensions`.
2. Activa **Developer mode**.
3. Pulsa **Load unpacked**.
4. Selecciona la carpeta `youtube-jev-mvp/extension`.
5. Abre `https://www.youtube.com/` en el Home y recarga la pestaña.

El popup de la extensión permite activar o desactivar el panel de debug y
probar la conexión con el backend.

## Preferencias

Edita `backend/preferences.json` y reinicia el backend. Su contenido forma
parte de la versión de configuración, por lo que un cambio invalida la caché
relevante.

## Confirmar llamadas reales a Jev

El backend escribe eventos estructurados sin contenido sensible:

```text
[jev] request batch=8
[jev] success batch=8 latency_ms=...
```

Los cache hits se informan por separado y no generan otra llamada a Jev.

