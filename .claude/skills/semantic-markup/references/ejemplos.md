# Ejemplos

Pares incorrecto/correcto para calibrar criterio, y equivalencias de sintaxis por tecnología.

---

## Diferencias de sintaxis por tecnología

El criterio semántico es idéntico en todas. Solo cambia cómo se escriben los atributos.

| HTML | React / Next (JSX) | Angular | Vue |
|---|---|---|---|
| `class` | `className` | `class` | `class` |
| `for` | `htmlFor` | `for` | `for` |
| `tabindex` | `tabIndex` | `tabindex` | `tabindex` |
| `aria-label` | `aria-label` | `aria-label` o `[attr.aria-label]` | `aria-label` o `:aria-label` |
| `aria-expanded="true"` | `aria-expanded={abierto}` | `[attr.aria-expanded]="abierto"` | `:aria-expanded="abierto"` |
| `readonly` | `readOnly` | `readonly` | `readonly` |
| `maxlength` | `maxLength` | `maxlength` | `maxlength` |
| `autocomplete` | `autoComplete` | `autocomplete` | `autocomplete` |
| `colspan` / `rowspan` | `colSpan` / `rowSpan` | `colspan` / `rowspan` | `colspan` / `rowspan` |
| `datetime` | `dateTime` | `datetime` | `datetime` |

Notas por tecnología:
- **React**: los `aria-*` y `data-*` mantienen el guion. Un booleano ARIA se pasa como string o como expresión que resuelve a string: `aria-expanded={abierto ? "true" : "false"}` es lo más seguro. `useId()` para IDs únicos.
- **Angular**: los atributos ARIA dinámicos se enlazan con `[attr.aria-*]`, no con `[aria-*]`. Un componente que envuelve un control debe exponer sus `id` hacia fuera.
- **Vue**: `:aria-*` funciona directo; un valor `false` elimina el atributo, así que para `aria-expanded="false"` usa la cadena `"false"`.
- **Nunjucks / Handlebars / Astro**: sintaxis HTML pura. Cuidado con los `id` dentro de bucles: derívalos del índice o de un identificador del dato.

---

## 1. Colección de tarjetas

```html
<!-- MAL -->
<div class="grid">
  <div class="card">
    <div class="card-title">Plan Básico</div>
    <div>Ideal para empezar</div>
    <div class="btn" onclick="elegir()">Elegir</div>
  </div>
</div>
```
Cuatro fallos: no se anuncia como lista, el título no es encabezado, el botón no es enfocable ni operable por teclado, no hay jerarquía.

```html
<!-- BIEN -->
<ul>
  <li>
    <article>
      <h3>Plan Básico</h3>
      <p>Ideal para empezar</p>
      <button type="button">Elegir Plan Básico</button>
    </article>
  </li>
</ul>
```
`<article>` porque cada plan es autónomo. El nombre del botón tiene sentido fuera de contexto.

---

## 2. Especificaciones de producto

```html
<!-- MAL -->
<div class="specs">
  <div><span>Peso</span><span>1.2 kg</span></div>
  <div><span>Material</span><span>Aluminio</span></div>
</div>
```

```html
<!-- BIEN -->
<dl>
  <div>
    <dt>Peso</dt>
    <dd>1.2 kg</dd>
  </div>
  <div>
    <dt>Material</dt>
    <dd>Aluminio</dd>
  </div>
</dl>
```
El `<div>` envolviendo cada par `<dt>`/`<dd>` es válido dentro de `<dl>` y permite estilarlos como unidad.

---

## 3. Sección con encabezado

```html
<!-- MAL: section sin nombre accesible = un div con más ruido -->
<section class="hero">
  <div class="hero-title">Bienvenido</div>
</section>

<!-- MAL: el aria-label en un div se ignora -->
<div aria-label="Características">…</div>
```

```html
<!-- BIEN: si no necesita ser landmark -->
<div>
  <h2>Características</h2>
  …
</div>

<!-- BIEN: si merece ser punto de navegación -->
<section aria-labelledby="h-caract">
  <h2 id="h-caract">Características</h2>
  …
</section>
```

---

