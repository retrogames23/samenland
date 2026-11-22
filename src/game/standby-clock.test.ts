import { describe, it, expect, beforeEach } from "vitest";
import {
  _setPerfSource,
  initTimeSync,
  getSyncedTime,
  syncServerTime,
  wakeSync,
  SLEEP_GAP,
} from "./time";

// Phones stop performance.now() in standby, the system clock keeps running. After waking up the game clock must
// show the real hour at once, not the night it fell asleep in until the server answers.
const T0 = 1_800_000_000_000,
  HOUR = 3.6e6;
let p = 0,
  w = 0;
const sleep = (ms: number) => {
  w += ms;
}; // perf stands still, system clock runs on
const run = (ms: number) => {
  p += ms;
  w += ms;
};
beforeEach(() => {
  p = 1000;
  w = 5e12;
  _setPerfSource(
    () => p,
    () => w,
  );
  initTimeSync(T0);
});

describe("game clock after standby", () => {
  it("jumps to the real time on the first frame after waking, before any server answer", () => {
    run(16);
    expect(getSyncedTime()).toBe(T0 + 16);
    sleep(10 * HOUR);
    expect(getSyncedTime()).toBe(T0 + 16 + 10 * HOUR);
    run(1000);
    expect(getSyncedTime()).toBe(T0 + 1016 + 10 * HOUR);
  });
  it("a wrongly set device clock does not matter: only the elapsed time counts", () => {
    w = 123;
    _setPerfSource(
      () => p,
      () => w,
    );
    initTimeSync(T0); // device clock decades off
    sleep(2 * HOUR);
    expect(getSyncedTime()).toBe(T0 + 2 * HOUR);
  });
  it("short hiccups and a backwards system clock change nothing", () => {
    sleep(SLEEP_GAP);
    expect(getSyncedTime()).toBe(T0);
    w -= HOUR;
    run(500);
    expect(getSyncedTime()).toBe(T0 + 500);
  });
  it("the server answer after waking only fine-tunes, it never pulls the clock back", async () => {
    sleep(6 * HOUR);
    expect(getSyncedTime()).toBe(T0 + 6 * HOUR);
    const answer = async () => {
      run(1500);
      return { serverTime: T0 + 6 * HOUR + 1200 };
    };
    expect(await wakeSync(answer)).toBe(true);
    expect(getSyncedTime()).toBe(T0 + 6 * HOUR + 1200 + 750);
  });
  it("an answer requested before the sleep is dropped instead of slowing the clock for hours", async () => {
    const stale = async () => {
      run(100);
      sleep(8 * HOUR);
      run(100);
      return { serverTime: T0 + 100 };
    };
    expect(await syncServerTime(stale)).toBe(false);
    expect(getSyncedTime()).toBe(T0 + 200 + 8 * HOUR);
    run(1000);
    expect(getSyncedTime()).toBe(T0 + 1200 + 8 * HOUR); // normal speed, no slew
  });
});
