# Tipografía responsive

Aplica cuando un estilo de texto de Figma tiene valores distintos por breakpoint (pares `H1/Mobile` + `H1/Desktop`, o modos por dispositivo en una colección tipográfica). Si el estilo es igual en todos los tamaños, no se hace nada: un solo token.

## Estrategia por defecto: redefinir por breakpoint

1. Cada valor distinto es un **primitivo** de la escala: `--font-size-2xl: 1.5rem`, `--font-size-3xl: 2rem`.
2. El **semántico** apunta al valor mobile: `--text-heading-1-size: var(--font-size-2xl)`.
3. En la media query del breakpoint donde cambia, el semántico **se re-apunta**: `--text-heading-1-size: var(--font-size-3xl)`.
4. Igual con `line-height` y `letter-spacing` si cambian.

Los componentes consumen `var(--text-heading-1-size)` y no saben que cambia. Es el mismo mecanismo que los modos de color: el breakpoint re-apunta la capa semántica y los primitivos no cambian.

Breakpoint de cambio: el del ancho del lienzo del estilo mayor (lienzo desktop de 1440 → `xl`; de 1024 → `lg`). Si hay tres tamaños, dos redefiniciones. Si el lienzo no coincide con ningún breakpoint, se usa el inmediato inferior y se declara como supuesto.

## Opcional: tipografía fluida (solo si el usuario la pide)

El semántico toma un `clamp()` calculado a partir de los dos valores de Figma, sin redefiniciones por breakpoint.

**Fórmula** (todo en rem; `vw` final = pendiente × 100):
```
pendiente  = (max - min) / (lienzoMax - lienzoMin)
intercepto = min - pendiente × lienzoMin
valor      = clamp(min, intercepto + (pendiente × 100)vw, max)
```

**Ejemplo:** 24px en el lienzo de 360 y 32px en el de 1440.
- min = 1.5rem, max = 2rem; lienzoMin = 22.5rem, lienzoMax = 90rem.
- pendiente = 0.5 / 67.5 = 0.007407 → 0.7407vw.
- intercepto = 1.5 − 0.007407 × 22.5 = 1.3333rem.

```css
--text-heading-1-size: clamp(1.5rem, 1.3333rem + 0.7407vw, 2rem);
```

**Reglas de accesibilidad (1.4.4, texto al 200 %):**
- El término central siempre suma un valor en rem. Si solo usa `vw`, el texto no escala con el zoom.
- `max` ≤ 2.5 × `min`. Por encima, con zoom el texto no alcanza el doble de tamaño en todos los anchos.
- Si alguna regla falla, no se genera la versión fluida de ese estilo: se reporta y se usa la redefinición por breakpoint.

En el mapa de equivalencias, el semántico fluido lista sus dos orígenes de Figma y el cálculo.