## 4. Estructura de página

```html
<body>
  <a href="#contenido">Saltar al contenido</a>

  <header>
    <a href="/"><img src="logo.svg" alt="Acme"></a>
    <nav aria-label="Principal">
      <ul>
        <li><a href="/productos" aria-current="page">Productos</a></li>
        <li><a href="/precios">Precios</a></li>
      </ul>
    </nav>
  </header>

  <main id="contenido" tabindex="-1">
    <h1>Productos</h1>
    <nav aria-label="Migas de pan">
      <ol>
        <li><a href="/">Inicio</a></li>
        <li><a href="/productos" aria-current="page">Productos</a></li>
      </ol>
    </nav>
    …
  </main>

  <footer>
    <h2 class="sr-only">Información del sitio</h2>
    …
  </footer>
</body>
```

Puntos: skip link primero; `aria-label` distinto en cada `<nav>` sin repetir la palabra "navegación"; migas en `<ol>` porque el orden es la jerarquía; `aria-current="page"` en el enlace actual; `tabindex="-1"` en `<main>` como destino del skip link; encabezado oculto en el footer para dar contexto de landmark.

---

## 5. Formulario con error

```html
<form>
  <h2 id="h-form">Crear cuenta</h2>

  <div>
    <label for="nombre">Nombre completo</label>
    <input type="text" id="nombre" name="nombre"
           autocomplete="name" required>
  </div>

  <div>
    <label for="correo">Correo electrónico (obligatorio)</label>
    <input type="email" id="correo" name="correo"
           autocomplete="email" required
           aria-describedby="correo-ayuda correo-error"
           aria-invalid="true">
    <p id="correo-ayuda">Usaremos este correo para el acceso.</p>
    <p id="correo-error">Introduce un correo válido, por ejemplo nombre@dominio.com.</p>
  </div>

  <fieldset>
    <legend>Tipo de cuenta</legend>
    <div>
      <input type="radio" id="tipo-personal" name="tipo" value="personal">
      <label for="tipo-personal">Personal</label>
    </div>
    <div>
      <input type="radio" id="tipo-empresa" name="tipo" value="empresa">
      <label for="tipo-empresa">Empresa</label>
    </div>
  </fieldset>

  <button type="submit">Crear cuenta</button>
</form>
```

Puntos: `<label for>` en todos; obligatoriedad indicada en texto, no solo con asterisco; ayuda y error encadenados en un mismo `aria-describedby`; `aria-invalid` que el JS alterna; `<fieldset>`/`<legend>` en el grupo de radios; `type="submit"` explícito.

---

## 6. Acordeón

```html
<!-- BIEN: nativo primero -->
<details>
  <summary>¿Cómo cancelo mi suscripción?</summary>
  <p>Desde Ajustes → Suscripción → Cancelar.</p>
</details>
```

Si el proyecto exige control total (animación, apertura única, estado sincronizado):

```html
<h3>
  <button type="button" aria-expanded="false" aria-controls="panel-1" id="btn-1">
    ¿Cómo cancelo mi suscripción?
  </button>
</h3>
<div id="panel-1" role="region" aria-labelledby="btn-1" hidden>
  <p>Desde Ajustes → Suscripción → Cancelar.</p>
</div>
```

`aria-expanded` va en el **botón**, nunca en el panel. `hidden` nativo para ocultar. El JS alterna ambos.

---

## 7. Botón de solo icono

```html
<!-- MAL -->
<button><svg>…</svg></button>
<button aria-label="Eliminar"><svg>…</svg></button>

<!-- BIEN: nombre con verbo + objeto -->
<button type="button" aria-label="Eliminar comentario de Ana">
  <svg aria-hidden="true" focusable="false">…</svg>
</button>

<!-- BIEN: alternativa con texto visible para lectores -->
<button type="button">
  <svg aria-hidden="true" focusable="false">…</svg>
  <span class="sr-only">Eliminar comentario de Ana</span>
</button>
```

`focusable="false"` en el SVG evita que IE/Edge antiguos lo metan en el orden de tabulación; es inocuo en navegadores actuales.

---

## 7 bis. Enlaces con complemento `sr-only`

