Quiero instalar y dejar disponible la Skill oficial de TypeSafe AI para
trabajar posteriormente con Jev desde el agente de código que estoy utilizando.

## REPOSITORIO OFICIAL

<https://github.com/typesafe-ai/skills>

## OBJETIVO

Dejar instalada y correctamente disponible la Skill oficial:

typesafe-ai

para el agente actual, ya sea Claude Code o Codex.

Esta tarea es únicamente de:

- verificación;
- instalación;
- comprobación de disponibilidad.

NO modifiques todavía ningún archivo del proyecto actual.
NO implementes todavía ningún workflow con Jev.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FASE 1 — VERIFICAR LA FUENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de instalar nada:

1. Abre y revisa:

   https://github.com/typesafe-ai/skills

2. Confirma que:

   - el propietario es `typesafe-ai`;
   - el repositorio es `skills`;
   - contiene la Skill `typesafe-ai`;
   - el plugin de Claude Code se llama `typesafe`;
   - el repositorio declara a TypeSafe AI como autor;
   - los métodos de instalación indicados más abajo siguen coincidiendo
     con la documentación actual.

3. Revisa como mínimo:

   - README.md
   - .claude-plugin/plugin.json
   - skills/typesafe-ai/SKILL.md

4. Confirma brevemente qué instala la Skill y qué propósito tiene.

Según la documentación oficial, debería proporcionar contexto al agente para:

- diseñar workflows con TypeSafe;
- consultar documentación y cookbooks actuales;
- trabajar con judgments tipados;
- utilizar Jev y otros System One models correctamente.

Si la documentación actual contradice de manera significativa este prompt,
DETENTE y explícame brevemente la discrepancia.

No intentes sortear ninguna protección del agente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FASE 2 — INSPECCIONAR ESTADO ACTUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de modificar nada, detecta:

1. Qué agente estás ejecutando actualmente:
   - Claude Code
   - Codex

2. Si `typesafe-ai` ya está disponible.

3. Si existe alguna instalación previa de esta misma Skill.

4. Si existe una instalación mediante otro mecanismo que podría provocar
   duplicados.

5. Si `TYPESAFE_API_KEY` está disponible en el entorno.

No muestres ni imprimas el valor de TYPESAFE_API_KEY.

IMPORTANTE:

Utiliza UN SOLO método de instalación.

No instales simultáneamente:

- Claude Code plugin
- skills.sh
- copia manual

para el mismo agente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FASE 3A — SI EL AGENTE ES CLAUDE CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Utiliza exclusivamente el método oficial de plugin para Claude Code.

Comprueba primero si el marketplace:

typesafe-ai/skills

ya está registrado.

Comprueba después si:

typesafe@typesafe-ai

ya está instalado.

Si ambos ya están correctamente disponibles, reutilízalos y no reinstales.

Si falta el marketplace, utiliza el comando actualmente documentado:

claude plugin marketplace add typesafe-ai/skills

Si falta el plugin, utiliza:

claude plugin install typesafe@typesafe-ai

No instales además una copia mediante `npx skills`.

Después verifica que la Skill `typesafe-ai` esté incluida dentro del plugin.

La invocación explícita esperada en Claude Code es:

/typesafe:typesafe-ai

No ejecutes todavía la Skill contra el proyecto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FASE 3B — SI EL AGENTE ES CODEX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NO instales el plugin específico de Claude Code.

Utiliza exclusivamente el método oficial basado en skills.sh.

Antes de instalar, comprueba si `typesafe-ai` ya existe para Codex.

Si ya existe y corresponde a:

<https://github.com/typesafe-ai/skills>

reutilízala.

Si falta:

1. Revisa el comando actualmente documentado por el repositorio.

2. Utiliza skills.sh para instalar únicamente:

   typesafe-ai

   desde:

   typesafe-ai/skills

3. Mantén la instalación a nivel del proyecto actual salvo que la
   documentación actual indique otra cosa o yo solicite instalación global.

El comando base documentado actualmente por TypeSafe es:

npx skills add typesafe-ai/skills --skill typesafe-ai

Selecciona Codex como agente cuando corresponda.

Si deseas utilizar flags no interactivos como `--agent`, `--yes` o equivalentes,
verifica primero que la versión instalada de skills.sh realmente los soporte.

No inventes flags.

No instales una segunda copia mediante otro mecanismo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## FASE 4 — VERIFICAR LA SKILL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Después de instalar:

1. Localiza la Skill `typesafe-ai`.

2. Lee su `SKILL.md`.

3. Confirma que corresponde al repositorio oficial:

   https://github.com/typesafe-ai/skills

4. Confirma que puede ser utilizada por el agente actual.

5. No ejecutes todavía ningún workflow TypeSafe/Jev.

6. No modifiques código del proyecto.

7. No crees archivos nuevos en el proyecto salvo los que el método oficial
   de instalación necesite para registrar la Skill en Codex.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TYPESAFE_API_KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La Skill puede instalarse sin TYPESAFE_API_KEY.

Comprueba únicamente si:

## TYPESAFE_API_KEY

está disponible en el entorno actual.

Si existe:

- reutilízala;
- no muestres su valor;
- no la copies al chat;
- no la escribas en archivos;
- no la traslades a otra ubicación.

Si no existe:

reporta:

TYPESAFE_API_KEY: MISSING

Eso NO debe impedir instalar o verificar la Skill.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SEGURIDAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No estás autorizado a:

- eliminar otras Skills;
- eliminar otros plugins;
- modificar MCPs;
- cambiar permisos globales;
- desactivar mecanismos de seguridad;
- modificar código del proyecto;
- guardar API keys;
- instalar copias duplicadas de la Skill.

Si una acción legítima requiere aprobación del usuario, utiliza el mecanismo
normal de autorización del agente.

No intentes evitar ni relajar esa protección.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## VERIFICACIÓN FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confirma:

- agente detectado correctamente;
- repositorio oficial verificado;
- método de instalación correcto para ese agente;
- Skill `typesafe-ai` disponible;
- SKILL.md leído y verificado;
- ninguna instalación duplicada;
- proyecto sin modificaciones funcionales;
- estado de TYPESAFE_API_KEY.

Al finalizar informa:

Agente: CLAUDE CODE / CODEX
Repositorio TypeSafe: VERIFICADO
TypeSafe Skill: OK
Método: CLAUDE PLUGIN / SKILLS.SH
Instalación duplicada: NO
TYPESAFE_API_KEY: AVAILABLE / MISSING
Proyecto modificado funcionalmente: NO
Listo para recibir el proyecto: SÍ
Reinicio / reload requerido: SÍ / NO

Si hace falta recargar Claude Code, indica si basta con:

/reload-plugins

o si la documentación actual recomienda reiniciar completamente el agente.