/**
 * BỘ SINH BẢN ĐỒ TỰ ĐỘNG
 * Mỗi seed → 1 bức pixel-art KHÁC NHAU (12 kiểu × bảng màu × hình dạng ngẫu nhiên).
 * Nhờ vậy có thể tạo 10.000+ màn mà không cần vẽ tay từng ảnh.
 */
import { buildArt, type PixelArtData } from "../lib/pixelEngine";

export type RNG = () => number;
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r: RNG, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const pick = <T,>(r: RNG, arr: T[]): T => arr[Math.floor(r() * arr.length)];
function shuffle<T>(r: RNG, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const lumOf = (h: string) => 0.2126 * parseInt(h.slice(1, 3), 16) + 0.7152 * parseInt(h.slice(3, 5), 16) + 0.0722 * parseInt(h.slice(5, 7), 16);

export const KINDS = ["creature", "robot", "mandala", "landscape", "emblem", "pattern", "tank", "plane", "ship", "circuit", "flag", "flower"] as const;
export type GenKind = typeof KINDS[number];

const PALETTES: string[][] = [
  ["#c9c19a", "#556b2f", "#3b4a24", "#8b7d4a", "#2a2f1a", "#a0a37a", "#d9a441", "#6e6a5a", "#e8e2c8"],
  ["#f2d9a8", "#e0b070", "#b07a3a", "#7a4a1f", "#4a2e12", "#ffe9c2", "#8ab0c8", "#3b3b3b", "#c95d3a"],
  ["#0e2a47", "#1b4d7a", "#2f7fb3", "#5fb7d9", "#a8e0ee", "#f4f1de", "#e07a5f", "#2a2a2a", "#f2cc8f"],
  ["#2b1b3d", "#7a2a55", "#c8456b", "#f07a5a", "#f9b56b", "#ffe6a7", "#3b3b6b", "#101020", "#5ec6d8"],
  ["#0f2a1a", "#1f4d2e", "#3a7d44", "#7fbf5a", "#c5e07a", "#8a5a2b", "#e8e4c9", "#2b2b2b", "#d94f3d"],
  ["#0b0b1a", "#ff2e88", "#2ef2ff", "#ffe600", "#7a3bff", "#00ff9c", "#ffffff", "#3a3a5a", "#ff7a2e"],
  ["#0f380f", "#306230", "#8bac0f", "#9bbc0f", "#c9d97a", "#e6f0b8"],
  ["#fff0f5", "#ff9ac2", "#ff5d9e", "#ffd166", "#8ed6ff", "#7b61ff", "#5a3d8a", "#2f2f2f", "#a8f0c6"],
  ["#1a0a05", "#5a1a0a", "#b3341a", "#ff6a1f", "#ffb020", "#fff2a0", "#4a4a4a", "#8a8a8a", "#2e1e4a"],
  ["#0c1f3f", "#2d5b9a", "#63a6d9", "#a9dcf5", "#e9f7ff", "#ffffff", "#6b6b8a", "#2a2a3a", "#f0a0b0"],
  ["#e6dcc3", "#b39b6e", "#7d6b48", "#4d4130", "#2e2a22", "#9fb87d", "#5c7a44", "#c96d3a", "#f1efe4"],
  ["#111111", "#333333", "#555555", "#777777", "#999999", "#bbbbbb", "#dddddd", "#ffffff", "#c02020"],
  ["#3b3f2a", "#5a6a3a", "#8a9a5a", "#b8b48a", "#2a2a1a", "#d9d0a8", "#6b5a3a", "#a67c52", "#e0e6d0"],
  ["#1d1b2e", "#4b3b7a", "#8a5fd6", "#c79bff", "#ffd6f5", "#ff8fb1", "#5ce1e6", "#f9f871", "#2f2f4f"],
  ["#f5f0e1", "#e63946", "#1d3557", "#457b9d", "#a8dadc", "#2a9d8f", "#f4a261", "#264653", "#e9c46a"],
  ["#2b2d42", "#8d99ae", "#edf2f4", "#ef233c", "#d90429", "#3a506b", "#5bc0be", "#ffb703", "#0b132b"],
  ["#4a3728", "#8c5e3c", "#c98b5a", "#e8c39e", "#f7e7ce", "#3d5a3c", "#7aa064", "#b8d68a", "#1e1a16"],
  ["#001219", "#005f73", "#0a9396", "#94d2bd", "#e9d8a6", "#ee9b00", "#ca6702", "#bb3e03", "#9b2226"],
];

interface Ctx { r: RNG; N: number; g: Int16Array; k: number; byLum: number[]; dark: number; light: number }

function makeCtx(r: RNG, N: number, maxColors: number): { c: Ctx; cols: string[] } {
  const cols = shuffle(r, pick(r, PALETTES)).slice(0, Math.max(4, Math.min(maxColors + 1, 10)));
  const byLum = cols.map((_, i) => i).sort((a, b) => lumOf(cols[a]) - lumOf(cols[b]));
  const c: Ctx = { r, N, g: new Int16Array(N * N), k: cols.length, byLum, dark: byLum[0], light: byLum[byLum.length - 1] };
  return { c, cols };
}
const ci = (c: Ctx, i: number) => c.byLum[((i % c.k) + c.k) % c.k]; // i=0 tối nhất … k-1 sáng nhất
const put = (c: Ctx, x: number, y: number, v: number) => { if (x >= 0 && y >= 0 && x < c.N && y < c.N) c.g[(y | 0) * c.N + (x | 0)] = v; };
function fillRect(c: Ctx, x0: number, y0: number, x1: number, y1: number, v: number) {
  for (let y = Math.max(0, Math.floor(Math.min(y0, y1))); y <= Math.min(c.N - 1, Math.floor(Math.max(y0, y1))); y++)
    for (let x = Math.max(0, Math.floor(Math.min(x0, x1))); x <= Math.min(c.N - 1, Math.floor(Math.max(x0, x1))); x++) c.g[y * c.N + x] = v;
}
function fillEllipse(c: Ctx, cx: number, cy: number, rx: number, ry: number, v: number) {
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(c.N - 1, Math.ceil(cy + ry)); y++)
    for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(c.N - 1, Math.ceil(cx + rx)); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) c.g[y * c.N + x] = v;
    }
}
function line(c: Ctx, x0: number, y0: number, x1: number, y1: number, v: number, th = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) put(c, x + a - (th >> 1), y + b - (th >> 1), v);
  }
}
function valueNoise(r: RNG, N: number, cells: number): Float32Array {
  const gs = cells + 1;
  const G = new Float32Array(gs * gs);
  for (let i = 0; i < G.length; i++) G[i] = r();
  const out = new Float32Array(N * N);
  const sm = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < N; y++) {
    const fy = (y / N) * cells, iy = Math.min(cells - 1, Math.floor(fy)), sy = sm(fy - iy);
    for (let x = 0; x < N; x++) {
      const fx = (x / N) * cells, ix = Math.min(cells - 1, Math.floor(fx)), sx = sm(fx - ix);
      const a = G[iy * gs + ix], b = G[iy * gs + ix + 1], d = G[(iy + 1) * gs + ix], e = G[(iy + 1) * gs + ix + 1];
      out[y * N + x] = (a + (b - a) * sx) * (1 - sy) + (d + (e - d) * sx) * sy;
    }
  }
  return out;
}
function outline(c: Ctx, bg: number, v: number) {
  const { N, g } = c;
  const src = Int16Array.from(g);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (src[i] === bg) continue;
    const nb = [src[i - 1], src[i + 1], src[i - N], src[i + N]];
    if ((x > 0 && nb[0] === bg) || (x < N - 1 && nb[1] === bg) || (y > 0 && nb[2] === bg) || (y < N - 1 && nb[3] === bg)) g[i] = v;
  }
}

