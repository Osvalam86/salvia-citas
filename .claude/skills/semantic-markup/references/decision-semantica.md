# Tabla de decisión semántica

Reglas mecánicas para asignar elemento HTML. Orden de evaluación: de arriba hacia abajo. La primera regla que aplica, decide.

---

## 1. Landmarks — la estructura de la página

Los landmarks son puntos de navegación para lectores de pantalla. **Pocos y bien elegidos.** Si todo es landmark, nada lo es.

| El contenido es… | Elemento | Condiciones |
|---|---|---|
| Cabecera de la página (logo, buscador global, nav principal) | `<header>` | Solo es landmark `banner` cuando es hijo directo de `<body>`. Dentro de `<article>`/`<section>`/`<main>`/`<aside>`/`<nav>` es solo una cabecera, sin rol de landmark — y está bien |
| Pie de la página (legales, contacto, sitemap) | `<footer>` | Solo es landmark `contentinfo` cuando es hijo directo de `<body>`. Mismas condiciones que `<header>` |
| Contenido principal y único de la vista | `<main>` | **Uno solo por página.** Nunca dentro de `<article>`, `<aside>`, `<nav>`, `<header>` o `<footer>` |
| Bloque de enlaces de navegación | `<nav>` | Solo para navegación **principal o significativa**, no para cualquier grupo de enlaces. Si hay más de uno en la página, cada uno lleva `aria-label` distinto ("Principal", "Migas de pan", "Paginación") |
| Contenido tangencial al principal | `<aside>` | Complementario y con sentido si se separa: sidebar de artículos relacionados, glosario, publicidad. No es "la columna de la derecha" por posición |
| Formulario de búsqueda | `<search>` | Elemento HTML actual para el landmark `search`. Alternativa con soporte más amplio: `<form role="search">` |
| Formulario relevante que necesita ser localizable | `<form>` + `aria-label`/`aria-labelledby` | `<form>` **solo es landmark si tiene nombre accesible.** Sin nombre es un contenedor normal — lo cual suele ser lo correcto |

### `aria-label` en landmarks
- Nunca repitas el rol en el nombre: `aria-label="Principal"`, no `aria-label="Navegación principal"` (el lector ya anuncia "navegación").
- Si ya existe un encabezado visible que nombra la zona, usa `aria-labelledby` apuntando a su `id` en lugar de duplicar el texto.

---

## 2. Agrupación de contenido

| El contenido es… | Elemento | Prueba de decisión |
|---|---|---|
| Pieza autónoma, con sentido completo fuera de su contexto | `<article>` | **Prueba del feed**: ¿tiene sentido si lo sacas y lo publicas solo, en un RSS o en otra página? Post, noticia, comentario, ficha de producto, tarjeta de evento → sí. Un bloque "Características" → no |
| Agrupación temática dentro de un flujo, con su propio encabezado | `<section>` | Solo si tiene encabezado. **Un `<section>` sin nombre accesible se expone como `generic`: equivale exactamente a un `<div>`.** Si lo quieres como landmark `region`, dale nombre con `aria-labelledby` al encabezado — y hazlo solo si esa zona merece ser un punto de navegación |
| Agrupación puramente visual o de layout | `<div>` | Respuesta correcta y frecuente. Un grid, un wrapper, una fila, una card sin autonomía → `<div>` |
| Imagen/código/diagrama con pie asociado | `<figure>` + `<figcaption>` | El `<figcaption>` nombra a la `<figure>`. Sin pie, no uses `<figure>` |
| Cita textual de bloque | `<blockquote>` + `cite` | Atribución fuera del `<blockquote>`, en `<figcaption>` si va dentro de `<figure>` |
| Contenido expandible/colapsable simple | `<details>` + `<summary>` | Nativo, sin JS, accesible por defecto. Solo pasa a patrón ARIA disclosure si necesitas animación controlada o estado sincronizado |
| Agrupación de controles relacionados | `<fieldset>` + `<legend>` | Obligatorio en grupos de radios y de checkboxes relacionados, aunque el diseño no dibuje el legend |

### `<article>` vs `<section>` vs `<div>` — resolución rápida

```
¿Tiene sentido completo y redistribuible por sí solo?  → <article>
¿Es una zona temática con encabezado propio?          → <section>
¿Ninguna de las dos?                                  → <div>
```

Nota: `<article>` puede contener `<section>`, y `<section>` puede contener `<article>`. Un `<article>` puede llevar su propio `<header>` y `<footer>`.

