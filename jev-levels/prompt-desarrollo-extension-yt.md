Quiero que construyas desde cero un MVP funcional llamado:

# YouTube Jev Relevance

Debes implementar completamente el proyecto, probarlo y dejar instrucciones exactas de uso. No te limites a proponer arquitectura o escribir pseudocódigo: crea todos los archivos necesarios.

No me hagas preguntas salvo que exista un bloqueo real imposible de resolver mediante una decisión técnica razonable.

## OBJETIVO

Construir una extensión local de Chrome Manifest V3 que funcione exclusivamente en el Home de YouTube.

Mientras el usuario navega por:

<https://www.youtube.com/>

y hace scroll, la extensión debe:

1. Detectar las nuevas cards de videos que YouTube añade al DOM.
2. Extraer la metadata visible de cada video.
3. Priorizar las cards visibles y las próximas a entrar en el viewport.
4. Enviar videos en microbatches a un backend local.
5. Hacer que el backend consulte directamente la API HTTP de Jev.
6. Obtener un score de relevancia entre 0 y 100.
7. Aplicar un tratamiento visual distinto a cada card.
8. Mantener el scroll completamente fluido.
9. Evitar reevaluar videos ya procesados cuando la configuración no ha cambiado.
10. Mostrar un panel opcional de debug para demostrar el procesamiento en tiempo real.

## ALCANCE

Implementa únicamente:

- Home de YouTube;
- extensión Chrome Manifest V3;
- backend local Node.js;
- evaluación de relevancia mediante Jev;
- MutationObserver;
- IntersectionObserver;
- cola, debounce, deduplicación y batching;
- caché de sesión;
- visualización reversible;
- popup mínimo;
- panel de debug;
- pruebas básicas.

No implementes:

- Search;
- Subscriptions;
- Shorts;
- videos laterales de la página Watch;
- YouTube Data API;
- JEV MCP;
- plugins de TypeSafe;
- publicación en Chrome Web Store;
- autenticación de usuarios;
- infraestructura productiva;
- transcripts;
- análisis de imágenes;
- clasificación de “AI slop”;
- frameworks frontend;
- TypeScript;
- bundlers;
- dependencias innecesarias.

Usa JavaScript estándar, CSS y APIs nativas de Chrome. El backend debe usar Node.js 22 o superior y módulos ES.

## ARQUITECTURA OBLIGATORIA

YouTube DOM
→ MutationObserver
→ YouTube DOM Adapter
→ IntersectionObserver
→ queue + debounce + dedupe
→ content script
→ service worker MV3
→ backend local
→ API HTTP de Jev
→ score 0–100
→ actualización visual reversible de la card

## ESTRUCTURA DEL PROYECTO

Crea exactamente una estructura equivalente a:

youtube-jev-mvp/
├── README.md
├── backend/
│   ├── package.json
│   ├── preferences.json
│   ├── src/
│   │   ├── config.js
│   │   ├── jev.js
│   │   └── server.js
│   └── test/
│       ├── config.test.js
│       └── jev.test.js
└── extension/
    ├── manifest.json
    ├── background.js
    ├── content/
    │   ├── youtube-adapter.js
    │   ├── content.js
    │   └── content.css
    └── popup/
        ├── popup.html
        ├── popup.css
        └── popup.js

## PARTE 1 — MANIFEST V3

Crea una extensión Manifest V3 con:

- nombre: YouTube Jev Relevance;
- content script en https://www.youtube.com/*;
- permiso storage;
- host permission exclusivamente para:
  http://127.0.0.1:8788/*
- service worker en background.js;
- popup de la acción;
- content script cargado en document_idle;
- CSS separado.

No solicites permisos más amplios de los necesarios.

La extensión nunca debe:

- contener TYPESAFE_API_KEY;
- recibir TYPESAFE_API_KEY;
- imprimir TYPESAFE_API_KEY;
- llamar directamente a api.typesafe.ai;
- leer variables internas de JavaScript de YouTube;
- utilizar YouTube Data API.

## PARTE 2 — ADAPTER DEL DOM DE YOUTUBE

Implementa youtube-adapter.js como módulo global sencillo disponible para content.js, por ejemplo mediante:

globalThis.YTJevAdapter

Debe exponer como mínimo:

- isHome()
- cards(root)
- extract(card)

isHome() solo debe devolver true cuando:

- hostname sea www.youtube.com;
- pathname sea exactamente "/".

Detecta cards usando selectores defensivos con fallbacks, principalmente:

- ytd-rich-item-renderer
- ytd-rich-grid-media

