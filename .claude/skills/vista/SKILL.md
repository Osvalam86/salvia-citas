---
name: vista
description: Plan y cierre de un bloque de la fase 5 de Salvia (T0–T2 transversales o vistas 1 a 4). Usar SIEMPRE al preparar el plan de un bloque antes de escribir código y al entregar su informe de cierre.
---

# Bloque de la fase 5: plan y cierre

Responde en español. No escribas código hasta que el plan esté aprobado.
No empieces el bloque siguiente sin confirmación.

## Plan (antes de escribir)

1. **Pantallas**: lista los frames de Figma del bloque (móvil y escritorio,
   con su id y el estado de D1 que representan) y su panel NN.0; léelos por
   MCP (solo lectura). Un bloque transversal nombra las vistas a las que
   sirve.
2. **Contradicciones primero** entre docs/, DESIGN.md, el panel y las
   pantallas, con opciones y recomendación. Figma manda en medidas y copy;
   los documentos, en decisiones. Un panel que contradice una decisión
   posterior del documento se señala como desfasado (diseño §2).
3. **URL**: parámetros que lee y escribe, push o replace, guardas (D1).
4. **Datos**: qué lee del almacén y de la disponibilidad, qué hecho de §5 y
   §6 debe cumplir y qué aserción se añade a `scripts/check-data.mjs`.
5. **Estructura por pantalla**: landmarks, encabezados (`h1#contenido` con
   `tabIndex={-1}`), `document.title` (D15), orden del DOM y D7 (qué cambia
   de control con `useMediaQuery`).
6. **Patrones de pantalla nuevos** (hojas, Action Bar, resumen de errores):
   elemento, nativo o RAC y por qué, clases BEMIT y parcial; cómo se ven en
   el modo de texto grande.
7. **Cambios en componentes del kit**: API que cambia, por qué y qué
   `pnpm verify 4.x` se vuelve a pasar.
8. **Foco y anuncios**: cada flujo, origen → destino; o foco o región viva.
9. **Valores y copy fuera de los documentos**: tabla con propuesta y razón.
   El copy que no sale de Figma se propone igual que un valor.
10. **Pruebas**: tabla pantalla × prueba (par Figma a ±1 px, anchos
    intermedios, teclado, 200 % a 320 con las dos barras, texto grande,
    forced-colors, navegación en cliente, flujos en preview), cada regla
    con su contraprueba.
11. **Pendientes** de DESIGN.md que el bloque cierra.

## Cierre (informe del bloque)

1. `scripts/verify/5.N-<nombre>.mjs` en `SECTIONS`; `pnpm verify 5.N`
   (n/n) contra `pnpm dev` y `pnpm verify 5.N --preview` contra
   `pnpm build && pnpm preview` para los flujos de foco. Si el bloque tocó
   un componente del kit, vuelve a pasar su `pnpm verify 4.x`. Contrapruebas
   en el script o como manuales en docs/verificacion.md.
2. Tabla de verificación medida, con las cifras de cada par de Figma. Nunca
   «debería». Un defecto conocido es ✗ declarado con su pendiente, nunca un
   ✓ que espera el fallo.
3. Checklist de bemit-scss: ✓, N/A o ✗ con nota.
4. Cambios en DESIGN.md, docs/ y el «Estado actual» de CLAUDE.md: diff
   mostrado antes de escribir.
5. Pendientes: cuáles cierra y cuáles se añaden, con su bloque.
6. build, lint (con `check-data`), contrast y `git status`.
7. Commit: lo hace el usuario tras aprobar el cierre. Propón Summary y
   Description por separado; la descripción cubre todo el diff, incluidos
   docs y pendientes. Termina con la línea `Co-Authored-By` que indique el
   harness.