```html
<!-- MAL: el icono comunica el formato, el texto no. Y el href no navega -->
<a class="link-document-PDF" href="javascript:void(0);">Informe anual</a>

<!-- MAL: sr-only innecesario, duplica lo visible -->
<a href="/contacto">Contacto<span class="sr-only"> Contacto</span></a>

<!-- BIEN: descarga de documento -->
<a href="/informes/anual-2026.pdf">
  Informe anual 2026
  <span class="sr-only"> (PDF, 2,4 MB)</span>
</a>

<!-- BIEN: ventana nueva -->
<a href="https://ejemplo.org/normativa" target="_blank" rel="noopener">
  Normativa vigente
  <span class="sr-only"> (se abre en una ventana nueva)</span>
</a>

<!-- BIEN: texto genérico repetido en una lista -->
<li>
  <span>Factura 0042</span>
  <a href="/facturas/0042.pdf" download>
    Descargar
    <span class="sr-only"> factura 0042 (PDF)</span>
  </a>
</li>

<!-- BIEN: navegación interna normal, sin complemento -->
<a href="/productos">Productos</a>
```

El espacio al inicio del `<span>` es intencional: evita que el lector concatene la última palabra visible con la primera del complemento.

---

## 8. Modal

```html
<dialog id="dlg-borrar" aria-labelledby="dlg-titulo" aria-describedby="dlg-texto">
  <h2 id="dlg-titulo">Eliminar proyecto</h2>
  <p id="dlg-texto">Esta acción no se puede deshacer.</p>
  <button type="button" value="cancel">Cancelar</button>
  <button type="button" value="confirm">Eliminar proyecto</button>
</dialog>
```

Abierto con `showModal()`: foco atrapado, `Esc` para cerrar y fondo inerte, todo nativo. `role="dialog"` y `aria-modal` son implícitos: no los escribas.

---

## 9. Componente React con IDs seguros

```jsx
import { useId } from 'react';

export function CampoTexto({ etiqueta, ayuda, error, ...props }) {
  const base = useId();
  const idInput = `${base}-input`;
  const idAyuda = `${base}-ayuda`;
  const idError = `${base}-error`;

  const descritoPor = [ayuda && idAyuda, error && idError]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div>
      <label htmlFor={idInput}>{etiqueta}</label>
      <input
        id={idInput}
        aria-describedby={descritoPor}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {ayuda && <p id={idAyuda}>{ayuda}</p>}
      {error && <p id={idError}>{error}</p>}
    </div>
  );
}
```

`useId()` garantiza unicidad entre instancias. `aria-describedby` se omite si no hay nada que describir (una cadena vacía apuntaría a la nada). `aria-invalid` se omite cuando no hay error, en lugar de escribir `"false"`.

---

## 10. Formato de entrega

Ejemplo de respuesta completa de esta skill, incluyendo cuándo procede la nota final.

> **Encargo**: "Necesito el marcado de una tabla de facturas con estado y acción de descarga. React."

```jsx
<table>
  <caption className="sr-only">Facturas emitidas</caption>
  <thead>
    <tr>
      <th scope="col">Número</th>
      <th scope="col">Fecha</th>
      <th scope="col">Estado</th>
      <th scope="col">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {facturas.map((f) => (
      <tr key={f.id}>
        <th scope="row">{f.numero}</th>
        <td><time dateTime={f.fechaISO}>{f.fechaLegible}</time></td>
        <td>{f.estado}</td>
        <td>
          <a href={f.urlPdf} download>
            Descargar
            <span className="sr-only"> factura {f.numero}</span>
          </a>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Notas:**
- `<caption>` y el `<span>` del enlace existen solo para lectores de pantalla: ocúltalos visualmente con `sr-only` (posicionamiento fuera de pantalla), nunca con `display:none`, que los elimina del árbol de accesibilidad.
- El estado va como texto, no solo como color: si el diseño usa un badge cromático, el texto debe permanecer en el DOM.

*(La nomenclatura de clases queda fuera del alcance de esta skill: `sr-only` aparece como marcador del patrón, no como propuesta de nombre.)*
