import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { sfx } from "./sound";

export function Coin({ size = 22 }: { size?: number }) {
  return (
    <span className="coin inline-grid shrink-0 place-items-center rounded-full font-pixel font-bold text-[#6b4a07]"
      style={{ width: size, height: size, fontSize: size * 0.55 }}>
      $
    </span>
  );
}

export function CoinBar({ coins, bump }: { coins: number; bump?: number }) {
  return (
    <div className="hud-pill relative flex h-10 items-center gap-2 pl-1.5 pr-4">
      <Coin size={28} />
      <motion.span key={coins} initial={{ scale: 1.35, color: "#ffe27a" }} animate={{ scale: 1, color: "#f2ead3" }}
        className="font-pixel text-base font-bold tabular-nums">
        {coins.toLocaleString("vi-VN")}
      </motion.span>
      <AnimatePresence>
        {bump ? (
          <motion.span key={`b${bump}-${coins}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: -22 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute right-1 top-0 font-pixel text-sm font-bold text-yellow-300">
            +{bump}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={() => { sfx.click(); onClick(); }} aria-label="Cài đặt"
      className="btn-dark grid h-11 w-11 place-items-center">
      <SettingsIcon size={22} strokeWidth={2.5} />
    </button>
  );
}

export function Modal({ open, children, onClose }: { open: boolean; children: ReactNode; onClose?: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-50 grid place-items-center bg-black/65 p-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}>
          <motion.div className="w-full max-w-[360px]" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => { sfx.click(); onChange(!value); }}
      className="flex w-full items-center justify-between gap-3 rounded-lg border-2 border-[#2e3219]/30 bg-[#f6ecca]/60 px-3 py-2.5 text-left">
      <div>
        <div className="font-pixel text-sm font-bold text-[#3e4322]">{label}</div>
        {desc && <div className="font-num text-base leading-tight text-[#5f6440]">{desc}</div>}
      </div>
      <div className={`relative h-7 w-12 shrink-0 rounded-md border-[3px] border-[#2e3219] transition ${value ? "bg-[#6d7a3f]" : "bg-[#9b9477]"}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-sm bg-[#f6ecca] shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
      </div>
    </button>
  );
}
