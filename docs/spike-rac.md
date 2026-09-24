# Spike de React Aria Components · R2, R3, R4

Prueba desechable hecha tras la fase 1 y antes de la 2, con
`react-aria-components` 1.21, React 19 y locale `es-MX`. El código del spike se
borró; este documento es lo único que queda. Las comprobaciones se hicieron en
el navegador leyendo el DOM y con teclado real (Tab, flechas, Intro, Espacio) y
ratón. **No se probó con lector de pantalla** (ver § 4).

**Veredicto:** los tres riesgos se resuelven con la **API pública y tipada de
RAC**. No hacen falta los hooks de `react-aria` ni `react-stately`.
`@internationalized/date` sí será dependencia directa (decisión D2), pero entra
en la fase que la use, no por el spike.

---

## 1 · Qué camino gana, por riesgo

### R2 · Hora llena: enfocable, `aria-disabled`, no seleccionable

Se probaron tres caminos:

| Camino | Enfocable | `aria-disabled` | No seleccionable | Flechas en rejilla | API |
|---|---|---|---|---|---|
| A · RAC `disabledKeys` + `disabledBehavior: 'selection'` | ✓ | solo con `render` | ✓ | ✓ | **No pública**: `disabledBehavior` no está en `ListBoxProps`; se pasó sin tipar |
| **B · RAC sin `disabledKeys`, selección controlada con guarda** | ✓ | ✓ con `render` | ✓ | ✓ | **Pública y tipada** |
| C · hooks (`useListBox`, `useOption`, `ListKeyboardDelegate`) | ✓ | solo a mano | ✓ | **✗** ← avanzó a la hora siguiente | Pública, pero hay que montar el delegado de teclado |

**Gana B.** El camino A queda descartado: depende de una prop sin tipar que
RAC recibe hoy porque reenvía sus props a `useListState`, y eso puede
desaparecer en una versión menor sin avisar. Con solo `disabledKeys`, sin esa
prop, el comportamiento por defecto es `'all'`: la hora llena lleva
`aria-disabled` pero **sale del foco**, justo lo que el diseño no quiere. El
camino C funciona en estado, pero la navegación en rejilla falla sin
configuración adicional (probablemente la dirección del texto); no se persiguió
porque B ya cumple.

Cómo es B:

- **Sin `disabledKeys`.** Para RAC las horas llenas son ítems normales, así que
  siguen en el orden de foco y en la navegación con flechas.
- **Selección controlada con guarda.** `selectedKeys` + `onSelectionChange`
  que descarta cualquier clave de una hora llena. La guarda es la única
  autoridad sobre qué se puede seleccionar.
- **`disallowEmptySelection`.** Sin él, un segundo Espacio sobre la hora
  seleccionada la deselecciona (el `selectionBehavior` por defecto es
  `toggle`).
- **`aria-disabled` por `render`.** `ListBoxItem` acepta un `render` público y
  tipado que sustituye su elemento del DOM. Ahí se añade
  `aria-disabled="true"` a la hora llena.

Comprobado con teclado y ratón:

- Tab entra en la hora seleccionada (10:30).
- Las flechas mueven el foco **sin seleccionar**, también sobre horas llenas.
- ↓ baja por la columna y cruza de «Mañana» a «Tarde».
- Intro y Espacio sobre una hora llena no seleccionan; sobre una libre, sí.
- Un clic en una hora llena le da el foco pero no la selecciona.
- Un segundo Espacio sobre la hora seleccionada no la deselecciona.

Precio de B: RAC cree que las horas llenas son seleccionables, así que es de
esperar que emita `data-hovered` y `data-pressed` sobre ellas (no se
inspeccionó). El estilo de «llena» debe leer `[aria-disabled='true']` y no
confiar en que RAC suprima esos estados.

### R3 · Día lleno: seleccionable, sin `aria-disabled`, «sin horarios» en el nombre

**Gana RAC `CalendarCell` con `render`.** El `render` es público y tipado:
`CalendarCellProps` → `RenderProps` → `StyleRenderProps` → `DOMRenderProps`.
Sustituye el elemento de la celda y permite poner nuestro `aria-label`.

- `isDateUnavailable` queda **descartado**: añade `aria-disabled="true"` a la
  celda y al botón, y bloquea la selección. Es lo contrario de lo que pide el
  diseño.
- Sin él, el día lleno es un día normal: enfocable, seleccionable con Intro y
  sin `aria-disabled`. Comprobado con el 23 y el 29.
