/**
 * Procedural soundscape (Web Audio, no sample files). The render loop hands in a scene summary a few
 * times per second; this module only mixes — it never touches game state, so worlds stay deterministic.
 */
export type Scene = {
  zoom: number; // 0 = whole map … 1 = close to villagers
  forest: number; water: number; sea: number; // 0..1 share of the visible area
  people: number; talkers: number; // visible villagers / currently speaking
  sources: { k: string; pan: number; near: number }[]; // pan -1..1, near 0..1
};

let ctx: AudioContext | null = null;
let master: GainNode, wind: GainNode, windF: BiquadFilterNode, leaves: GainNode, water: GainNode, sea: GainNode;
let enabled = false;
let scene: Scene | null = null;
let timer = 0;

const lerp = (g: AudioParam, v: number, tc = 0.6) => ctx && g.setTargetAtTime(v, ctx.currentTime, tc);

function noiseBuf(a: AudioContext) {
  const len = a.sampleRate * 3, b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = last * 3.2 * 0.6 + w * 0.4; }
  return b;
}
function loop(a: AudioContext, buf: AudioBuffer, type: BiquadFilterType, f: number, q: number) {
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = Math.random();
  const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = a.createGain(); g.gain.value = 0;
  src.connect(fl).connect(g).connect(master); src.start(0, Math.random() * 2);
  return { g, fl };
}

function init() {
  if (ctx) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const nb = noiseBuf(ctx);
  ({ g: wind, fl: windF } = loop(ctx, nb, "lowpass", 380, 1.2));
  ({ g: leaves } = loop(ctx, nb, "bandpass", 3200, 0.6));
  ({ g: water } = loop(ctx, nb, "bandpass", 1100, 1.4));
  ({ g: sea } = loop(ctx, nb, "lowpass", 520, 0.7));
  noise = nb;
  timer = window.setInterval(tick, 120);
}
let noise: AudioBuffer;

/** Short shaped sound helpers */
function out(pan: number, vol: number) {
  const g = ctx!.createGain(); g.gain.value = vol;
  const p = ctx!.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
  g.connect(p).connect(master); return g;
}
function burst(pan: number, vol: number, f: number, dur: number, type: BiquadFilterType = "highpass") {
  const a = ctx!, s = a.createBufferSource(); s.buffer = noise;
  const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
  const g = a.createGain(), t = a.currentTime;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(out(pan, 1)); s.start(t, Math.random() * 2, dur + 0.05);
}
function tone(pan: number, vol: number, f0: number, f1: number, dur: number, type: OscillatorType = "sine", formant = 0) {
  const a = ctx!, o = a.createOscillator(), t = a.currentTime; o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.04, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n: AudioNode = o;
  if (formant) { const fl = a.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = formant; fl.Q.value = 3; o.connect(fl); n = fl; }
  n.connect(g).connect(out(pan, 1)); o.start(t); o.stop(t + dur + 0.05);
  return o;
}
/** Murmured syllable — warm, wordless "village chatter". */
function syllable(pan: number, vol: number) {
  const f = 140 + Math.random() * 140, d = 0.09 + Math.random() * 0.14;
  tone(pan, vol, f, f * (0.85 + Math.random() * 0.3), d, "sawtooth", 500 + Math.random() * 900);
}
export function baa(pan = 0) {
  if (!ctx || !enabled) return;
  const o = tone(pan, 0.22, 420, 360, 0.75, "sawtooth", 950);
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 11; lg.gain.value = 22;
  lfo.connect(lg).connect(o.frequency); lfo.start(); lfo.stop(ctx.currentTime + 0.8);
}
export function hm(pan = 0) {
  if (!ctx || !enabled) return;
  tone(pan, 0.14, 210, 260, 0.28, "triangle", 700);
}
/** Festive bell: a few slowly decaying, slightly inharmonic strikes. */
export function bell(pan = 0) {
  if (!ctx || !enabled) return;
  for (let k = 0; k < 3; k++) setTimeout(() => {
    if (!ctx || !enabled) return;
    tone(pan, 0.2, 392, 390, 2.4, "sine", 3000); tone(pan, 0.08, 940, 935, 1.6, "sine", 3000); tone(pan, 0.05, 1290, 1285, 1.0, "triangle", 3000);
  }, k * 1100);
}
export function tap(pan = 0) {
  if (!ctx || !enabled) return;
  burst(pan, 0.18, 300, 0.12, "lowpass"); tone(pan, 0.05, 880, 860, 0.5, "sine");
}