Procesa únicamente elementos que contengan un enlace:

/watch?v=...

No proceses Shorts.

Extrae, cuando estén disponibles:

- videoId;
- title;
- channel;
- views;
- publishedAt;
- url.

Selectores sugeridos con fallback:

Título:

- #video-title
- #video-title-link
- h3 a
- atributo title cuando exista

Canal:

- ytd-channel-name a
- #channel-name a
- yt-content-metadata-view-model a[href^="/@"]
- a[href^="/@"]

Metadata:

- #metadata-line span
- yt-content-metadata-view-model span

URL y videoId:

- enlace con href que contenga /watch?v=
- usa new URL(href, location.origin)
- obtiene videoId mediante searchParams.get("v")
- normaliza la URL final a:
  https://www.youtube.com/watch?v=VIDEO_ID

Normaliza whitespace.

No inventes metadata ausente. Usa strings vacíos cuando un campo visible no esté disponible.

Deduplica principalmente por videoId.

Ten en cuenta que YouTube puede reciclar nodos. Si un mismo elemento DOM cambia de videoId, elimina su asociación anterior, limpia la decoración vieja y registra la nueva metadata.

Elimina referencias a nodos que ya no estén conectados mediante isConnected para evitar fugas de memoria durante infinite scroll.

## PARTE 3 — DETECCIÓN Y PRIORIZACIÓN

En content.js implementa:

MutationObserver:

- observa cambios childList + subtree;
- aplica debounce de aproximadamente 180 ms;
- no realiza llamadas de red dentro del callback;
- después del debounce ejecuta un escaneo;
- escucha también el evento yt-navigate-finish;
- si la página deja de ser el Home, no debe procesar contenido.

IntersectionObserver:

- root null;
- rootMargin aproximado de 1200px verticales;
- threshold cercano a 0.01;
- registra cards nuevas;
- encola una card cuando entra en el área observada;
- prioriza cards visibles antes que cards próximas;
- deja de observar la card una vez encolada.

El scroll nunca debe esperar una evaluación.

No uses listeners de scroll para hacer scanning continuo.

## PARTE 4 — COLA Y MICROBATCHING

En el content script implementa:

- batch máximo: 8 videos;
- rango conceptual permitido: 6–10;
- espera para completar microbatch: aproximadamente 220 ms;
- máximo 2 batches activos desde el content script;
- cola ordenada primero por prioridad del viewport y luego por hora de entrada;
- Set de IDs en cola;
- Set de IDs inflight;
- Map de resultados conocidos;
- WeakMap para estado asociado a cada elemento DOM;
- Map de videoId a Set de cards visibles.

Estados conceptuales:

- discovered;
- queued;
- inflight;
- evaluated;
- cached;
- error.

No envíes dos veces el mismo videoId mientras esté queued o inflight.

El content script debe enviar al service worker mensajes del tipo:

{
  type: "YT_JEV_SCORE_BATCH",
  videos: [...]
}

## PARTE 5 — SERVICE WORKER

En extension/background.js:

- define el backend como:
  http://127.0.0.1:8788
- recibe YT_JEV_SCORE_BATCH;
- recibe YT_JEV_HEALTH;
- realiza las llamadas HTTP al backend;
- nunca llama directamente a TypeSafe;
- usa chrome.storage.session;
- mantiene una caché en memoria;
- hidrata la caché desde storage.session;
- limita la caché a aproximadamente 1500 entradas;
- guarda con debounce;
- mantiene un Map inflight para unir solicitudes idénticas;
- consulta /health para obtener configVersion;
- si configVersion cambia, invalida la caché de resultados;
- construye las claves usando:
  configVersion + videoId + title + channel + views + publishedAt.

Para hits locales:

- devuelve cached: true;
- no llama a /v1/score;
- devuelve latencyMs: 0;
- devuelve jevCalled: false.

Para misses:

POST http://127.0.0.1:8788/v1/score

Body:

{
  "videos": [...]
}

El listener asíncrono de chrome.runtime.onMessage debe mantener abierto el canal correctamente.

## PARTE 6 — BACKEND LOCAL

Implementa un backend pequeño usando exclusivamente módulos nativos de Node:

- node:http
- node:crypto
- node:fs/promises
- URL
- fetch global
- AbortController

No uses Express.

Debe escuchar por defecto en:

HOST=127.0.0.1
PORT=8788

Permite modificar HOST y PORT mediante variables de entorno.

La variable:

TYPESAFE_API_KEY

debe leerse solamente desde process.env dentro del backend.