/* ---------- 1. SINH VẬT / ROBOT (đối xứng gương) ---------- */
function genCreature(c: Ctx, blocky: boolean) {
  const { r, N, g, k } = c;
  const bg = r() < 0.75 ? c.light : c.dark;
  const ol = bg === c.dark ? c.light : c.dark;
  g.fill(bg);
  const mask = new Uint8Array(N * N);
  const half = Math.ceil(N / 2), cx = (N - 1) / 2, cy = (N - 1) / 2;
  const rx = N * (0.28 + r() * 0.2), ry = N * (0.3 + r() * 0.18);
  if (!blocky) {
    for (let y = 0; y < N; y++) for (let x = 0; x < half; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      const p = 0.72 * (1 - d);
      if (p > 0 && r() < p) mask[y * N + x] = 1;
    }
  } else {
    const nb = ri(r, 4, 10);
    for (let i = 0; i < nb; i++) {
      const w = ri(r, 2, Math.max(2, N / 3 | 0)), h = ri(r, 2, Math.max(2, N / 3 | 0));
      const x0 = ri(r, Math.max(0, cx - rx) | 0, cx | 0), y0 = ri(r, Math.max(0, cy - ry) | 0, Math.min(N - h, cy + ry) | 0);
      for (let y = y0; y < y0 + h && y < N; y++) for (let x = x0; x < x0 + w && x < half; x++) mask[y * N + x] = 1;
    }
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < half; x++) mask[y * N + (N - 1 - x)] = mask[y * N + x];
  if (!blocky) for (let it = 0; it < 2; it++) {
    const src = Uint8Array.from(mask);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < N && yy < N) n += src[yy * N + xx];
      }
      mask[y * N + x] = n >= 5 ? 1 : n <= 2 ? 0 : src[y * N + x];
    }
  }
  let cnt = 0; for (let i = 0; i < mask.length; i++) cnt += mask[i];
  if (cnt < N * N * 0.08) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x - cx) / (rx * 0.6)) ** 2 + ((y - cy) / (ry * 0.6)) ** 2 <= 1) mask[y * N + x] = 1;

  const noise = valueNoise(r, N, ri(r, 2, 4));
  const body = c.byLum.filter((i) => i !== bg && i !== ol);
  const bodyCols = body.length ? body : [ol];
  for (let i = 0; i < N * N; i++) if (mask[i]) g[i] = bodyCols[Math.min(bodyCols.length - 1, Math.floor(noise[i] * bodyCols.length))];
  outline(c, bg, ol);
  // mắt
  const ey = Math.round(cy - ry * 0.25), ex = Math.round(rx * 0.35);
  const eyeCol = bg === c.dark ? c.dark : c.light;
  const es = N >= 28 ? 2 : 1;
  for (const sx of [-1, 1]) {
    const x = Math.round(cx + sx * ex);
    if (mask[ey * N + x]) { fillRect(c, x, ey, x + es - 1, ey + es - 1, eyeCol); if (es === 2) put(c, x, ey, ol); }
  }
  void k;
}

