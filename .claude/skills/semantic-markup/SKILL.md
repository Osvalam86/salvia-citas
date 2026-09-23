---
name: semantic-markup
description: Construye la estructura de marcado (HTML, JSX/React/Next, templates de Angular, Vue, Nunjucks, etc.) con semántica correcta y accesibilidad WCAG 2.2 AA vigente — elemento nativo adecuado, ARIA solo cuando hace falta, e IDs de cableado accesible (label/for, aria-describedby, aria-labelledby). Usar SIEMPRE que se pida construir, crear, escribir o estructurar un componente, vista, layout, página, sección, formulario, tabla, lista, navegación, modal, tabs o acordeón; también cuando se pida "el HTML de…", "la estructura de…" o "cómo debería marcarse…". NO genera estilos, CSS ni nombres de clases.
---

# Estructura semántica y accesible

Esta skill produce **únicamente la estructura del marcado**: qué elemento HTML usa cada pieza de contenido, qué atributos de accesibilidad lleva y cómo se cablean entre sí.

**Objetivo**: que el marcado salga correcto a la primera. No se construye para después auditar. Cada decisión se toma con el criterio ya aplicado.

## Alcance

**SÍ:**
- Elección del elemento HTML correcto para cada pieza de contenido.
- Atributos y roles ARIA — solo los necesarios, solo los vigentes.
- Atributos nativos de accesibilidad: `alt`, `lang`, `type`, `required`, `autocomplete`, `scope`, `datetime`, `inputmode`.
- `id` cuando el cableado de accesibilidad lo exige (ver sección "IDs").
- Jerarquía de encabezados y landmarks.
- Orden del DOM y foco: el orden del marcado es el orden de lectura y de tabulación.

**NO:**
- Estilos: ni CSS, ni SCSS, ni clases de utilidad, ni `style` inline.
- Nombres de clases ni metodologías de nomenclatura (BEM, BEMIT, Tailwind). Si el encargo requiere clases, se deja el elemento sin `class` y se indica en una línea que la nomenclatura queda fuera del alcance.
- Lógica de negocio, estado, hooks, servicios o llamadas a API. Solo el marcado del componente.
- Auditoría de código existente. Esta skill construye; no revisa.

## Paso 0 — Tecnología y convenciones (obligatorio, antes de escribir código)

1. Busca y lee `CLAUDE.md` (o `AGENTS.md`, `README.md`, `DESIGN.md`) en el proyecto. De ahí sale la tecnología: HTML plano, React/Next (JSX), Angular, Vue, Nunjucks, Handlebars, Astro, etc.
2. Si el archivo existe y lo indica, úsalo sin preguntar.
3. Si no existe o no es concluyente, **pregunta antes de escribir una sola línea**:
   - ¿Qué tecnología? (HTML, React/Next, Angular, Vue, otra)
   - Si aplica: ¿el componente se renderiza dentro de `<main>` o es la vista completa? — determina si lleva landmarks propios y qué nivel de encabezado le corresponde.

No asumas la tecnología. Un `<label for>` en HTML es `htmlFor` en JSX; `class` es `className`; `tabindex` es `tabIndex` en JSX y `tabindex` en Angular. Equivocarse ahí produce código que no compila.

## Paso 1 — Inventario

Antes de marcar, lista mentalmente cada pieza de contenido del encargo y responde tres preguntas por pieza:

1. **¿Qué es?** — texto, control, agrupación, dato, imagen, navegación.
2. **¿Qué hace?** — navega, ejecuta, informa, agrupa, decora.
3. **¿Qué relación tiene con lo demás?** — encabeza, pertenece a, describe a, etiqueta a.

La tercera pregunta es la que decide listas, tablas, `<dl>`, `fieldset` y los cableados por `id`. No la saltes.

## Paso 2 — Mapa semántico

Asigna el elemento a cada pieza con `references/decision-semantica.md`. Reglas que no se negocian:

- **Elemento nativo antes que ARIA, siempre.** Si `<button>`, `<a href>`, `<details>`, `<dialog>`, `<select>` resuelven el caso, se usan. ARIA es el último recurso, no el primero.
- **`<div>` y `<span>` son respuestas válidas y frecuentes.** Un contenedor sin rol semántico es un `<div>`. Inventar `<section>` o `<article>` para "no usar tantos divs" es un error peor que el div.
- **El encabezado manda sobre la caja.** La estructura del documento la definen `<h1>`–`<h6>` en jerarquía correcta, no los elementos de sección. El algoritmo de outline de HTML5 nunca se implementó en ningún navegador: los niveles se escriben a mano y a conciencia.
- **`<main>` es único por página** y no se anida en `<article>`, `<aside>`, `<nav>` ni `<footer>`.
- Ante la duda entre dos elementos, gana el menos semántico. Semántica inventada es peor que semántica ausente.