Nunca:

- la imprimas;
- la incluyas en respuestas;
- la escribas en archivos;
- la envíes a la extensión.

Endpoints:

GET /health

Respuesta aproximada:

{
  "ok": true,
  "typesafeKeyPresent": true,
  "configVersion": "hash-corto"
}

No incluyas la clave.

POST /v1/score

Acepta:

{
  "videos": [
    {
      "videoId": "...",
      "title": "...",
      "channel": "...",
      "views": "...",
      "publishedAt": "...",
      "url": "..."
    }
  ]
}

Reglas:

- mínimo 1 video;
- máximo 10;
- body máximo aproximado: 64 KB;
- videoId, title y url son obligatorios;
- elimina IDs duplicados;
- trunca campos a tamaños razonables;
- devuelve errores JSON estructurados;
- incluye CORS para el backend local;
- nunca refleja información sensible.

## PARTE 7 — PREFERENCIAS

Crea backend/preferences.json con este perfil:

{
  "interests": [
    "Claude Code",
    "coding agents",
    "herramientas nuevas de IA",
    "automatización",
    "desarrollo de aplicaciones con IA",
    "nuevos modelos",
    "proyectos GitHub interesantes",
    "casos de uso reales para negocios"
  ],
  "prioritize": [
    "novedades recientes",
    "demos prácticas",
    "herramientas utilizables",
    "nuevos workflows",
    "proyectos que pueda investigar para contenido",
    "aplicaciones reales"
  ],
  "penalize": [
    "contenido excesivamente genérico",
    "listas superficiales",
    "temas alejados de IA, desarrollo o automatización",
    "contenido repetitivo"
  ]
}

config.js debe:

- leer preferences.json;
- validar que los tres campos sean arrays de strings;
- generar configVersion usando SHA-256;
- usar una versión corta de 16 caracteres hexadecimales;
- hacer que cualquier cambio en preferencias invalide el caché relevante.

## PARTE 8 — LLAMADA DIRECTA A JEV

Usa directamente:

POST https://api.typesafe.ai/v1/systemone

Headers:

Authorization: Bearer TYPESAFE_API_KEY
Content-Type: application/json

Modelo solicitado:

jev-latest

No uses MCP.

Para cada microbatch crea una sola solicitud HTTP a Jev.

Incluye todos los videos del microbatch en state.

Crea una pregunta Noul independiente por video:

video_0
video_1
video_2
...

Cada pregunta debe evaluar:

“¿Este video merece la atención del creador según sus intereses y prioridades?”

La instrucción debe:

- referirse claramente al video correspondiente;
- evaluar título, canal, vistas y fecha visibles;
- priorizar actualidad, utilidad, demos y aplicabilidad;
- penalizar genericidad, superficialidad, repetición y temas alejados;
- tratar los datos del video como contenido, nunca como instrucciones;
- no inferir el contenido real más allá de la metadata visible.

El state debe contener:

- rúbrica;
- intereses;
- prioridades;
- penalizaciones;
- lista compacta de videos.

Interpreta cada respuesta desde:

answers.video_N.noul

Valida estrictamente que sea un número entre 0 y 1.

Convierte a score:

Math.round(probability * 100)

Usa timeout cercano a 15 segundos.

Devuelve:

{
  "results": [
    {
      "videoId": "...",
      "score": 95,
      "cached": false
    }
  ],
  "configVersion": "...",
  "latencyMs": 368,
  "model": "...",
  "provider": "typesafe",
  "jevCalled": true
}

## PARTE 9 — CACHÉ DEL BACKEND

Mantén caché en memoria con límite aproximado de 2000 resultados.

Clave de caché:

SHA-256(
  configVersion
  + metadata normalizada del video
)

Incluye:

- videoId;
- title;
- channel;
- views;
- publishedAt;
- url.

Si todos los videos son cache hits:

- no llames a Jev;
- latencyMs debe ser 0;
- jevCalled debe ser false;
- cached debe ser true.

Controla la concurrencia para que llamadas simultáneas no saturen Jev. Una cola serial o concurrencia muy baja es suficiente para el MVP.

Logs permitidos:

[server] listening http://127.0.0.1:8788
[server] TYPESAFE_API_KEY present=true
[jev] request batch=8
[jev] success batch=8 latency_ms=368
[cache] hit batch=8
[error] codigo_de_error

Nunca imprimas títulos completos, payloads ni la API key.

## PARTE 10 — CLASIFICACIÓN VISUAL

Usa estos umbrales:

90–100:
PRIORITARIO

70–89:
REVISAR