/* ---------- 2. MANDALA ---------- */
function genMandala(c: Ctx) {
  const { r, N, g, k } = c;
  const bg = r() < 0.5 ? c.dark : c.light;
  g.fill(bg);
  const cx = (N - 1) / 2, R = N / 2;
  const rings = ri(r, 3, 7), m = ri(r, 3, 6), eight = r() < 0.6;
  const A = Array.from({ length: rings }, () => ri(r, 0, k - 1));
  const B = Array.from({ length: rings }, () => ri(r, 0, k - 1));
  const P = Array.from({ length: m * m }, () => (r() < 0.5 ? 1 : 0));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x - cx, dy = y - cx;
    let a = Math.abs(dx), b = Math.abs(dy);
    if (eight && b > a) [a, b] = [b, a];
    const rr = Math.hypot(dx, dy);
    if (rr > R) continue;
    const band = Math.min(rings - 1, Math.floor((rr / R) * rings));
    const pa = Math.min(m - 1, Math.floor((a / R) * m)), pb = Math.min(m - 1, Math.floor((b / R) * m));
    g[y * N + x] = P[pa * m + pb] ? A[band] : B[band];
  }
}

/* ---------- 3. PHONG CẢNH ---------- */
function genLandscape(c: Ctx) {
  const { r, N, g, k } = c;
  const horizon = ri(r, Math.round(N * 0.5), Math.round(N * 0.7));
  const sky1 = ci(c, k - 1), sky2 = ci(c, k - 2);
  g.fill(sky1);
  const b1 = Math.floor(horizon * (0.3 + r() * 0.35));
  fillRect(c, 0, 0, N - 1, b1, sky2);
  const sun = ci(c, ri(r, 1, k - 1));
  fillEllipse(c, ri(r, N * 0.15 | 0, N * 0.85 | 0), ri(r, N * 0.08 | 0, horizon * 0.55 | 0), Math.max(1.2, N * (0.05 + r() * 0.07)), Math.max(1.2, N * (0.05 + r() * 0.07)), sun);
  if (N >= 20) for (let i = ri(r, 0, 3); i > 0; i--) {
    const rx = ri(r, 2, N / 6 | 0);
    fillEllipse(c, ri(r, 0, N - 1), ri(r, 1, horizon * 0.5 | 0), rx, Math.max(1, rx / 3), c.light);
  }
  const mount = (base: number, amp: number, col: number) => {
    let h = base;
    for (let x = 0; x < N; x++) {
      h += (r() - 0.5) * amp * 2;
      h = Math.max(horizon * 0.25, Math.min(horizon - 1, h));
      fillRect(c, x, Math.round(h), x, horizon - 1, col);
    }
  };
  mount(horizon * 0.55, N / 14 + 0.6, ci(c, 2));
  mount(horizon * 0.8, N / 16 + 0.5, ci(c, 3));
  fillRect(c, 0, horizon, N - 1, N - 1, ci(c, 4));
  const gb = horizon + Math.round((N - horizon) * (0.35 + r() * 0.3));
  fillRect(c, 0, gb, N - 1, N - 1, ci(c, 1));
  if (r() < 0.55) {
    const cx = ri(r, N * 0.3 | 0, N * 0.7 | 0);
    for (let y = horizon; y < N; y++) {
      const t = (y - horizon) / (N - horizon);
      const w = 0.5 + t * N * 0.18;
      fillRect(c, cx - w, y, cx + w, y, ci(c, 0));
    }
  }
}

