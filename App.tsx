import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MenuScreen from "./game/MenuScreen";
import GameScreen from "./game/GameScreen";
import LevelSelect from "./game/LevelSelect";
import SettingsModal from "./game/SettingsModal";
import { getLevel, TOTAL_LEVELS } from "./game/levels";
import { useSave, DEFAULT_SAVE, clearProgress, clearAllProgress } from "./game/store";
import { setSoundEnabled, setVibrateEnabled } from "./game/sound";
import { setMusicEnabled, startMusic } from "./game/music";

type Screen = "menu" | "levels" | "game";

export default function App() {
  const [save, setSave] = useSave();
  const [screen, setScreen] = useState<Screen>("menu");
  const [playing, setPlaying] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [coinBump, setCoinBump] = useState(0);

  useEffect(() => {
    setSoundEnabled(save.settings.sound);
    setVibrateEnabled(save.settings.vibrate);
  }, [save.settings.sound, save.settings.vibrate]);

  // nhạc: trình duyệt chỉ cho phát sau khi người chơi chạm → bật ở lần chạm đầu tiên
  useEffect(() => { setMusicEnabled(save.settings.music); }, [save.settings.music]);
  useEffect(() => {
    const kick = () => { if (save.settings.music) startMusic(); };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    return () => { window.removeEventListener("pointerdown", kick); window.removeEventListener("keydown", kick); };
  }, [save.settings.music]);

  const startLevel = (i: number) => {
    const idx = Math.max(0, Math.min(TOTAL_LEVELS - 1, i));
    setPlaying(idx);
    setSave((s) => ({ ...s, current: idx }));
    setScreen("game");
  };

  const handleComplete = useCallback((reward: number) => {
    const lv = getLevel(playing);
    setSave((s) => {
      const next = Math.min(playing + 1, TOTAL_LEVELS - 1);
      return {
        ...s,
        coins: s.coins + reward,
        completed: s.completed.includes(lv.id) ? s.completed : [...s.completed, lv.id],
        unlocked: Math.max(s.unlocked, next),
        current: next,
      };
    });
    setTimeout(() => setCoinBump(reward), 900);
  }, [playing, setSave]);

  const handleSpend = useCallback((n: number) => {
    if (save.coins < n) return false;
    setSave((s) => ({ ...s, coins: s.coins - n }));
    return true;
  }, [save.coins, setSave]);

  const handleNext = useCallback(() => {
    setCoinBump(0);
    const next = playing + 1;
    if (next >= TOTAL_LEVELS) { setScreen("menu"); return; }
    setPlaying(next);
    setSave((s) => ({ ...s, current: next }));
  }, [playing, setSave]);

  const level = getLevel(playing);

  return (
    <div className="outer-bg flex h-[100dvh] w-full items-center justify-center">
      <div className="relative h-[100dvh] overflow-hidden bg-[#1e2212] sm:rounded-[22px] sm:border-4 sm:border-[#0c0e06] sm:shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        style={{ width: "min(100vw, calc(100dvh * 9 / 16))", containerType: "inline-size" }}>
        <AnimatePresence mode="wait">
          {screen === "menu" && (
            <motion.div key="menu" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <MenuScreen save={save}
                onPlay={() => startLevel(save.current)}
                onLevels={() => setScreen("levels")}
                onSettings={() => setShowSettings(true)} />
            </motion.div>
          )}
          {screen === "levels" && (
            <motion.div key="levels" className="absolute inset-0" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ duration: 0.25 }}>
              <LevelSelect save={save}
                onBack={() => setScreen("menu")}
                onPick={startLevel}
                onSettings={() => setShowSettings(true)} />
            </motion.div>
          )}
          {screen === "game" && (
            <motion.div key={`game-${playing}-${nonce}`} className="absolute inset-0"
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }} transition={{ duration: 0.3 }}>
              <GameScreen
                level={level}
                levelIndex={playing}
                totalLevels={TOTAL_LEVELS}
                coins={save.coins}
                coinBump={coinBump}
                settings={save.settings}
                onComplete={handleComplete}
                onSpend={handleSpend}
                onNext={handleNext}
                onHome={() => { setCoinBump(0); setScreen("menu"); }}
                onLevels={() => { setCoinBump(0); setScreen("levels"); }}
                onSettings={() => setShowSettings(true)} />
            </motion.div>
          )}
        </AnimatePresence>

        <SettingsModal
          open={showSettings}
          settings={save.settings}
          inGame={screen === "game"}
          onChange={(st) => setSave((s) => ({ ...s, settings: st }))}
          onClose={() => setShowSettings(false)}
          onHome={() => { setShowSettings(false); setScreen("menu"); }}
          onRestartLevel={() => { clearProgress(level.id); setShowSettings(false); setNonce((n) => n + 1); }}
          onResetAll={() => { clearAllProgress(); setSave({ ...DEFAULT_SAVE, settings: save.settings }); setShowSettings(false); setScreen("menu"); setPlaying(0); }}
        />
      </div>
    </div>
  );
}
