import { worldHour, clock, isWorkHour, WORK_START, WORK_END } from "./time";
import { isRestDay, feastOn } from "./feasts";
/**
 * Procedural soundscape (Web Audio, no sample files). The render loop hands in a scene summary a few
 * times per second; this module only mixes — it never touches game state, so worlds stay deterministic.
 */
export type Scene = {
  zoom: number; // 0 = whole map … 1 = close to villagers
  forest: number; water: number; sea: number; // 0..1 share of the visible area
  people: number; talkers: number; // visible villagers / currently speaking
  sources: { k: string; pan: number; near: number }[]; // pan -1..1, near 0..1
  flood?: number; floodPan?: number; // nearness of flood water 0..1 and its side
};

let ctx: AudioContext | null = null;
// flood: deep brown roar + churning mid band + bright surface hiss, all from brown noise, panned to the water
let fRoar: GainNode, fChurn: GainNode, fChurnF: BiquadFilterNode, fHiss: GainNode, fPan: StereoPannerNode | null = null;
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
  {
    const a = ctx, bus = a.createGain(); bus.gain.value = 1;
    fPan = a.createStereoPanner ? a.createStereoPanner() : null;
    if (fPan) bus.connect(fPan).connect(master); else bus.connect(master);
    const chain = (type: BiquadFilterType, f: number, q: number, f2?: number) => {
      const src = a.createBufferSource(); src.buffer = nb; src.loop = true;
      const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      let n: AudioNode = src.connect(fl);
      if (f2) { const l2 = a.createBiquadFilter(); l2.type = "lowpass"; l2.frequency.value = f2; n = n.connect(l2); }
      const g = a.createGain(); g.gain.value = 0; n.connect(g).connect(bus); src.start(0, Math.random() * 2.5);
      return { g, fl };
    };
    ({ g: fRoar } = chain("lowpass", 240, 0.5, 180));
    ({ g: fChurn, fl: fChurnF } = chain("bandpass", 520, 0.9));
    ({ g: fHiss } = chain("highpass", 2400, 0.4, 5200));
  }
  timer = window.setInterval(tick, 120);
  // real sheep "Mäh!" (public-domain recording), played when a sheep is clicked
  fetch("/sounds/sheep.mp3").then((r) => r.arrayBuffer()).then((b) => ctx!.decodeAudioData(b)).then((b) => { sheepBuf = b; }).catch(() => {});
}
let noise: AudioBuffer;
let sheepBuf: AudioBuffer | null = null;

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
/** Real sheep "Mäh!" (recorded sample) — only on click, never ambient. */
export function baa(pan = 0) {
  if (!ctx || !enabled || !sheepBuf) return;
  const s = ctx.createBufferSource(); s.buffer = sheepBuf;
  const g = ctx.createGain(); g.gain.value = 0.9;
  s.connect(g).connect(out(pan, 1)); s.start();
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
/** One bronze strike of the town bell: fundamental, hum and inharmonic partials with a long decay. */
function strike(pan: number, v: number) {
  tone(pan, 0.13 * v, 392, 390, 2.6, "sine", 3000); tone(pan, 0.05 * v, 196, 195, 3.2, "sine"); tone(pan, 0.04 * v, 940, 935, 1.5, "sine", 3000); tone(pan, 0.025 * v, 1290, 1285, 0.9, "triangle", 3000);
}
/** Ringing the bell for morning, midday and evening: a slow swinging series of strikes. */
function peal(pan: number, v: number) {
  for (let i = 0; i < 7; i++) setTimeout(() => ctx && enabled && strike(pan, v * (i % 2 ? 0.8 : 1)), i * 900);
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
    case "wedding": { // a plain dance tune on shawm-like horns over a drone (Dorian, c. 1500), then the church bell
      const seq: [number, number, number][] = [[0, 2, 0.22], [0.24, 5, 0.22], [0.48, 9, 0.44], [0.96, 7, 0.22], [1.2, 5, 0.22], [1.44, 7, 0.44], [1.92, 5, 0.22], [2.16, 4, 0.22], [2.4, 2, 0.8]];
      seq.forEach(([at, st, d]) => horn(at, N(st), d, 0.06));
      horn(0, N(-10), 3.2, 0.025);
      setTimeout(() => ok() && bell(0), 3300); setTimeout(() => ok() && bell(0), 5600);
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
  // flood water: steady roar, slowly surging churn, and occasional gurgles where the current hits walls
  const fl = s.flood ?? 0, surge = 0.7 + 0.3 * Math.sin(ctx.currentTime / 2.3) * Math.sin(ctx.currentTime / 5.7 + 1);
  lerp(fRoar.gain, fl * 0.32 * surge, 1.4);
  lerp(fChurn.gain, fl * 0.11 * (0.6 + 0.4 * surge), 0.9);
  lerp(fChurnF.frequency, 420 + 260 * surge, 1.1);
  lerp(fHiss.gain, fl * 0.035 * surge * (0.4 + 0.6 * close), 1);
  if (fPan) lerp(fPan.pan, (s.floodPan ?? 0) * 0.6, 1);
  if (fl > 0.1 && rnd() < fl * 1.6 * dt) { const f0 = 180 + rnd() * 320; burst(P(s.floodPan), 0.05 * fl, f0, 0.12 + rnd() * 0.25, "bandpass"); if (rnd() < 0.35) burst(P(s.floodPan), 0.03 * fl, f0 * 1.9, 0.08, "bandpass"); }
  // birdsong: gentle two-note warble, soft and not too high (water "plinks" removed: sounded like beeping)
  if ((s.forest > 0.05 || close > 0) && rnd() < 0.25 * dt * land) {
    const f = 1400 + rnd() * 900;
    for (let i = 0; i < 1 + Math.floor(rnd() * 3); i++) setTimeout(() => ctx && enabled && tone(P(), 0.014, f * (i % 2 ? 1.12 : 1), f * (i % 2 ? 1 : 1.12), 0.16, "sine"), i * 170);
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
      case "site": if (isWorkHour(clock()) && rnd() < 0.9 * dt) burst(src.pan, 0.1 * v, 700, 0.06, "bandpass"); break;
      case "sawmill": if (rnd() < 0.25 * dt) burst(src.pan, 0.05 * v, 1800, 0.5, "bandpass"); break;
      case "mill": if (rnd() < 0.2 * dt) tone(src.pan, 0.03 * v, 120, 95, 0.6, "sawtooth", 300); break;
      case "watermill": if (rnd() < 0.15 * dt) tone(src.pan, 0.04 * v, 500 + rnd() * 400, 1200, 0.08); break;
      // ambient sheep bleats stay removed: the synthetic vibrato baa was the recurring nagging sound; real "Mäh!" plays on click only
      case "steamworks": if (rnd() < 0.8 * dt) burst(src.pan, 0.07 * v, 900, 0.08, "bandpass"); break; // water-driven trip hammer
    }
  }
  // church bell at the full hour (real clock), when a church is in view
  const wh = worldHour(clock()), key = Math.floor(wh);
  // Sunday morning: festive peal calling everyone to church (shared world clock)
  // Good Friday: the bells fall silent ("fly to Rome") until Easter morning
  const mute = feastOn(clock()) === "goodfriday";
  if (!mute && isRestDay(clock()) && wh >= 9.75 && wh < 9.75 + 1 / 60 && lastPeal !== Math.floor(clock() / 864e5)) {
    lastPeal = Math.floor(clock() / 864e5); bell(0); setTimeout(() => ctx && enabled && bell(0), 2600);
  }
  // town bell (from Kleinstadt on): morning bell at WORK_START wakes the sites, midday bell, evening bell at
  // WORK_END ends the builders' day; in between it strikes the full hour. Silent at night.
  if (wh - key < 1 / 60 && lastBell !== key) {
    const b = s.sources.filter((x) => x.k === "bell").sort((p, q) => q.near - p.near)[0];
    if (b && !mute && key >= WORK_START && key <= WORK_END) {
      lastBell = key;
      const v = Math.max(0.35, b.near);
      if (key === WORK_START || key === 12 || key === WORK_END) { peal(b.pan, v); if (key === WORK_END) setTimeout(() => ctx && enabled && peal(b.pan, v * 0.8), 3600); }
      else for (let i = 0; i < ((key % 12) || 12); i++) setTimeout(() => ctx && enabled && strike(b.pan, v), i * 1700);
    }
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
  // muted: stop the audio thread entirely after the fade, saves battery on phones
  if (!on) setTimeout(() => { if (!enabled && ctx?.state === "running") void ctx.suspend(); }, 400);
}
// background tab / locked phone: suspend audio, resume when visible again
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend(); else if (enabled) void ctx.resume();
});
export function unlock() { if (enabled && ctx && ctx.state !== "running") void ctx.resume(); }
export function disposeAudio() { clearInterval(timer); }
