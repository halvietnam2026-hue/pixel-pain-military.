import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Lock, Star, Crosshair } from "lucide-react";
import { CoinBar, SettingsButton } from "./ui";
import { getLevel, getArtCached, TOTAL_LEVELS, type Level } from "./levels";
import { sfx } from "./sound";
import { tr } from "./i18n";
import type { SaveData } from "./store";

const PAGE = 24;
type CellState = "locked" | "open" | "done";

function Thumb({ level, state }: { level: Level; state: CellState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (level.src || !ref.current) return;
    const art = getArtCached(level);
    const c = ref.current, S = 96;
    c.width = S; c.height = S;
    const ctx = c.getContext("2d")!;
    const cell = S / art.size;
    for (let i = 0; i < art.grid.length; i++) {
      const col = art.palette[art.grid[i]];
      if (state === "done") ctx.fillStyle = col.hex;
      else if (state === "open") { const g = Math.round(195 + (col.lum / 255) * 55); ctx.fillStyle = `rgb(${g},${g},${g - 6})`; }
      else { const g = Math.round(55 + (col.lum / 255) * 35); ctx.fillStyle = `rgb(${g},${g},${g})`; }
      const r = (i / art.size) | 0, x = i % art.size;
      ctx.fillRect(Math.floor(x * cell), Math.floor(r * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }, [level, state]);

  if (level.src) {
    return <img src={level.src} alt="" className="h-full w-full object-cover" style={{
      imageRendering: "pixelated",
      filter: state === "done" ? "none" : state === "open" ? "grayscale(1) contrast(0.6) brightness(1.3)" : "grayscale(1) blur(4px) brightness(0.5)",
    }} />;
  }
  return <canvas ref={ref} className="h-full w-full" style={{ imageRendering: "pixelated" }} />;
}

interface Props {
  save: SaveData;
  onBack: () => void;
  onPick: (index: number) => void;
  onSettings: () => void;
}

export default function LevelSelect({ save, onBack, onPick, onSettings }: Props) {
  const lang = save.settings.lang;
  const pages = Math.ceil(TOTAL_LEVELS / PAGE);
  const [page, setPage] = useState(Math.floor(save.current / PAGE));
  const [goto, setGoto] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const completed = new Set(save.completed);

  const go = (p: number) => { setPage(Math.max(0, Math.min(pages - 1, p))); listRef.current?.scrollTo({ top: 0 }); };
  const jump = () => {
    const n = parseInt(goto, 10);
    if (!n || n < 1 || n > TOTAL_LEVELS) return;
    sfx.click(); go(Math.floor((n - 1) / PAGE)); setGoto("");
  };

  return (
    <div className="camo-bg absolute inset-0 flex flex-col">
      <div className="flex items-center justify-between gap-2 bg-[#1e2212]/90 p-3 pt-[max(12px,env(safe-area-inset-top))]">
        <button onClick={() => { sfx.click(); onBack(); }} className="btn-dark grid h-11 w-11 place-items-center"><ArrowLeft size={22} strokeWidth={2.5} /></button>
        <div className="font-pixel text-base font-bold text-[#e2cf96]">{tr(lang, "chooseLevel")}</div>
        <div className="flex items-center gap-2">
          <CoinBar coins={save.coins} />
          <SettingsButton onClick={onSettings} />
        </div>
      </div>

      {/* thanh phân trang */}
      <div className="flex items-center gap-2 border-b-4 border-[#14170b] bg-[#2b3019] px-3 py-2">
        <button onClick={() => { sfx.click(); go(page - 1); }} disabled={page === 0} className="btn-dark grid h-9 w-9 place-items-center"><ChevronLeft size={18} strokeWidth={3} /></button>
        <div className="flex-1 text-center font-pixel text-xs font-bold text-[#e2cf96]">{tr(lang, "page", { a: page + 1, b: pages })}</div>
        <button onClick={() => { sfx.click(); go(page + 1); }} disabled={page >= pages - 1} className="btn-dark grid h-9 w-9 place-items-center"><ChevronRight size={18} strokeWidth={3} /></button>
        <button onClick={() => { sfx.click(); go(Math.floor(save.current / PAGE)); }} title={tr(lang, "current")} className="btn-olive grid h-9 w-9 place-items-center"><Crosshair size={17} strokeWidth={2.5} /></button>
      </div>
      <div className="flex items-center gap-2 bg-[#1e2212]/80 px-3 py-2">
        <input value={goto} onChange={(e) => setGoto(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && jump()}
          inputMode="numeric" placeholder={`${tr(lang, "goTo")} 1–${TOTAL_LEVELS}`}
          className="h-9 flex-1 rounded-md border-[3px] border-[#14170b] bg-[#f6ecca] px-3 font-pixel text-xs font-bold text-[#3e4322] outline-none placeholder:text-[#8b8a6e]" />
        <button onClick={jump} className="btn-sand h-9 px-4 font-pixel text-xs font-bold">{tr(lang, "jump")}</button>
      </div>

      <div ref={listRef} className="no-scrollbar flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: Math.min(PAGE, TOTAL_LEVELS - page * PAGE) }, (_, j) => {
            const i = page * PAGE + j;
            const lv = getLevel(i);
            const locked = i > save.unlocked;
            const done = completed.has(lv.id);
            const state: CellState = done ? "done" : locked ? "locked" : "open";
            const isCurrent = i === save.current;
            return (
              <button key={lv.id} disabled={locked}
                onClick={() => { sfx.click(); onPick(i); }}
                className={`panel-military relative overflow-hidden p-1.5 text-left disabled:cursor-not-allowed ${isCurrent ? "ring-4 ring-yellow-300" : ""}`}>
                <div className="relative aspect-square overflow-hidden rounded-md border-[3px] border-[#2e3219] bg-[#f3f1ea]">
                  <Thumb level={lv} state={state} />
                  {locked && (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="grid h-9 w-9 place-items-center rounded-lg border-[3px] border-[#1d2410] bg-[#3a3f26] text-[#e2cf96]"><Lock size={18} /></div>
                    </div>
                  )}
                  {done && (
                    <div className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-[#2e3219] text-yellow-300">
                      <Star size={12} fill="currentColor" />
                    </div>
                  )}
                  <div className="absolute left-1 top-1 rounded bg-[#2e3219] px-1 py-0.5 font-pixel text-[9px] font-bold text-[#e2cf96]">{lv.id}</div>
                </div>
                <div className="mt-1 truncate font-pixel text-[9px] font-bold">{tr(lang, lv.nameKey)}</div>
                <div className="flex items-center justify-between font-num text-sm leading-none text-[#5f6440]">
                  <span>{lv.grid}×{lv.grid}</span>
                  <span className="font-bold text-[#8a6410]">+{lv.reward}$</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center font-num text-lg text-[#f2ead3]/70">{tr(lang, "unlockHint")}</p>
      </div>
    </div>
  );
}
