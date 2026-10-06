// Celdas del calendario al cambiar de mes (7.6 · lote 7). La usan 4.6 (en
// línea) y 5.2 (la hoja). Antes de cada paso de teclado, cada td del cuerpo
// de la rejilla lleva una marca; después se apunta el foco (con «rejilla» si
// está dentro de la tabla) y, si cambió el mes, cuántos td del cuerpo nuevo
// llevan la marca: los que RAC reutilizó.

const probe = (root) => `(() => {
  const tds = [...${root}.querySelectorAll('.c-calendar__grid tbody td')], reused = tds.filter((td) => td.__antes).length
  for (const td of tds) td.__antes = true
  const a = document.activeElement
  return { foco: (a.closest('[role=grid]') ? 'rejilla ' : '') + a.tagName + ' ' + (a.getAttribute('aria-label') ?? a.textContent.trim()).split(',')[0], mes: ${root}.querySelector('.c-calendar__month').textContent, reutilizadas: reused }
})()`

// `steps`: [etiqueta, acción]. `extra`: texto que se añade a cada cambio de mes
// (la región del mes en la hoja).
export async function monthCells(b, root, steps, extra = async () => '') {
  let { mes } = await b.ev(probe(root))
  const out = []
  for (const [label, press] of steps) {
    await press()
    const now = await b.ev(probe(root))
    out.push(`${label}: ${now.foco}` + (now.mes !== mes ? ` · ${now.mes} · ${now.reutilizadas} reutilizadas${await extra()}` : ''))
    mes = now.mes
  }
  return out
}