/* ---------- 4. HUY HIỆU ---------- */
function genEmblem(c: Ctx) {
  const { r, N, g, k } = c;
  let prev = ri(r, 0, k - 1);
  g.fill(prev);
  const cx = (N - 1) / 2;
  if (r() < 0.6) {
    const t = ri(r, 1, Math.max(1, N / 12 | 0));
    const col = (prev + ri(r, 1, k - 1)) % k;
    fillRect(c, 0, 0, N - 1, t - 1, col); fillRect(c, 0, N - t, N - 1, N - 1, col);
    fillRect(c, 0, 0, t - 1, N - 1, col); fillRect(c, N - t, 0, N - 1, N - 1, col);
  }
  const shapes = ri(r, 2, 4);
  const R0 = N * 0.42;
  for (let s = 0; s < shapes; s++) {
    const rad = R0 * (1 - s * 0.22 - r() * 0.08);
    if (rad < 1) break;
    const type = pick(r, ["circle", "diamond", "square", "star", "ring", "cross", "chevron"]);
    const col = (prev + ri(r, 1, k - 1)) % k;
    prev = col;
    const pts = ri(r, 3, 8), per = Math.max(2, Math.round(N / ri(r, 4, 8)));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - cx, dy = y - cx, ax = Math.abs(dx), ay = Math.abs(dy), h = Math.hypot(dx, dy);
      let inside = false;
      switch (type) {
        case "circle": inside = h <= rad; break;
        case "diamond": inside = ax + ay <= rad; break;
        case "square": inside = Math.max(ax, ay) <= rad * 0.82; break;
        case "ring": inside = h <= rad && h >= rad * 0.68; break;
        case "cross": inside = (ax <= rad * 0.3 && ay <= rad) || (ay <= rad * 0.3 && ax <= rad); break;
        case "star": { const th = Math.atan2(dy, dx); inside = h <= rad * (0.55 + 0.45 * Math.cos(pts * th)); break; }
        case "chevron": inside = ax + ay <= rad && Math.floor((y + N) / per) % 2 === 0; break;
      }
      if (inside) g[y * N + x] = col;
    }
  }
}

