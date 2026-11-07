import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Minimal stand-in for the Web Audio API: every node/param accepts any call and chains.
const node = (): unknown => new Proxy(function () {}, {
  get: (_t, k) => (k === "then" ? undefined : k === "state" ? "running" : k === "currentTime" || k === "sampleRate" ? 1 : k === "getChannelData" ? () => new Float32Array(8) : node()),
  apply: () => node(),
  set: () => true,
});
let made = 0;
class FakeContext { constructor() { made++; return node() as object; } }

describe("soundscape clock", () => {
  beforeAll(() => {
    vi.stubGlobal("AudioContext", FakeContext);
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
  });
  afterAll(() => vi.unstubAllGlobals());

  it("starts on first enable, stops on dispose and comes back after a remount with the same context", async () => {
    const a = await import("./audio");
    a.setSound(true);
    expect(a.tickerRunning()).toBe(true);
    expect(made).toBe(1);
    a.disposeAudio(); // unmount
    expect(a.tickerRunning()).toBe(false);
    a.setSound(true); // remount: first pointerdown enables sound again
    expect(a.tickerRunning()).toBe(true);
    expect(made).toBe(1); // context reused, not rebuilt
  });

  it("never runs two clocks when enabled twice", async () => {
    const a = await import("./audio");
    const spy = vi.spyOn(window, "setInterval");
    a.setSound(true); a.setSound(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("muting keeps the clock but turns sound off; re-enabling works", async () => {
    const a = await import("./audio");
    a.setSound(false);
    expect(a.soundEnabled()).toBe(false);
    a.setSound(true);
    expect(a.soundEnabled()).toBe(true);
    expect(a.tickerRunning()).toBe(true);
  });
});
