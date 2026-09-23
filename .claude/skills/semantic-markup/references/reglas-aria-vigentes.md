# Reglas ARIA vigentes y cableado por IDs

Referencia base: WAI-ARIA 1.2 / 1.3, ARIA in HTML (W3C), ARIA Authoring Practices Guide y WCAG 2.2. Contiene lo que aplica hoy y señala explícitamente lo que quedó obsoleto.

---

## Las cinco reglas

1. **No uses ARIA si el HTML nativo resuelve el caso.** `<button>` antes que `role="button"`. `<nav>` antes que `role="navigation"`.
2. **No cambies la semántica nativa**, salvo que sea deliberado y correcto. `<h2 role="tab">` es válido en un patrón de tabs; `<button role="link">` es casi siempre un error.
3. **Todo control con ARIA debe ser operable con teclado.** Si añades `role="button"` a un `<div>`, debes añadir `tabindex="0"`, manejo de `Enter` y `Space`, y el estado visible de foco. ARIA no aporta comportamiento: solo lo describe.
4. **No pongas `aria-hidden="true"` en elementos enfocables** ni en ancestros de elementos enfocables. Produce foco invisible para el lector de pantalla.
5. **Todo control interactivo necesita nombre accesible.** Del contenido, del `<label>`, de `aria-label` o de `aria-labelledby`.

---

## Roles redundantes — prohibidos

Estos `role` duplican la semántica implícita y solo añaden ruido:

| Prohibido | Razón |
|---|---|
| `<button role="button">` | Implícito |
| `<a href role="link">` | Implícito |
| `<nav role="navigation">` | Implícito |
| `<main role="main">` | Implícito |
| `<header role="banner">` (hijo de body) | Implícito |
| `<footer role="contentinfo">` (hijo de body) | Implícito |
| `<aside role="complementary">` | Implícito |
| `<ul role="list">` | Implícito — salvo el caso `list-style:none` + Safari, ver decision-semantica.md §3 |
| `<li role="listitem">` | Implícito |
| `<table role="table">` | Implícito |
| `<form role="form">` | Implícito |
| `<input type="checkbox" role="checkbox">` | Implícito |

Los `role="banner"` / `"navigation"` / `"main"` explícitos vienen de la época en que el soporte de los elementos HTML5 era irregular. Hoy es ruido. No los escribas.

---

## Nombrado: qué se puede nombrar y qué no

El rol `generic` **prohíbe el nombrado**. Un `<div>` o `<span>` sin `role` explícito tiene rol `generic`:

```html
<!-- MAL: el nombre se ignora; además es HTML inválido -->
<div aria-label="Resumen del pedido">…</div>

<!-- BIEN: elemento con rol que admite nombre -->
<section aria-labelledby="h-resumen">
  <h2 id="h-resumen">Resumen del pedido</h2>
  …
</section>

<!-- BIEN: si de verdad necesita ser un grupo nombrado -->
<div role="group" aria-label="Resumen del pedido">…</div>
```

Otros roles que prohíben el nombrado: `caption`, `code`, `deletion`, `emphasis`, `insertion`, `paragraph`, `presentation`/`none`, `strong`, `subscript`, `superscript`.

### Precedencia del nombre accesible
`aria-labelledby` > `aria-label` > contenido nativo (`<label>`, texto del botón, `alt`, `<caption>`, `<legend>`) > `title`.

- `aria-label` **reemplaza** el texto visible. Si el control tiene texto visible, el `aria-label` debe empezar con ese texto (WCAG 2.5.3, Etiqueta en el nombre) o el comando de voz fallará.
- `title` como nombre accesible es el último recurso: no se muestra en móvil, no funciona con teclado y su soporte es irregular. No lo uses como mecanismo principal.
- `aria-description` es ARIA 1.3 y su soporte aún es parcial. Para descripciones, usa `aria-describedby` apuntando a texto real del DOM.

---

## Cableado por `id`

Esta skill genera `id` solo para accesibilidad. Los cableados vigentes:

### `<label for>` ↔ `id`

```html
<label for="correo">Correo electrónico</label>
<input type="email" id="correo" name="correo" autocomplete="email">
```

