// Génère public/icon-192.png et icon-512.png à partir de assets/icon-source.png.
// La source est un carré arrondi bleu avec des COINS BLANCS autour. On rend ces
// coins transparents (sinon ils apparaissent en mode sombre / onglet sombre),
// SANS toucher au « 26 » blanc qui, lui, est enfermé dans le bleu au centre.
//
// Méthode : flood fill du blanc depuis les bords (= les coins, qui touchent le
// bord) → on les rend transparents. Le « 26 » n'est pas atteint → il reste blanc.
//
//   node scripts/build-icons.mjs
import sharp from "sharp";

const SRC = "assets/icon-source.png";

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const isWhite = (x, y) => {
  const i = (y * W + x) * 4;
  return data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;
};

// Flood fill du blanc depuis les bords → coins.
const corner = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (corner[p] || !isWhite(x, y)) return;
  corner[p] = 1;
  stack.push(x, y);
};
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
while (stack.length) {
  const y = stack.pop(), x = stack.pop();
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

let cleared = 0;
for (let p = 0; p < W * H; p++) {
  if (corner[p]) { data[p * 4 + 3] = 0; cleared++; }
}
console.log(`coins blancs rendus transparents : ${cleared} pixels`);

// Image nettoyée (pleine résolution), puis on décline en 512 et 192.
const clean = sharp(data, { raw: { width: W, height: H, channels: 4 } }).png();
const buf = await clean.toBuffer();

for (const size of [512, 192]) {
  await sharp(buf)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`public/icon-${size}.png`);
  console.log(`public/icon-${size}.png écrit (${size}×${size})`);
}