let lastBell = -1;
function tick() {
  if (!ctx || !enabled || !scene) return;
  const s = scene, z = s.zoom, dt = 0.12;
  const far = 1 - z, close = Math.max(0, (z - 0.45) / 0.55);
  const gust = 0.75 + 0.25 * Math.sin(ctx.currentTime / 7) * Math.sin(ctx.currentTime / 3.1);
  lerp(wind.gain, (0.05 + 0.32 * far * far) * gust, 1.2);
  lerp(windF.frequency, 260 + 320 * gust * far, 1.2);
  const land = 0.3 + 0.7 * Math.min(1, z * 1.6);
  lerp(leaves.gain, s.forest * 0.12 * land * (0.7 + 0.3 * gust), 0.8);
  lerp(water.gain, Math.min(1, s.water * 3) * 0.1 * land, 0.8);
  lerp(sea.gain, Math.min(1, s.sea * 1.5) * (0.06 + 0.1 * (0.5 + 0.5 * Math.sin(ctx.currentTime / 4.5))), 0.9);
  const rnd = Math.random, P = (pan = 0) => pan + (rnd() - 0.5) * 0.3;
  // babbling water, birds
  if (s.water > 0.02 && rnd() < s.water * 2 * dt * land) tone(P(), 0.02, 600 + rnd() * 700, 1500 + rnd() * 900, 0.05);
  if ((s.forest > 0.05 || close > 0) && rnd() < 0.25 * dt * land) {
    const f = 2200 + rnd() * 1800; for (let i = 0; i < 1 + Math.floor(rnd() * 3); i++) setTimeout(() => ctx && enabled && tone(P(), 0.025, f, f * 1.25, 0.08), i * 110);
  }
  // villagers' chatter
  if (close > 0) {
    if (rnd() < s.talkers * 2.5 * dt) syllable(P(), 0.05 * close);
    if (rnd() < Math.min(6, s.people * 0.15) * dt) syllable(P(), 0.012 * close);
  }
  for (const src of s.sources) {
    const v = src.near * (0.3 + 0.7 * close);
    if (v < 0.02) continue;
    switch (src.k) {
      case "campfire": if (rnd() < 6 * dt) burst(src.pan, 0.12 * v * rnd(), 2000 + rnd() * 3000, 0.02 + rnd() * 0.04); break;
      case "smithy": if (rnd() < 0.7 * dt) { burst(src.pan, 0.1 * v, 2500, 0.05); tone(src.pan, 0.05 * v, 1900, 1850, 0.35, "triangle"); } break;
      case "site": if (rnd() < 0.9 * dt) burst(src.pan, 0.1 * v, 700, 0.06, "bandpass"); break;
      case "sawmill": if (rnd() < 0.25 * dt) burst(src.pan, 0.05 * v, 1800, 0.5, "bandpass"); break;
      case "mill": if (rnd() < 0.2 * dt) tone(src.pan, 0.03 * v, 120, 95, 0.6, "sawtooth", 300); break;
      case "watermill": if (rnd() < 2 * dt) tone(src.pan, 0.02 * v, 500 + rnd() * 400, 1200, 0.06); break;
      case "pasture": if (rnd() < 0.02 * dt * 10 && v > 0.3) baa(src.pan); break;
      case "factory": case "steamworks": if (rnd() < 0.5 * dt) burst(src.pan, 0.05 * v, 400, 0.4, "lowpass"); break;
    }
  }
  // church bell at the full hour (real clock), when a church is in view
  const d = new Date(), key = d.getHours();
  if (d.getMinutes() === 0 && lastBell !== key) {
    const ch = s.sources.find((x) => x.k === "church");
    if (ch) { lastBell = key; for (let i = 0; i < ((key % 12) || 12); i++) setTimeout(() => ctx && enabled && tone(ch.pan, 0.12 * ch.near, 392, 390, 2.4, "sine"), i * 1600); }
  }
}

export function setScene(s: Scene) { scene = s; }
export function soundEnabled() { return enabled; }
/** Must be called from a user gesture the first time (browser autoplay rules). */
export function setSound(on: boolean) {
  enabled = on;
  if (on) init();
  if (!ctx) return;
  if (on) void ctx.resume();
  lerp(master.gain, on ? 0.9 : 0, 0.3);
}
export function unlock() { if (enabled && ctx && ctx.state !== "running") void ctx.resume(); }
export function disposeAudio() { clearInterval(timer); }
