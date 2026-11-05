import { worldHour, clock } from "./time";
import nightSong from "@/assets/music/night_last_candle_waning.mp3.asset.json";
import daySong from "@/assets/music/day_builders_dance.mp3.asset.json";
import daySong2 from "@/assets/music/day_cobblestone_and_crowds.mp3.asset.json";
import nightSong2 from "@/assets/music/night_embers_of_the_hearth.mp3.asset.json";
import nightSong3 from "@/assets/music/night_moonlight_on_the_well.mp3.asset.json";
import nightSong4 from "@/assets/music/night_a_winter_vigil_in_the_keep.mp3.asset.json";
import daySong0 from "@/assets/music/day_currents_through_the_city_gate.mp3.asset.json";
import tavernSong from "@/assets/music/tavern_stein_auf_stein.mp3.asset.json";

/**
 * Background music: situation playlists picked from the shared world clock. Plays only while both
 * sound and music are on; crossfades via a plain <audio> element (streams, no full decode on phones).
 */
export type Mood = "day" | "night" | "tavern" | null;
const PLAYLISTS: Record<Exclude<Mood, null>, string[]> = {
  day: [daySong0.url, daySong.url, daySong2.url],
  night: [nightSong.url, nightSong2.url, nightSong3.url, nightSong4.url],
  tavern: [tavernSong.url],
};
let inTavern = false;
/** While the tavern window is open its own song overrides the clock playlist (still silent if music is off). */
export function setTavernMusic(open: boolean) {
  if (inTavern === open) return;
  inTavern = open; sync();
}

/** Which playlist the world clock calls for: dark = evening/night, light = daytime (dusk/dawn ramps of the sky tint). */
export function moodAt(now = clock()): Mood {
  const h = worldHour(now);
  return h >= 19.5 || h < 6.5 ? "night" : "day";
}

/** Songs waiting in a mood's loop (first entry plays first). */
export function songsOf(m: Exclude<Mood, null>): string[] {
  return PLAYLISTS[m];
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
  const want = active ? (inTavern ? "tavern" : moodAt()) : null;
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
// Music keeps playing in background tabs (like a radio); only the sound effects suspend there.
