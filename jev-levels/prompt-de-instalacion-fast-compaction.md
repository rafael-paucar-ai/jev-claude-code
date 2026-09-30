Quiero instalar y configurar globalmente el plugin de terceros:

<https://github.com/tamaratran/fast-jev-compaction>

## OBJETIVO

Configurar fast-jev-compaction para utilizar Jev de TypeSafe durante
/compact en Claude Code.

## IMPORTANTE

Este es un repositorio público de terceros, no un plugin oficial de Anthropic.
Antes de instalar nada:

1. Abre y revisa el repositorio indicado.
2. Verifica que el proyecto corresponda realmente a:
   tamaratran/fast-jev-compaction.
3. Revisa README, package.json, configuración del plugin y hooks.
4. Confirma:
   - qué hace el plugin;
   - qué datos envía externamente;
   - a qué dominio/API realiza solicitudes;
   - cómo utiliza TYPESAFE_API_KEY;
   - que no intenta leer, imprimir, guardar o transmitir la API key a otro
     destino distinto del servicio TypeSafe necesario para funcionar.
5. Comprueba que los comandos de instalación coincidan con los documentados
   actualmente por el propio repositorio.

Si detectas alguna discrepancia significativa entre este prompt y el
repositorio actual, DETENTE y explícame cuál es.

Si la verificación es satisfactoria, continúa con la configuración.

## CONFIGURACIÓN

1. Comprueba:

   claude --version

fast-jev-compaction requiere Claude Code 2.1.274 o superior.

Solo actualiza Claude Code si la versión actual es inferior.

2. Comprueba si el marketplace ya está registrado.

Si no está registrado, utiliza el comando documentado por el repositorio para
agregar:

tamaratran/fast-jev-compaction

con scope global de usuario.

3. Comprueba si fast-jev-compaction ya está instalado.

Si no lo está, instálalo con scope user siguiendo las instrucciones actuales
del repositorio.

4. Conservando toda mi configuración existente, asegúrate de que en:

~/.claude/settings.json

esté habilitado:

CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1

No elimines ni sobrescribas ninguna otra configuración.

5. Verifica únicamente que TYPESAFE_API_KEY ya esté disponible como variable
de entorno.

NO:
- muestres su valor;
- lo copies en el chat;
- lo escribas en archivos nuevos;
- lo traslades a otra ubicación.

Si TYPESAFE_API_KEY no existe, detente y dímelo.

6. Verifica finalmente:

- plugin instalado;
- scope user;
- plugin habilitado;
- Function Hooks habilitados;
- TYPESAFE_API_KEY disponible.

No modifiques otros plugins, Skills, MCPs ni configuraciones.

Al terminar explícame brevemente qué verificaste y recuérdame cerrar
completamente VS Code / Claude Code y volverlo a abrir antes de probar
/compact.