---

## 3. Listas

Error frecuente y costoso: una colección marcada como `<div>` repetidos no se anuncia como lista, y el lector de pantalla pierde el conteo ("lista de 8 elementos") y la navegación por lista.

| El contenido es… | Elemento |
|---|---|
| Colección donde el orden **no** cambia el significado | `<ul>` + `<li>` |
| Colección donde el orden **sí** importa | `<ol>` + `<li>` |
| Pares término → descripción | `<dl>` + `<dt>` + `<dd>` |

**`<ul>`** — enlaces de navegación, resultados de búsqueda, tarjetas de producto, tags, galería, ítems de menú, opciones de filtro.

**`<ol>`** — pasos de un proceso o wizard, ranking o top N, instrucciones secuenciales, migas de pan (el orden es la jerarquía), resultados numerados, líneas de una receta.

**`<dl>`** — especificaciones técnicas (Peso → 1.2 kg), metadatos (Autor → Ana, Fecha → 12/03), pares etiqueta/valor de un resumen o KPI, glosario, FAQ donde pregunta y respuesta son término y definición, ficha de datos de un perfil.

Reglas de listas:
- Hijos directos de `<ul>`/`<ol>`: solo `<li>` (y `<script>`/`<template>`). Nada de `<div>` envolviendo `<li>`.
- Hijos directos de `<dl>`: `<dt>`, `<dd>`, o `<div>` envolviendo un par `<dt>`/`<dd>` (permitido y útil para estilar cada par).
- Un `<dt>` puede tener varios `<dd>`, y varios `<dt>` pueden compartir un `<dd>`.
- Un solo ítem sigue siendo una lista si conceptualmente lo es (un carrito con un producto).
- `<ol reversed>` y `start` existen; úsalos en lugar de falsear la numeración con texto.
- Nunca `role="list"` en un `<ul>`: es redundante. **Excepción real**: si el CSS del proyecto aplica `list-style: none`, Safari + VoiceOver elimina la semántica de lista; el remedio es `role="list"` explícito. Aplícalo solo si sabes que ese CSS existe — y déjalo señalado en la nota de entrega.

---

## 4. Tablas

Solo para **datos tabulares reales**: información con relación bidimensional fila × columna. Nunca para layout.

Estructura mínima:
```html
<table>
  <caption>Ventas por región, primer trimestre 2026</caption>
  <thead>
    <tr>
      <th scope="col">Región</th>
      <th scope="col">Enero</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Norte</th>
      <td>1 240</td>
    </tr>
  </tbody>
</table>
```

- `<caption>` siempre: es el nombre accesible de la tabla. Si el diseño no lo muestra, se oculta visualmente con `sr-only` (no con `display:none`, que lo elimina del árbol de accesibilidad).
- `scope="col"` / `scope="row"` en cada `<th>`. En tablas irregulares (celdas combinadas), `headers`+`id`.
- La primera columna que identifica la fila es `<th scope="row">`, no `<td>`.
- `<tfoot>` para totales.
- Tabla con scroll horizontal: contenedor con `tabindex="0"` + `role="region"` + nombre accesible, para que el usuario de teclado pueda desplazarla.
- ¿Es una lista de cosas con varios atributos, no una matriz? Probablemente es `<ul>` de `<article>` con `<dl>` dentro, no una tabla.

---

## 5. Controles interactivos

| El control… | Elemento | Notas |
|---|---|---|
| Navega a otra URL o ancla | `<a href>` | Nunca `<a>` sin `href`. Nunca `<button>` para navegar |
| Ejecuta una acción en la página | `<button type="button">` | `type` explícito siempre: el default dentro de `<form>` es `submit` |
| Envía un formulario | `<button type="submit">` | |
| Solo contiene un icono | `<button>`/`<a>` + texto `sr-only` o `aria-label` | Nombre = verbo + objeto: "Eliminar comentario", no "Eliminar" |
| Entrada de texto | `<input>` con el `type` correcto | `email`, `tel`, `url`, `number`, `search`, `date`, `password`. Nunca `text` genérico si existe tipo específico. Añade `inputmode` cuando ayude al teclado móvil |
| Texto largo | `<textarea>` | |
| Una opción entre varias | `<select>` o radios | `<select>` para muchas opciones; radios cuando todas deben verse |
| Opción binaria independiente | `<input type="checkbox">` | |
| Interruptor on/off inmediato | `<button aria-pressed>` o `<input type="checkbox" role="switch">` | Elige uno y sé consistente |
| Modal / diálogo | `<dialog>` + `showModal()` | Nativo: gestiona foco, `Esc` e inerte del fondo. Requiere nombre accesible vía `aria-labelledby` |
| Popover ligero (menú, tooltip enriquecido) | atributo `popover` + `popovertarget` | Nativo y con buen soporte actual |
| Barra de progreso | `<progress>` | |
| Tabs, combobox, treeview, menubar | Patrón WAI-ARIA APG completo | No hay nativo. Implica implementar todo el teclado del patrón |

