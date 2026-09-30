Quiero configurar la Skill de terceros:

<https://github.com/zurfyx/jev-browser-skill>

para utilizar Jev como browser agent desde el agente de código que estoy
utilizando actualmente.

## OBJETIVO

Dejar `jev-browser` instalado globalmente para mi usuario y disponible para
el agente actual (Claude Code o Codex), utilizando exclusivamente el método
documentado actualmente por el propio repositorio.

## IMPORTANTE

Este es un repositorio público de terceros y una implementación de referencia.
Antes de instalar o modificar absolutamente nada:

1. Abre y revisa:

   https://github.com/zurfyx/jev-browser-skill

2. Verifica que corresponde realmente a:

   zurfyx/jev-browser-skill

3. Revisa como mínimo:

   - README.md
   - SKILL.md
   - package.json
   - scripts/core.mjs
   - scripts/browser.mjs
   - scripts/jev.mjs

4. Comprueba:

   - qué hace la Skill;
   - qué acciones puede realizar en el navegador;
   - cómo utiliza TYPESAFE_API_KEY;
   - qué información se envía a Jev;
   - cómo trata valores marcados como secretos;
   - si existen dependencias, scripts de instalación o post-instalación
     inesperados;
   - que los comandos de instalación indicados más abajo siguen coincidiendo
     con la documentación actual del repositorio.

5. Verifica que el repositorio sigue indicando que:

   - requiere Node.js 22 o superior;
   - funciona con Chrome, Edge, Brave o Chromium;
   - no necesita `npm install`;
   - no necesita Playwright;
   - no necesita descargar un navegador adicional.

Si encuentras una discrepancia significativa, comportamiento inesperado o algo
que no puedas verificar razonablemente, DETENTE y explícame brevemente qué
encontraste.

No intentes sortear ninguna protección de seguridad del agente.

## ESTADO ACTUAL

Antes de realizar cambios comprueba:

- versión de Node.js;
- disponibilidad de Git;
- navegador Chromium compatible instalado;
- si `jev-browser` ya está instalado para el agente actual;
- si TYPESAFE_API_KEY está disponible como variable de entorno.

No muestres, imprimas ni copies el valor de TYPESAFE_API_KEY.

## DEPENDENCIAS

### 1. NODE.JS

Comprueba:

   node --version

Necesitamos Node.js 22 o superior.

- Si ya cumple, reutilízalo.
- Si no cumple, no realices una actualización silenciosa.

Indícame que Node necesita actualizarse y utiliza únicamente el procedimiento
oficial apropiado para este sistema.

### 2. GIT

Comprueba que Git esté disponible.

Si Git falta, detente e indícame que esa dependencia es necesaria para clonar
el repositorio.

### 3. NAVEGADOR

Comprueba que exista al menos uno de estos navegadores:

- Chrome
- Edge
- Brave
- Chromium

Si ya existe uno compatible, reutilízalo.

NO:

- modifiques su configuración;
- habilites remote debugging;
- cambies perfiles;
- abras páginas;
- instales Playwright;
- descargues Chromium;
- instales extensiones.

La configuración del navegador se realizará más adelante únicamente si es
necesaria para una prueba.

## TYPESAFE API KEY

Verifica únicamente que:

   TYPESAFE_API_KEY

esté disponible como variable de entorno para el agente actual.

- No muestres su valor.
- No la copies al chat.
- No la escribas dentro del repositorio.
- No crees archivos `.env` si la variable global ya existe.
- No la traslades a otra ubicación.

Si no existe, detente e indícame que debo configurarla.

## DETECCIÓN DEL AGENTE

Determina cuál es el agente que está ejecutando actualmente esta conversación.

Si es CLAUDE CODE, la ubicación objetivo es:

   ~/.claude/skills/jev-browser

Si es CODEX, la ubicación objetivo es:

   ~/.codex/skills/jev-browser

No instales la Skill para ambos agentes salvo que yo lo solicite explícitamente.

## INSTALACIÓN

