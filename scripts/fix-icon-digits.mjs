// Corrige le « 26 » des icônes : il était DÉCOUPÉ (transparent) au lieu d'être
// blanc plein. Résultat : invisible sur fond bleu (splash) et en mode sombre.
// Ce script remplit les chiffres en blanc opaque SANS toucher aux coins arrondis.
//
// Méthode : on inonde la transparence depuis les bords de l'image (= les coins
// arrondis, qui touchent le bord). Tout pixel transparent NON atteint est donc
// « enfermé » dans le bleu → c'est un trait de chiffre → on le peint en blanc.
//
//   node scripts/fix-icon-digits.mjs
import sharp from "sharp";

async function fixIcon(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const alpha = (x, y) => data[(y * W + x) * 4 + 3];

  // 1) Flood fill depuis les bords sur les pixels transparents (alpha < 128).
  const outside = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (outside[p] || alpha(x, y) >= 128) return; // déjà vu, ou « mur » opaque
    outside[p] = 1;
    stack.push(x, y);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // 2) Pixels transparents/semi-transparents NON atteints = chiffres → blanc plein.
  let filled = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (!outside[p] && data[i + 3] < 255) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
      filled++;
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path);
  console.log(`${path} → ${filled} pixels remplis en blanc`);
}

await fixIcon("public/icon-512.png");
await fixIcon("public/icon-192.png");