### Enlaces — sufijo `sr-only` de acción o destino

Un enlace debe anunciar **qué va a pasar** cuando el comportamiento no es el esperado por defecto (navegar dentro del sitio, en la misma ventana, a una página HTML). Si el icono o el contexto visual comunican algo que el texto no dice, ese dato falta en el árbol de accesibilidad.

Patrón: texto visible + `<span class="sr-only">` con el complemento.

```html
<a href="/informe.pdf">
  Informe anual
  <span class="sr-only"> (PDF, 2,4 MB)</span>
</a>
```

**Cuándo SÍ es necesario:**

| Situación | Complemento sugerido |
|---|---|
| Descarga o apertura de documento | ` (PDF, 2,4 MB)` · ` (Word, 180 kB)` · ` (Excel, 1,1 MB)` |
| Abre en ventana o pestaña nueva | ` (se abre en una ventana nueva)` |
| Reproduce o descarga multimedia | ` (vídeo, 4 min)` · ` (audio, 12 min)` |
| Enlace externo a otro dominio | ` (sitio externo)` |
| Inicia una descarga directa | ` (descarga el archivo)` |
| Texto genérico repetido en una lista ("Ver más", "Descargar") | El objeto concreto: `Descargar<span class="sr-only"> factura 0042</span>` |
| Enlace que solo contiene un icono | El nombre completo de la acción y su objeto |

**Cuándo NO es necesario:**

- Navegación interna normal, misma ventana, página HTML. Un enlace de menú no lleva `sr-only`.
- El texto visible ya es único y descriptivo por sí solo.
- El dato ya está en el texto visible: no lo dupliques (`Informe anual (PDF)` visible **no** necesita `sr-only` que repita "PDF").

Reglas de redacción del complemento:
- Escribe **qué obtiene el usuario**, no qué hace el elemento: `(PDF, 2,4 MB)` es más útil que `Abre documento PDF`.
- Incluye el formato y, si lo conoces, el peso: condiciona la decisión de abrirlo en datos móviles.
- Cuida el espacio inicial dentro del `<span>` (` (PDF)`): sin él, algunos lectores concatenan las palabras.
- Un `::after` de CSS que inserte un icono **no** sustituye este texto; el contenido generado por CSS no es contenido fiable para tecnología asistiva.
- No anuncies "abre en ventana nueva" si no vas a usar `target="_blank"`, ni omitas el aviso si sí lo usas (WCAG 3.2.5).

**Dos correcciones sobre patrones frecuentes de este tipo:**

1. `href="javascript:void(0);"` invalida el enlace: sin destino real no es navegable, rompe "abrir en pestaña nueva", el middle-click y la copia de URL. Si el elemento navega, lleva `href` real; si ejecuta una acción, es `<button type="button">`, no `<a>`.
2. Revisa que el complemento corresponda al formato: un enlace de audio con el texto "archivo de vídeo" es peor que no tener texto, porque afirma algo falso con autoridad.

### Reglas de controles
- Todo control es alcanzable y operable con teclado. Si algo responde a click, responde a `Enter`/`Space`.
- Orden del DOM = orden de tabulación. Nunca uses `tabindex` positivo para reordenar.
- `tabindex="0"` solo para hacer enfocable algo que debe serlo y no lo es nativamente (contenedor con scroll, elemento con `role` interactivo).
- `tabindex="-1"` para destinos de foco programático (encabezado de vista tras navegar en SPA, primer error de un formulario).
- Un control deshabilitado con `disabled` sale del orden de tabulación y no se anuncia. Si el usuario necesita saber que existe y por qué está bloqueado, usa `aria-disabled="true"` + bloqueo por JS.
- Nombre accesible con sentido fuera de contexto: nada de "clic aquí", "ver más", "leer".

---

