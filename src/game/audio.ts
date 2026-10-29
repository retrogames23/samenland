import { worldHour, clock, isSunday } from "./time";
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
/** Murmured syllable — soft, distant, breathy chatter (no buzzy oscillators). */
function syllable(pan: number, vol: number) {
  const a = ctx!, t = a.currentTime, d = 0.12 + Math.random() * 0.18;
  const f = 110 + Math.random() * 120;
  // gentle voiced hum, heavily low-passed so it sounds muffled like voices across a square
  const o = a.createOscillator(); o.type = "triangle";
  o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (0.9 + Math.random() * 0.2), t + d);
  const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 0.4;
  // breath: noise through a vowel-like formant
  const s = a.createBufferSource(); s.buffer = noise;
  const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 600 + Math.random() * 700; bp.Q.value = 1.2;
  const g = a.createGain(), o2 = out(pan, 1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol * 0.6, t + d * 0.35);
  g.gain.linearRampToValueAtTime(0.0001, t + d);
  const gn = a.createGain(); gn.gain.value = 0.5;
  o.connect(lp).connect(g); s.connect(bp).connect(gn).connect(g); g.connect(o2);
  o.start(t); o.stop(t + d + 0.05); s.start(t, Math.random() * 2, d + 0.05);
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
let lastPeal = -1;
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

// ---------------- event jingles (short, cozy, synthesized) ----------------
/** Plucked/woody note at absolute time offset `at` seconds. */
function note(at: number, f: number, dur: number, vol: number, type: OscillatorType = "triangle", pan = 0) {
  const a = ctx!, o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
  o.connect(lp).connect(g).connect(out(pan, 1)); o.start(t); o.stop(t + dur + 0.05);
}
/** Brassy horn note (filtered saw with soft attack). */
function horn(at: number, f: number, dur: number, vol: number) {
  const a = ctx!, t = a.currentTime + at;
  for (const d of [0, 3]) {
    const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = "sawtooth"; o.frequency.value = f; o.detune.value = d;
    lp.type = "lowpass"; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1800, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(out(0, 1)); o.start(t); o.stop(t + dur + 0.05);
  }
}
const N = (semi: number) => 261.63 * Math.pow(2, semi / 12); // semitones from C4
const ok = () => !!ctx && enabled;

export type Jingle = "coins" | "fanfare" | "wedding" | "stage" | "built" | "road" | "welcome" | "letter" | "woe" | "relief" | "twin" | "gift";
/** Short themed cue for game events and rewards. */
export function jingle(k: Jingle) {
  if (!ok()) return;
  switch (k) {
    case "coins": // a handful of coins clinking into the purse
      for (let i = 0; i < 6; i++) { const at = i * 0.07 + Math.random() * 0.03, f = 2200 + Math.random() * 1600; note(at, f, 0.25, 0.06, "sine"); note(at, f * 1.51, 0.15, 0.025, "sine"); }
      break;
    case "fanfare": // little herald call: G-C-E-G
      [[0, 7, 0.16], [0.17, 12, 0.16], [0.34, 16, 0.16], [0.51, 19, 0.6]].forEach(([at, s, d]) => horn(at!, N(s! - 12), d!, 0.07));
      break;
    case "wedding": { // opening of Mendelssohn's wedding march: "ta-ta-ta-taaa" ×2, then rising chord
      const seq: [number, number, number][] = [[0, 7, 0.12], [0.14, 7, 0.12], [0.28, 7, 0.12], [0.42, 7, 0.55], [1.05, 7, 0.12], [1.19, 7, 0.12], [1.33, 7, 0.12], [1.47, 7, 0.55]];
      seq.forEach(([at, s, d]) => horn(at, N(s), d, 0.06));
      [[2.1, 12], [2.1, 16], [2.1, 19]].forEach(([at, s]) => horn(at!, N(s!), 0.9, 0.04));
      break;
    }
    case "stage": // longer fanfare plus bell
      jingle("fanfare"); setTimeout(() => ok() && [[0, 12], [0, 16], [0, 19], [0, 24]].forEach(([, s]) => horn(0, N(s!), 1.1, 0.035)), 750); setTimeout(() => bell(0), 900);
      break;
    case "built": // carpenters' hammer taps + bright chord
      for (let i = 0; i < 3; i++) setTimeout(() => ok() && burst(0, 0.2, 400, 0.08, "lowpass"), i * 160);
      [0, 4, 7, 12].forEach((s, i) => note(0.5 + i * 0.08, N(s), 0.8, 0.07));
      break;
    case "road": // ox-cart bell rolling off + rising fifth
      [0, 0.35, 0.7].forEach((at) => note(at, 1320, 0.4, 0.05, "sine"));
      note(0.1, N(0), 0.5, 0.06); note(0.45, N(7), 0.8, 0.06);
      break;
    case "welcome": // warm lute arpeggio
      [0, 4, 7, 12, 7].forEach((s, i) => note(i * 0.12, N(s), 0.7, 0.065));
      break;
    case "letter": // horse trot + post horn
      for (let i = 0; i < 4; i++) setTimeout(() => ok() && burst(0, 0.12, 700, 0.05, "bandpass"), i * 120);
      horn(0.55, N(7), 0.2, 0.06); horn(0.78, N(12), 0.45, 0.06);
      break;
    case "gift":
      [12, 16, 19, 24].forEach((s, i) => note(i * 0.09, N(s), 0.5, 0.05, "sine"));
      setTimeout(() => jingle("coins"), 380);
      break;
    case "twin": // two voices meeting
      note(0, N(0), 0.9, 0.06); note(0.25, N(7), 0.9, 0.06); note(0.5, N(12), 1.2, 0.05); note(0.5, N(16), 1.2, 0.04);
      break;
    case "woe": // low, sorrowful minor descent
      [[0, 3], [0.35, 2], [0.7, -2], [1.05, 0]].forEach(([at, s]) => note(at!, N(s! - 12), 0.7, 0.07, "triangle"));
      break;
    case "relief": // averted danger: minor resolving to major
      note(0, N(-9), 0.5, 0.06); note(0.3, N(-5), 0.5, 0.06); note(0.6, N(0), 0.9, 0.06); note(0.6, N(4), 0.9, 0.05);
      break;
  }
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
      case "steamworks": if (rnd() < 0.8 * dt) burst(src.pan, 0.07 * v, 900, 0.08, "bandpass"); break; // water-driven trip hammer
    }
  }
  // church bell at the full hour (real clock), when a church is in view
  const wh = worldHour(clock()), key = Math.floor(wh);
  // Sunday morning: festive peal calling everyone to church (shared world clock)
  if (isSunday(clock()) && wh >= 9.75 && wh < 9.75 + 1 / 60 && lastPeal !== Math.floor(clock() / 864e5)) {
    lastPeal = Math.floor(clock() / 864e5); bell(0); setTimeout(() => ctx && enabled && bell(0), 2600);
  }
  if (wh - key < 1 / 60 && lastBell !== key) {
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
