# Checklist de autoverificación — theme tokens

Marcar ✓ / ✗ (corregir) / N/A e incluir en la sección "Verificación".

## Trazabilidad y fidelidad
- [ ] Cero valores inventados: todo token traza a un valor de Figma en el mapa de equivalencias (o está marcado como inferido/confirmado en modo degradado)
- [ ] Mapa de equivalencias completo: una fila por token + huecos declarados
- [ ] Ningún primitivo nombrado por rol; ningún semántico con valor literal (siempre alias a primitivo)
- [ ] Escalas reflejan solo los valores existentes (rampa no completada artificialmente)
- [ ] Estilos de texto de Figma descompuestos en primitivos + grupo semántico

## Arquitectura
- [ ] Custom properties CSS como capa primaria en cualquier stack
- [ ] SCSS: sin variables puente; `_breakpoints.scss` en rem y `_scales.scss` con exactamente las claves de `--space-*` emitidas
- [ ] Sin `@layer` en la salida
- [ ] Tailwind v4: @theme en CSS con namespaces correctos; sin config JS
- [ ] Modos generados solo si Figma los define; solo la capa semántica cambia por modo
- [ ] Unidades: rem en tamaños, espaciados y breakpoints; px solo en radios, bordes y hairlines
- [ ] Tipografía por breakpoint: primitivos fijos, solo el semántico se re-apunta en la media query
- [ ] Tipografía fluida solo si se pidió; con término rem y max ≤ 2.5 × min
- [ ] Modos por dispositivo tratados como responsive, no como tema

## Calidad y reporte
- [ ] Reporte de contraste: pares semánticos texto/fondo evaluados (4.5:1 texto, 3:1 UI); fallos reportados con criterio WCAG, nunca corregidos en silencio
- [ ] Huecos de semánticos esenciales reportados (danger, focus, disabled…)
- [ ] Ambigüedades resueltas por pregunta, no por decisión propia
- [ ] Salida completa: Inventario + Archivos + Mapa + Huecos/reportes + Verificación
