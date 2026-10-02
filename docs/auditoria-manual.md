# Auditoría manual · 7.4

Guion de la prueba manual de la fase 7: lector de pantalla (NVDA), Firefox, Chrome real,
Android y los calendarios. Lo ejecuta Osvaldo; cada paso se rellena aquí mismo y vuelve al
repo como se dice en § Vuelta al repo. Lo automático está en docs/auditoria.md (7.3).

- **Producción:** https://salvia-citas.netlify.app. Ningún paso usa `pnpm dev`.
- **Tramos y paradas:** N1, N2 y N3 con Firefox (NF) y con Chrome (NC), K, C, A e I: diez
  paradas. Al terminar un tramo se pega relleno en el chat y no se empieza el siguiente sin
  confirmación. Orden propuesto: NF1, NF2, NF3, NC1, NC2, NC3, K, C, A, I.
- **Sin dispositivo:** sin Mac ni iPhone. Lo que exige Safari, iOS o VoiceOver queda en
  § Sin dispositivo con su razón y la mitad medida aquí.
- **Abreviaturas:** `RUIZ` = `/especialistas/elena-ruiz-arellano`; `SLOT` =
  `fecha=2029-04-24&hora=10:30`; «estrecho» = zoom del navegador al 200 % en una ventana
  maximizada de 1920 (960 px CSS, por debajo de `lg`: chrome móvil). `ENTORNO` con ese zoom
  debe dar `innerWidth` < 1024; si no (portátil o PC con otra resolución o escalado), el
  tramo se para y se avisa. RDM = modo de diseño adaptable de Firefox (Ctrl+Mayús+M).

## Recorte de 7.4

Decidido por Osvaldo tras NF3: el guion completo no cabe en el tiempo disponible. Lo no
medido se anota «sin medir en 7.4», nunca ✓.

- **Quedan por hacer:** Chrome + NVDA solo para repetir los hallazgos (N1.11, «procesando»
  de N1.7 y la validación nativa de N2); K.1, K.2, K.4 y K.7; A.1 y A.3; I.3.
- **Sin medir en 7.4:** N3.5, N3.6, el resto de NC1–NC3, K.3, K.5, K.6, K.8, K.9, todo el
  tramo C, A.2, A.4–A.6, I.1, I.2, I.4 e I.5.
- Pendientes de DESIGN.md y la tabla «Pendientes → pasos» se ajustan en el cierre, con el
  diff.

## Condiciones de cada paso

1. **Pestaña nueva y carga completa** al empezar cada paso, escribiendo la URL. Las citas se
   reinician al recargar (D13) y una URL ya visitada en la misma pestaña restaura su scroll
   (D12, «Matiz»). Si N2.4 canceló la cita de Molina, K.1 y K.2 empiezan con carga completa.
2. **Bloque de entorno** al empezar cada tramo (fragmento `ENTORNO`, § Fragmentos), más
   fecha, equipo (PC o portátil), Windows (`winver`), versión del navegador (Firefox:
   `about:support`; Chrome: `chrome://version`), NVDA (NVDA+N › Ayuda › Acerca de) y el zoom
   del navegador. **Esperado: `/assets/index-DgeRHP-Q.js`** (el build de la app no cambia
   desde 3423e78, D18). Si sale otro, el tramo se para y se avisa.
3. **Lector:** cada paso de N lista lo que debe oírse: función, nombre, estado y valor. ✓ si se
   oyen todos; el orden y las palabras exactas de NVDA no cuentan. Un elemento que falta es ✗.
   Un duplicado («seleccionado» dos veces) es dato, salvo spike-rac § 4.2, que es ✗ para 7.6.
   Lo que dice NVDA se copia literal del Visor de voz.
4. **Consola:** en Firefox y Chrome hay que escribir `permitir pegar` (o `allow pasting`) la
   primera vez que se pega. Ejecutar un fragmento no mueve el foco de la página
   (`document.activeElement` sigue siendo el control). Se pega la salida entera. DevTools va
   en su propia ventana (desacoplado) y, tras ejecutar un fragmento, se vuelve a la página con
   Alt+Tab, **sin hacer clic en ella**: un clic mueve el foco.
5. **Nada a ojo** donde hay fragmento o captura: la cifra manda.

## Chuleta de NVDA

| Qué | Teclas |
|---|---|
| Tecla NVDA | Insert (o Bloq Mayús si lo configuras al instalar) |
| Callar | Ctrl |
| Visor de voz | NVDA+N › Herramientas › Visor de voz. Ábrelo antes del tramo; entre pasos, selecciona todo y bórralo con Supr para copiar solo lo del paso |
| Modo exploración / foco | NVDA+Espacio alterna (suena un clic). Exploración: se lee la página con letras rápidas. Foco: las teclas van al control. NVDA cambia solo al entrar en un campo o una lista |
| Letras rápidas (exploración) | H / Mayús+H encabezado siguiente / anterior; 1–6 por nivel; D región; K enlace; B botón; F campo; T tabla; Ctrl+Alt+flechas, de celda en celda dentro de una tabla |
| Lista de elementos | NVDA+F7 (pestañas Enlaces, Encabezados, Regiones…); Escape la cierra |
| Leer | ↓ / ↑ línea a línea; NVDA+Tab lee el foco; NVDA+T el título de la ventana; NVDA+B lee el diálogo en primer plano |
| Velocidad | NVDA+Ctrl+flechas (Velocidad) o Preferencias › Opciones › Voz |
| Antes de empezar | Preferencias › Opciones › Presentación de objetos › «Anunciar descripciones de objetos» activado (lo usan `aria-describedby`); las mismas opciones con Firefox y Chrome |

## Fragmentos de consola

Cada fragmento se pega en la consola (F12) de la pestaña del paso.

**`ENTORNO`** (al empezar cada tramo, y en C antes de cada pasada):

```js
({ fecha: new Date().toString(), ua: navigator.userAgent, innerWidth, innerHeight, devicePixelRatio, barra: innerWidth - document.documentElement.clientWidth, js: [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')).find((s) => s.includes('/index-')) })
```

Esperado: `js: "/assets/index-DgeRHP-Q.js"`. `barra` es el ancho de la barra de scroll (0 si
es superpuesta).

**`FOCO`** (qué tiene el foco y su descripción):

```js
(() => { const el = document.activeElement; const d = el.getAttribute('aria-describedby'); return { etiqueta: el.tagName + ' ' + (el.getAttribute('aria-label') || el.textContent).replace(/\s+/g, ' ').trim().slice(0, 60), descripcion: d && d.split(' ').map((id) => document.getElementById(id)?.textContent.trim()).join(' | '), url: location.pathname + location.search } })()
```

**`ESTADO`** (hoja abierta, página bloqueada y foco; K.5 y A.1):

```js
(() => ({ url: location.pathname + location.search, hojaModal: !!document.querySelector('dialog:modal'), dialogAbierto: !!document.querySelector('dialog[open]'), overflowHtml: getComputedStyle(document.documentElement).overflow, foco: document.activeElement.tagName + ' ' + document.activeElement.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), historial: history.length }))()
```

**`TEXTO_GRANDE`** (modo de texto grande y barra):

```js
(() => { const bar = document.querySelector('.c-app-layout__bar'); return { innerWidth, modoTextoGrande: matchMedia('(max-width: 18.75rem)').matches, posicionBarra: bar && getComputedStyle(bar).position, letraRaiz: getComputedStyle(document.documentElement).fontSize } })()
```

`tools.large-text` es `max-width: 18.75rem`: con la letra a 16 se activa por debajo de 300
px de ancho; a 24, de 450; a 32, de 600. Activo, la barra es `static` (en el flujo).

**`ANILLO`** (anillo del control enfocado frente a la barra; el anillo acaba 4 px por debajo
de la caja: desfase 2 + grosor 2):

```js
(() => { const el = document.activeElement; const r = el.getBoundingClientRect(); const bar = document.querySelector('.c-app-layout__bar'); const b = bar.getBoundingClientRect(); const fin = r.bottom + 4; return { foco: el.id || el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), componenteFin: +r.bottom.toFixed(1), anilloFin: +fin.toFixed(1), barraInicio: +b.top.toFixed(1), posicionBarra: getComputedStyle(bar).position, solapeAnillo: +(fin - b.top).toFixed(1), solapeComponente: +(r.bottom - b.top).toFixed(1), innerHeight, scrollY } })()
```

`solapeAnillo > 0`: parte del anillo bajo la barra (mecanismo de F2). `solapeComponente > 0`:
el componente bajo la barra (2.4.11). Con la barra `static` el solape no aplica.

**`HORA`** (la hora enfocada frente al viewport; K.8):

```js
(() => { const el = document.activeElement; const r = el.getBoundingClientRect(); return { hora: el.textContent.trim(), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), innerHeight, aLaVista: r.top >= 0 && r.bottom <= innerHeight, scrollY } })()
```

**`BASE`** (cabecera de resultados; K.9). La línea base del recuento se mide con una sonda de
alto 0, cuyo borde inferior cae en la línea base; la del valor del `select` no es accesible
desde JS, así que se compara la geometría con Edge, donde V1a midió la cabecera en 79 y 1 px
entre las dos líneas base:

