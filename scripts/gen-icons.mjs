// Erzeugt die PWA-Icons ohne externe Abhaengigkeiten (reiner PNG-Encoder).
// Aufruf: npm run icons
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [14, 16, 21]
const EMBER = [228, 98, 46]
const GOLD = [217, 164, 65]

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(size, rgb) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3
      raw[p++] = rgb[i]
      raw[p++] = rgb[i + 1]
      raw[p++] = rgb[i + 2]
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/**
 * Motiv: Glutring mit Bruchstelle oben rechts + goldener Punkt.
 * scale < 1 laesst Luft fuer maskable-Safe-Zone.
 */
function draw(size, scale) {
  const rgb = new Uint8Array(size * size * 3)
  const c = size / 2
  const rOuter = size * 0.36 * scale
  const rInner = size * 0.25 * scale
  const SS = 3 // Supersampling gegen Treppchen

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let acc = [0, 0, 0]
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS - c
          const py = y + (sy + 0.5) / SS - c
          const d = Math.hypot(px, py)
          const ang = Math.atan2(py, px) // -PI..PI, 0 = rechts
          let col = BG
          const inRing = d <= rOuter && d >= rInner
          const gap = ang > -1.15 && ang < -0.45 // Bruchstelle oben rechts
          if (inRing && !gap) {
            const t = (d - rInner) / (rOuter - rInner)
            col = mix(EMBER, [255, 170, 110], 1 - t)
          }
          const dotR = size * 0.075 * scale
          const dotX = c + Math.cos(-0.8) * ((rOuter + rInner) / 2) - c
          const dotY = c + Math.sin(-0.8) * ((rOuter + rInner) / 2) - c
          if (Math.hypot(px - dotX, py - dotY) <= dotR) col = GOLD
          acc = [acc[0] + col[0], acc[1] + col[1], acc[2] + col[2]]
        }
      }
      const n = SS * SS
      const i = (y * size + x) * 3
      rgb[i] = Math.round(acc[0] / n)
      rgb[i + 1] = Math.round(acc[1] / n)
      rgb[i + 2] = Math.round(acc[2] / n)
    }
  }
  return rgb
}

mkdirSync(OUT, { recursive: true })

const targets = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.72],
  ['apple-touch-icon.png', 180, 1],
]

for (const [name, size, scale] of targets) {
  writeFileSync(resolve(OUT, name), encodePNG(size, draw(size, scale)))
  console.log(`✓ ${name} (${size}px)`)
}
