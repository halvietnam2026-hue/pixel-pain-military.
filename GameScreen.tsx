import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Lightbulb, ZoomIn, ZoomOut, Hand, Brush, Star, ChevronRight, Map as MapIcon } from "lucide-react";
import { artToDataURL, type PixelArtData } from "../lib/pixelEngine";
import { CoinBar, SettingsButton, Coin, Modal } from "./ui";
import { HINT_COST, PERFECT_BONUS, loadLevelArt, type Level } from "./levels";
import { sfx } from "./sound";
import { tr } from "./i18n";
import { loadProgress, saveProgress, clearProgress, type Settings } from "./store";

interface Props {
  level: Level;
  levelIndex: number;
  totalLevels: number;
  coins: number;
  coinBump: number;
  settings: Settings;
  onComplete: (reward: number) => void;
  onSpend: (n: number) => boolean;
  onNext: () => void;
  onHome: () => void;
  onLevels: () => void;
  onSettings: () => void;
}

const MIN_Z = 1;
const MAX_Z = 4;
const clampZ = (z: number) => Math.max(MIN_Z, Math.min(MAX_Z, z));

export default function GameScreen(props: Props) {
  const { level, levelIndex, totalLevels, coins, coinBump, settings, onComplete, onSpend, onNext, onHome, onLevels, onSettings } = props;
  const isLast = levelIndex >= totalLevels - 1;
  const lang = settings.lang;
  const t = (k: string, p?: Record<string, string | number>) => tr(lang, k, p);
  const levelName = t(level.nameKey);

  const [art, setArt] = useState<PixelArtData | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState(0);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [hintIdx, setHintIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<"brush" | "hand">("brush");
  const [box, setBox] = useState({ w: 300, h: 300 });
  const [completed, setCompleted] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [reward, setReward] = useState(0);
  const [stars, setStars] = useState(3);
  const [countdown, setCountdown] = useState(4);
  const [toast, setToast] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const paintedRef = useRef<Uint8Array>(new Uint8Array(0));
  const remainingRef = useRef<number[]>([]);
  const totalsRef = useRef<number[]>([]);
  const doneRef = useRef(0);
  const mistakesRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const saveTimer = useRef<number | null>(null);
  const selectedRef = useRef(0);
  selectedRef.current = selected;

  /* ---------- tải level ---------- */
  useEffect(() => {
    let cancel = false;
    setArt(null); setError(false);
    (async () => {
      try {
        const a = await loadLevelArt(level);
        if (cancel) return;
        const total = a.size * a.size;
        const painted = loadProgress(level.id, total);
        const totals = new Array(a.palette.length).fill(0);
        const remaining = new Array(a.palette.length).fill(0);
        let done = 0;
        a.grid.forEach((g, i) => {
          totals[g]++;
          if (painted[i]) done++; else remaining[g]++;
        });
        paintedRef.current = painted;
        totalsRef.current = totals;
        remainingRef.current = remaining;
        doneRef.current = done;
        mistakesRef.current = 0;
        const first = remaining.findIndex((r) => r > 0);
        setSelected(first >= 0 ? first : 0);
        setArt(a);
        setTick((t) => t + 1);
      } catch {
        if (!cancel) setError(true);
      }
    })();
    return () => { cancel = true; };
  }, [level]);

  /* ---------- kích thước bảng ---------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  const boardSize = Math.max(120, Math.floor(Math.min(box.w, box.h) - 16));
  const cssSize = Math.round(boardSize * zoom);

  /* ---------- zoom giữ tâm ---------- */
  const setZoomKeep = useCallback((z: number) => {
    const el = scrollRef.current;
    if (el) {
      centerRef.current = {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      };
    }
    setZoom(clampZ(z));
  }, []);
  useLayoutEffect(() => {
    const el = scrollRef.current, c = centerRef.current;
    if (el && c) {
      el.scrollLeft = c.x * el.scrollWidth - el.clientWidth / 2;
      el.scrollTop = c.y * el.scrollHeight - el.clientHeight / 2;
      centerRef.current = null;
    }
  }, [zoom]);
  useEffect(() => { if (zoom <= 1.01) setTool("brush"); }, [zoom]);

  /* ---------- vẽ canvas ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !art) return;
    const N = art.size;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.min(2600, Math.round(cssSize * dpr));
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    const ctx = canvas.getContext("2d")!;
    const cell = px / N;
    const painted = paintedRef.current;
    const cssCell = cssSize / N;
    const showNums = cssCell >= 8.5;

    ctx.fillStyle = "#f4f2ea";
    ctx.fillRect(0, 0, px, px);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.round(cell * 0.66)}px "VT323", monospace`;

    for (let i = 0; i < N * N; i++) {
      const r = (i / N) | 0, c = i % N;
      const x = Math.floor(c * cell), y = Math.floor(r * cell);
      const w = Math.floor((c + 1) * cell) - x, h = Math.floor((r + 1) * cell) - y;
      const p = art.grid[i];
      const col = art.palette[p];
      if (painted[i]) {
        ctx.fillStyle = col.hex;
        ctx.fillRect(x, y, w, h);
        continue;
      }
      const isSel = p === selected && settings.highlight && !completed;
      if (isSel) {
        ctx.fillStyle = "#b7bd9c";
      } else {
        // xám theo độ sáng của màu thật → nhìn ra hình mờ như game thật
        const g = Math.round(214 + (col.lum / 255) * 36);
        ctx.fillStyle = `rgb(${g},${g},${g - 4})`;
      }
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(46,50,25,0.16)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      if (showNums) {
        ctx.fillStyle = isSel ? "#1f2412" : "#7c806c";
        ctx.fillText(String(p + 1), x + w / 2, y + h / 2 + cell * 0.04);
      }
    }

    if (hintIdx !== null && !painted[hintIdx]) {
      const r = (hintIdx / N) | 0, c = hintIdx % N;
      ctx.fillStyle = "rgba(250,204,21,0.45)";
      ctx.fillRect(c * cell, r * cell, cell, cell);
      ctx.strokeStyle = "#e2a500";
      ctx.lineWidth = Math.max(2, cell * 0.14);
      ctx.strokeRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
    }
    if (wrongIdx !== null && !painted[wrongIdx]) {
      const r = (wrongIdx / N) | 0, c = wrongIdx % N;
      ctx.fillStyle = "rgba(220,38,38,0.7)";
      ctx.fillRect(c * cell, r * cell, cell, cell);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.round(cell * 0.7)}px sans-serif`;
      ctx.fillText("✕", c * cell + cell / 2, r * cell + cell / 2);
    }
  }, [art, tick, selected, cssSize, wrongIdx, hintIdx, settings.highlight, completed]);

  useEffect(() => {
    if (wrongIdx === null) return;
    const t = setTimeout(() => setWrongIdx(null), 450);
    return () => clearTimeout(t);
  }, [wrongIdx]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- hoàn thành ---------- */
  const finishLevel = useCallback(() => {
    setCompleted(true);
    clearProgress(level.id);
    const perfect = mistakesRef.current === 0;
    const rw = level.reward + (perfect ? PERFECT_BONUS : 0);
    setReward(rw);
    setStars(perfect ? 3 : mistakesRef.current <= 3 ? 2 : 1);
    sfx.win();
    onComplete(rw);
    setTimeout(() => { setShowWin(true); sfx.coin(); }, 900);
  }, [level, onComplete]);

  /* ---------- tô 1 ô ---------- */
  const tryPaint = useCallback((idx: number | null, isTap: boolean) => {
    if (idx === null || !art || completed) return;
    const painted = paintedRef.current;
    if (painted[idx]) return;
    const sel = selectedRef.current;
    const need = art.grid[idx];
    if (need === sel) {
      painted[idx] = 1;
      remainingRef.current[sel]--;
      doneRef.current++;
      setHintIdx((h) => (h === idx ? null : h));
      sfx.pop();
      setTick((t) => t + 1);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => saveProgress(level.id, paintedRef.current), 300);

      if (doneRef.current >= painted.length) {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        finishLevel();
        return;
      }
      if (remainingRef.current[sel] === 0) {
        sfx.colorDone();
        const rem = remainingRef.current;
        let next = rem.findIndex((r, i) => i > sel && r > 0);
        if (next < 0) next = rem.findIndex((r) => r > 0);
        if (next >= 0) setSelected(next);
      }
    } else if (isTap) {
      mistakesRef.current++;
      setWrongIdx(idx);
      setShakeKey((k) => k + 1);
      sfx.error();
    }
  }, [art, completed, level.id, finishLevel]);

  /* ---------- cảm ứng: tô / kéo / chụm 2 ngón để zoom ---------- */
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ painting: false, pinchDist: 0, pinchZoom: 1, midX: 0, midY: 0, lastX: 0, lastY: 0 });

  const cellAt = (clientX: number, clientY: number) => {
    const c = canvasRef.current;
    if (!c || !art) return null;
    const rect = c.getBoundingClientRect();
    const cx = Math.floor(((clientX - rect.left) / rect.width) * art.size);
    const cy = Math.floor(((clientY - rect.top) / rect.height) * art.size);
    if (cx < 0 || cy < 0 || cx >= art.size || cy >= art.size) return null;
    return cy * art.size + cx;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      g.painting = false;
      g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      g.pinchZoom = zoom;
      g.midX = (a.x + b.x) / 2; g.midY = (a.y + b.y) / 2;
      return;
    }
    g.lastX = e.clientX; g.lastY = e.clientY;
    if (tool === "brush") {
      g.painting = true;
      tryPaint(cellAt(e.clientX, e.clientY), true);
    } else {
      g.painting = false;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const el = scrollRef.current;
    if (ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.pinchDist > 0) {
        const nz = clampZ(g.pinchZoom * (d / g.pinchDist));
        if (Math.abs(nz - zoom) > 0.02) setZoomKeep(nz);
      }
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (el) { el.scrollLeft -= mx - g.midX; el.scrollTop -= my - g.midY; }
      g.midX = mx; g.midY = my;
      return;
    }
    if (g.painting) {
      tryPaint(cellAt(e.clientX, e.clientY), false);
    } else if (el) {
      el.scrollLeft -= e.clientX - g.lastX;
      el.scrollTop -= e.clientY - g.lastY;
    }
    g.lastX = e.clientX; g.lastY = e.clientY;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) gesture.current.painting = false;
    if (ptrs.current.size === 1) {
      const [p] = [...ptrs.current.values()];
      gesture.current.lastX = p.x; gesture.current.lastY = p.y;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    // PC: lăn chuột để zoom (khi đã zoom thì giữ Ctrl để zoom, lăn thường để cuộn)
    if (e.ctrlKey || zoom <= 1.01) {
      setZoomKeep(zoom * (e.deltaY < 0 ? 1.15 : 0.87));
    }
  };

  /* ---------- gợi ý ---------- */
  const giveHint = () => {
    if (!art || completed) return;
    const painted = paintedRef.current;
    let idx = art.grid.findIndex((g, i) => g === selected && !painted[i]);
    if (idx < 0) idx = art.grid.findIndex((_, i) => !painted[i]);
    if (idx < 0) return;
    if (!onSpend(HINT_COST)) { setToast(t("needCoins", { n: HINT_COST })); sfx.error(); return; }
    sfx.click();
    setSelected(art.grid[idx]);
    setHintIdx(idx);
    // cuộn tới ô gợi ý
    const targetZoom = art.size >= 24 && zoom < 2 ? 2.2 : zoom;
    setZoom(targetZoom);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = scrollRef.current, c = canvasRef.current;
      if (!el || !c) return;
      const cssCell = c.clientWidth / art.size;
      const r = (idx / art.size) | 0, col = idx % art.size;
      el.scrollTo({
        left: c.offsetLeft + col * cssCell - el.clientWidth / 2,
        top: c.offsetTop + r * cssCell - el.clientHeight / 2,
        behavior: "smooth",
      });
    }));
  };

  /* ---------- đếm ngược tự chuyển level ---------- */
  useEffect(() => {
    if (!showWin || isLast || !settings.autoNext) return;
    setCountdown(4);
    const iv = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(iv);
  }, [showWin, isLast, settings.autoNext]);
  useEffect(() => {
    if (showWin && !isLast && settings.autoNext && countdown <= 0) onNext();
  }, [countdown, showWin, isLast, settings.autoNext, onNext]);

  // cuộn bảng màu tới màu đang chọn
  useEffect(() => {
    const el = paletteRef.current?.querySelector<HTMLElement>(`[data-i="${selected}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selected]);

  const total = art ? art.size * art.size : 1;
  const progress = Math.floor((doneRef.current / total) * 100);
  const remaining = useMemo(() => [...remainingRef.current], [tick, art]); // eslint-disable-line react-hooks/exhaustive-deps
  const winImg = useMemo(() => (art && showWin ? artToDataURL(art, 320) : ""), [art, showWin]);

  return (
    <div className="camo-bg absolute inset-0 flex flex-col">
      {/* HUD trên */}
      <div className="relative z-10 border-b-4 border-[#14170b] bg-[#2b3019] px-2.5 pb-2 pt-[max(10px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { sfx.click(); onHome(); }} aria-label="Menu" className="btn-dark grid h-11 w-11 shrink-0 place-items-center">
            <Home size={20} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="font-pixel text-base font-bold leading-none text-[#e2cf96]">{t("level")} {level.id}</div>
            <div className="mt-0.5 truncate font-num text-lg leading-none text-[#c7c2a3]">{levelName}</div>
          </div>
          <CoinBar coins={coins} bump={coinBump} />
          <SettingsButton onClick={onSettings} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative h-4 flex-1 overflow-hidden rounded-sm border-2 border-[#14170b] bg-[#1a1d10]">
            <motion.div className="h-full bg-gradient-to-r from-[#8d9a5a] to-[#e2cf96]" animate={{ width: `${progress}%` }} transition={{ duration: 0.2 }} />
            <div className="absolute inset-0 flex">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="flex-1 border-r border-black/25" />)}
            </div>
          </div>
          <div className="w-11 text-right font-pixel text-xs font-bold text-[#e2cf96]">{progress}%</div>
        </div>
      </div>

      {/* BẢNG TÔ */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={scrollRef}
          className={`no-scrollbar absolute inset-0 overflow-auto ${tool === "hand" ? "cursor-grab" : "cursor-crosshair"}`}
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          onWheel={onWheel}>
          <div style={{ width: "max-content", minWidth: "100%", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
            <div key={shakeKey} className={wrongIdx !== null ? "shake" : ""}>
              <canvas ref={canvasRef}
                className="block rounded-sm border-4 border-[#14170b] shadow-[0_10px_0_rgba(0,0,0,0.35)]"
                style={{ width: cssSize, height: cssSize, imageRendering: "pixelated", visibility: art ? "visible" : "hidden" }} />
            </div>
          </div>
        </div>

        {!art && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="panel-military px-6 py-5 text-center">
              {error ? (
                <>
                  <div className="font-pixel text-sm font-bold">{t("loadError")}</div>
                  <div className="font-num text-lg">{level.src}</div>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-md border-4 border-[#2e3219] border-t-transparent" />
                  <div className="font-pixel text-sm font-bold">{t("loading")}</div>
                  <div className="font-num text-lg">{t("level")} {level.id} · {level.grid}×{level.grid}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* công cụ nổi */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-end justify-between px-2.5">
          <button onClick={giveHint} disabled={!art || completed}
            className="btn-sand pointer-events-auto flex items-center gap-1.5 px-3 py-1.5">
            <Lightbulb size={18} strokeWidth={2.5} />
            <span className="flex items-center gap-1 font-pixel text-xs font-bold">{HINT_COST}<Coin size={16} /></span>
          </button>
          <div className="pointer-events-auto flex items-center gap-1.5">
            {zoom > 1.01 && (
              <button onClick={() => { sfx.click(); setTool(tool === "brush" ? "hand" : "brush"); }}
                className={`${tool === "hand" ? "btn-sand" : "btn-dark"} grid h-10 w-10 place-items-center`} aria-label="Đổi công cụ">
                {tool === "hand" ? <Hand size={18} strokeWidth={2.5} /> : <Brush size={18} strokeWidth={2.5} />}
              </button>
            )}
            <button onClick={() => { sfx.click(); setZoomKeep(zoom / 1.4); }} disabled={zoom <= MIN_Z} className="btn-dark grid h-10 w-10 place-items-center" aria-label="Thu nhỏ"><ZoomOut size={18} strokeWidth={2.5} /></button>
            <button onClick={() => { sfx.click(); setZoomKeep(zoom * 1.4); }} disabled={zoom >= MAX_Z} className="btn-dark grid h-10 w-10 place-items-center" aria-label="Phóng to"><ZoomIn size={18} strokeWidth={2.5} /></button>
          </div>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border-[3px] border-[#3d130b] bg-[#b23b25] px-3 py-1.5 font-pixel text-xs font-bold text-white">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BẢNG MÀU */}
      <div className="relative z-10 border-t-4 border-[#14170b] bg-[#2b3019] pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
        <div ref={paletteRef} className="no-scrollbar flex gap-2.5 overflow-x-auto px-3 py-1.5">
          {art?.palette.map((c, i) => {
            const tot = totalsRef.current[i] || 1;
            const rem = remaining[i] ?? 0;
            const pct = ((tot - rem) / tot) * 100;
            const done = rem === 0;
            const active = selected === i;
            const light = c.lum > 150;
            return (
              <button key={i} data-i={i}
                onClick={() => { if (!done) { sfx.click(); setSelected(i); setHintIdx(null); } }}
                className={`relative shrink-0 transition-transform ${active ? "-translate-y-1 scale-110" : ""}`}
                style={{ width: 54, height: 54 }}>
                <div className="absolute inset-0 rounded-full"
                  style={{ background: `conic-gradient(#e2cf96 ${pct}%, #14170b ${pct}%)` }} />
                <div className={`absolute inset-[4px] grid place-items-center rounded-full border-2 ${active ? "border-white" : "border-[#14170b]"}`}
                  style={{ background: c.hex, opacity: done ? 0.4 : 1 }}>
                  <span className="font-num text-[28px] font-bold leading-none"
                    style={{ color: light ? "#1f2412" : "#fff", textShadow: light ? "none" : "0 2px 0 rgba(0,0,0,0.5)" }}>
                    {done ? "✓" : i + 1}
                  </span>
                </div>
                {active && <div className="absolute -bottom-2 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-[#e2cf96]" />}
              </button>
            );
          })}
        </div>
        <div className="px-3 text-center font-num text-base leading-tight text-[#c7c2a3]">
          {art ? (remaining[selected] ? t("colorRemain", { n: selected + 1, m: remaining[selected] }) : t("pickColor")) : "..."}
        </div>
      </div>

      {/* MÀN HOÀN THÀNH */}
      <Modal open={showWin}>
        <div className="panel-military relative overflow-hidden p-4 text-center">
          <div className="-mx-4 -mt-4 mb-3 border-b-4 border-[#2e3219] bg-[#56622f] py-3">
            <div className="font-pixel text-xl font-bold text-[#f2ead3]">{isLast ? t("allDoneTitle") : t("missionComplete")}</div>
            <div className="font-num text-lg leading-none text-[#e2cf96]">{t("level")} {level.id} · {levelName}</div>
          </div>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((s) => (
              <motion.div key={s} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + s * 0.2, type: "spring" }}>
                <Star size={s === 1 ? 44 : 34} strokeWidth={2.5}
                  className={s < stars ? "text-[#c98d12]" : "text-[#9b9477]"} fill={s < stars ? "#f5c542" : "#c9c1a0"} />
              </motion.div>
            ))}
          </div>
          {winImg && (
            <motion.img src={winImg} alt="thành quả" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
              className="mx-auto mt-2 aspect-square w-40 rounded-sm border-4 border-[#2e3219]" style={{ imageRendering: "pixelated" }} />
          )}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
            className="mx-auto mt-3 flex w-max items-center gap-2 rounded-full border-[3px] border-[#2e3219] bg-[#2b3019] px-4 py-1.5">
            <Coin size={26} />
            <span className="font-pixel text-xl font-bold text-yellow-300">+{reward}</span>
          </motion.div>
          {reward > level.reward && (
            <div className="mt-1 font-num text-lg leading-none text-[#56622f]">{t("perfectBonus", { n: PERFECT_BONUS })}</div>
          )}

          <div className="mt-4 grid gap-2">
            {!isLast ? (
              <button onClick={() => { sfx.click(); onNext(); }} className="btn-sand flex items-center justify-center gap-1 py-2.5">
                <span className="font-pixel text-base font-bold">{t("level")} {level.id + 1}</span>
                <ChevronRight size={20} strokeWidth={3} />
                {settings.autoNext && <span className="font-num text-lg">({Math.max(0, countdown)}s)</span>}
              </button>
            ) : (
              <div className="rounded-md bg-[#f6ecca] p-2 font-num text-lg leading-tight">{t("finishedAll")}</div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { sfx.click(); onHome(); }} className="btn-olive flex items-center justify-center gap-1.5 py-2 font-pixel text-xs font-bold"><Home size={14} /> {t("menu")}</button>
              <button onClick={() => { sfx.click(); onLevels(); }} className="btn-olive flex items-center justify-center gap-1.5 py-2 font-pixel text-xs font-bold"><MapIcon size={14} /> {t("chooseLevel")}</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