## Paso 3 — ARIA e IDs

Aplica `references/reglas-aria-vigentes.md`. Resumen operativo:

1. **Primera regla de ARIA**: no usar ARIA si el HTML nativo ya lo resuelve.
2. **Segunda regla**: no redeclarar el rol implícito de un elemento (`role="button"` en `<button>`, `role="navigation"` en `<nav>`, `role="list"` en `<ul>` → todos prohibidos).
3. **Tercera regla**: si agregas un `role` interactivo, agregas el manejo de teclado completo de ese patrón. ARIA describe comportamiento, no lo crea.
4. `aria-hidden="true"` nunca en un elemento enfocable ni en un ancestro de uno enfocable.
5. `aria-label` solo en elementos cuyo rol admite nombre. En un `<div>` o `<span>` sin `role`, el rol implícito es `generic` y el nombre se **ignora**: es marcado inválido y sin efecto.

### IDs — cuándo y por qué

Esta skill genera `id` **solo cuando la accesibilidad lo requiere**, nunca como gancho de CSS o JS:

| Cableado | Uso |
|---|---|
| `<label for="x">` ↔ `id="x"` | Asociar etiqueta y control. Obligatorio salvo label envolvente |
| `aria-describedby` | Texto de ayuda, formato esperado, mensaje de error |
| `aria-labelledby` | Nombre tomado de un elemento visible (encabezado de `<section>`, título de `<dialog>`) |
| `aria-errormessage` | Mensaje de error, acompañado de `aria-invalid="true"` |
| `aria-controls` | Solo donde el patrón APG lo pide. Soporte irregular en lectores: nunca es el único mecanismo |
| Destino de skip link / `href="#id"` | Navegación interna dentro del documento |

Reglas duras de `id`:
- **Único en todo el documento.** Sin excepción.
- En componentes reutilizables (React, Angular, Vue), el `id` **se genera o se recibe por props**, nunca se escribe literal: dos instancias del mismo componente romperían la unicidad. Usa `useId()` en React, una prop `id` en Angular/Vue, o deriva del `id` base recibido.
- Si el proyecto ya tiene una convención de generación de IDs, respétala.

## Paso 4 — Entrega

Entrega el marcado directo, listo para pegar. Sin auditoría, sin checklist, sin tabla de verificación.

Después del código, **solo si aplica**, agrega una nota de máximo 3 viñetas para señalar lo que no es evidente a simple vista:
- Elementos presentes solo para tecnología asistiva (`sr-only`, `<legend>` oculto visualmente, `<caption>`).
- Atributos que requieren que el JS los actualice en runtime (`aria-expanded`, `aria-selected`, `aria-current`, `aria-invalid`, `aria-live`).
- Decisiones de teclado que el marcado por sí solo no cubre (gestión de foco en modales, roving tabindex).

Si no hay nada de eso, no agregues nota. El código se entrega solo.

Si el encargo tiene una ambigüedad que cambia la semántica — no si es una lista o una tabla, no si el contenido es autónomo o no, no si hay uno o varios `<nav>` — **pregunta antes de construir**. No resuelvas por defecto y avises después.

## Prohibiciones

- `<div>` o `<span>` con manejador de click como control interactivo.
- `role` que duplica la semántica nativa del elemento.
- `aria-label` o `aria-labelledby` en elementos de rol `generic` (`<div>`, `<span>` sin `role`).
- `<a>` sin `href` usado como botón; `<button>` usado para navegar.
- `placeholder` como sustituto de `<label>`.
- `<table>` para maquetar; `<br>` para separar bloques; encabezados elegidos por tamaño visual.
- `tabindex` positivo (`tabindex="1"` y superiores).
- Atributos ARIA deprecados: `aria-grabbed`, `aria-dropeffect`.
- Texto de enlace o botón sin sentido fuera de contexto ("clic aquí", "ver más", "leer").
- `href="javascript:void(0)"` o `href="#"` en un elemento que ejecuta una acción: eso es un `<button>`.
- Enlace que descarga, abre ventana nueva o apunta a un documento sin anunciarlo en el nombre accesible (ver `decision-semantica.md` §5, "Enlaces").
- Entregar estilos, clases o nombres de clase.

## Referencias

| Archivo | Leer cuando |
|---|---|
| `references/decision-semantica.md` | SIEMPRE, en el Paso 2 |
| `references/reglas-aria-vigentes.md` | SIEMPRE, en el Paso 3 |
| `references/ejemplos.md` | Ante duda de sintaxis por tecnología o para calibrar el nivel esperado |