```js
(() => { const h = document.querySelector('.c-results-header'); const c = h.querySelector('.c-results-header__count'); const s = h.querySelector('select'); const p = document.createElement('span'); p.style.cssText = 'display:inline-block;width:0;height:0'; c.append(p); const base = p.getBoundingClientRect().bottom; p.remove(); const hr = h.getBoundingClientRect(); const sr = s.getBoundingClientRect(); return { soporta: CSS.supports('align-self', 'last baseline'), alineacionRecuento: getComputedStyle(c).alignSelf, altoCabecera: +hr.height.toFixed(1), baseRecuento: +(base - hr.top).toFixed(1), selectTop: +(sr.top - hr.top).toFixed(1), selectBottom: +(sr.bottom - hr.top).toFixed(1) } })()
```

**`CLIC`** (C.1 y C.2: el `scrollY` del clic, con un escuchador en captura; se pega antes de
desplazarse):

```js
addEventListener('click', (e) => console.log('clic', { scrollY, innerWidth, devicePixelRatio, destino: e.target.closest('a')?.getAttribute('href'), t: performance.now().toFixed(0) }), { capture: true, once: true }); 'listo'
```

---

## Tramo N · NVDA

Seis paradas: NF1, NF2, NF3 con Firefox y NC1, NC2, NC3 con Chrome, con los mismos pasos. Cada
paso tiene una columna por navegador. NVDA arrancado antes que el navegador. Ventana
maximizada; «estrecho», con el zoom del navegador al 200 %.

Plantilla de resultado de cada paso:

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | | |
| ✓ / ✗ | | |
| Notas | | |

### N1 · Estructura, navegación y búsqueda (45–60 min)

**Entorno NF1.** Jueves 1 de octubre de 2026, 10:55–12:06 (GMT−6). PC de escritorio. Windows
11 26H2 (compilación 26300.9550). Firefox 157.0. NVDA 2026.2 (2026.2.0.57664), «Anunciar
descripciones de objetos» activado. `ENTORNO` al 100 %: `innerWidth` 1920, `innerHeight` 919,
`devicePixelRatio` 1, barra 0, `js` `/assets/index-DgeRHP-Q.js` (CSS `index-D1ACGvU6.css`).
Estrecho (zoom 200 %): `innerWidth` 960, `innerHeight` 460, `devicePixelRatio` 2. Extensiones:
Adblock Plus (permitido en el sitio: `@@||salvia-citas.netlify.app^$document`) y React
DevTools. Método: N0.1 con H; N0.2 con K en vez de NVDA+F7 (el diálogo de lista no se copia);
el resto, con Tab.

**Entorno NC1** (tramo NC recortado: N1.7, N1.9–N1.11 y el hallazgo de N2). Jueves 1 de
octubre de 2026, 17:13–17:20 (GMT−6). Mismo PC y Windows 11 26H2. Chrome 154 (UA
`Chrome/154.0.0.0`; versión completa sin anotar). NVDA 2026.2. `ENTORNO` al 100 %:
`innerWidth` 1920, `innerHeight` 911, `devicePixelRatio` 1, barra 15; `js` no leído (objeto
contraído en la consola; Firefox dio `index-DgeRHP-Q.js` a las 16:50). Extensiones: Adblock
Plus y React DevTools. Estrecho = zoom 200 % (sale «Filtrar y ordenar», chrome móvil).

#### N0.1 · Encabezados de las 8 rutas de D1 y el 404 (1.3.1)

Ruta: cada una de la tabla, carga completa, al 100 % y estrecho. Acción: NVDA+F7 › pestaña
Encabezados, vista de árbol; leer la lista entera. Debe oírse / verse: los encabezados de la
tabla, con su nivel, en ese orden; un solo h1. Medido en el DOM de producción (Chromium, 30
de septiembre) a 1440 y a 375.

| Ruta | 100 % (1440) | Estrecho (derivado de 375, sin medir a 960) |
|---|---|---|
| `/` | H1 Encuentra a tu especialista · H2 Filtros · H2 Resultados · H3 Dra. Isabel Carmona Díaz · H3 Dr. Iván Cortés Naranjo · H3 Dr. Julián Ferrer Nava · H3 Dr. Leonardo Corona Álvarez | Sin H2 Filtros |
| `RUIZ?SLOT` | H1 Dra. Elena Ruiz Arellano · H2 Elige fecha · H2 abril de 2029 (el oculto de RAC, N3.1) · H2 Elige hora · H2 Tu cita | H1 · H2 Elige fecha · H2 Elige hora |
| `RUIZ/confirmar?SLOT` | H1 Confirma tu cita | Igual |
| `RUIZ/datos?SLOT` | H1 Tus datos · H2 Datos del paciente · H2 Antes de confirmar · H2 Tu cita | Sin H2 Tu cita |
| `/citas/c1/confirmada` | H1 Tu cita está reservada · H2 Qué sigue | Igual |
| `/mis-citas` | H1 Mis citas · H2 Próximas · H3 Martes 24 de abril · 10:30 · H3 Martes 8 de mayo · 17:00 · H3 Miércoles 16 de mayo · 09:30 · H2 Pasadas · H3 Lunes 12 de marzo · 09:00 · H3 Jueves 22 de febrero · 12:30 · H2 Agendar otra cita | Sin H2 Agendar otra cita |
| `/mis-citas/c3/reprogramar?fecha=2029-05-17&hora=17:00` | H1 Dr. Iván Cortés Naranjo · H2 Elige fecha · H2 mayo de 2029 · H2 Elige hora · H2 El cambio | H1 · H2 Elige fecha · H2 Elige hora |
| `/fuera-de-alcance` | H1 Esta sección no forma parte del caso de estudio | Igual |
| `/no-existe` | H1 No encontramos esta página | Igual |

Anotar: por ruta, ✓ o la diferencia (encabezado que falta, sobra o cambia de nivel), en las
dos columnas.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | 100 %: 7 de 9 rutas iguales a la tabla (`/`, confirmar, datos, confirmada, Mis citas, `/fuera-de-alcance` y el 404), con un solo h1. `RUIZ?SLOT`: «Dra. Elena Ruiz Arellano encabezado nivel 1 · Elige fecha nivel 2 · Elige hora nivel 2 · Tu cita región Tu cita nivel 2». Estrecho: 9 de 9 iguales; en `RUIZ` y en reprogramar, «Elige fecha agrupación» | Sin medir en 7.4 |
| ✓ / ✗ | Diferencia, sin ✗ todavía: a 100 %, en `RUIZ?SLOT` falta «H2 abril de 2029» y en reprogramar c3 falta «H2 mayo de 2029». Estrecho ✓ | |
| Notas | Causa compatible, sin confirmar: `role="application"` en la raíz del calendario de RAC (react-aria 3.52.1, `private/calendar/useCalendarBase.mjs:91`), que NVDA no recorre con H en modo exploración. La investiga N3.1 | |

#### N0.2 · Enlaces de `/`, `RUIZ?SLOT` y `/mis-citas` (2.4.4)

Acción: NVDA+F7 › pestaña Enlaces, al 100 % y estrecho. Debe verse: la lista de la tabla (DOM
de producción). **Dato, sin ✓ ni ✗:** anotar cada nombre que no dice su destino fuera de
contexto. Los repetidos de la tabla son conocidos y llevan su contexto por
`aria-describedby`, que cumple 2.4.4 (A, técnica ARIA1); el criterio es N0.3.

| Ruta | 100 % | Estrecho (derivado de 375, sin medir a 960) |
|---|---|---|
| `/` | Saltar al contenido · Salvia · Especialistas (actual) · Mis citas · Ayuda · Ver horarios ×4 · Página 1 (actual) · Página 2 · Página 12 · Siguiente | Saltar al contenido · Salvia · Ayuda · Ver horarios ×4 · Especialistas (actual) · Mis citas · Cuenta |
| `RUIZ?SLOT` | Saltar al contenido · Salvia · Especialistas (actual, sección) · Mis citas · Ayuda · Especialistas (breadcrumb) | Saltar al contenido · Salvia · Ayuda · Especialistas (retroceso) |
| `/mis-citas` | Saltar al contenido · Salvia · Especialistas · Mis citas (actual) · Ayuda · Reprogramar ×2 · Agendar seguimiento · Agendar de nuevo · Buscar especialista | Sin Buscar especialista; con Especialistas · Mis citas (actual) · Cuenta al final |

Anotar: nombres que no dicen su destino fuera de contexto, y cualquier diferencia con la
tabla.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | 100 %: en `/`, «Especialistas visitado misma página enlace página actual»; en `RUIZ`, «Especialistas visitado enlace actual» y «Ruta de navegación navegación región lista con 2 elementos» con un solo enlace; en la paginación, «Página 1 … página actual». Estrecho: la nav inferior al final, con Cuenta | Sin medir en 7.4 |
| ✓ / ✗ | Dato: 6 de 6 listas como la tabla | |
| Notas | Recorrido con K en vez de NVDA+F7 | |

#### N0.3 · Contexto de los enlaces repetidos (2.4.4)

Ruta: `/` y `/mis-citas`, 100 %. Acción: Tab hasta cada enlace de la tabla. Debe oírse, en
cada uno: el nombre, enlace, y su descripción. ✓ si se oyen las seis descripciones.