/* ---------- 5. HOẠ TIẾT LẶP ---------- */
function genPattern(c: Ctx) {
  const { r, N, g, k } = c;
  const m = pick(r, [3, 4, 5, 6, 8]);
  const nc = Math.min(k, ri(r, 2, 5));
  const cols = shuffle(r, c.byLum).slice(0, nc);
  const motif = Array.from({ length: m * m }, () => cols[Math.floor(r() * nc)]);
  const mode = pick(r, ["repeat", "mirror", "rotate", "mirror"]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let mx = x % m, my = y % m;
    const tx = Math.floor(x / m), ty = Math.floor(y / m);
    if (mode === "mirror") { if (tx % 2) mx = m - 1 - mx; if (ty % 2) my = m - 1 - my; }
    if (mode === "rotate" && (tx + ty) % 2) [mx, my] = [my, mx];
    g[y * N + x] = motif[my * m + mx];
  }
}

/* ---------- 6. XE TĂNG ---------- */
function genTank(c: Ctx) {
  const { r, N, g, k } = c;
  g.fill(c.light);
  const groundY = Math.round(N * 0.72 + r() * N * 0.1);
  fillRect(c, 0, groundY, N - 1, N - 1, ci(c, k - 3));
  const trackH = Math.max(2, Math.round(N * 0.14));
  const ty1 = groundY - 1, ty0 = ty1 - trackH + 1;
  const tx0 = Math.round(N * 0.08 + r() * N * 0.06), tx1 = N - 1 - Math.round(N * 0.08 + r() * N * 0.06);
  fillRect(c, tx0, ty0, tx1, ty1, c.dark);
  const nw = ri(r, 3, 6), wr = Math.max(0.7, trackH / 2 - 0.6);
  for (let i = 0; i < nw; i++) fillEllipse(c, tx0 + 1.5 + ((tx1 - tx0 - 3) * i) / (nw - 1), (ty0 + ty1) / 2, wr, wr, ci(c, 3));
  const hullH = Math.max(2, Math.round(N * 0.12));
  const hy1 = ty0 - 1, hy0 = hy1 - hullH + 1;
  const hx0 = tx0 + ri(r, 0, 2), hx1 = tx1 - ri(r, 0, 2);
  const hull = ci(c, 2), hullTop = ci(c, 4);
  fillRect(c, hx0, hy0, hx1, hy1, hull);
  fillRect(c, hx0 + 1, hy0, hx1 - 1, hy0, hullTop);
  const tw = Math.round((hx1 - hx0) * (0.3 + r() * 0.15)), th = Math.max(2, Math.round(N * 0.1));
  const tcx = Math.round((hx0 + hx1) / 2 + (r() - 0.5) * N * 0.1);
  fillRect(c, tcx - tw / 2, hy0 - th, tcx + tw / 2, hy0 - 1, ci(c, 2));
  fillRect(c, tcx - tw / 2 + 1, hy0 - th, tcx + tw / 2 - 1, hy0 - th, hullTop);
  const dir = r() < 0.5 ? 1 : -1, by = hy0 - th + (th >> 1);
  const bx0 = dir > 0 ? tcx + tw / 2 : tcx - tw / 2;
  line(c, bx0, by, bx0 + dir * ri(r, N * 0.2 | 0, N * 0.4 | 0), by, c.dark, Math.max(1, Math.round(N / 30)));
  fillRect(c, tcx - 1, hy0 - th - 1, tcx + 1, hy0 - th - 1, c.dark);
  if (N >= 20) fillRect(c, hx0 + 2, hy0 + 1, hx0 + 3, hy0 + 2, ci(c, 5));
}