Comprueba primero si la carpeta objetivo ya contiene una instalación válida
procedente de:

   https://github.com/zurfyx/jev-browser-skill

Si ya existe y corresponde al repositorio correcto, reutilízala.

No sobrescribas ni vuelvas a clonar una instalación válida.

Si falta, utiliza el comando documentado actualmente por el repositorio.

Para Claude Code:

   git clone https://github.com/zurfyx/jev-browser-skill ~/.claude/skills/jev-browser

Para Codex:

   git clone https://github.com/zurfyx/jev-browser-skill ~/.codex/skills/jev-browser

No ejecutes `npm install`.

No instales Playwright.

No descargues ningún navegador.

No modifiques otras Skills.

## VERIFICACIÓN

Después de instalar, verifica que en la carpeta de la Skill existan como mínimo:

- SKILL.md
- scripts/core.mjs
- scripts/browser.mjs
- scripts/jev.mjs

Verifica también que:

- Node.js cumple el requisito;
- Git está disponible;
- existe un navegador compatible;
- TYPESAFE_API_KEY está disponible sin mostrarla;
- la Skill está ubicada en la carpeta global correcta del agente actual.

NO EJECUTES TODAVÍA EL BROWSER AGENT.

No:

- abras páginas web;
- hagas clicks;
- escribas texto;
- habilites remote debugging;
- utilices mis sesiones existentes;
- pruebes la Skill contra ninguno de mis proyectos.

Solo queremos validar la instalación.

## SEGURIDAD

No estás autorizado a:

- modificar otras Skills;
- modificar plugins;
- modificar MCPs;
- cambiar permisos globales;
- desactivar mecanismos de seguridad;
- modificar configuraciones de navegador;
- habilitar remote debugging;
- acceder a contraseñas o sesiones;
- almacenar TYPESAFE_API_KEY;
- ejecutar navegación durante esta instalación.

Si una acción legítima requiere aprobación del usuario, no intentes evitarla.
Explícame brevemente qué acción necesita autorización y permite que yo la
apruebe mediante el mecanismo normal del agente.

## RESULTADO FINAL

Cuando todo esté correctamente preparado, informa:

Node.js: OK
Git: OK
Navegador compatible: OK
TYPESAFE_API_KEY: OK
jev-browser: OK
Agente configurado: CLAUDE CODE / CODEX
Browser ejecutado durante instalación: NO
Reinicio requerido: SÍ / NO

Si es necesario reiniciar, indícame cerrar completamente el agente y volverlo
a abrir antes de realizar nuestra primera prueba.

## NAVEGADOR PARA JEV (PREFERENCIA DE USO)

Mi navegador principal es Brave, con remote debugging activo (puerto 9222).
Mientras no te diga otra cosa:

- Usa `--browser yours`. No uses `--browser own` ni `--headless`.
- Antes de cada ejecución, detecta en solo lectura qué navegador tiene
  DevToolsActivePort (Chrome, Edge o Brave) y usa ese. Si te pido otro,
  adáptate con `--browser host:puerto`.
- Si ninguno tiene debugging activo, avísame y dime cómo activarlo.

## UNA SOLA CONEXIÓN (para no tener que pulsar Allow a cada rato)

- Si la prueba tiene más de una tarea, no lances un `jev.mjs` por tarea.
  Usa `node tools/jev-run.mjs tasks/<archivo>.json` (una sola conexión).
- Para una prueba nueva, crea un JSON en `tasks/`; no escribas otro runner.
- Avísame justo antes de lanzarlo para que pulse Allow una vez.
- Nunca intentes saltarte ni automatizar el aviso "Allow remote debugging?".

Límites que se mantienen:
- Navega solo a las URLs de la tarea; no abras ni leas otras pestañas.
- No accedas a contraseñas, cookies ni sesiones ajenas a la tarea.
- Las contraseñas van con `--secret` o `secretEnv`, nunca en `--text`.
- No cambies ninguna configuración del navegador.
