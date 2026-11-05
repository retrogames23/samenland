import { isLab } from "./time";
import type { WeatherKind } from "./weather";
import type { FeastCode } from "./feasts";

/**
 * Admin control desk for the test map only: local overrides (weather, feast) and event triggers
 * (wedding, fire, flood, raid) stored as game-clock moments in localStorage. Every getter returns
 * nothing outside the lab realm, so public maps are never affected.
 */
export type LabEvent = "wedding" | "fire" | "flood" | "raid";
type State = { weather?: WeatherKind; feast?: FeastCode; ev: Partial<Record<LabEvent, number>> };
const KEY = "samenland-lab-ctl";
let st: State = { ev: {} };
if (typeof localStorage !== "undefined") {
  try { st = { ev: {}, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { /* ignore */ }
}
let ver = 0;
const save = () => { ver++; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ } };

export const labVersion = () => ver;
export const labState = () => st;
export const labWeather = (): WeatherKind | null => (isLab() && st.weather) || null;
export const labFeast = (): FeastCode | null => (isLab() && st.feast) || null;
export const labEvent = (e: LabEvent): number | null => (isLab() && st.ev[e]) || null;

export function setLabWeather(w: WeatherKind | null) { st.weather = w ?? undefined; save(); }
export function setLabFeast(f: FeastCode | null) { st.feast = f ?? undefined; save(); }
export function triggerLab(e: LabEvent, now: number) { st.ev[e] = now; save(); }
export function clearLabEvent(e: LabEvent) { delete st.ev[e]; save(); }
export function resetLab() { st = { ev: {} }; save(); }