/* ---------- 7. MÁY BAY (nhìn từ trên) ---------- */
function genPlane(c: Ctx) {
  const { r, N, g, k } = c;
  const bg = ci(c, k - 1);
  g.fill(bg);
  if (r() < 0.5) for (let i = ri(r, 1, 3); i > 0; i--) { const rx = ri(r, 2, N / 5 | 0); fillEllipse(c, ri(r, 0, N - 1), ri(r, 0, N - 1), rx, Math.max(1, rx / 2.5), ci(c, k - 2)); }
  const cx = (N - 1) / 2, nose = Math.round(N * 0.06), tail = N - 1 - Math.round(N * 0.06);
  const fw = Math.max(1, Math.round(N * (0.05 + r() * 0.03)));
  const body = ci(c, 2), wing = ci(c, 3), dark = c.dark;
  const wy0 = Math.round(N * (0.3 + r() * 0.1)), wy1 = Math.round(N * (0.5 + r() * 0.1)), span = N * (0.35 + r() * 0.12);
  const swept = r() < 0.6;
  for (let y = wy0; y <= wy1; y++) {
    const t = (y - wy0) / Math.max(1, wy1 - wy0);
    const hw = fw + span * (swept ? t : 1 - Math.abs(t - 0.5) * 0.4);
    fillRect(c, cx - hw, y, cx + hw, y, wing);
  }
  const ty0 = tail - Math.round(N * 0.12);
  for (let y = ty0; y <= tail; y++) { const t = (y - ty0) / Math.max(1, tail - ty0); const hw = fw + N * 0.17 * t; fillRect(c, cx - hw, y, cx + hw, y, wing); }
  for (let y = nose; y <= tail; y++) {
    const t = Math.min(1, (y - nose) / (N * 0.15));
    const w = Math.max(0, fw * t);
    fillRect(c, cx - w, y, cx + w, y, body);
  }
  const cy = nose + Math.round(N * 0.16);
  fillRect(c, cx - Math.max(0, fw - 1), cy, cx + Math.max(0, fw - 1), cy + Math.max(1, N / 12 | 0), ci(c, k - 2));
  if (r() < 0.6) for (const s of [-1, 1]) fillRect(c, cx + s * span * 0.5 - 1, wy1 - 2, cx + s * span * 0.5, wy1 + 1, dark);
  if (k >= 4) outline(c, bg, dark);
}

