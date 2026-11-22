import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Season stand-ins: while a new season key is recoloured in budgeted slices, the last finished seasonal
 * surface of the same image and role stays on screen — never the uncoloured summer original once a
 * seasonal version exists. Canvas and clock are faked: every clock read costs 10 ms, so each frame
 * (setArtTime) advances a job by exactly one 24-row slice and a 48-row image needs two frames.
 */
type Mod = typeof import("./season-art");
type Weather = typeof import("./season");

const WINTER = Date.UTC(2027, 0, 15, 12); // deep winter: weights fixed, only the snow cover changes the key
let art: Mod, season: Weather, cover = 0, clock = 0, T = WINTER;

const fakeCanvas = () => {
  const cv = { width: 0, height: 0, getContext: () => ({
    drawImage: () => {},
    getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(200) }),
    putImageData: () => {},
  }) };
  return cv;
};
const image = (h = 48) => ({ naturalWidth: 8, naturalHeight: h }) as unknown as HTMLImageElement;
const frame = () => art.setArtTime(T);
const ask = (im: HTMLImageElement, role: "leaf" | "ground" | "building" = "leaf") => art.seasonalImage(im, role);
/** Frames until the current key is finished; returns the finished surface. */
function finish(im: HTMLImageElement, role: "leaf" | "ground" | "building" = "leaf") {
  for (let i = 0; i < 50; i++) { frame(); const r = ask(im, role); if (!art.lastWasProvisional()) return r; }
  throw new Error("recolour never finished");
}

beforeEach(async () => {
  vi.resetModules();
  clock = 0; cover = 0; T = WINTER;
  vi.stubGlobal("document", { createElement: fakeCanvas });
  vi.spyOn(performance, "now").mockImplementation(() => (clock += 10));
  art = await import("./season-art");
  season = await import("./season");
  season.setSnowCoverFn(() => cover);
  frame();
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("seasonal stand-ins", () => {
  it("keeps the last finished season on screen while the next key is recoloured", () => {
    const im = image();
    const a = finish(im);
    expect(a).not.toBe(im);
    cover = 1; // snow cover step: new season key
    frame();
    const stand = ask(im);
    expect(art.lastWasProvisional()).toBe(true); // bakes still see a stand-in and do not cache it
    expect(stand).toBe(a); // never the uncoloured original
    const b = finish(im);
    expect(b).not.toBe(a);
    expect(b).not.toBe(im);
  });

  it("shows the original only when no seasonal version was ever finished", () => {
    const im = image();
    frame();
    expect(ask(im)).toBe(im);
    expect(art.lastWasProvisional()).toBe(true);
    expect(finish(im)).not.toBe(im);
  });

  it("rapid key changes keep the last finished surface and compute only the newest key", () => {
    const im = image(96); // four slices
    const a = finish(im);
    for (const c of [0.25, 0.5, 0.75]) {
      cover = c; frame();
      expect(ask(im)).toBe(a);
      expect(art.seasonArtStats().pending).toBeLessThanOrEqual(1); // superseded keys are dropped, not queued
    }
    cover = 1;
    const last = finish(im);
    expect(last).not.toBe(a);
    // the abandoned intermediate keys never complete behind the newest one
    for (let i = 0; i < 10; i++) frame();
    expect(art.seasonArtStats().pending).toBe(0);
    cover = 0.5; frame();
    expect(ask(im)).toBe(last); // fallback is the newest finished surface, not an older intermediate
  });

  it("a late older job can neither evict nor replace the newer finished surface", () => {
    const im = image(96), other = image(96);
    finish(im);
    cover = 0.25; frame(); ask(im); // job B starts, unfinished
    ask(other); // a second image keeps the queue busy
    cover = 0.5;
    const c = finish(im); // newer key C finishes
    for (let i = 0; i < 20; i++) frame(); // give any leftover job time to complete
    frame();
    expect(ask(im)).toBe(c); // C is still cached
    expect(art.lastWasProvisional()).toBe(false);
    cover = 1; frame();
    expect(ask(im)).toBe(c); // and C, not B, stands in for the next key
  });

  it("bounds the cache per image and never evicts the surface on screen", () => {
    const im = image(24);
    let prev: unknown = null;
    for (let i = 0; i <= 12; i++) {
      cover = i / 12; frame();
      if (prev) expect(ask(im)).toBe(prev); // fallback survives every eviction
      prev = finish(im);
      expect(art.seasonArtStats(im).cached).toBeLessThanOrEqual(art.ART_CACHE_PER_IMAGE);
    }
    // the per-role stand-in also survives when the same image is used under a second role
    const ground = finish(im, "ground");
    for (let i = 0; i < 8; i++) { cover = i / 8; finish(im); }
    cover = 0.123; frame();
    expect(ask(im, "ground")).toBe(ground);
    expect(art.seasonArtStats(im).cached).toBeLessThanOrEqual(art.ART_CACHE_PER_IMAGE);
  });

  it("forgets the stand-in once the original is the current look again (summer between winter and autumn)", () => {
    const im = image();
    const winter = finish(im, "building");
    expect(winter).not.toBe(im);
    T = Date.UTC(2027, 6, 15, 12); frame(); // summer: buildings need no recolour
    expect(ask(im, "building")).toBe(im);
    T = Date.UTC(2027, 9, 15, 12); frame(); // autumn: new key, nothing finished yet since summer
    expect(ask(im, "building")).toBe(im); // the summer original, not last winter's snow roofs
    expect(art.lastWasProvisional()).toBe(true);
  });
});