- El nombre accesible se compone entero en nuestro código (ver § 2.2); no se
  concatena al de RAC.

### R4 · Hoy simulado, primer día de la semana, 6 filas, rango

**Gana RAC `Calendar`**, con estas reglas:

| Comprobación | Resultado |
|---|---|
| `firstDayOfWeek="mon"` | Imprescindible. Sin la prop, `es-MX` empieza en domingo: cabecera D–S y abril de 2029 con **5** filas. Con ella: L M M J V S D y **6** filas |
| Mayo de 2029 | **5** filas aun con lunes primero. «Siempre 6 filas» se resuelve por CSS con un alto mínimo de 6 filas; RAC no tiene prop para forzarlo |
| `isToday` de RAC | Usa el reloj real: ninguna celda de 2029 lo recibe. «Hoy» se calcula siempre contra `TODAY` de los datos simulados |
| `minValue` = hoy | Los días pasados llevan `aria-disabled`, no tienen `tabindex` y las flechas no entran en ellos (← desde el 23 no se mueve) |
| «Mes anterior» en el mes de `minValue` | RAC lo marca `disabled` y `data-disabled` (comprobado); en mayo llega habilitado. ~~Ocultarlo con `visibility: hidden`~~ **Corregido en 4.6:** se omite (no se renderiza) y el mes pasa al inicio, como en Figma 02.2 y 02.5; «Mes siguiente» conserva su sitio. Si tenía el foco, RAC lo lleva al día enfocado del mes nuevo (medido) |
| `value` controlado | Con `value` siempre definido, el foco inicial cae en la fecha seleccionada y no en el hoy real (2026) |

---

## 2 · Hallazgos colaterales: decisiones de construcción

### 2.1 · `ListBoxSection` no admite DOM arbitrario

Un `div` entre la sección y sus ítems hace que **no se pinte ninguna opción**,
sin error en consola: el constructor de colecciones de RAC solo reconoce
ítems. La rejilla de filas de 3 va por CSS **sobre la propia sección**
(`display: grid; grid-template-columns: repeat(3, …)`), con el `Header` a
`grid-column: 1 / -1`. `ListBoxSection` pinta un `<section>` con
`role="group"` y `aria-labelledby` apuntando al `Header`. Comprobado: los
grupos se nombran «Mañana» y «Tarde».

### 2.2 · «Primera fecha disponible» choca con «sin horarios»

RAC añade «Primera fecha disponible» a la etiqueta de la fecha de `minValue`
(y, por simetría, «Última fecha disponible» a la de `maxValue`). En el 23
salía «lunes, 23 de abril de 2029, Primera fecha disponible, sin horarios»,
que se contradice. Además, su «seleccionado» va sin coma.

**Solución, comprobada:** el `render` de `CalendarCell` compone el nombre
entero, sin partir de la etiqueta de RAC:

```
{fecha larga}[, hoy][, sin horarios][, seleccionado]
```

- `fecha larga`: `Intl.DateTimeFormat('es-MX', { weekday: 'long', day:
  'numeric', month: 'long', year: 'numeric' })`, que da «lunes, 23 de abril
  de 2029».
- `hoy` contra `TODAY` simulado; `sin horarios` desde los datos de
  disponibilidad; `seleccionado` desde el `isSelected` del `render`.
- Resultados: «lunes, 23 de abril de 2029, hoy, sin horarios» · «martes, 24
  de abril de 2029, seleccionado» · «domingo, 29 de abril de 2029, sin
  horarios».

**Formato final (4.6), el de la descripción de `UI/Calendar Day` en Figma:**
`{fecha} [, hoy], {N horarios libres | 1 horario libre | sin horarios} [, seleccionado]`,
con la fecha sin la coma de `Intl` («martes 24 de abril de 2029, 6 horarios
libres, seleccionado»). Fuera de rango, solo la fecha. El segmento
«seleccionado» sigue pendiente de la fase 7 (§ 4.2).

**Coste, aceptado:** se pierde también «Última fecha disponible» en `maxValue`
(90 días). El límite ya lo comunican la ausencia de «Mes siguiente» y los días
no enfocables, así que no se añade como segmento.

### 2.3 · Las celdas de fuera de mes muestran su número

RAC pinta los días de los meses vecinos (en abril, del 26 al 31 de marzo) con
el número visible, `aria-disabled` y una etiqueta del tipo «lunes, 26 de
marzo de 2029». El diseño las quiere como espaciador en blanco (`Blank`).