| Ruta | Enlace | Descripción |
|---|---|---|
| `/` | «Ver horarios» (primero) | Dra. Isabel Carmona Díaz |
| `/` | «Ver horarios» (último) | Dr. Leonardo Corona Álvarez |
| `/mis-citas` | «Reprogramar» (primero) | Martes 24 de abril · 10:30 |
| `/mis-citas` | «Reprogramar» (segundo) | Miércoles 16 de mayo · 09:30 |
| `/mis-citas` | «Agendar seguimiento» | Lunes 12 de marzo · 09:00 |
| `/mis-citas` | «Agendar de nuevo» | Jueves 22 de febrero · 12:30 |

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Ver horarios enlace Dra. Isabel Carmona Díaz» … «Ver horarios enlace Dr. Leonardo Corona Álvarez»; «Reprogramar enlace Martes 24 de abril · 10:30»; «Reprogramar enlace Miércoles 16 de mayo · 09:30»; «Agendar seguimiento enlace Lunes 12 de marzo · 09:00»; «Agendar de nuevo enlace Jueves 22 de febrero · 12:30» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ 6 de 6 | |
| Notas | Dato: «Cancelar cita botón abre diálogo Martes 8 de mayo · 17:00» | |

#### N1.1 · Nav del header y página actual

Ruta: `/`, 100 %. Acción: D hasta la región de navegación del header; K hasta «Especialistas».
Debe oírse: navegación «Principal»; «Especialistas», enlace, **página actual**.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Principal navegación región lista con 3 elementos Especialistas … página actual» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | Medido con K en N0.2 | |

#### N1.2 · Sección actual

Ruta: `/mis-citas/c3/reprogramar?fecha=2029-05-17&hora=17:00`, 100 %. Acción: D hasta la nav
del header; K hasta «Mis citas». Debe oírse: «Mis citas», enlace, **actual**
(`aria-current="true"`, `current: 'section'`), no «página actual».

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Mis citas visitado enlace actual» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | | |

#### N1.3 · Menú de cuenta

Ruta: `/`, 100 %. Acción: Tab hasta «Karla Sánchez»; Intro; Escape. Debe oírse: «Karla
Sánchez», botón, **contraído**; tras Intro, **expandido** (y lo que lea del panel); tras
Escape, el foco en «Karla Sánchez», **contraído**.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Karla Sánchez botón contraído» → «expandido» → «contraído»; tras Escape, NVDA+Tab: «Karla Sánchez botón enfocado contraído» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ (dos pasadas iguales) | |
| Notas | Dato: al expandir no lee nada del panel (es un disclosure) | |

#### N1.4 · Barra inferior

Ruta: `/`, estrecho. Acción: D hasta la nav de la barra inferior; K por sus enlaces. Debe
oírse: navegación «Principal»; «Especialistas», enlace, página actual; «Mis citas», enlace;
«Cuenta», enlace.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Principal navegación región lista con 3 elementos Especialistas visitado misma página enlace página actual · Mis citas · Cuenta» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | Medido con K en N0.2, estrecho | |

#### N1.5 · Conmutador «Avisarme»

Ruta: `/?q=Cardiología&especialidad=cardiologia`, 100 %. Acción: Tab hasta «Avisarme» de la
tarjeta del Dr. Rodrigo Alcántara Vela; Espacio; NVDA+Tab. Debe oírse: «Avisarme», botón de
alternancia, **no presionado**, descripción «Dr. Rodrigo Alcántara Vela»; tras Espacio,
**presionado**. Anotar como dato si se lee la etiqueta nueva «Te avisaremos» al pulsar y con
NVDA+Tab (desviación de la APG: cambian etiqueta y estado).

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Avisarme botón conmutador sin pulsar Dr. Rodrigo Alcántara Vela»; tras Espacio, «pulsado», «Te avisaremos»; NVDA+Tab: «Te avisaremos botón conmutador enfocado pulsado Dr. Rodrigo Alcántara Vela» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | Dato APG: anuncia el estado y la etiqueta nueva | |

#### N1.6 · Foco tras «Siguiente» de la paginación

Ruta: `/?q=Cardiología&especialidad=cardiologia`, 100 %. Acción: Tab hasta «Siguiente» de la
paginación; Intro. Debe oírse: el nombre de la primera tarjeta de la página 2, encabezado
nivel 3.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «lista con 4 elementos Dra. Adriana Zamora Nieto encabezado nivel 3» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | Con `especialidad=cardiologia` hay 9 páginas, no 12 (las 12 de N0.2 son de `/`) | |

#### N1.7 · «Ver más» con carga y `aria-busy`

Ruta: `/?q=Cardiología&especialidad=cardiologia&escenario=lenta`, estrecho (esperar a que
lleguen las tarjetas). Acción: Tab hasta «Ver más especialistas»; Intro; no tocar nada 3 s.
Debe oírse: «Ver más especialistas», botón; al llegar (1,5 s), el nombre de la quinta tarjeta,
encabezado nivel 3, con el foco en él. Anotar como dato lo que se oye durante la carga
(`aria-busy`) y si se lee el recuento «Mostrando 8 de 34 especialistas».

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «lista procesando con 8 elementos Dra. Adriana Zamora Nieto encabezado nivel 3» | «Ver más especialistas botón» → «lista con 8 elementos Dra. Adriana Zamora Nieto encabezado nivel 3» |
| ✓ / ✗ | ✓ (foco) | ✓ (foco) |
| Notas | Datos: silencio durante la carga; «Mostrando 8 de 34 especialistas» no se lee (no es región viva); «procesando» al llegar el foco, aunque `Search.tsx:528` quita `aria-busy` en el mismo commit: comparar en NC1 | Sin «procesando»: el «lista procesando» de NF es solo de Firefox (dato, sin defecto). Al cargar con `lenta` a 200 %: «34 resultados» |

#### N1.8 · Carga completa con `lenta`

Ruta: `/?q=Cardiología&especialidad=cardiologia&escenario=lenta`, 100 %, carga completa sin
tocar nada. Debe oírse: el recuento pasa de «Buscando…» a «34 resultados» (región
`role="status"`). Dato: si NVDA lee algo de la lista mientras solo hay esqueletos (va
`aria-hidden`).

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «34 resultados» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | «Buscando…» no se oye (es el contenido inicial de la región); nada de la lista mientras hay esqueletos | |

#### N1.9 · Hoja de filtros: abrir

Ruta: `/?q=Cardiología&especialidad=cardiologia`, estrecho. Acción: Tab hasta «Filtrar y
ordenar»; Intro. Debe oírse: antes de abrir, «Filtrar y ordenar, 1 filtro aplicado», botón,
abre diálogo; al abrir, diálogo «Filtrar y ordenar» y el foco en su título.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Filtrar y ordenar , 1 filtro aplicado botón abre diálogo» → «Filtrar y ordenar diálogo» → «Filtrar y ordenar encabezado nivel 2» | «Filtrar y ordenar, 1 filtro aplicado botón abre diálogo» → «Filtrar y ordenar diálogo» → «Filtrar y ordenar encabezado nivel 2» |
| ✓ / ✗ | ✓ | ✓ |
| Notas | Dato: Firefox lee de corrido el contenido de la hoja | Chrome también lee el contenido de la hoja |

#### N1.10 · Hoja de filtros: borrador

En la hoja de N1.9. Acción: Tab hasta «Videoconsulta» (grupo Modalidad); Espacio. Debe oírse:
«Videoconsulta», casilla, marcada, y la región oculta «N resultados» (anotar N).

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «marcado» y «11 resultados» | «Videoconsulta casilla de verificación sin marcar» → «11 resultados» · «marcado» |
| ✓ / ✗ | ✓ (N = 11) | ✓ (N = 11) |
| Notas | | |

#### N1.11 · Hoja de filtros: aplicar

Acción: Tab hasta «Ver N resultados»; Intro. Debe oírse: el foco en el disparador, «Filtrar y
ordenar, 2 filtros aplicados», botón; y la región del recuento «N resultados». Anotar el
orden de los dos mensajes.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | Tras «Ver 11 resultados botón» + Intro: «cliqueable misma página enlace Saltar al contenido» · «principal región Filtrar y ordenar , 1 filtro aplicado botón abre diálogo» · «11 resultados» | Tras «Ver 11 resultados botón»: «cliqueable misma página enlace Saltar al contenido» · «principal región Filtrar y ordenar, 1 filtro aplicado botón abre diálogo» · «11 resultados»; NVDA+Tab: «Filtrar y ordenar , 2 filtros aplicados botón enfocado abre diálogo» |
| ✓ / ✗ | ✗ del proyecto, hallazgo de 7.4 (candidato a 7.6): se anuncia «1 filtro aplicado» en vez de 2. No es ✗ de WCAG: el nombre se corrige y el recuento llega por la región de estado; es ✗ de la regla del diseño (los dos mensajes al aplicar) | ✗ del proyecto, igual que NF |
| Notas | Contraprueba: NVDA+Tab después: «Filtrar y ordenar , 2 filtros aplicados botón enfocado abre diálogo»; `location.search` `"?q=Cardiolog%C3%ADa&especialidad=cardiologia&modalidad=videoconsulta"`. Causa en el código: `Sheet.tsx` devuelve el foco (línea 100) antes de `onSubmit()` (línea 101), así que el disparador recibe el foco con el recuento anterior y el cambio de nombre no se vuelve a anunciar. Dato: «Saltar al contenido» se lee antes del disparador al cerrar. Repetir en NC1 antes de redactar la fila de 7.6; sin propuesta de código todavía | Conclusión: general a los dos navegadores; causa en `Sheet.tsx` (foco devuelto en la línea 100, antes de `onSubmit()` en la 101). La línea «Saltar al contenido» al cerrar sale en los dos (dato) |

