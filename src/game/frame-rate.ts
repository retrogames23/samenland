/**
 * Frame pacing for the world canvas (battery): the loop runs on the display's refresh rate, so a 120 Hz screen drew
 * 120 frames a second. Animation is a pure function of the shared clock, so skipping frames only lowers the cadence.
 * Active (input within IDLE_AFTER_MS): at most ACTIVE_FPS; resting: at most IDLE_FPS; one touch wakes it at once.
 */
export const ACTIVE_FPS = 60;
export const IDLE_FPS = 30;
export const IDLE_AFTER_MS = 5000;
/** Display refresh intervals jitter by a millisecond or two; a frame that early still counts as due. */
const SLACK_MS = 2;

export const frameInterval = (fps: number) => 1000 / fps;

/** True when a frame should be drawn now (`lastDraw`/`lastInput` in performance.now() ms; `lastDraw` < 0 = never drawn). */
export function frameDue(now: number, lastDraw: number, lastInput: number, busy = false): boolean {
  if (lastDraw < 0) return true;
  const fps = busy || now - lastInput < IDLE_AFTER_MS ? ACTIVE_FPS : IDLE_FPS;
  return now - lastDraw >= frameInterval(fps) - SLACK_MS;
}
