import { describe, it, expect } from "vitest";
import { moodAt, songsOf } from "./music";
import daySong from "@/assets/music/day_builders_dance.mp3.asset.json";
import nightSong from "@/assets/music/night_last_candle_waning.mp3.asset.json";

// Berlin is UTC+1 in November (winter time), so these UTC instants have known world hours.
const at = (utc: string) => Date.parse(utc);
const utc = (day: string, hm: string) => at(`2026-11-${day}T${hm}:00Z`);

describe("Musik-Playlists", () => {
  it("bright hours play the day loop, dark hours the night loop", () => {
    expect(moodAt(utc("04", "12:00"))).toBe("day");   // 13:00 Berlin
    expect(moodAt(utc("04", "18:29"))).toBe("day");   // 19:29 Berlin, still light
    expect(moodAt(utc("04", "18:30"))).toBe("night"); // 19:30 Berlin, dusk crossfade
    expect(moodAt(utc("04", "22:00"))).toBe("night"); // 23:00 Berlin
    expect(moodAt(utc("05", "05:29"))).toBe("night"); // 06:29 Berlin
    expect(moodAt(utc("05", "05:30"))).toBe("day");   // 06:30 Berlin, dawn
  });
  it("The Builder's Dance leads the day loop, the night song leads the night loop", () => {
    expect(songsOf("day")[0]).toBe(daySong.url);
    expect(songsOf("night")[0]).toBe(nightSong.url);
    expect(songsOf("day")[0]).not.toBe(songsOf("night")[0]);
  });
});