#### N1.12 · Etiqueta en el nombre (2.5.3)

Ruta: `RUIZ?SLOT`, estrecho. Acción: Tab hasta la tira de días (entra en el día marcado).
Debe oírse: «mar 24 de abril, 6 horarios libres», botón de opción, marcado (anotar «1 de 7» o
lo que diga). Criterio: el nombre empieza por el texto visible «mar 24». En N1.9, el nombre
«Filtrar y ordenar, 1 filtro aplicado» empieza por el visible «Filtrar y ordenar».
Dato, solo si el acceso por voz de Windows está disponible en español en el equipo: decir
«clic en Filtrar y ordenar» y «clic en mar 24». Anotar si está disponible y qué hace.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «mar 24 de abril, 6 horarios libres botón de opción marcado 2 de 7»; el disparador: «Filtrar y ordenar , 1 filtro aplicado» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | Dato: con Acceso por voz de Windows 11 en español, «clic en mar 24» → «hizo clic en mar 24 de abril, 6 horarios libres», y selecciona el chip | |

**Parada NF1 / NC1.** Pega el tramo relleno en el chat.

### N2 · Formulario, diálogo y avisos (30–45 min)

**Entorno NF2.** Jueves 1 de octubre de 2026, 12:10–13:35 (GMT−6). Mismo equipo, Windows,
Firefox 157.0 y NVDA 2026.2 que NF1. Zoom 100 %. Mismo build (`index-DgeRHP-Q.js`).

**Entorno NC2.** El de NC1 (el hallazgo de N2 se midió en la misma sesión).

#### N2.1 · Ayuda del grupo por `aria-describedby` (`UI/Legend`)

Ruta: `RUIZ/datos?SLOT`, 100 %. Acción: Tab desde el inicio hasta «Nombre completo». Debe oírse:
grupo «Datos del paciente»; la descripción del grupo «Todos los campos son obligatorios salvo
los marcados como opcionales»; «Nombre completo», campo de edición, requerido, valor «Karla
Sánchez Bautista»; la pista «Como aparece en tu identificación».

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Datos del paciente agrupación entrada inválida Todos los campos son obligatorios salvo los marcados como opcionales» · «Nombre completo edición requerido tiene auto completado Como aparece en tu identificación seleccionado Karla Sánchez Bautista» | «Datos del paciente agrupación Todos los campos son obligatorios salvo los marcados como opcionales» · «Nombre completo edición requerido Como aparece en tu identificación seleccionado Karla Sánchez Bautista» |
| ✓ / ✗ | ✓ | ✓ |
| Notas | «entrada inválida» en el grupo antes de enviar: § Hallazgo tras N2.2 | Medido en el tramo NC, en el bloque del hallazgo tras N2.2; sin «entrada inválida» en el grupo |

#### N2.2 · Resumen de errores

Misma ruta, carga completa. Acción: en «Correo electrónico», borrar y escribir `karla@`; dejar
«Motivo de consulta» en «Elige una opción» y «Acepto el aviso de privacidad» sin marcar;
«Confirmar cita». Debe oírse: «Corrige 3 campos para continuar», encabezado, nivel 2, con el
foco en él. Dato: Tab al primer enlace del resumen y lo que dice.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Corrige 3 campos para continuar encabezado nivel 2»; Tab: «lista con 3 elementos Correo electrónico misma página enlace» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | | |

#### Hallazgo de 7.4 · «entrada inválida» antes del primer envío (candidato a 7.6)

Visto en Firefox + NVDA en N2.1 y N2.2. Criterio: regla del proyecto (validación al enviar,
diseño §3.4, `PatientData.tsx:46`), no ✗ de WCAG. Repetir en NC2 antes de redactar la fila de
7.6; sin propuesta de código todavía.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | Antes de «Confirmar cita»: al cargar, el fieldset «Datos del paciente agrupación entrada inválida»; «Motivo de consulta cuadro combinado Elige una opción contraído requerido entrada inválida»; «Acepto el aviso de privacidad casilla de verificación sin marcar requerido entrada inválida»; en el correo, al teclear la primera letra, «k · entrada inválida» | «Datos del paciente agrupación Todos los campos son obligatorios salvo los marcados como opcionales» (sin «entrada inválida») · «Nombre completo edición requerido Como aparece en tu identificación seleccionado Karla Sánchez Bautista» · «Motivo de consulta cuadro combinado Elige una opción contraído requerido entrada inválida Nos ayuda a preparar tu consulta» · «Acepto el aviso de privacidad casilla de verificación sin marcar requerido entrada inválida Solo usamos tus datos para esta cita» |
| ✓ / ✗ | ✗ del proyecto | ✗ del proyecto: se reproduce en los controles, no en el fieldset |
| Notas | Contraprueba (carga completa, sin tocar): `form :invalid` = `["FIELDSET · Datos del paciente · aria-invalid=null", "SELECT · Motivo de consulta · aria-invalid=null", "FIELDSET · Antes de confirmar · aria-invalid=null", "INPUT · Acepto el aviso de privacidad · aria-invalid=null"]`. Es la validez nativa de `required` y `type=email`, que Firefox expone aunque el form tenga `noValidate`; la app solo pone `aria-invalid` con error (`FieldText.tsx:48`, `FieldSelect.tsx:56`, `Checkbox.tsx:43`). Al elegir «Primera consulta», «entrada inválida» desaparece del select. Dato para la propuesta: con `setAttribute('aria-invalid', 'false')` en el select (sin recargar), NVDA sigue diciendo «requerido entrada inválida» (una pasada): el `false` explícito no lo anula en Firefox | Conclusión: general (Firefox 157 y Chrome 154 con NVDA 2026.2); solo el anuncio en el fieldset es de Firefox. Dato: Chrome anuncia «formulario región» |

#### N2.3 · `alertdialog` al abrir

Ruta: `/mis-citas`, 100 %. Acción: Tab hasta «Cancelar cita» de la tarjeta del martes 8 de mayo
(Dr. Molina); Intro. Debe oírse: diálogo de alerta «¿Cancelar esta cita?»; el cuerpo «Martes 8
de mayo, 17:00, con el Dr. Andrés Molina Paz. Esta acción no se puede deshacer.»; «Mantener
mi cita», botón (foco inicial). Criterio extra: el anuncio del foco no corta el del título y
el cuerpo.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «¿Cancelar esta cita? diálogo Martes 8 de mayo, 17:00, con el Dr. Andrés Molina Paz. Esta acción no se puede deshacer.» · «Mantener mi cita botón» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ (el foco no corta el anuncio) | |
| Notas | Dato: NVDA dice «diálogo», no «diálogo de alerta» (comparar en NC2) | |

#### N2.4 · Aviso Success con foco (dato)

En el diálogo de N2.3. Acción: Tab hasta «Cancelar cita»; Intro. Debe oírse: «Cita cancelada»,
encabezado nivel 2, con el foco en él. Dato: si lee el cuerpo «Ya no tienes la cita del martes
8 de mayo a las 17:00 con el Dr. Molina.» sin moverse.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | Tras «Cancelar cita botón»: «fuera de lista fuera de región cliqueable título región visitado enlace Salvia» · «principal región Cita cancelada encabezado nivel 2» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ (dato) | |
| Notas | El cuerpo no se lee. La línea «Salvia» antes del título: sin aislar si es el foco o el cursor de exploración (comparar en NC2) | |

#### N2.4b · Aviso Error con foco: reserva fallida (dato)

Ruta: `RUIZ/datos?SLOT&escenario=ocupada`, 100 %. Acción: «Motivo de consulta» = «Primera
consulta»; marcar «Acepto el aviso de privacidad» y «Quiero un recordatorio por correo el día
anterior»; «Confirmar cita». Debe oírse: «Esa hora ya está ocupada», encabezado nivel 2, con el
foco en él. Dato: si lee el cuerpo (nombra el martes 24 a las 10:30).

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Esa hora ya está ocupada encabezado nivel 2» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ (dato) | |
| Notas | El cuerpo no se lee | |

#### N2.5 · Aviso Success en región viva

Ruta: `/kit`, 100 %. Acción: Tab hasta el botón «Avisarme si se libera un hueco» de la sección
de avisos (la de «Región viva: el disparador sigue en pantalla…»); Intro; no tocar nada 3 s.
Debe oírse, con el foco quieto en el botón: «Aviso activado» y «Te avisaremos por correo si se
libera un hueco con la Dra. Ruiz.». Dato: si también lee «Cerrar aviso». (La parte
`role="alert"` de la fila de Pendientes es N/A: ninguna ruta monta un Error en región viva.)

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | Con el foco en el botón: «Aviso activado Te avisaremos por correo si se libera un hueco con la Dra. Ruiz. Cerrar aviso» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | Dato: lee también «Cerrar aviso»; después, «Tu cita actual», sin explicar. `role="alert"`: N/A, sin instancia | |