**Solución, comprobada:** en el `render`, si `isOutsideMonth`, se pinta el
elemento sin contenido, sin `aria-label` y con `aria-hidden="true"`. El texto
visible queda vacío. La celda `td` sigue en la rejilla con
`role="gridcell"` y `aria-disabled` (ver § 4).

### 2.4 · El `Heading` de RAC mete el rótulo del calendario en el texto visible

El `<Heading />` de RAC pintó «rac-abril-lunes, abril de 2029»: antepone el
`aria-label` del calendario al mes, en texto **visible** y en minúscula. El
diseño pide el mes en `heading/sm`.

**Solución:** mes propio, calculado desde el mes visible del estado del
calendario (`CalendarStateContext`, que RAC exporta) y con el formato del
maestro `UI/Calendar` en Figma («Abril 2029»). No se usa `<Heading />`.

**Corregido en 4.6:** el mes **no es un encabezado** (el panel 02.0 enumera
los de la vista 2 y no lo incluye): es un `p`. El calendario no recibe ni
`aria-label` ni `aria-labelledby`: RAC nombra la rejilla «abril de 2029», sin
duplicar el mes (medido). Con un `aria-labelledby` al mes, según el código de
`useCalendarGrid` (sin medir), RAC añadiría su propio `aria-label` con el mes y
el nombre saldría duplicado. RAC añade además un `h2`
oculto con el mes y un botón oculto «Siguiente», que su API pública no deja
quitar (DESIGN.md § Fecha y hora; lector en la fase 7).

### 2.5 · El cast `as CalendarDate`

No hace falta. `Calendar<T extends DateValue>` infiere `T` desde `value`: con
el estado tipado como `CalendarDate` (`useState<CalendarDate>`),
`onChange={setValue}` compila sin cast. El error del spike venía de declarar el
estado como `DateValue`, el tipo unión. **Regla:** el valor de fecha del
selector se tipa como `CalendarDate` desde los datos; nunca `DateValue`.

### 2.6 · El `render` de `ListBoxItem` exige estrechar el tipo

`ListBoxItem` puede ser un enlace, así que sus props en `render` son una unión
de `div` y `a`. Hay que estrechar con `'href' in props` antes de pintar el
`div`, o TypeScript rechaza el `ref`. En el componente real las horas nunca
llevan `href`, pero la rama de `a` tiene que existir para que compile.

---

## 3 · Consecuencias en dependencias

| Paquete | Decisión |
|---|---|
| `react-aria` | No se añade. B y el `render` de `CalendarCell` bastan |
| `react-stately` | No se añade |
| `@internationalized/date` | Dependencia directa (D2), versión alineada con la que usa RAC (3.12.4 hoy). Entra en la fase de la capa de datos |

Las tres se instalaron solo para el spike y se revirtieron con él.

---

## 4 · Sin validar: comprobar con lector de pantalla en la fase 7

1. **Hora llena (R2):** que NVDA y VoiceOver anuncien «no disponible» o
   «atenuado» por nuestro `aria-disabled`, dado que RAC no lo sabe. Y que al
   pulsar Intro sobre ella no se anuncie nada que sugiera que se seleccionó.
2. **«seleccionado» por partida doble (R3):** el `gridcell` lleva
   `aria-selected="true"` y el nombre del botón incluye «seleccionado». Ver si
   algún lector lo dice dos veces; si es así, quitar el segmento.
3. **Celdas en blanco (2.3):** el `td` vacío sigue siendo un `gridcell` con
   `aria-disabled`. Comprobar cómo se anuncia al recorrer la tabla con las
   órdenes de tabla del lector (no con Tab).
4. **Nombre de la rejilla (2.4):** qué dice el lector al entrar en el
   calendario con el encabezado propio.
5. **Grupos «Mañana» y «Tarde» (2.1):** que se anuncie el cambio de grupo al
   cruzar de sección con ↓.
6. **Botón «Mes anterior» oculto con `visibility: hidden`:** que desaparezca
   también para el lector (debería, porque `visibility: hidden` lo saca del
   árbol de accesibilidad).
7. **Navegación del ListBox en rejilla a otros anchos:** el delegado de RAC
   calcula arriba y abajo por posición en pantalla. Probado en una sola
   anchura; verificar a 320 px y con zoom al 200 %.