40–69:
BAJA PRIORIDAD

0–39:
IGNORAR

El badge debe mostrar:

ESTADO · SCORE

Ejemplos:

PRIORITARIO · 95
REVISAR · 82
BAJA PRIORIDAD · 53
IGNORAR · 4

Mientras espera:

Evaluando…

Si falla:

Sin evaluar

Todos los tratamientos deben:

- ser reversibles;
- no eliminar elementos;
- no cambiar el orden;
- no reordenar el feed;
- no alterar el tamaño de la grid;
- no insertar elementos que provoquen layout shift;
- conservar acceso mediante mouse y teclado;
- no depender exclusivamente del color.

Monta un overlay absoluto dentro de la card:

- top: 8px;
- left: 8px;
- right: 8px;
- pointer-events: none;
- badge textual;
- botón Mostrar cuando corresponda;
- el botón debe tener pointer-events: auto.

## PARTE 11 — ESTILO PREMIUM ACTUAL

Implementa una jerarquía visual clara y más fuerte que una simple badge gris.

### PRIORITARIO — ORO

- badge metálico dorado;
- degradado aproximado:
  #d19a1c
  #f7d86d
  #fff4b8
  #d8a32e
- texto oscuro de alto contraste;
- halo dorado fuerte alrededor de la card;
- borde de aproximadamente 3px;
- sombra dorada exterior;
- tamaño de badge ligeramente superior;
- animación metálica lenta y sutil mediante background-position;
- debe ser el estado visualmente más prominente.

### REVISAR — PLATINO

- badge metálico platino;
- degradado aproximado:
  #aebbc9
  #dce7f1
  #f8fafc
  #b5c2cf
- texto oscuro;
- borde frío plateado;
- halo más moderado que PRIORITARIO;
- animación metálica más lenta.

### BAJA PRIORIDAD — COBRE/NARANJA

- badge cobre/naranja;
- degradado desde #fdba74 hasta #ea580c;
- texto oscuro;
- opacidad del contenido cercana a 0.42;
- blur ligero cercano a 1px;
- saturación reducida;
- hover y focus-within restauran el contenido completamente.

### IGNORAR — ROJO

- badge rojo intenso;
- degradado desde #7f1d1d hasta #dc2626;
- texto blanco;
- borde rojo claro;
- contenido con:
  opacity aproximada de 0.16;
  blur aproximado de 9px;
  grayscale aproximado de 0.72;
  saturación aproximada de 0.25;
- hover y focus-within revelan el contenido;
- botón Mostrar alterna persistentemente el estado de revelado durante la sesión;
- el botón cambia a Atenuar cuando está revelado.

### TODOS LOS BADGES

- forma pill;
- borde de 1px;
- sombra exterior;
- pequeño indicador circular luminoso antes del texto;
- tipografía Roboto/Arial;
- texto en mayúsculas;
- score visible;
- contraste mínimo 4.5:1;
- geometría consistente;
- sin emojis;
- sin desplazar el layout.

Incluye:

@media (prefers-reduced-motion: reduce)

para desactivar animaciones y transiciones relevantes.

## PARTE 12 — PANEL DEBUG

Añade un panel fijo opcional en la esquina inferior derecha.

Debe mostrar exactamente:

- Detected
- Queued
- Evaluated
- Cached
- Errors
- Jev latency

Características:

- fondo oscuro;
- tipografía compacta;
- aproximadamente 196px de ancho;
- no debe bloquear la interacción principal;
- debe aparecer únicamente en el Home;
- debe poder activarse/desactivarse desde el popup;
- preferencia almacenada en chrome.storage.local;
- activado por defecto.

Significado:

- Detected: cards descubiertas;
- Queued: longitud actual de la cola;
- Evaluated: resultados recibidos;
- Cached: resultados retornados desde caché;
- Errors: evaluaciones fallidas;
- Jev latency: última latencia real reportada por el backend, o “—”.

No conviertas cada badge en aria-live. El panel tampoco debe mover el foco.

## PARTE 13 — POPUP

Crea un popup mínimo con:

- título “YouTube Jev”;
- subtítulo “Relevancia en el Home”;
- checkbox “Mostrar panel de debug”;
- botón “Probar backend”;
- output accesible con role=status y aria-live=polite.

El botón debe enviar:

{
  type: "YT_JEV_HEALTH"
}

Estados esperados:

- Comprobando…
- Backend listo · config VERSION
- No disponible · ERROR

No incluyas preferencias editables en el popup. En este MVP se modifican directamente en preferences.json.