/* ---------- 8. TÀU CHIẾN ---------- */
function genShip(c: Ctx) {
  const { r, N, g, k } = c;
  g.fill(ci(c, k - 1));
  const water = Math.round(N * (0.58 + r() * 0.1));
  for (let y = water; y < N; y++) for (let x = 0; x < N; x++) {
    const off = Math.round(Math.sin((x / N) * Math.PI * 4 + y) * 1.2);
    g[y * N + x] = ((y + off - water) >> 1) % 2 ? ci(c, 3) : ci(c, 2);
  }
  fillEllipse(c, ri(r, N * 0.1 | 0, N * 0.9 | 0), ri(r, 1, water * 0.4 | 0), Math.max(1.2, N * 0.07), Math.max(1.2, N * 0.07), ci(c, k - 2));
  const y0 = water - Math.round(N * 0.11), yb = water + Math.round(N * 0.07);
  const hull = c.dark;
  for (let y = y0; y <= yb; y++) { const t = (y - y0) / (yb - y0); const ins = t * N * 0.12; fillRect(c, N * 0.08 + ins, y, N * 0.92 - ins, y, hull); }
  fillRect(c, N * 0.1, y0, N * 0.9, y0, ci(c, 4));
  const cw = N * (0.22 + r() * 0.15), ch = Math.max(2, Math.round(N * 0.13)), cx0 = N * (0.3 + r() * 0.25);
  fillRect(c, cx0, y0 - ch, cx0 + cw, y0 - 1, ci(c, 2));
  fillRect(c, cx0 + cw * 0.25, y0 - ch - Math.max(1, ch * 0.6), cx0 + cw * 0.75, y0 - ch - 1, ci(c, 3));
  const chx = cx0 + cw * (r() < 0.5 ? 0.15 : 0.85);
  fillRect(c, chx, y0 - ch - Math.round(N * 0.16), chx + Math.max(1, N / 22 | 0), y0 - ch - 1, hull);
  for (let i = 1; i <= 3; i++) fillEllipse(c, chx - i * N * 0.05, y0 - ch - N * 0.16 - i * N * 0.06, Math.max(1, N * 0.03 * i), Math.max(1, N * 0.02 * i), ci(c, k - 2));
  const nwin = Math.max(2, Math.floor(cw / 3));
  for (let i = 0; i < nwin; i++) put(c, cx0 + 1 + i * 3, y0 - ch + Math.max(1, ch >> 1), ci(c, k - 1));
}

/* ---------- 9. MẠCH ĐIỆN ---------- */
function genCircuit(c: Ctx) {
  const { r, N, g, k } = c;
  const bg = r() < 0.6 ? c.dark : c.light;
  g.fill(bg);
  const n = ri(r, 5, 12);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const nodeCol = bg === c.dark ? c.light : c.dark;
  const th = N >= 30 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    let x = ri(r, 1, N - 2), y = ri(r, 1, N - 2);
    let col = ri(r, 0, k - 1); if (col === bg) col = (col + 1) % k;
    const segs = ri(r, 2, 5);
    const sx = x, sy = y;
    let d = pick(r, dirs);
    for (let s = 0; s < segs; s++) {
      const len = ri(r, Math.max(2, N / 6 | 0), Math.max(3, N / 2 | 0));
      const nx = Math.max(1, Math.min(N - 2, x + d[0] * len)), ny = Math.max(1, Math.min(N - 2, y + d[1] * len));
      line(c, x, y, nx, ny, col, th);
      x = nx; y = ny;
      d = d[0] !== 0 ? pick(r, [dirs[2], dirs[3]]) : pick(r, [dirs[0], dirs[1]]);
    }
    const ns = N >= 20 ? 1 : 0;
    fillRect(c, sx - ns, sy - ns, sx + ns, sy + ns, nodeCol);
    fillRect(c, x - ns, y - ns, x + ns, y + ns, nodeCol);
  }
}