Alternativa válida: `<label>` envolvente, sin `id` ni `for`.
```html
<label>Correo electrónico
  <input type="email" name="correo" autocomplete="email">
</label>
```
Usa la primera forma si el layout exige separar label y control.

### `aria-describedby` — ayuda, formato y error

Acumula varios `id` separados por espacio; se anuncian en ese orden después del nombre:

```html
<label for="pass">Contraseña</label>
<input type="password" id="pass" name="pass"
       autocomplete="new-password"
       aria-describedby="pass-ayuda pass-error"
       aria-invalid="true">
<p id="pass-ayuda">Mínimo 12 caracteres.</p>
<p id="pass-error">La contraseña no cumple el mínimo.</p>
```

### `aria-labelledby` — nombre tomado del DOM

```html
<dialog aria-labelledby="dlg-titulo">
  <h2 id="dlg-titulo">Confirmar eliminación</h2>
  …
</dialog>
```
Acepta varios `id`: el nombre se concatena en el orden listado.

### `aria-errormessage`

Más preciso que `aria-describedby` para errores, pero **solo se anuncia cuando `aria-invalid="true"`** y su soporte aún no es universal. Estrategia segura: `aria-describedby` como base, `aria-errormessage` como refuerzo si el proyecto lo requiere.

### `aria-controls`

Soporte irregular en lectores de pantalla (JAWS lo usa; NVDA y VoiceOver lo ignoran en gran medida). Inclúyelo donde el patrón APG lo especifica, pero **nunca como único mecanismo**: el estado se comunica con `aria-expanded` y el foco se gestiona por JS.

### Unicidad del `id` en componentes

En componentes reutilizables el `id` literal es un bug latente: dos instancias rompen la unicidad y el `for` apunta al control equivocado.

```jsx
// React
const id = useId();
return (
  <>
    <label htmlFor={`${id}-correo`}>Correo</label>
    <input id={`${id}-correo`} aria-describedby={`${id}-ayuda`} />
    <p id={`${id}-ayuda`}>Usaremos este correo para el acceso.</p>
  </>
);
```

En Angular/Vue: recibe un `id` base por prop/input y deriva los demás, o usa un generador incremental del proyecto.

---

## Estados dinámicos

Atributos que el marcado declara pero **el JS debe mantener actualizados**. Un estado estático es peor que ninguno: miente.

| Atributo | Dónde | Valor |
|---|---|---|
| `aria-expanded` | El control que expande | `true`/`false` en el disparador, no en el panel |
| `aria-selected` | Ítem seleccionado | Solo en `tab`, `option`, `row`, `gridcell` |
| `aria-checked` | Control custom de marcado | Con nativo, no se usa: `checked` basta |
| `aria-pressed` | Botón de alternancia | `true`/`false` |
| `aria-current` | Ítem actual en un conjunto | `page`, `step`, `location`, `date`, `time` o `true` |
| `aria-invalid` | Campo con error | `true` mientras el error persiste |
| `aria-disabled` | Control bloqueado pero enfocable | Requiere bloquear la acción por JS |
| `aria-busy` | Región cargando | `true` durante la carga |
| `aria-live` | Región que cambia sola | `polite` por defecto; `assertive` solo para lo urgente |

Notas sobre `aria-live`:
- El contenedor con `aria-live` debe existir en el DOM **antes** de recibir contenido. Si lo insertas junto con el mensaje, no se anuncia.
- `role="status"` ≡ `aria-live="polite"`; `role="alert"` ≡ `aria-live="assertive"`.
- Un `aria-live` por tipo de mensaje. Varios compitiendo se pisan entre sí.

---

## Foco y teclado