**Parada NF2 / NC2.**

### N3 · Calendario y horas (30–45 min)

**Entorno NF3.** Jueves 1 de octubre de 2026, 16:45–17:00 (GMT−6). Mismo equipo, Windows,
Firefox 157.0 y NVDA 2026.2. Build `/assets/index-DgeRHP-Q.js`. Zoom 100 % salvo N3.8b (200 %).

**Entorno NC3.** Sin medir en 7.4 (recorte).

#### N3.1 · El `h2` oculto de RAC

Ruta: `RUIZ?SLOT`, 100 %. Acción: H desde el inicio. Debe oírse: «abril de 2029», encabezado
nivel 2, entre «Elige fecha» y «Elige hora». Dato: si el mes se oye dos veces seguidas (el
rótulo visible y el h2).

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | Con el rol (N0.1), «abril de 2029» no sale con H. Contraprueba, tras `document.querySelector('[role=application]').removeAttribute('role')`: «Dra. Elena Ruiz Arellano nivel 1 · Elige fecha nivel 2 · abril de 2029 encabezado nivel 2 · Elige hora nivel 2 · Tu cita nivel 2» | Sin medir en 7.4 |
| ✓ / ✗ | Diferencia de N0.1 explicada, causa confirmada, sin ✗ | |
| Notas | Consola: `["Elige fecha · dentro de application: false", "abril de 2029 · dentro de application: true", "Elige hora · dentro de application: false", "Tu cita · dentro de application: false"]`. NVDA + Firefox no recorre con letras rápidas el interior de `role="application"` (raíz del calendario de RAC, `useCalendarBase.mjs:91`). El calendario se alcanza con Tab y su rótulo se lee («abril de 2029» al entrar). Dato para spike-rac § 4 (h2 oculto) | |

#### N3.2 · Nombre de la rejilla (spike § 4.4)

Misma ruta. Acción: Tab hasta la rejilla (entra en el 24). Debe oírse: tabla o cuadrícula
«abril de 2029»; la celda «martes 24 de abril de 2029, 6 horarios libres, seleccionado».

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «abril de 2029» · «Mes siguiente botón» · «abril de 2029 tabla» · «martes 24 de abril de 2029, 6 horarios libres, seleccionado fila 5 columna 2» · «martes 24 de abril de 2029, 6 horarios libres, seleccionado botón» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | | |

#### N3.3 · «seleccionado» por partida doble (spike § 4.2)

En el 24 de N3.2: NVDA+Tab. Anotar cuántas veces se oye «seleccionado». **Dos veces = ✗ para
7.6** (quitar el segmento, como dice el spike).

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | NVDA+Tab: «martes 24 de abril de 2029, 6 horarios libres, seleccionado botón enfocado» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ «seleccionado» una vez (NVDA no añade el estado de `aria-selected`) | |
| Notas | Dato: al llegar con Tab, el nombre entero se lee dos veces (celda y botón) | |

#### N3.4 · Hoy y `aria-current="date"`

Acción: ← hasta el 23. Debe oírse: «lunes 23 de abril de 2029, hoy, sin horarios». Dato: si
además dice «actual» o «fecha actual» (`aria-current`).

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «lunes 23 de abril de 2029, hoy, sin horarios columna 1» · «lunes 23 de abril de 2029, hoy, sin horarios botón fecha actual» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ | |
| Notas | Dato: hoy se anuncia dos veces («hoy» del nombre y «fecha actual» de `aria-current="date"`); redundante, a decidir en 7.6 | |

#### N3.5 · Celdas en blanco con las órdenes de tabla (spike § 4.3)

Acción: modo exploración (NVDA+Espacio); en la rejilla, Ctrl+Alt+← desde «domingo 1 de abril»
hasta las celdas de antes, y Ctrl+Alt+→ desde «lunes 30 de abril» hasta las de después.
Anotar qué dice cada celda en blanco. Criterio: no lee ningún número ni fecha de marzo o mayo.

Resultado: sin medir en 7.4 (recorte), en NF y NC.

#### N3.6 · Botones de mes (spike § 4.6)

Acción: modo exploración, B por la página. Debe oírse: «Mes siguiente», botón; **no** «Mes
anterior» (en abril se omite del DOM; el spike hablaba de `visibility: hidden`, ya no
aplica). Dato: si aparece también un «Siguiente» de RAC (en el DOM hay un segundo botón con ese
nombre, el de VoiceOver por gestos).

Resultado: sin medir en 7.4 (recorte), en NF y NC.

#### N3.7 · Horas: grupos y hora llena (spike § 4.5 y § 4.1)

Rejilla de 3 columnas: ↓ salta de fila (09:00 → 10:30 → 16:00), así que nunca pasa por
11:30. Acción: Tab hasta la lista de horas (entra en 10:30); ↑ hasta 09:00 (llena); Intro; ↓
dos veces (10:30 y 16:00). Debe oírse: «09:00», opción, **no disponible** (o «atenuado»); tras
Intro, nada que diga «seleccionado» y la 10:30 sigue elegida («Tu cita» no cambia); en el
segundo ↓, que cruza de «Mañana» a «Tarde», el grupo «Tarde» (spike § 4.5). Anotar lo literal.
Dato aparte: desde 11:30, → hasta 16:00 (el cruce por el orden del DOM) y lo que se oye.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Elige hora lista · Mañana agrupación · 10:30 4 de 6»; ↑: «09:00 no disponible sin seleccionar 1 de 6»; Intro: nada; ↓: «10:30 4 de 6»; ↓: «Tarde agrupación · 16:00 sin seleccionar 1 de 6» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ (tras Intro la 10:30 sigue elegida) | |
| Notas | Dato: al elegir la 16:00, «seleccionado», y la URL pasa a `hora=16%3A00`. El dato aparte (→ de 11:30 a 16:00), sin medir en 7.4 | |

#### N3.8 · Anuncio del mes al navegar en línea

Ruta: `RUIZ?SLOT`, 100 %. Acción: Tab hasta «Mes siguiente»; Intro. Debe oírse: «mayo de 2029».

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | «Mes siguiente botón» + Intro → «mayo de 2029»; NVDA+Tab: «Mes siguiente botón enfocado» | Sin medir en 7.4 |
| ✓ / ✗ | ✓ en línea, al 100 % | |
| Notas | El foco se queda en «Mes siguiente» | |

#### N3.8b · Anuncio del mes dentro de la hoja (✗ esperado, 7.6)

Ruta: `RUIZ?SLOT`, estrecho. Acción: «Ver mes completo»; en la hoja, Tab hasta «Mes siguiente»;
Intro. **Esperado ✗:** no se oye «mayo de 2029» (el anunciador de React Aria queda inerte bajo
el `<dialog>` modal). Anotar lo que se oiga. Si se oye, el ✗ de 7.6 no se confirma de oído y se
anota.

| | NF (Firefox) | NC (Chrome) |
|---|---|---|
| Literal del Visor de voz | En la hoja, a 200 %: «Elige una fecha diálogo · abril de 2029 · abril de 2029 tabla · martes 24 … seleccionado»; «Mes siguiente botón» + Intro → no se oye «mayo de 2029»; NVDA+Tab: «Mes siguiente botón enfocado» | Sin medir en 7.4 |
| ✓ / ✗ | ✗ esperado, confirmado de oído (7.6, anunciador inerte). Dos pasadas | |
| Notas | Dato: dentro de la hoja, Tab sale a la interfaz de Firefox («Pestañas del navegador barra de herramientas» … «Marcadores») y vuelve al diálogo («Elige una fecha diálogo · Ver horarios del martes 24 · Cerrar botón · abril de 2029 aplicación · Mes siguiente botón»), sin caer en la página | |

**Parada NF3 / NC3.**

---

## Tramo K · Teclado en Firefox, sin lector (60 min)

**Entorno K** (tramo recortado: K.1, K.2, K.4 y K.7). Jueves 1 de octubre de 2026, 17:22–17:41
(GMT−6). Mismo PC, Windows 11 26H2, Firefox 157.0, sin NVDA. Build `index-DgeRHP-Q.js` (leído a
las 16:50). Método: en vez de `FOCO` tras cada tecla, un registro en consola de `focusin`
(etiqueta, `aria-describedby` y URL) y de `focusout` sin destino («foco sale de la página»),
pegado una vez por carga.

#### K.1 · Ciclo de Tab del diálogo

Ruta: `/mis-citas` (carga completa), ventana maximizada al 100 %. Acción: abrir el diálogo de la
cita del Dr. Molina; Tab 6 veces y Mayús+Tab 6 veces; `FOCO` tras cada vuelta. Esperado: el
foco pasa por «Mantener mi cita» y «Cancelar cita» y, como mucho, sale a la interfaz de Firefox
y vuelve; nunca a la página. La salida a la interfaz no la ve `FOCO`: se anota a la vista
(barra de direcciones, pestaña o botón de la barra resaltados). Anotar la secuencia.

- **Medida:** 100 %, `/mis-citas`. Registro con el diálogo abierto: «BUTTON Cancelar cita ·
  Martes 8 de mayo · 17:00» (el disparador) → «BUTTON Mantener mi cita» → «BUTTON Cancelar
  cita» (del diálogo) → «foco sale de la página».