/* ---------- 10. LÁ CỜ ---------- */
function genFlag(c: Ctx) {
  const { r, N, g, k } = c;
  const vertical = r() < 0.5, stripes = ri(r, 2, 5);
  const cols = shuffle(r, c.byLum);
  for (let i = 0; i < stripes; i++) {
    const a = Math.round((N * i) / stripes), b = Math.round((N * (i + 1)) / stripes) - 1;
    if (vertical) fillRect(c, a, 0, b, N - 1, cols[i % cols.length]); else fillRect(c, 0, a, N - 1, b, cols[i % cols.length]);
  }
  const emb = cols[stripes % cols.length], emb2 = cols[(stripes + 1) % cols.length];
  if (r() < 0.45) {
    fillRect(c, 0, 0, N * 0.45, N * 0.5, emb);
    const dots = ri(r, 3, 9), ds = N >= 24 ? 1 : 0;
    for (let i = 0; i < dots; i++) { const x = ri(r, 1, N * 0.42 | 0), y = ri(r, 1, N * 0.47 | 0); fillRect(c, x - ds, y - ds, x + ds, y + ds, emb2); }
  } else {
    const cx = (N - 1) / 2, R = N * (0.18 + r() * 0.1);
    const shape = pick(r, ["circle", "diamond", "star"]);
    const pts = ri(r, 4, 7);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - cx, dy = y - cx, h = Math.hypot(dx, dy);
      const inside = shape === "circle" ? h <= R : shape === "diamond" ? Math.abs(dx) + Math.abs(dy) <= R : h <= R * (0.55 + 0.45 * Math.cos(pts * Math.atan2(dy, dx)));
      if (inside) g[y * N + x] = emb;
    }
    if (r() < 0.6) fillEllipse(c, cx, cx, R * 0.45, R * 0.45, emb2);
  }
  void g; void k;
}

/* ---------- 11. BÔNG HOA ---------- */
function genFlower(c: Ctx) {
  const { r, N, g, k } = c;
  const bg = r() < 0.7 ? c.light : c.dark;
  g.fill(bg);
  const cx = (N - 1) / 2, cy = N * 0.42;
  const stem = ci(c, 2), leaf = ci(c, 3);
  line(c, cx, cy, cx, N - 1, stem, Math.max(1, Math.round(N / 22)));
  for (const s of [-1, 1]) fillEllipse(c, cx + s * N * 0.12, cy + N * (0.3 + r() * 0.15), N * 0.11, N * 0.05, leaf);
  const petals = ri(r, 4, 9), dist = N * (0.18 + r() * 0.08), pr = N * (0.1 + r() * 0.07);
  const p1 = ci(c, ri(r, 3, k - 1)), p2 = r() < 0.5 ? p1 : ci(c, ri(r, 3, k - 1));
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + r() * 0.1;
    fillEllipse(c, cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, pr, pr, i % 2 ? p2 : p1);
  }
  fillEllipse(c, cx, cy, N * 0.1, N * 0.1, ci(c, k - 2) === p1 ? c.dark : ci(c, k - 2));
  if (bg === c.light && k >= 5) outline(c, bg, c.dark);
}

export function generateArt(seed: number, N: number, maxColors: number, kind: GenKind): PixelArtData {
  // thử tối đa 4 lần với seed khác nhau để chắc chắn tranh có ≥3 màu và không bị 1 màu chiếm >92%
  for (let attempt = 0; attempt < 4; attempt++) {
    const art = generateOnce((seed + attempt * 0x9e3779b9) >>> 0, N, maxColors, attempt === 3 ? "mandala" : kind);
    const counts = new Array(art.palette.length).fill(0);
    for (const v of art.grid) counts[v]++;
    const maxShare = Math.max(...counts) / art.grid.length;
    if (art.palette.length >= 3 && maxShare < 0.92) return art;
  }
  return generateOnce(seed, N, maxColors, "pattern");
}

function generateOnce(seed: number, N: number, maxColors: number, kind: GenKind): PixelArtData {
  const r = mulberry32(seed);
  const { c, cols } = makeCtx(r, N, maxColors);
  switch (kind) {
    case "creature": genCreature(c, false); break;
    case "robot": genCreature(c, true); break;
    case "mandala": genMandala(c); break;
    case "landscape": genLandscape(c); break;
    case "emblem": genEmblem(c); break;
    case "pattern": genPattern(c); break;
    case "tank": genTank(c); break;
    case "plane": genPlane(c); break;
    case "ship": genShip(c); break;
    case "circuit": genCircuit(c); break;
    case "flag": genFlag(c); break;
    case "flower": genFlower(c); break;
  }
  return buildArt(N, c.g, cols, maxColors);
}
