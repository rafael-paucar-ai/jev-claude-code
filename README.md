# Jev Claude Code

Proyecto de apoyo de la guía **Jev Hará Tu Claude Code 10X Mejor**.

- `demo-app/`: app de login con tres roles (admin, manager, employee). Sirve de prueba para los niveles 1 y 3.
- `docs/access-control.md`: contrato de permisos por rol.
- `tasks/` y `tools/`: tareas y runner para probar el browser agent.
- `youtube-extension/`: extensión de Chrome YouTube Jev Relevance (nivel 4) y su backend local.
- `jev-levels/`: prompts de instalación y de desarrollo usados en cada nivel.

Requiere Node.js 22 o superior y tu `TYPESAFE_API_KEY` como variable de entorno. Nunca la guardes en el repositorio.

```
npm run demo
```
