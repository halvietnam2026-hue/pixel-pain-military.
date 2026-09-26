import { motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { CoinBar, SettingsButton } from "./ui";
import { getLevel, TOTAL_LEVELS } from "./levels";
import { sfx } from "./sound";
import { tr } from "./i18n";
import type { SaveData } from "./store";

interface Props {
  save: SaveData;
  onPlay: () => void;
  onLevels: () => void;
  onSettings: () => void;
}

export default function MenuScreen({ save, onPlay, onLevels, onSettings }: Props) {
  const lang = save.settings.lang;
  const lv = getLevel(save.current);
  const allDone = save.completed.length >= TOTAL_LEVELS;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/ui/menu-bg.jpg)", imageRendering: "pixelated" }}
        initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />

      {[
        { l: "9%", t: "40%", d: "0s" }, { l: "88%", t: "60%", d: "0.8s" },
        { l: "72%", t: "30%", d: "1.4s" }, { l: "20%", t: "72%", d: "0.4s" },
      ].map((s, i) => (
        <span key={i} className="twinkle absolute font-pixel text-3xl text-[#f6ecca]" style={{ left: s.l, top: s.t, animationDelay: s.d }}>+</span>
      ))}

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3 pt-[max(12px,env(safe-area-inset-top))]">
        <CoinBar coins={save.coins} />
        <SettingsButton onClick={onSettings} />
      </div>

      <motion.div className="absolute inset-x-0 top-[11%] z-10 px-3 text-center"
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.2 }}>
        <div className="font-pixel text-[clamp(30px,10.5cqw,58px)] font-bold leading-[1.05] tracking-wide">
          <span className="title-green">PIXEL </span>
          <span className="title-sand">PAINT</span>
        </div>
        <div className="title-sand font-pixel text-[clamp(40px,15cqw,84px)] font-bold leading-[1.05] tracking-wide">
          MILITARY
        </div>
        <div className="mx-auto mt-3 inline-block rounded-md border-2 border-[#1d2410] bg-[#2e3219]/85 px-3 py-1 font-pixel text-[11px] font-bold tracking-widest text-[#e2cf96]">
          {tr(lang, "subtitle")}
        </div>
      </motion.div>

      <div className="absolute inset-x-0 top-[62%] z-10 flex -translate-y-1/2 flex-col items-center gap-4">
        <motion.button
          onClick={() => { sfx.click(); onPlay(); }}
          className="btn-sand shine overflow-hidden px-12 py-3"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.5 }}
          whileHover={{ scale: 1.04 }}>
          <span className="inner-label font-pixel text-[clamp(34px,11cqw,58px)] font-bold leading-none">{tr(lang, "play")}</span>
        </motion.button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="hud-pill max-w-[90%] truncate px-4 py-1.5 font-pixel text-xs font-bold text-[#e2cf96]">
          {allDone ? tr(lang, "allCleared") : `${tr(lang, "level")} ${lv.id} · ${tr(lang, lv.nameKey)}`}
        </motion.div>

        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          onClick={() => { sfx.click(); onLevels(); }}
          className="btn-olive flex items-center gap-2 px-5 py-2 font-pixel text-sm font-bold">
          <MapIcon size={16} /> {tr(lang, "chooseLevel")}
        </motion.button>
      </div>

      <div className="absolute inset-x-0 bottom-2 z-10 text-center font-pixel text-[10px] text-[#f2ead3]/60">
        v2.0 · {save.completed.length.toLocaleString()}/{TOTAL_LEVELS.toLocaleString()} {tr(lang, "missions")}
      </div>
    </div>
  );
}