- **Resultado:** ✓ en lo esencial: ningún elemento de la página recibe el foco con el diálogo
  abierto.
- **Notas:** las 6 + 6 pulsaciones no se reconstruyen con el registro; la salida a la interfaz
  de Firefox, sin observar. Dato de NF3: en la hoja del calendario, Tab sale a la interfaz y
  vuelve al diálogo (N3.8b).

#### K.2 · Foco devuelto por el diálogo

Misma ruta, carga completa. Acción: abrir el diálogo de Molina; Escape; `FOCO`. Repetir y cerrar
con «Mantener mi cita»; `FOCO`. Esperado las dos veces: `etiqueta: "BUTTON Cancelar cita"`,
`descripcion: "Martes 8 de mayo · 17:00"`.

- **Medida:** Escape: «BUTTON Cancelar cita · Martes 8 de mayo · 17:00». «Mantener mi cita» +
  Intro: «BUTTON Cancelar cita · Martes 8 de mayo · 17:00».
- **Resultado:** ✓

#### K.3 · Foco devuelto por las hojas

RDM 375×812. (a) Ruta `/?q=Cardiología&especialidad=cardiologia`: abrir «Filtrar y ordenar» y
cerrar con Escape; abrir y cerrar con «Cerrar»; abrir y cerrar con «Ver N resultados». `FOCO`
tras cada cierre. Esperado: «Filtrar y ordenar…» las tres veces. (b) Ruta `RUIZ?SLOT`: abrir
«Ver mes completo» y cerrar con Escape, con «Cerrar» y con «Ver horarios del martes 24».
Esperado: «Ver mes completo» las tres veces.

- **Resultado:** sin medir en 7.4 (recorte).

#### K.4 · Envío implícito con Intro en un radio

RDM 375×812, ruta `RUIZ?SLOT`.
(a) Tab hasta la tira (entra en «mar 24»); → (pasa a «mié 25»); Intro; `FOCO`. Esperado:
Missing, sin navegar. La barra dice «Elige un horario primero», el foco está en la **09:00**
del miércoles 25 (su primera hora libre) y la URL sigue en `RUIZ` con `fecha=2029-04-25` y sin `hora` (cambiar de
fecha pone la hora a null, D2; Intro equivale a «Continuar» con validación).
(b) Carga completa de la misma ruta; Tab hasta la lista de horas (10:30); Mayús+Tab hasta el
radio marcado («mar 24»), sin flechas; Intro; `FOCO`. Esperado: navegación a
`/especialistas/elena-ruiz-arellano/confirmar?fecha=2029-04-24&hora=10%3A30` (o `10:30`) con el
foco en su h1.
Si Firefox no hace envío implícito, fallan los dos: anotar qué pasa.

- **Medida (a):** a 200 % (chrome móvil), en vez de RDM 375×812. Tira «INPUT» ×2 («mar 24» y,
  tras →, «mié 25»); tras Intro, «DIV 09:00 · /especialistas/elena-ruiz-arellano?fecha=2029-04-25»
  y después «DIV 09:00 · Elige un horario primero».
- **Resultado (a):** ✓ Missing: el foco en la primera hora libre del 25 y la URL sin hora.
  Firefox hace el envío implícito: sin él, el foco se habría quedado en el radio.
- **Resultado (b):** sin medir en 7.4. Por una instrucción errónea del revisor (F5 en vez de la
  URL original) se ejecutó desde `fecha=2029-04-25` sin hora y volvió a dar Missing.
- **Notas:** dato: al volver a 100 % (cruce de lg), «H1 Dra. Elena Ruiz Arellano» (respaldo de
  foco).

#### K.5 · Atrás con la hoja abierta en escritorio estrecho

RDM 375×812. Esperado (H3): ✓ si (a) cierra la hoja sin cambiar la URL y el foco vuelve al
disparador, o (b) navega a la entrada anterior sin hoja montada, sin la página bloqueada
(`hojaModal: false`, `overflowHtml` distinto de `hidden`) y con el foco en el h1 de llegada.
✗ si queda la página sin scroll, la hoja colgada o el foco en `body`.
(a) Filtros. Carga completa de `/`; escribir «Cardiología» en «Especialidad o nombre»; «Buscar»
(push: la URL pasa a `/?q=Cardiología`); «Filtrar y ordenar»; `ESTADO`; Alt+←; `ESTADO`.
Repetir con el botón Atrás del ratón. Destino de (b): `/`.
(b) Calendario. Carga completa de `/mis-citas`; «Reprogramar» de la cita del martes 24 de abril
(llega a `/mis-citas/c1/reprogramar`); «Ver mes completo»; `ESTADO`; Alt+←; `ESTADO`. Repetir
con el ratón. Destino de (b): `/mis-citas`.

- **Resultado:** sin medir en 7.4 (recorte).

#### K.6 · Foco y `scroll-padding` (la mitad de Firefox) y F2 (dato)

RDM 375×812, ruta `RUIZ/datos?SLOT`, letra y zoom al 100 %. Acción: Tab desde el inicio hasta
«Correo electrónico»; `ANILLO`. Esperado 2.4.11: `solapeComponente ≤ 0` (✓). F2: en Chromium
(7.3), este campo deja 3,9–5 px del anillo bajo la barra; `solapeAnillo > 0` lo reproduce en
Firefox (dato para 7.6, sin ✗ nuevo).
Contraprueba: en la consola, `document.documentElement.style.scrollPaddingBlockEnd = '0px'`;
Mayús+Tab y Tab para volver al correo; `ANILLO`. Esperado: `solapeComponente > 0` (el campo
queda bajo la barra), lo que prueba que la medida discrimina. Recargar para quitarlo.

- **Resultado:** sin medir en 7.4 (recorte).

#### K.7 · Zoom solo de texto (hallazgo de 7.1) y letra real

Ruta `/fuera-de-alcance`.
(a) Zoom solo de texto. Menú Ver › Zoom › «Ampliar solo texto» (Alt muestra el menú); Ctrl++
hasta 200 % (110, 120, 133, 150, 170, 200). En RDM 375×900 y después 375×812: Tab hasta «Ir a
Especialistas»; `TEXTO_GRANDE` y `ANILLO`. Esperado: ✓ si `modoTextoGrande: true` (la barra
`static`) o si `solapeAnillo ≤ 0`; **✗ (nuevo, 7.6)** si la barra sigue `sticky` y
`solapeAnillo > 0`: en Firefox la condición de 7.1 sí la alcanza un usuario. Volver el zoom a
100 % (Ctrl+0).
(b) Letra real. Ajustes › General › Idioma y apariencia › Fuentes › Tamaño = 32. En RDM 320,
375 y 430 (×812): `TEXTO_GRANDE`; a 375, Tab hasta «Ir a Especialistas» y `ANILLO`. Esperado:
`modoTextoGrande: true` y `posicionBarra: "static"` en los tres anchos.
(c) Letra a 16 (por defecto), los mismos tres anchos: `modoTextoGrande: false`,
`posicionBarra: "sticky"`. Dejar la letra en 16 al terminar.

- **Medida:** `/fuera-de-alcance`, RDM 375 × 900, Firefox 157.0, una pasada por medida.
  (c) Letra 16, zoom 100 %: `letraRaiz` 16px, `modoTextoGrande` false, `posicionBarra` sticky,
  `barraInicio` 836. (a) Zoom solo de texto al 200 %: 32px, true, static, `barraInicio` 832,
  `scrollY` 0. (b) Letra del navegador a 32, zoom 100 %: 32px, true, static, 832, `scrollY` 0.
- **Resultado:** ✓ (a), (b) y (c) a 375 × 900. En Firefox el zoom solo de texto mueve la media
  query en rem, activa el modo de texto grande y la barra pasa al flujo: la condición de 7.1
  (texto ampliado con la barra sticky) no se alcanza.
- **Notas:** `ANILLO`, sin medir: en RDM `document.activeElement` era `body` al evaluar; con
  la barra static el solape no aplica. 375 × 812 y los anchos 320 y 430, sin medir en 7.4.

#### K.8 · Inicio y Fin en el ListBox (F1, dato) y rejilla (spike § 4.7, dato)

RDM 320×812, ruta `RUIZ?SLOT`, zoom solo de texto al 200 % (como K.7 a). Acción: Tab hasta la
lista de horas (10:30); Inicio; `HORA`; Fin; `HORA`. Después, desde la 09:00: → tres veces y ↓
tres veces, anotando la hora enfocada tras cada tecla. Esperado F1 (Chromium): tras Inicio la
09:00 puede quedar fuera (`aLaVista: false`; ✗ ya declarado en 7.6); anotar si Firefox lo
reproduce. § 4.7: → sigue el orden del DOM (09:00, 09:30, 10:00, 10:30) y ↓ la geometría.
Volver el zoom a 100 %.

- **Resultado:** sin medir en 7.4 (recorte).

#### K.9 · `last baseline` (dato)

Ruta `/?q=Cardiología&especialidad=cardiologia`, 1440×900 (RDM en Firefox; modo dispositivo de
DevTools en Edge, el mismo tamaño). Acción: `BASE` en Edge y en Firefox. Esperado: Edge
`altoCabecera` 79 (V1a); Firefox ✓ si las cuatro cifras coinciden con Edge ±1. Anotar las dos
salidas. Safari queda en § Sin dispositivo.

