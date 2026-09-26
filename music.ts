/**
 * NHẠC NỀN CHILL — tổng hợp bằng Web Audio (không cần file mp3).
 * Nhiều bài, mỗi bài lặp vài vòng rồi tự chuyển bài tiếp theo.
 */
export interface Track {
  name: string;
  bpm: number;
  root: number;          // tần số nốt gốc (Hz)
  chords: number[][];    // các hợp âm, tính bằng nửa cung so với root
  pad: OscillatorType;
  arp: OscillatorType;
  drums: boolean;
  loops: number;         // số vòng trước khi chuyển bài
}

const MAJ7 = [0, 4, 7, 11], MIN7 = [0, 3, 7, 10], DOM7 = [0, 4, 7, 10];
const sh = (chord: number[], by: number) => chord.map((n) => n + by);

export const TRACKS: Track[] = [
  { name: "Dawn Patrol", bpm: 70, root: 220.0, chords: [MAJ7, sh(MIN7, 9), sh(MAJ7, 5), sh(DOM7, 7)], pad: "triangle", arp: "sine", drums: false, loops: 2 },
  { name: "Field Radio", bpm: 78, root: 174.61, chords: [sh(MIN7, 2), sh(DOM7, 7), MAJ7, sh(MIN7, 9)], pad: "sine", arp: "triangle", drums: true, loops: 2 },
  { name: "Night Watch", bpm: 66, root: 146.83, chords: [MIN7, sh(MAJ7, 8), sh(MAJ7, 3), sh(DOM7, 10)], pad: "triangle", arp: "sine", drums: false, loops: 2 },
  { name: "Sand & Steel", bpm: 82, root: 164.81, chords: [MAJ7, sh(MAJ7, 5), sh(MIN7, 2), sh(DOM7, 7)], pad: "sawtooth", arp: "triangle", drums: true, loops: 2 },
  { name: "Quiet Outpost", bpm: 64, root: 196.0, chords: [MAJ7, sh(MIN7, 4), sh(MAJ7, 5), sh(MIN7, 9)], pad: "sine", arp: "sine", drums: false, loops: 2 },
  { name: "Cold Front", bpm: 74, root: 130.81, chords: [MIN7, sh(MIN7, 5), sh(MAJ7, 8), sh(MIN7, 7)], pad: "triangle", arp: "triangle", drums: true, loops: 2 },
  { name: "Radio Silence", bpm: 60, root: 185.0, chords: [MAJ7, sh(MAJ7, 5), MAJ7, sh(DOM7, 7)], pad: "sine", arp: "sine", drums: false, loops: 2 },
  { name: "Morning Drill", bpm: 84, root: 207.65, chords: [sh(MIN7, 9), sh(MAJ7, 5), MAJ7, sh(DOM7, 7)], pad: "triangle", arp: "triangle", drums: true, loops: 2 },
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let padBus: GainNode | null = null;
let arpBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let timer: number | null = null;
let step = 0, nextTime = 0, loopsDone = 0, trackIdx = 0;
let enabled = false, running = false;
let activePads: { g: GainNode; o: OscillatorNode }[] = [];
const listeners = new Set<() => void>();

export function onTrackChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const currentTrack = () => TRACKS[trackIdx];
export const isMusicRunning = () => running;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
    master.connect(lp).connect(ctx.destination);

    padBus = ctx.createGain(); padBus.gain.value = 1;
    const padLp = ctx.createBiquadFilter(); padLp.type = "lowpass"; padLp.frequency.value = 850;
    padBus.connect(padLp).connect(master);

    arpBus = ctx.createGain(); arpBus.gain.value = 1;
    const delay = ctx.createDelay(1.5); delay.delayTime.value = 0.32;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const wet = ctx.createGain(); wet.gain.value = 0.5;
    delay.connect(fb).connect(delay);
    arpBus.connect(master);
    arpBus.connect(delay); delay.connect(wet).connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMusicEnabled(v: boolean) { enabled = v; if (v) startMusic(); else stopMusic(); }

export function startMusic() {
  if (!enabled || running) return;
  ensure();
  if (!ctx || !master) return;
  running = true;
  step = 0; loopsDone = 0;
  nextTime = ctx.currentTime + 0.15;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2.5);
  timer = window.setInterval(schedule, 100);
}

export function stopMusic() {
  if (!running || !ctx || !master) return;
  running = false;
  if (timer) { clearInterval(timer); timer = null; }
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  killPads(0.8);
}

function killPads(fade: number) {
  if (!ctx) return;
  for (const p of activePads) {
    try {
      p.g.gain.cancelScheduledValues(ctx.currentTime);
      p.g.gain.setValueAtTime(p.g.gain.value, ctx.currentTime);
      p.g.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
      p.o.stop(ctx.currentTime + fade + 0.05);
    } catch { /* ignore */ }
  }
  activePads = [];
}

export function nextTrack() {
  trackIdx = (trackIdx + 1) % TRACKS.length;
  step = 0; loopsDone = 0;
  if (running && ctx) { killPads(0.4); nextTime = ctx.currentTime + 0.3; }
  listeners.forEach((f) => f());
}

function schedule() {
  if (!ctx || !running) return;
  const tr = TRACKS[trackIdx];
  const six = 60 / tr.bpm / 4;
  const total = tr.chords.length * 32;
  while (nextTime < ctx.currentTime + 0.5) {
    playStep(tr, step, nextTime, six);
    nextTime += six;
    step++;
    if (step >= total) {
      step = 0; loopsDone++;
      if (loopsDone >= tr.loops) {
        trackIdx = (trackIdx + 1) % TRACKS.length;
        loopsDone = 0;
        listeners.forEach((f) => f());
        break;
      }
    }
  }
}

function playStep(tr: Track, s: number, t: number, six: number) {
  if (!ctx || !master || !padBus || !arpBus) return;
  const chord = tr.chords[Math.floor(s / 32) % tr.chords.length];
  const f = (semi: number) => tr.root * Math.pow(2, semi / 12);

  if (s % 32 === 0) {
    const dur = 32 * six;
    chord.forEach((semi, i) => {
      const o = ctx!.createOscillator(); o.type = tr.pad; o.frequency.value = f(semi); o.detune.value = i % 2 ? 5 : -5;
      const g = ctx!.createGain();
      const vol = tr.pad === "sawtooth" ? 0.028 : 0.05;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 1.4);
      g.gain.setValueAtTime(vol, t + dur - 1.2);
      g.gain.linearRampToValueAtTime(0, t + dur + 0.2);
      o.connect(g).connect(padBus!);
      o.start(t); o.stop(t + dur + 0.3);
      activePads.push({ g, o });
    });
    if (activePads.length > 24) activePads.splice(0, activePads.length - 24);
  }
  if (s % 16 === 0 || s % 16 === 10) {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f(chord[0] - 24);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.11, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.0);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1.05);
  }
  if (s % 2 === 0 && Math.random() < 0.62) {
    const semi = chord[Math.floor(Math.random() * chord.length)] + [0, 12, 12, 24][Math.floor(Math.random() * 4)];
    const o = ctx.createOscillator(); o.type = tr.arp; o.frequency.value = f(semi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5);
    o.connect(g).connect(arpBus); o.start(t); o.stop(t + 0.55);
  }
  if (tr.drums) {
    if (s % 16 === 0 || s % 16 === 10) {
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.28);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.3);
    }
    if (s % 8 === 4 && noiseBuf) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.02, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
      src.connect(hp).connect(g).connect(master); src.start(t); src.stop(t + 0.1);
    }
  }
}
