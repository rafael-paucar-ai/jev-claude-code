Quiero configurar `n23eos/jev-skills` para utilizar `jev-skill-picker`
en Claude Code.

## REPOSITORIO A VERIFICAR

<https://github.com/n23eos/jev-skills>

## OBJETIVO

Dejar `jev-skill-picker` instalado y funcional en Claude Code utilizando
el mecanismo de instalación actualmente documentado por el propio repositorio.

## IMPORTANTE

Este es un repositorio público de terceros.

Antes de instalar o modificar nada:

1. Abre y revisa:
   https://github.com/n23eos/jev-skills

2. Verifica que corresponde realmente a:
   n23eos/jev-skills

3. Revisa como mínimo:
   - README.md
   - pyproject.toml
   - proceso de instalación;
   - código relacionado con la instalación de Skills;
   - cómo utiliza TYPESAFE_API_KEY;
   - qué datos se envían durante una decisión live;
   - a qué servicio/dominio se realizan las solicitudes;
   - si existen scripts de instalación o post-instalación inesperados.

4. Confirma que los comandos indicados más abajo siguen coincidiendo con
   la documentación actual del repositorio.

5. Si encuentras una discrepancia significativa, comportamiento inesperado
   o algo que no puedas verificar razonablemente, DETENTE y explícame
   brevemente qué encontraste.

No intentes sortear ninguna protección de seguridad de Claude Code.

## ESTADO ACTUAL

Antes de modificar nada, inspecciona:

- si `uv` está instalado;
- si Git está instalado;
- si `jev-skills` ya está disponible;
- si las Skills de n23eos/jev-skills ya existen en Claude Code;
- si `TYPESAFE_API_KEY` está disponible como variable de entorno.

No muestres ni imprimas el valor de TYPESAFE_API_KEY.

## INSTALACIÓN

Si la revisión anterior es satisfactoria:

1. Verifica `uv`.

   Si ya existe, reutilízalo.

   Si no existe, utiliza únicamente el método oficial actualmente recomendado
   por Astral para instalar `uv` en este sistema operativo.

   Si Claude Code requiere mi intervención para instalar una herramienta
   del sistema, muéstrame el comando oficial exacto y espera mi confirmación.

2. Verifica Git.

   Si Git no está disponible y es necesario para instalar el repositorio,
   DETENTE e indícame que falta esa dependencia.

3. Comprueba si `jev-skills` ya está instalado y operativo.

   Si ya funciona, no lo reinstales.

   Si falta, instala utilizando el comando documentado actualmente por
   n23eos/jev-skills:

   uv tool install 'git+https://github.com/n23eos/jev-skills.git'

4. Si después de instalar el comando `jev-skills` no está disponible en
   esta terminal, sigue únicamente el procedimiento recomendado por el repo:

   uv tool update-shell

   Si esto requiere abrir una nueva terminal antes de continuar, indícamelo.

5. Instala las Skills para Claude Code utilizando el mecanismo oficial:

   jev-skills install --agent claude

## IMPORTANTE SOBRE ESTA INSTALACIÓN

El instalador oficial puede instalar las siete Skills incluidas actualmente
en n23eos/jev-skills.

Eso está autorizado.

Nuestro objetivo principal será utilizar:

   jev-skill-picker

No elimines, muevas ni sobrescribas Skills ajenas a este repositorio.

Si una Skill existente fue modificada manualmente y el instalador decide
preservarla, respeta ese comportamiento y no fuerces su sobrescritura.

## CONFIGURACIÓN DE RED Y AUTOMATIZACIÓN

No habilites:

- workflows automáticos;
- hooks;
- Function Hooks;
- routing automático;
- modificaciones en CLAUDE.md;
- modificaciones en AGENTS.md;
- ninguna automatización adicional.

La instalación debe permanecer en su comportamiento opt-in por defecto.

No ejecutes:

   jev-skills enable ...

salvo que yo lo solicite explícitamente más adelante.

## TYPESAFE API KEY

Comprueba únicamente que:

   TYPESAFE_API_KEY

esté disponible en el entorno que utiliza Claude Code.

- No muestres su valor.
- No la copies al chat.
- No la escribas en archivos.
- No la traslades a otra ubicación.
- Si no existe, detente e indícame que debo configurarla.

## VERIFICACIÓN

Cuando termine la instalación ejecuta:

   jev-skills doctor

Utiliza su resultado para comprobar:

- que la CLI funciona;
- que Claude Code puede encontrar las Skills;
- que TYPESAFE_API_KEY está disponible sin mostrarla;
- que la instalación no activó workflows automáticos.

Después verifica específicamente que:

   ~/.claude/skills/jev-skill-picker

esté disponible para Claude Code.

No necesitas ejecutar todavía una decisión live.

NO REALICES TODAVÍA UNA PRUEBA CON JEV.

Solo queremos confirmar que la instalación está correctamente preparada.

## SEGURIDAD

No estás autorizado a:

- eliminar Skills existentes ajenas a n23eos/jev-skills;
- cambiar permisos globales de Claude Code;
- desactivar mecanismos de seguridad;
- modificar otros plugins;
- modificar MCPs;
- modificar hooks;
- cambiar configuraciones de proyectos;
- guardar TYPESAFE_API_KEY en archivos;
- activar decisiones automáticas.

Si Claude Code bloquea una acción legítima que requiere aprobación del usuario,
no intentes evitar dicha protección.

Explícame brevemente qué acción necesita aprobación y permite que yo la
autorice normalmente.

## RESULTADO FINAL

Cuando todo esté listo, informa:

uv: OK
Git: OK
jev-skills CLI: OK
Skills instaladas: OK
jev-skill-picker: OK
TYPESAFE_API_KEY: OK
Workflows automáticos: DESACTIVADOS
Reinicio requerido: SÍ / NO

Si es necesario reiniciar, indícame cerrar completamente Claude Code / VS Code
y volverlo a abrir antes de probar `jev-skill-picker`.