- Orden del DOM = orden de tabulación. Si el diseño exige un orden visual distinto, el problema se resuelve en CSS sin alterar el DOM — y si el CSS reordena (`order`, `grid-area`), el orden de foco deja de coincidir con el visual: es un fallo de WCAG 1.3.2 / 2.4.3.
- `tabindex` positivo: prohibido.
- `tabindex="0"`: hace enfocable algo que debe serlo. También para contenedores con scroll (tabla ancha, bloque de código), que de otro modo son inalcanzables por teclado.
- `tabindex="-1"`: destino de foco programático, fuera del orden de tabulación.
- Modales: foco al abrir, foco atrapado dentro, `Esc` cierra, foco devuelto al disparador al cerrar. `<dialog>` + `showModal()` hace todo esto de forma nativa.
- SPA: tras navegar, mueve el foco al `<h1>` de la nueva vista (`tabindex="-1"`) y anuncia el cambio. El foco no se reinicia solo.
- Skip link como primer elemento enfocable del `<body>`, apuntando al `id` de `<main>`.
- El indicador de foco nunca se elimina. `outline: none` sin reemplazo es un fallo de WCAG 2.4.7.
- WCAG 2.2 — 2.4.11 Foco no oscurecido: headers pegajosos, cookie banners y barras flotantes no deben tapar el elemento enfocado.

---

## Obsoleto — no escribir

| Elemento / atributo | Estado |
|---|---|
| `aria-grabbed`, `aria-dropeffect` | Deprecados desde ARIA 1.1. Soporte nulo. Para drag & drop accesible: ofrecer siempre una alternativa por teclado (WCAG 2.2 — 2.5.7 Movimientos de arrastre) |
| `role="application"` | Desactiva los atajos del lector de pantalla. Casi nunca justificado |
| `role="presentation"` / `role="none"` en contenido con significado | Solo para eliminar semántica de un envoltorio puramente estructural |
| Algoritmo de outline de HTML5 | Nunca se implementó en ningún navegador. Los niveles de encabezado se escriben explícitamente; anidar `<section>` no genera jerarquía |
| `<h1>` múltiples "porque las sección lo permiten" | Consecuencia del punto anterior: un `<h1>` por página |
| `accesskey` | Colisiona con atajos del navegador y del lector. Evitar |
| `longdesc` | Obsoleto. Usa `aria-describedby` a texto real del DOM |
| `role="text"` | No estándar. Solo un parche histórico de WebKit |
| `<marquee>`, `<blink>`, `<font>`, `<center>` | Obsoletos en HTML |
| WCAG 4.1.1 "Parsing" | **Retirado en WCAG 2.2** por obsoleto. IDs duplicados ya no fallan ese criterio — pero siguen rompiendo `label/for` y `aria-labelledby`, así que la regla de unicidad se mantiene por motivos funcionales |
| Validación solo por color/borde | Falla WCAG 1.4.1. Siempre texto |
| `aria-label` en `<div>`/`<span>` sin `role` | Se ignora (rol `generic` prohíbe nombrado) |
| `<section>` como sustituto genérico de `<div>` | Sin nombre accesible es `generic`: el mismo resultado con más ruido |

---

## Criterios de WCAG 2.2 que afectan al marcado

Los criterios nuevos de 2.2 son mayoritariamente de diseño, pero tres tocan directamente la estructura:

- **3.3.7 Entrada redundante (A)** — no volver a pedir información ya capturada en el mismo proceso. En el marcado: precargar valores o permitir seleccionarlos.
- **3.3.8 Autenticación accesible (AA)** — permitir pegado y gestores de contraseñas. En el marcado: `autocomplete="current-password"` / `"one-time-code"`, y jamás bloquear `paste`.
- **2.5.7 Movimientos de arrastre (AA)** — toda funcionalidad de arrastre necesita una alternativa de un solo puntero. En el marcado: botones de "mover arriba/abajo" o un `<select>` de posición junto al drag.

También relevante: **2.5.8 Tamaño del objetivo (AA)**, mínimo 24×24 px. Es una restricción de CSS, pero condiciona el marcado cuando los controles se apilan (evitar enlaces inline pegados como si fueran botones).

---

## Patrones que exigen APG completo

No hay equivalente nativo. Si el encargo los pide, se implementa el patrón completo de la WAI-ARIA Authoring Practices Guide, con todo su teclado:

`tabs` · `combobox` / autocomplete · `menu` / `menubar` · `treeview` · `grid` / `treegrid` · `carousel` · `slider` de doble pulgar · `listbox` múltiple

Si el marcado por sí solo no basta (y en estos casos nunca basta), señálalo en la nota de entrega indicando qué teclado debe implementar el JS.
