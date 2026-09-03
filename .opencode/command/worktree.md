---
description: Crea un git worktree en .worktree/ con el nombre derivado del argumento.
---

Argumento recibido: $ARGUMENTS

Instrucciones:

1. Deriva el nombre del worktree a partir del argumento: analízalo y
   conviértelo a un slug kebab-case — minúsculas, espacios y guiones
   bajos reemplazados por guiones (-), sin caracteres especiales, sin
   guiones al inicio o al final, guiones consecutivos colapsados.
   Ejemplos: "Fix Bug de Colisiones" → fix-bug-de-colisiones;
   "refactor-powerups" → refactor-powerups.
   Si el argumento está vacío, pregúntale al usuario el nombre del
   worktree y continúa con su respuesta.
2. Ejecuta exactamente este comando y nada más:
   git worktree add .worktree/<nombre-del-worktree>
3. NO hagas nada más: no cambies de directorio, no crees commits, no
   edites archivos, no ejecutes comandos adicionales. Solo reporta el
   resultado del comando.
