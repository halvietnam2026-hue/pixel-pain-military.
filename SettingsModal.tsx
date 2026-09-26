import { useEffect, useState } from "react";
import { Home, RotateCcw, X, SkipForward, Copy, Check, Music2 } from "lucide-react";
import { Modal, Toggle } from "./ui";
import { sfx } from "./sound";
import { tr, LANGS } from "./i18n";
import { currentTrack, nextTrack, onTrackChange } from "./music";
import type { Settings } from "./store";

interface Props {
  open: boolean;
  settings: Settings;
  inGame: boolean;
  onChange: (s: Settings) => void;
  onClose: () => void;
  onHome: () => void;
  onRestartLevel: () => void;
  onResetAll: () => void;
}

const CONTACTS = [
  { label: "Discord", value: "hal_2105.", icon: "💬" },
  { label: "Roblox", value: "Hal_2105", icon: "🎮" },
];

export default function SettingsModal({ open, settings, inGame, onChange, onClose, onHome, onRestartLevel, onResetAll }: Props) {
  const lang = settings.lang;
  const [confirm, setConfirm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [trackName, setTrackName] = useState(currentTrack().name);
  useEffect(() => onTrackChange(() => setTrackName(currentTrack().name)), []);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });

  const copy = (v: string) => {
    sfx.click();
    navigator.clipboard?.writeText(v).catch(() => undefined);
    setCopied(v);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="panel-military relative max-h-[86dvh] overflow-hidden p-4">
        <div className="-mx-4 -mt-4 mb-3 flex items-center justify-between rounded-t-[10px] border-b-4 border-[#2e3219] bg-[#56622f] px-4 py-3">
          <div className="font-pixel text-lg font-bold text-[#f2ead3]">⚙ {tr(lang, "settings")}</div>
          <button onClick={() => { sfx.click(); onClose(); }} className="btn-dark grid h-9 w-9 place-items-center"><X size={18} strokeWidth={3} /></button>
        </div>

        <div className="no-scrollbar max-h-[calc(86dvh-120px)] space-y-2 overflow-y-auto pr-0.5">
          {/* ngôn ngữ */}
          <div className="rounded-lg border-2 border-[#2e3219]/30 bg-[#f6ecca]/60 p-2.5">
            <div className="mb-2 font-pixel text-sm font-bold text-[#3e4322]">🌐 {tr(lang, "language")}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => { sfx.click(); set("lang", l.code); }}
                  className={`flex items-center gap-1.5 rounded-md border-2 px-2 py-1.5 text-left text-[12px] font-bold ${lang === l.code ? "border-[#2e3219] bg-[#6d7a3f] text-[#f2ead3]" : "border-[#2e3219]/30 bg-[#fbf5e2] text-[#3e4322]"}`}>
                  <span className="text-base">{l.flag}</span><span className="truncate">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Toggle label={tr(lang, "sound")} desc={tr(lang, "soundDesc")} value={settings.sound} onChange={(v) => set("sound", v)} />
          <Toggle label={tr(lang, "music")} desc={tr(lang, "musicDesc")} value={settings.music} onChange={(v) => set("music", v)} />
          <div className="flex items-center gap-2 rounded-lg border-2 border-[#2e3219]/30 bg-[#f6ecca]/60 px-3 py-2">
            <Music2 size={16} className={settings.music ? "text-[#56622f]" : "text-[#9b9477]"} />
            <div className="min-w-0 flex-1 truncate font-num text-lg leading-none text-[#3e4322]">♪ {trackName}</div>
            <button onClick={() => { sfx.click(); nextTrack(); }} className="btn-olive flex items-center gap-1 px-2.5 py-1.5 font-pixel text-[10px] font-bold">
              <SkipForward size={13} /> {tr(lang, "nextTrack")}
            </button>
          </div>
          <Toggle label={tr(lang, "vibrate")} desc={tr(lang, "vibrateDesc")} value={settings.vibrate} onChange={(v) => set("vibrate", v)} />
          <Toggle label={tr(lang, "autoNext")} desc={tr(lang, "autoNextDesc")} value={settings.autoNext} onChange={(v) => set("autoNext", v)} />
          <Toggle label={tr(lang, "highlight")} desc={tr(lang, "highlightDesc")} value={settings.highlight} onChange={(v) => set("highlight", v)} />

          {/* liên hệ */}
          <div className="rounded-lg border-2 border-[#2e3219]/30 bg-[#2b3019] p-2.5">
            <div className="mb-2 font-pixel text-xs font-bold text-[#e2cf96]">📡 {tr(lang, "contact")}</div>
            <div className="space-y-1.5">
              {CONTACTS.map((c) => (
                <button key={c.label} onClick={() => copy(c.value)}
                  className="flex w-full items-center gap-2 rounded-md border-2 border-[#14170b] bg-[#3a3f26] px-2.5 py-1.5 text-left">
                  <span className="text-base">{c.icon}</span>
                  <span className="font-pixel text-[10px] font-bold text-[#c7c2a3]">{c.label}</span>
                  <span className="ml-auto font-num text-xl leading-none text-[#f2ead3]">{c.value}</span>
                  {copied === c.value ? <Check size={15} className="text-emerald-300" /> : <Copy size={14} className="text-[#c7c2a3]" />}
                </button>
              ))}
            </div>
            {copied && <div className="mt-1.5 text-center font-num text-base leading-none text-emerald-300">{tr(lang, "copied")}</div>}
          </div>

          {inGame && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { sfx.click(); onRestartLevel(); }} className="btn-olive flex items-center justify-center gap-2 py-2.5 font-pixel text-xs font-bold">
                <RotateCcw size={15} /> {tr(lang, "repaint")}
              </button>
              <button onClick={() => { sfx.click(); onHome(); }} className="btn-olive flex items-center justify-center gap-2 py-2.5 font-pixel text-xs font-bold">
                <Home size={15} /> {tr(lang, "menu")}
              </button>
            </div>
          )}
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="w-full rounded-lg border-2 border-dashed border-[#8b2e1f]/60 py-2 font-pixel text-[11px] font-bold text-[#8b2e1f]">
              {tr(lang, "resetAll")}
            </button>
          ) : (
            <div className="rounded-lg border-2 border-[#8b2e1f] bg-[#f6d9c9] p-2 text-center">
              <div className="font-num text-lg leading-tight text-[#8b2e1f]">{tr(lang, "resetConfirm")}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => setConfirm(false)} className="btn-dark py-2 font-pixel text-xs font-bold">{tr(lang, "cancel")}</button>
                <button onClick={() => { setConfirm(false); onResetAll(); }} className="rounded-lg border-[3px] border-[#3d130b] bg-[#b23b25] py-2 font-pixel text-xs font-bold text-white">{tr(lang, "delete")}</button>
              </div>
            </div>
          )}
          <div className="pb-1 text-center font-num text-base text-[#5f6440]">Pixel Paint Military · v2.0</div>
        </div>
      </div>
    </Modal>
  );
}