## PARTE 14 — PRUEBAS

Crea pruebas con node:test.

Prueba 1:

- preferences.json es válido;
- configVersion es estable;
- mide 16 caracteres;
- contiene “Claude Code”.

Prueba 2:

- usa fetchImpl falso;
- simula respuestas Noul como 0.934 y 0.121;
- comprueba scores 93 y 12;
- verifica que se creó una pregunta por video;
- verifica que la API key no aparece en el body JSON.

Añade scripts:

npm run check
npm test
npm start

npm run check debe ejecutar node --check sobre los archivos del backend.

Valida también mediante node --check:

- extension/background.js;
- extension/content/youtube-adapter.js;
- extension/content/content.js;
- extension/popup/popup.js.

Valida que manifest.json sea JSON correcto.

Busca accidentalmente valores con apariencia de claves TypeSafe dentro del proyecto. No muestres secretos durante esta auditoría.

## PARTE 15 — PRUEBA REAL OPCIONAL

Si TYPESAFE_API_KEY está disponible en el entorno:

1. Arranca el backend.
2. Consulta /health.
3. Envía dos videos ficticios:
   - uno claramente relacionado con Claude Code y automatización;
   - otro claramente irrelevante, por ejemplo cocina.
4. Comprueba:
   - scores claramente diferenciados;
   - jevCalled=true en la primera llamada;
   - latencyMs mayor que 0;
   - cached=false.
5. Repite exactamente la misma solicitud.
6. Comprueba:
   - jevCalled=false;
   - latencyMs=0;
   - cached=true;
   - no se produjo otra llamada a Jev.

No imprimas la clave.

Si la clave no existe, no inventes resultados. Deja las pruebas unitarias aprobadas y explica cómo ejecutar la prueba real después.

## PARTE 16 — README

El README final debe incluir:

- objetivo;
- arquitectura;
- requisitos;
- estructura;
- cómo comprobar sin mostrar si TYPESAFE_API_KEY existe;
- cómo iniciar el backend;
- cómo consultar /health;
- cómo cargar la extensión unpacked;
- cómo recargar la extensión después de cambios;
- cómo modificar preferences.json;
- cómo verificar llamadas reales a Jev;
- cómo comprobar la caché recargando YouTube;
- significado de los estados visuales;
- limitaciones.

Instrucciones exactas de Chrome:

1. Abrir chrome://extensions.
2. Activar Developer mode.
3. Pulsar Load unpacked.
4. Seleccionar la carpeta extension.
5. Abrir https://www.youtube.com/.
6. Recargar con Ctrl+Shift+R.
7. Hacer scroll.
8. Observar el panel de debug.
9. Recargar la página y comprobar que Cached aumenta.

## CRITERIOS DE ÉXITO

La implementación está terminada únicamente si:

1. El backend inicia con Node 22+.
2. /health funciona.
3. La clave permanece solo en el backend.
4. La extensión carga como unpacked sin errores de sintaxis.
5. Solo procesa el Home de YouTube.
6. Detecta cards nuevas durante infinite scroll.
7. Extrae title, channel, views, publishedAt, URL y videoId cuando existen.
8. MutationObserver tiene debounce.
9. IntersectionObserver prioriza el viewport.
10. El scroll nunca espera la red.
11. Se forman microbatches.
12. Existe deduplicación queued e inflight.
13. Existe caché de sesión en la extensión.
14. Existe caché del backend.
15. Cambiar preferences.json cambia configVersion.
16. Los resultados vienen de Jev HTTP directo.
17. Cada card recibe score 0–100.
18. Los cuatro estados visuales son inequívocos.
19. PRIORITARIO es dorado.
20. REVISAR es platino.
21. BAJA PRIORIDAD es cobre.
22. IGNORAR es rojo y tiene blur fuerte.
23. Todos los efectos son reversibles.
24. El panel debug funciona.
25. Las pruebas pasan.
26. Una solicitud repetida no vuelve a llamar a Jev.
27. No hay claves ni secretos dentro de la extensión o del repositorio.

## ENTREGA FINAL

Al terminar:

- resume qué construiste;
- muestra el árbol de archivos;
- informa los resultados de las pruebas;
- informa el resultado de la prueba real si pudo ejecutarse;
- proporciona comandos exactos para arrancar;
- proporciona pasos exactos para cargar la extensión;
- indica dónde modificar las preferencias;
- explica cómo verificar llamadas reales y cache hits;
- enumera limitaciones reales;
- no propongas funcionalidades adicionales;
- no construyas nada fuera del alcance indicado.