import { imageToPixelArt, loadImage, type PixelArtData } from "../lib/pixelEngine";
import { generateArt, mulberry32, KINDS, type GenKind } from "./procgen";

/**
 * 5 màn đầu: ảnh vẽ tay (public/levels/).
 * Từ màn 6 → TOTAL_LEVELS: bản đồ sinh tự động, mỗi seed = 1 bức tranh khác nhau.
 */
export const TOTAL_LEVELS = 12000;
export const PERFECT_BONUS = 20;
export const HINT_COST = 15;

export interface Level {
  id: number;      // 1-based
  index: number;   // 0-based
  nameKey: string; // key i18n
  src?: string;    // ảnh vẽ tay (nếu có)
  kind?: GenKind;  // kiểu sinh tự động
  grid: number;
  colors: number;
  reward: number;
  seed: number;
}

const HANDMADE: Omit<Level, "index" | "id">[] = [
  { nameKey: "lv_helmet", src: "/levels/level1.jpg", grid: 16, colors: 6, reward: 50, seed: 101 },
  { nameKey: "lv_grenade", src: "/levels/level2.jpg", grid: 20, colors: 7, reward: 60, seed: 202 },
  { nameKey: "lv_tank", src: "/levels/level3.jpg", grid: 24, colors: 8, reward: 80, seed: 303 },
  { nameKey: "lv_heli", src: "/levels/level4.jpg", grid: 28, colors: 9, reward: 100, seed: 404 },
  { nameKey: "lv_jet", src: "/levels/level5.jpg", grid: 32, colors: 10, reward: 120, seed: 505 },
];

const KIND_NAME: Record<GenKind, string> = {
  creature: "lv_creature", robot: "lv_robot", mandala: "lv_mandala", landscape: "lv_landscape",
  emblem: "lv_emblem", pattern: "lv_pattern", tank: "lv_tank", plane: "lv_plane",
  ship: "lv_ship", circuit: "lv_circuit", flag: "lv_flag", flower: "lv_flower",
};
const SIZES = [16, 20, 24, 28, 32, 36, 40];

const levelCache = new Map<number, Level>();
export function getLevel(index: number): Level {
  index = Math.max(0, Math.min(TOTAL_LEVELS - 1, index));
  const hit = levelCache.get(index);
  if (hit) return hit;
  let lv: Level;
  if (index < HANDMADE.length) {
    lv = { ...HANDMADE[index], index, id: index + 1 };
  } else {
    const id = index + 1;
    const seed = (Math.imul(id, 2654435761) ^ 0x9e3779b9) >>> 0;
    const r = mulberry32(seed);
    const tier = Math.min(1, (index - HANDMADE.length) / 300);
    const maxI = Math.round(tier * (SIZES.length - 1));
    const grid = SIZES[Math.max(0, maxI - 2) + Math.floor(r() * (Math.min(2, maxI) + 1))];
    const colors = Math.max(4, Math.min(14, 5 + Math.round(tier * 3) + Math.floor(r() * (3 + tier * 5))));
    const kind = KINDS[Math.floor(r() * KINDS.length)];
    lv = { id, index, nameKey: KIND_NAME[kind], kind, grid, colors, reward: 40 + grid * 2 + colors * 3, seed };
  }
  if (levelCache.size > 2000) levelCache.clear();
  levelCache.set(index, lv);
  return lv;
}

/* cache tranh đã sinh (cho thumbnail + màn chơi) */
const artCache = new Map<number, PixelArtData>();
export function getArtCached(level: Level): PixelArtData {
  const hit = artCache.get(level.index);
  if (hit) return hit;
  const art = generateArt(level.seed ^ 0x5bd1e995, level.grid, level.colors, level.kind ?? "creature");
  if (artCache.size > 400) artCache.clear();
  artCache.set(level.index, art);
  return art;
}

export async function loadLevelArt(level: Level): Promise<PixelArtData> {
  if (level.src) {
    const img = await loadImage(level.src);
    return imageToPixelArt(img, level.grid, level.colors, level.seed);
  }
  return getArtCached(level);
}
