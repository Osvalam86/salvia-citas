---
name: seccion-kit
description: Plan y cierre de una sección de componentes del kit de Salvia (fase 4). Usar SIEMPRE al preparar el plan de una sección antes de escribir código y al entregar su informe de cierre.
---

# Sección del kit: plan y cierre

Responde en español. No escribas código hasta que el plan esté aprobado.
No empieces la sección siguiente sin confirmación.

## Plan (antes de escribir)

1. Lee el `node.description` de cada componente por MCP (solo lectura).
2. **Contradicciones primero**: todo choque entre docs/, DESIGN.md y
   Figma, con las opciones y tu recomendación. Figma manda en medidas
   (si un documento dice otra, se corrige el documento, con su diff);
   los documentos, en decisiones. Si una frase del documento parece
   transcribir una posición de capa de Figma, dilo.
3. **Valores fuera de los documentos**: tabla con propuesta y razón.
   Un valor derivado (p. ej. radio del anillo = control + 4) se
   declara como derivado, no como nuevo.
4. **Por componente**: elemento HTML, nativo o RAC y por qué (nativo
   mientras HTML resuelva lo que pide el diseño), clases BEMIT,
   archivos (1:1 de D5 o excepción declarada).
5. **API**: props tipadas; combinaciones prohibidas que no compilen;
   aria-\* y atributos de formulario que la sección siguiente necesitará.
6. **Reglas transversales que aplican**: icono y etiqueta (flex-wrap,
   base de 8rem si hay contenido fluido), iconos con color propio en
   forced-colors, anillo global (−4 solo en header, barra inferior e
   ítems del menú), destino de foco programático, dashed nativo.
7. **Pruebas proporcionales**: tabla componente × prueba. Solo las que
   tienen riesgo real: medida contra Figma, teclado, 200 % a 320 con
   las dos barras (clásica 15 px y superpuesta), forced-colors,
   anuncio. Cada regla con su contraprueba.

## Cierre (informe de la sección)

1. `scripts/verify/<sección>-<nombre>.mjs` añadido y registrado en
   `SECTIONS` de `scripts/verify/run.mjs`; `pnpm verify <sección>` con
   el resultado y el recuento (n/n). Las contrapruebas dentro del
   script o declaradas como manuales en docs/verificacion.md, donde
   también se actualizan la tabla «Estructura» y la lista de secciones
   de «Cómo se ejecuta».
2. Tabla de verificación: comprobación → resultado medido. Nunca
   «debería»: si no se midió, se dice.
3. Checklist de bemit-scss: ✓, N/A o ✗ con nota.
4. Cambios en DESIGN.md, docs/ y el «Estado actual» de CLAUDE.md: diff
   mostrado antes de escribir.
5. Pendientes: revisa los pendientes abiertos de la fase y di cuáles
   cierra esta sección; qué se añade, con su fase.
6. build, lint, contrast y `git status`.
7. Commit: lo hace el usuario tras aprobar el cierre. Propón Summary y
   Description por separado. La descripción cubre todo el diff,
   incluidos docs y pendientes; las correcciones de documentos de la
   sección van en ese mismo commit. Termina con
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
