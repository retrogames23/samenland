import { worldHour, clock } from "./time";
import nightSong from "@/assets/music/night_last_candle_waning.mp3.asset.json";

/**
 * Background music: situation playlists picked from the shared world clock. Plays only while both
 * sound and music are on; crossfades via a plain <audio> element (streams, no full decode on phones).
 */
export type Mood = "night" | null;
const PLAYLISTS: Record<Exclude<Mood, null>, string[]> = { night: [nightSong.url] };

/** Dark = evening/night on the world clock (matches the sky tint's dusk/dawn ramps). */
export function moodAt(now = clock()): Mood {
  const h = worldHour(now);
  return h >= 19.5 || h < 6.5 ? "night" : null;
}

const VOL = 0.45;
let el: HTMLAudioElement | null = null;
let active = false, mood: Mood = null, idx = 0, fade = 0, timer = 0;

function ramp(to: number, then?: () => void) {
  clearInterval(fade);
  fade = window.setInterval(() => {
    if (!el) return;
    const v = el.volume + Math.sign(to - el.volume) * 0.03;
    if (Math.abs(to - el.volume) <= 0.03) { el.volume = to; clearInterval(fade); then?.(); } else el.volume = Math.max(0, Math.min(1, v));
  }, 60);
}
function play(m: Exclude<Mood, null>) {
  const list = PLAYLISTS[m];
  if (!el) { el = new Audio(); el.preload = "auto"; el.addEventListener("ended", () => { if (!mood) return; idx = (idx + 1) % PLAYLISTS[mood].length; el!.src = PLAYLISTS[mood][idx]!; void el!.play().catch(() => {}); }); }
  idx = idx % list.length; el.src = list[idx]!; el.loop = list.length === 1; el.volume = 0;
  void el.play().then(() => ramp(VOL)).catch(() => {});
}
function sync() {
  const want = active && !(typeof document !== "undefined" && document.hidden) ? moodAt() : null;
  if (want === mood) { if (want && el?.paused) void el.play().catch(() => {}); return; }
  mood = want;
  if (el && !el.paused) ramp(0, () => { el!.pause(); if (want) play(want); });
  else if (want) play(want);
}
/** Call with (soundOn && musicOn); the first "true" must come from a user gesture (autoplay rules). */
export function setMusic(on: boolean) {
  active = on; sync();
  if (on && !timer) timer = window.setInterval(sync, 15000);
  if (!on) { clearInterval(timer); timer = 0; }
}
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (el && document.hidden) { el.pause(); mood = null; } else sync(); });
