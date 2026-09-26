import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

export interface Settings {
  sound: boolean;
  vibrate: boolean;
  autoNext: boolean;
  highlight: boolean;
  music: boolean;
  lang: Lang;
}

export interface SaveData {
  coins: number;
  unlocked: number; // index level cao nhất đã mở (0-based)
  completed: number[]; // id level đã hoàn thành
  current: number; // index level sẽ chơi khi bấm PLAY
  settings: Settings;
}

const KEY = "ppm_save_v1";

export const DEFAULT_SAVE: SaveData = {
  coins: 100,
  unlocked: 0,
  completed: [],
  current: 0,
  settings: { sound: true, vibrate: true, autoNext: true, highlight: true, music: true, lang: "en" },
};

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SAVE;
    const p = JSON.parse(raw);
    return { ...DEFAULT_SAVE, ...p, settings: { ...DEFAULT_SAVE.settings, ...(p.settings || {}) } };
  } catch {
    return DEFAULT_SAVE;
  }
}

export function useSave() {
  const [save, setSave] = useState<SaveData>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* ignore */ }
  }, [save]);
  return [save, setSave] as const;
}

/* ---- tiến độ tô dở của từng level ---- */
const progKey = (id: number) => `ppm_prog_${id}`;

export function loadProgress(id: number, total: number): Uint8Array {
  const arr = new Uint8Array(total);
  try {
    const s = localStorage.getItem(progKey(id));
    if (s && s.length === total) for (let i = 0; i < total; i++) arr[i] = s.charCodeAt(i) === 49 ? 1 : 0;
  } catch { /* ignore */ }
  return arr;
}

export function saveProgress(id: number, arr: Uint8Array) {
  try {
    let s = "";
    for (let i = 0; i < arr.length; i++) s += arr[i] ? "1" : "0";
    localStorage.setItem(progKey(id), s);
  } catch { /* ignore */ }
}

export function clearProgress(id: number) {
  try { localStorage.removeItem(progKey(id)); } catch { /* ignore */ }
}

export function clearAllProgress() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("ppm_")).forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
