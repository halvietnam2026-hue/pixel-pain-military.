export interface PaletteColor {
  r: number;
  g: number;
  b: number;
  hex: string;
  hue: number;
  lum: number;
}

export interface PixelArtData {
  size: number; // N x N
  grid: number[]; // length N*N, value = palette index
  palette: PaletteColor[];
}

export function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return h * 60;
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function dist2(a: number[], b: number[]) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** RNG có seed → cùng 1 ảnh luôn cho ra cùng 1 bản tranh */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function kmeans(pixels: number[][], k: number, iters: number, rand: () => number) {
  const n = pixels.length;
  const kk = Math.min(k, n);
  const centroids: number[][] = [[...pixels[Math.floor(rand() * n)]]];
  while (centroids.length < kk) {
    const d2 = pixels.map((p) => {
      let m = Infinity;
      for (const c of centroids) m = Math.min(m, dist2(p, c));
      return m;
    });
    const sum = d2.reduce((a, b) => a + b, 0) || 1;
    let r = rand() * sum;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      r -= d2[i];
      if (r <= 0) { idx = i; break; }
    }
    centroids.push([...pixels[idx]]);
  }
  const labels = new Array(n).fill(0);
  const assign = () => {
    for (let i = 0; i < n; i++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < kk; c++) {
        const d = dist2(pixels[i], centroids[c]);
        if (d < bd) { bd = d; best = c; }
      }
      labels[i] = best;
    }
  };
  for (let it = 0; it < iters; it++) {
    assign();
    const sums = Array.from({ length: kk }, () => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const l = labels[i];
      sums[l][0] += pixels[i][0];
      sums[l][1] += pixels[i][1];
      sums[l][2] += pixels[i][2];
      sums[l][3] += 1;
    }
    for (let c = 0; c < kk; c++) {
      if (sums[c][3] > 0) {
        centroids[c] = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
      } else {
        centroids[c] = [...pixels[Math.floor(rand() * n)]];
      }
    }
  }
  assign();
  return { centroids, labels };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Ảnh → lưới N×N → gom K màu → đánh số 1..K */
export async function imageToPixelArt(
  img: HTMLImageElement,
  gridSize: number,
  colorCount: number,
  seed = 1234
): Promise<PixelArtData> {
  const N = gridSize;
  const small = document.createElement("canvas");
  small.width = N;
  small.height = N;
  const sctx = small.getContext("2d", { willReadFrequently: true })!;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const side = Math.min(iw, ih);
  sctx.drawImage(img, (iw - side) / 2, (ih - side) / 2, side, side, 0, 0, N, N);

  const data = sctx.getImageData(0, 0, N, N).data;
  const pixels: number[][] = [];
  for (let i = 0; i < N * N; i++) pixels.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);

  const { centroids, labels } = kmeans(pixels, colorCount, 14, mulberry32(seed));

  // bỏ các cụm rỗng
  const used = new Set(labels);
  const palette0: PaletteColor[] = [];
  const oldToCompact = new Map<number, number>();
  centroids.forEach((c, i) => {
    if (!used.has(i)) return;
    oldToCompact.set(i, palette0.length);
    const [r, g, b] = c;
    palette0.push({
      r: Math.round(r), g: Math.round(g), b: Math.round(b),
      hex: rgbToHex(r, g, b), hue: rgbToHue(r, g, b), lum: luminance(r, g, b),
    });
  });
  const compactLabels = labels.map((l) => oldToCompact.get(l)!);

  // sắp xếp: tối → sáng để số 1 là màu đậm nhất (giống game thật)
  const order = palette0.map((_, i) => i).sort((a, b) => palette0[a].lum - palette0[b].lum);
  const remap: number[] = [];
  const palette = order.map((oldIdx, newIdx) => { remap[oldIdx] = newIdx; return palette0[oldIdx]; });
  const grid = compactLabels.map((l) => remap[l]);

  return { size: N, grid, palette };
}

/**
 * Từ lưới chỉ số + danh sách màu → PixelArtData hoàn chỉnh.
 * Gộp màu quá ít ô / vượt quá maxColors vào màu gần nhất, rồi đánh số 1..K theo độ sáng.
 */
export function buildArt(N: number, idx: ArrayLike<number>, hexes: string[], maxColors: number): PixelArtData {
  const grid = Array.from(idx);
  const rgb = hexes.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const thr = Math.max(2, Math.round(N * N * 0.006));
  const remap = hexes.map((_, i) => i);
  const resolve = (i: number) => { while (remap[i] !== i) i = remap[i]; return i; };

  for (let guard = 0; guard < 64; guard++) {
    const counts = new Array(hexes.length).fill(0);
    for (const v of grid) counts[resolve(v)]++;
    const used = counts.map((c, i) => [c, i]).filter(([c]) => c > 0);
    if (used.length <= 2) break;
    let victim = -1;
    if (used.length > maxColors) {
      victim = used.reduce((a, b) => (b[0] < a[0] ? b : a))[1];
    } else {
      const small = used.filter(([c]) => c < thr);
      if (!small.length) break;
      victim = small.reduce((a, b) => (b[0] < a[0] ? b : a))[1];
    }
    let best = -1, bd = Infinity;
    for (const [, j] of used) {
      if (j === victim) continue;
      const d = dist2(rgb[victim], rgb[j]);
      if (d < bd) { bd = d; best = j; }
    }
    if (best < 0) break;
    remap[victim] = best;
  }

  const final = grid.map(resolve);
  const usedSet = [...new Set(final)];
  const pal0 = usedSet.map((i) => {
    const [r, g, b] = rgb[i];
    return { i, c: { r, g, b, hex: rgbToHex(r, g, b), hue: rgbToHue(r, g, b), lum: luminance(r, g, b) } as PaletteColor };
  });
  pal0.sort((a, b) => a.c.lum - b.c.lum);
  const toNew = new Map<number, number>();
  pal0.forEach((p, n) => toNew.set(p.i, n));
  return { size: N, grid: final.map((v) => toNew.get(v)!), palette: pal0.map((p) => p.c) };
}

export function darken(hex: string, amt = 0.55): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return rgbToHex(r * amt, g * amt, b * amt);
}

/** Vẽ bản màu hoàn chỉnh ra dataURL (dùng cho thumbnail / màn chiến thắng) */
export function artToDataURL(art: PixelArtData, size = 256): string {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const cell = size / art.size;
  for (let i = 0; i < art.grid.length; i++) {
    const r = Math.floor(i / art.size), col = i % art.size;
    ctx.fillStyle = art.palette[art.grid[i]].hex;
    ctx.fillRect(Math.floor(col * cell), Math.floor(r * cell), Math.ceil(cell), Math.ceil(cell));
  }
  return c.toDataURL();
}
