// Génère les icônes PWA (icon-192.png / icon-512.png) sans dépendance externe.
// Design : fond bleu accent (#0a84ff) façon iOS + ballon blanc stylisé
// (pentagone central + coutures). Antialiasing par sur-échantillonnage 4x.
//
//   node scripts/generate-icons.mjs
//
import zlib from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

// --- Palette (alignée sur globals.css) ---
const BLUE = [10, 132, 255]; // --accent
const WHITE = [255, 255, 255];
const DARK = [28, 28, 30]; // gris très foncé, plus doux que le noir pur

// --- Géométrie utilitaire ---
function insideRoundedRect(x, y, S, radius) {
  const rx = Math.min(Math.max(x, radius), S - radius);
  const ry = Math.min(Math.max(y, radius), S - radius);
  const dx = x - rx;
  const dy = y - ry;
  return dx * dx + dy * dy <= radius * radius;
}

function insideConvexPolygon(px, py, pts) {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const cross = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
    if (cross !== 0) {
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Couleur d'un sample (coordonnées en pixels de l'image finale, valeurs flottantes).
// Renvoie [r, g, b, a].
function sampleColor(x, y, S) {
  const cornerR = S * 0.22;
  if (!insideRoundedRect(x, y, S, cornerR)) return [0, 0, 0, 0]; // coins transparents

  const cx = S / 2;
  const cy = S / 2;
  const ballR = S * 0.34;
  const distC = Math.hypot(x - cx, y - cy);

  // Hors du ballon -> fond bleu
  if (distC > ballR) return [...BLUE, 255];

  // Pentagone central
  const rp = ballR * 0.46;
  const verts = [];
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    verts.push([cx + rp * Math.cos(ang), cy + rp * Math.sin(ang)]);
  }
  if (insideConvexPolygon(x, y, verts)) return [...DARK, 255];

  // Coutures : du sommet du pentagone vers l'extérieur du ballon
  const seamW = S * 0.022;
  for (const v of verts) {
    const dirx = v[0] - cx;
    const diry = v[1] - cy;
    const len = Math.hypot(dirx, diry) || 1;
    const ex = cx + (dirx / len) * ballR * 0.98;
    const ey = cy + (diry / len) * ballR * 0.98;
    if (distToSegment(x, y, v[0], v[1], ex, ey) <= seamW / 2) return [...DARK, 255];
  }

  // Reste du ballon -> blanc
  return [...WHITE, 255];
}

function renderRGBA(S, ss = 4) {
  const buf = Buffer.alloc(S * S * 4);
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const fx = px + (sx + 0.5) / ss;
          const fy = py + (sy + 0.5) / ss;
          const [cr, cg, cb, ca] = sampleColor(fx, fy, S);
          // pré-multiplie par alpha pour un bord net
          const af = ca / 255;
          r += cr * af;
          g += cg * af;
          b += cb * af;
          a += ca;
        }
      }
      const n = ss * ss;
      const af = a / (255 * n) || 1;
      const o = (py * S + px) * 4;
      buf[o] = Math.round(r / n / (af || 1));
      buf[o + 1] = Math.round(g / n / (af || 1));
      buf[o + 2] = Math.round(b / n / (af || 1));
      buf[o + 3] = Math.round(a / n);
    }
  }
  return buf;
}

// --- Encodage PNG (RGBA 8 bits) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(rgba, S) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // scanlines avec filtre 0
  const raw = Buffer.alloc(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0;
    rgba.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const S of [192, 512]) {
  const png = encodePNG(renderRGBA(S), S);
  const out = join(PUBLIC, `icon-${S}.png`);
  writeFileSync(out, png);
  console.log(`✓ ${out} (${png.length} octets)`);
}