- **Resultado:** sin medir en 7.4 (recorte).

**Parada K.**

---

## Tramo C · Chrome real de escritorio (30–45 min)

Entorno C: … (con DevTools desacoplado en su propia ventana, para que no cambie `innerWidth`).
Chrome en Windows no baja de unos 500 px de ventana: los pasos a 375 van en el modo
dispositivo de DevTools (Ctrl+Mayús+M, «Responsive» 375×900), declarado como tal.

**Capturas:** DevTools › Ctrl+Mayús+P › «Capture screenshot» (en español, «Capturar captura de
pantalla»): solo el viewport. Se guardan en `scripts/verify/out/7.4/` (fuera de git) con el
nombre del paso, la pasada y el momento: `C1-p1-llegada.png`, `C1-p1-4s.png`,
`C1-p1-recarga.png`. Claude las compara píxel a píxel con el criterio del arnés
(`navegacion.mjs`: píxeles con delta máximo por canal > 64 frente a la recarga). Nada a ojo.

#### C.1 · Resto de pintado con `/kit` desplazado, 1350

Precondición: zoom de Chrome al 100 %, `devicePixelRatio` 1 y `innerWidth` 1350 (`ENTORNO`). Si
el escalado de Windows no es 100 %, anotarlo y ajustar la ventana hasta que `innerWidth` sea
1350; si `devicePixelRatio` no es 1, anotarlo (las capturas salen a esa escala).
Acción, 3 pasadas, cada una en pestaña nueva: carga completa de `/kit`; pegar `CLIC`; bajar con
la rueda hasta el enlace «Ver fecha y hora» (sección Fecha y hora) y hacer clic; captura
«llegada» en cuanto se pueda (anotar los segundos); captura «4s» pasados al menos 4 s sin tocar
la página; `scrollY` en la consola; F5 y, ya cargada sin desplazar, captura «recarga».
Esperado (7.3, Edge headless): resto de avatares bajo la última Booking Bar, 12632 px con delta
230, en 3 de 3. Anotar el `scrollY` del clic, el de llegada y el de la recarga.

#### C.1b · Lo mismo a 375

Modo dispositivo 375×900. Las mismas 3 pasadas. Esperado (7.3): 0.

#### C.2 · Una vista desplazada

Modo dispositivo 375×900, ruta `/?q=Cardiología&pagina=9`. Acción, 3 pasadas: `CLIC`; bajar
con la rueda hasta la última tarjeta; «Ver horarios» de la última que lo tenga; las tres
capturas (`C2-p1-…`). Esperado (7.3): 0.

#### C.3 · Texto grande con la letra real de Chrome

Ruta `/fuera-de-alcance`, modo dispositivo a 320, 375 y 430 (×812). Para cada tamaño de letra
(`chrome://settings/fonts`, «Tamaño de fuente»: 16; 24, que es «Muy grande» en Aspecto; y 32):
`TEXTO_GRANDE` en los tres anchos. Esperado: a 16, `modoTextoGrande: false` y `sticky`; a 24 y
32, `true` y `static`. Dejar la letra en 16 al terminar.

- **Resultado del tramo C (C.1, C.1b, C.2 y C.3):** sin medir en 7.4 (recorte).

**Parada C.**

---

## Tramo A · Android con Chrome (45 min)

Entorno A: modelo, versión de Android, versión de Chrome (Ajustes › Acerca de Chrome), tamaño
de fuente y de pantalla del sistema, y el `index-*.js` de `view-source:https://salvia-citas.netlify.app/`
(esperado `index-DgeRHP-Q.js`). Con depuración USB (`chrome://inspect` en el PC) se pueden
usar `ENTORNO`, `ESTADO` y `TEXTO_GRANDE`; sin ella, los campos de consola quedan «sin medir»
y se anota lo visible.

**Entorno A** (tramo recortado: A.1 y A.3). Jueves 1 de octubre de 2026, 17:45–17:54 (GMT−6).
POCO F7 (25053PC47G), Android 16 (BP2A.250605.031.A3), HyperOS 3.0.303.0, Chrome
153.0.8010.52. Navegación por gestos. Sin depuración USB: los campos de consola, sin medir. El
`index-*.js`, sin leer en el móvil.

#### A.1 · Atrás con la hoja abierta

Criterio de K.5 (H3). (a) Filtros: carga completa de `/`; «Cardiología» en «Especialidad o
nombre»; «Buscar» (la URL pasa a `/?q=Cardiología`); «Filtrar y ordenar»; gesto Atrás. Anotar:
URL, si la hoja se cerró, si la página se desplaza y, con USB, `ESTADO`. Repetir con el botón
Atrás si el móvil tiene navegación de tres botones. Si la hoja se cerró, un segundo Atrás:
anotar adónde va (esperado `/`). (b) Calendario: carga completa de `/mis-citas`; «Reprogramar»
de la cita del martes 24 de abril; «Ver mes completo»; gesto Atrás; lo mismo. Destino de (b):
`/mis-citas`.

- **Medida (a):** carga de `/`, «Cardiología», «Buscar», «Filtrar y ordenar», gesto Atrás: la
  hoja se cierra, la URL sigue en `/?q=Cardiología` y la página se desplaza (no queda
  bloqueada). Segundo Atrás: `/` con el campo vacío.
- **Resultado (a):** ✓ (caso a de H3). El foco tras cerrar, sin medir (táctil, sin USB).
- **Resultado (b), calendario:** sin medir en 7.4 (recorte).

#### A.2 · Letra grande del sistema y de Chrome

Ajustes de Android › Pantalla › Tamaño de fuente al máximo. Chrome › Configuración ›
Accesibilidad: anotar qué opciones tiene esta versión («Escalado de texto», «Zoom de página»…)
y su valor. Rutas `/`, `RUIZ?SLOT` y `/fuera-de-alcance`. Acción: desplazarse hasta la mitad de
cada página. Esperado: la barra se va con el contenido (en el flujo) y no hay scroll horizontal.
Repetir con el tamaño por defecto: la barra se queda pegada abajo. Con USB, `TEXTO_GRANDE`.

- **Resultado:** sin medir en 7.4 (recorte).

#### A.3 · Objetivos táctiles

Con la letra por defecto. Tocar con el dedo, 3 veces cada uno: «Ver horarios» de la tarjeta que
queda junto a la barra inferior en `/` (arriba, sin desplazar), los tres enlaces de la barra
inferior, los chips de la tira y las horas de `RUIZ?SLOT`, y las dos casillas de
`RUIZ/datos?SLOT`. Esperado: ningún toque errado (activa otro control o ninguno). Anotar los
fallos con el control y la posición.

- **Medida:** los tres enlaces de la barra inferior (Especialistas, Mis citas, Cuenta) navegan
  bien. «Ver horarios» junto a la barra no se da en este dispositivo: en `/`, sin desplazar, el
  botón de la primera tarjeta queda bajo el pliegue.
- **Resultado:** ✓ parcial (la barra inferior). Chips, horas y casillas: sin medir en 7.4.

#### A.4 · `hyphens: auto` en Nav Item

Con la letra al máximo (A.2). Ruta `/`. Mirar la barra inferior. Anotar si «Especialistas» (o
otra etiqueta) parte de línea y, si parte, si lleva guion. Esperado: si parte, con guion. Si no
parte, dato «no parte» (el caso no se da).

- **Resultado:** sin medir en 7.4 (recorte).

#### A.5 · Zona segura (dato, solo con recorte de pantalla)

Si el móvil tiene recorte (cámara en la pantalla): `/` en horizontal, con el recorte a cada
lado. Anotar si algún contenido queda bajo el recorte. No cierra la fila del iPhone.

- **Resultado:** sin medir en 7.4 (recorte).

#### A.6 · TalkBack (opcional, dato)

Gestos de deslizar: N2.3 (diálogo de Molina), N2.5 (aviso del kit) y, en `RUIZ?SLOT`, la hoja de
«Ver mes completo» recorrida por gestos: anotar si aparece «Siguiente» además de «Mes
siguiente» y si aparece «Mes anterior». No sustituye a VoiceOver.

- **Resultado:** sin medir en 7.4 (recorte).

**Parada A.**

---

## Tramo I · `.ics` en los calendarios (30 min)

Entorno I: navegadores y versiones; cuenta de Google y zona horaria del calendario; variante de
Outlook (clásico, nuevo o web) y su zona horaria.

**Entorno I** (tramo recortado: I.1 en Chrome e I.3). Jueves 1 de octubre de 2026, 17:50
(GMT−6). Chrome 154 en el PC. Google Calendar web, calendario principal «Osvaldo Ocampo», zona
GMT−06.

#### I.1 · Descarga

Ruta `/citas/c1/confirmada`, carga completa, en Chrome y en Firefox. Acción: «Agregar a mi
calendario». Esperado: descarga `cita-salvia-2029-04-24.ics`. Anotar si pregunta, si lo abre o
si lo guarda.

- **Resultado:** ✓ en Chrome: descarga `cita-salvia-2029-04-24.ics`. Firefox: sin medir en 7.4.

#### I.2 · Contenido