## 6. Formularios

| Requisito | Regla |
|---|---|
| Etiqueta | Todo control lleva `<label for>` asociado por `id`, o `<label>` envolvente. **`placeholder` nunca sustituye al label**: desaparece al escribir y su contraste suele fallar |
| Grupos | Radios y checkboxes relacionados van en `<fieldset>` + `<legend>`. El `<legend>` es el primer hijo del `<fieldset>` |
| Obligatorio | `required` nativo + indicación **visible** en el label (no solo un asterisco de color) |
| Ayuda / formato | `<p id="ayuda-x">` asociado con `aria-describedby="ayuda-x"` en el control |
| Error | Mensaje en texto, asociado con `aria-describedby` (o `aria-errormessage`) + `aria-invalid="true"`. Nunca solo borde o color rojo |
| Resumen de errores | Tras enviar: mover foco al resumen (`tabindex="-1"`) con enlaces a cada campo, o al primer campo con error |
| Autocompletado | `autocomplete` en campos de datos personales (WCAG 1.3.5): `name`, `given-name`, `family-name`, `email`, `tel`, `street-address`, `postal-code`, `country`, `cc-number`, `current-password`, `new-password`, `one-time-code` |
| Autenticación | `autocomplete="current-password"` / `"one-time-code"` para permitir pegado y gestores de contraseñas (WCAG 2.2 — 3.3.8 Autenticación accesible) |
| Entrada redundante | No vuelvas a pedir un dato ya capturado en el mismo proceso; si debe repetirse, precárgalo o permite seleccionarlo (WCAG 2.2 — 3.3.7) |

---

## 7. Texto

| El contenido es… | Elemento |
|---|---|
| Título de la página o vista | `<h1>` — uno por página |
| Título de sección o subsección | `<h2>`–`<h6>` por jerarquía real. Sin saltos de nivel (de `h2` a `h4` es error). **El tamaño visual no decide el nivel** |
| Párrafo | `<p>` |
| Fragmento inline sin semántica | `<span>` |
| Importancia o urgencia | `<strong>` |
| Énfasis con cambio de entonación | `<em>` |
| Negrita o itálica solo visual | No es marcado: es CSS. Si debes marcarlo, `<b>` / `<i>` (estilísticos, sin peso semántico) |
| Fecha u hora legible por máquina | `<time datetime="2026-03-12">` |
| Abreviatura | `<abbr title="...">` |
| Código | `<code>`, `<pre>` para bloques |
| Texto en otro idioma | Elemento contenedor + `lang="en"` |
| Texto tachado / insertado | `<del>` / `<ins>` |
| Badge o estado | `<span>` + **texto legible**. El color por sí solo nunca comunica estado (WCAG 1.4.1) |

Regla de subtítulos: un subtítulo bajo un título **no es un encabezado de nivel inferior** (crearía una subsección fantasma). Usa `<p>` dentro de `<hgroup>`:

```html
<hgroup>
  <h2>Resultados trimestrales</h2>
  <p>Actualizado cada lunes</p>
</hgroup>
```

---

## 8. Imágenes, iconos y multimedia

| Caso | Marcado |
|---|---|
| Imagen informativa | `<img alt="descripción del contenido y función">` |
| Imagen decorativa | `<img alt="">` — el atributo vacío, **nunca omitido** |
| Imagen que es el único contenido de un enlace | El `alt` describe el **destino**, no la imagen |
| Icono decorativo junto a texto | `aria-hidden="true"` en el SVG o el elemento del icono |
| Icono que es el único contenido de un control | El control lleva el nombre accesible; el icono va `aria-hidden="true"` |
| SVG informativo independiente | `<svg role="img" aria-labelledby="t1"><title id="t1">…</title></svg>` |
| Imagen compleja (gráfica, diagrama) | `alt` breve + descripción larga en el DOM, asociada con `aria-describedby` |
| Video | `<video controls>` + `<track kind="captions">` |
| Audio | `<audio controls>` + transcripción en el DOM |

Texto alternativo: describe **función y contenido**, no apariencia. Sin "imagen de" ni "foto de": el lector ya anuncia el rol.

---

## 9. Atributos `data-*`

- Válidos para hooks de JS y testing (`data-testid`, `data-state`).
- Nunca transportan información que el usuario necesita percibir: eso va en el DOM visible o en un atributo accesible.
- No son responsabilidad de esta skill salvo que el encargo los pida explícitamente.
