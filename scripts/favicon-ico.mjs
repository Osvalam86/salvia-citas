// node scripts/favicon-ico.mjs <png16> <png32> <salida>
// Genera public/favicon.ico con los PNG de 16 y 32 que exporta Figma (F.8,
// frame 534:6514; DESIGN.md § Constantes), incrustados tal cual: un ICO con
// entradas PNG, que leen todos los navegadores actuales. Sin dependencias. Los
// PNG fuente salen de la carpeta de exportación de Figma y no se versionan.
import fs from 'node:fs'

const [png16, png32, out] = process.argv.slice(2)
if (!png16 || !png32 || !out) {
  console.error('Uso: node scripts/favicon-ico.mjs <png16> <png32> <salida>')
  process.exit(2)
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// Lee un PNG y comprueba su firma y su tamaño (IHDR: ancho y alto en 16 y 20).
function readPng(file, size) {
  const data = fs.readFileSync(file)
  if (!data.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${file}: no es un PNG`)
  const width = data.readUInt32BE(16)
  const height = data.readUInt32BE(20)
  if (width !== size || height !== size) throw new Error(`${file}: mide ${width} × ${height}, no ${size} × ${size}`)
  return data
}

const images = [readPng(png16, 16), readPng(png32, 32)]

// ICONDIR (6 bytes) + una ICONDIRENTRY de 16 bytes por imagen + los PNG.
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reservado
header.writeUInt16LE(1, 2) // tipo: icono
header.writeUInt16LE(images.length, 4)

let offset = 6 + 16 * images.length
const entries = images.map((png, i) => {
  const size = [16, 32][i]
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size, 0) // ancho
  entry.writeUInt8(size, 1) // alto
  entry.writeUInt8(0, 2) // sin paleta
  entry.writeUInt8(0, 3) // reservado
  entry.writeUInt16LE(1, 4) // planos
  entry.writeUInt16LE(32, 6) // bits por píxel (RGBA)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += png.length
  return entry
})

fs.writeFileSync(out, Buffer.concat([header, ...entries, ...images]))
console.log(`${out}: ${offset} bytes, PNG de 16 y 32`)