Abrir el archivo en el Bloc de notas. Esperado, exacto (CRLF; la línea `LOCATION` viene plegada
a 75 octetos y la continuación empieza por un espacio):

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Salvia//Caso de estudio//ES
BEGIN:VEVENT
UID:c1@salvia.example
DTSTAMP:20290423T150000Z
DTSTART:20290424T163000Z
DTEND:20290424T170000Z
SUMMARY:Cita con Dra. Elena Ruiz Arellano
LOCATION:Clínica Roma Norte\, Av. Álvaro Obregón 123\, Roma Norte\, Ciud
 ad de México
END:VEVENT
END:VCALENDAR
```

- **Resultado:** sin medir en 7.4 (recorte).

#### I.3 · Google Calendar (web)

Crear un calendario secundario «Salvia prueba»; Configuración › Importar y exportar › Importar,
el archivo, en ese calendario. Abrir el evento del martes 24 de abril de 2029. Esperado: de 10:30
a 11:00 si la zona es Ciudad de México (UTC−6); en otra zona, la misma hora convertida (16:30–17:00
UTC); título «Cita con Dra. Elena Ruiz Arellano»; ubicación «Clínica Roma Norte, Av. Álvaro
Obregón 123, Roma Norte, Ciudad de México», con las comas, sin barras invertidas y con «Ciudad»
entero (el plegado deshecho). Anotar zona, horas y ubicación literal. Borrar el calendario al
terminar.

- **Medida:** «Se importó 1 de 1 evento.» Evento: «Cita con Dra. Elena Ruiz Arellano»,
  «Martes, 24 abril 2029 · 10:30 – 11:00am», ubicación «Clínica Roma Norte, Av. Álvaro Obregón
  123, Roma Norte, Ciuda…» (truncada por la interfaz).
- **Resultado:** ✓ zona GMT−06, horas, título, comas sin barras invertidas y «Ciuda» unido en el
  punto del plegado.
- **Notas:** se importó en el calendario principal, no en uno secundario.

#### I.4 · Outlook

Clásico o nuevo: abrir el `.ics` con doble clic y guardar el evento; web: Calendario › Agregar
calendario › Cargar desde archivo. Mismas comprobaciones que I.3. Borrar el evento al terminar.

- **Resultado:** sin medir en 7.4 (recorte).

#### I.5 · Chrome en Android (dato)

`/citas/c1/confirmada` › «Agregar a mi calendario». Anotar qué hace (descarga, abre Google
Calendar, nada).

- **Resultado:** sin medir en 7.4 (recorte).

**Parada I.**

---

## Pendientes → pasos

Ajustada en el cierre de 7.4 con el resultado de cada fila (DESIGN.md, Pendientes).

| Pendiente (DESIGN.md) | Pasos | Resultado 7.4 | Sin dispositivo |
|---|---|---|---|
| Ayuda de `UI/Legend` por `aria-describedby` | N2.1 | ✓ NF y NC | VoiceOver |
| Anuncio de `UI/Notice` en región viva | N2.5; N2.4 y N2.4b (con foco, dato) | ✓ NF; `role="alert"`: N/A, sin instancia | VoiceOver |
| Menú de cuenta y navegación con lector | N1.1–N1.4 | ✓ NF | VoiceOver |
| `hyphens: auto` en Nav Item | A.4 | Sin medir en 7.4 | Safari macOS e iOS |
| Texto grande con el ajuste real | K.7 b–c (Firefox), C.3 (Chrome), A.2 (Android) | ✓ Firefox a 375 (K.7 b–c); 320 y 430, Chrome y Android: sin medir en 7.4 | Safari |
| Envío implícito con Intro en un radio | K.4 | ✓ Firefox (K.4 a); K.4 b sin medir | Safari |
| `last baseline` en Safari | K.9 (Firefox, dato) | Sin medir en 7.4 | Fila entera: Safari macOS e iOS |
| Resultados con lector | N1.5–N1.8 | ✓ NF (N1.7 también NC) | VoiceOver |
| Resto de pintado (Chrome real) | C.1, C.1b, C.2 | Sin medir en 7.4 | — |
| Anuncio del h2 del resumen de errores | N2.2 | ✓ NF | VoiceOver |
| `.ics` en Safari y en los calendarios | I.1–I.4 (I.5 dato) | ✓ descarga en Chrome (I.1) y Google Calendar (I.3); Firefox, I.2, Outlook e I.5: sin medir en 7.4 | Safari iOS y macOS |
| Ciclo de Tab del diálogo | K.1 | ✓ Firefox | Safari |
| Foco devuelto por el diálogo | K.2 | ✓ Firefox | Safari |
| `alertdialog` con lector | N2.3 | ✓ NF (dato: «diálogo») | VoiceOver |
| Calendario y horas con lector (+ spike § 4.1–4.6) | N3.1–N3.8b | ✓ NF en N3.1–N3.4, N3.7 y N3.8; N3.5 y N3.6: sin medir en 7.4 | VoiceOver («Siguiente» por gestos: A.6, sin medir) |
| Safari: foco y `scroll-padding` | K.6 (Firefox) | Sin medir en 7.4 | Parte Safari entera |
| Atrás con la hoja abierta | A.1, K.5 | ✓ Android, hoja de filtros (A.1 a); A.1 b y K.5: sin medir en 7.4 | Safari iOS |
| Hoja de filtros con lector | N1.9–N1.11 | ✓ NF y NC en N1.9 y N1.10; ✗ del proyecto en N1.11 (7.6) | VoiceOver |
| Foco devuelto por la hoja | K.3 | ✓ Firefox, filtros al aplicar (N1.11); K.3: sin medir en 7.4 | Safari |
| Zona segura en un iPhone real | A.5 (dato) | Sin medir en 7.4 | Fila entera: iPhone |
| Hallazgo de 7.1 (Firefox, solo texto) | K.7 a | ✓ Firefox a 375 × 900: la barra pasa al flujo | — |
| 7.6 · anunciador inerte en la hoja | N3.8 y N3.8b | ✗ confirmado de oído (N3.8b) | — |
| 7.6 · F1 y F2 | K.8 y K.6 (Firefox, dato) | Sin medir en 7.4 | — |
| 7.6 · anillo contra vecinos | — (medida de píxeles, exacta en 7.3) | — | — |
| spike § 4.7 (rejilla a 320 y 200 %) | K.8 (Firefox, dato; Chromium ✓ en 7.3) | Sin medir en 7.4 | — |
| Matriz: 1.3.1, 2.4.4, 2.5.3, 4.1.2, 4.1.3 | N0.1; N0.3 (N0.2, dato); N1.12; N1–N3; N1.7–N1.11, N2.5, N3.8 | Columna «Manual (7.4)» de docs/auditoria.md | VoiceOver |
| Hallazgos de 7.4 | N1.11; hallazgo tras N2.2 | ✗ del proyecto, NF y NC: dos filas «7 · 7.6» nuevas | — |

## Sin dispositivo

Sin Mac ni iPhone. Lo que queda abierto y por qué:

- **VoiceOver (macOS e iOS):** todas las filas de lector; su mitad NVDA se mide en N.
- **Safari de macOS e iOS:** envío implícito, ciclo de Tab y foco devuelto del diálogo y de la
  hoja, `hyphens`, texto grande, `.ics` y Atrás con la hoja (iOS); su mitad Firefox, Chrome o
  Android se mide en K, C, A e I.
- **Enteras:** zona segura del iPhone (A.5 es solo un dato de Android), `last baseline` en
  Safari (K.9 es Firefox) y la parte Safari de foco y `scroll-padding` (K.6 es Firefox).

## Vuelta al repo

Al terminar los diez tramos, Claude transcribe y enseña el diff de todos los docs antes de
escribir. Un único commit `docs` al final, con la cuenta exacta de filas cerradas, partidas,
«7 · sin dispositivo» nuevas y «7 · 7.6» nuevas.

1. **Este archivo** queda como registro, con los literales y las cifras de cada paso.
2. **docs/auditoria.md:** columna «Manual (7.4)» en la matriz (`✓ NF · NC`, `✗ (paso)`,
   `sin dispositivo`, `—`), que resuelve los «manual (7.4)» de 1.3.1, 2.4.4, 2.5.3, 4.1.2 y
   4.1.3; un § «Prueba manual · 7.4» con la tabla de entornos; Limitaciones al día; título
   nuevo.
3. **DESIGN.md, Pendientes:** cada fila «7» se parte. La mitad medida pasa a «7 · 7.4 ✓» con
   fecha, versiones y lo oído o medido; la mitad Safari o VoiceOver va a una fila nueva
   «7 · sin dispositivo» con su razón. Las que quedan enteras sin dispositivo (zona segura del
   iPhone, `last baseline`, la parte Safari de `scroll-padding`) pasan a «7 · sin
   dispositivo». Cada defecto nuevo, una fila «7 · 7.6» con la forma de las de 7.3 (hallazgo
   de 7.4, criterio, literal o cifra, propuesta).
4. **docs/spike-rac.md § 4:** el resultado de cada ítem, con el paso.
5. **docs/verificacion.md, Comprobaciones manuales:** las filas «Anuncio real con lector de
   pantalla» (4.2, 4.3), «Zona segura y Safari» (3) y «Ciclo de Tab del diálogo con ventana»
   (4.7, con Firefox).
6. **CLAUDE.md:** el «Estado actual» con 7.4.
