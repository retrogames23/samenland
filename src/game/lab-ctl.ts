import { isLab } from "./time";
import type { WeatherKind } from "./weather";
import type { FeastCode } from "./feasts";
import type { Season } from "./season";

/**
 * Admin control desk for the test map only: local overrides (weather, feast) and event triggers
 * (wedding, fire, flood, raid) stored as game-clock moments in localStorage. Every getter returns
 * nothing outside the lab realm, so public maps are never affected.
 */
export type LabEvent = "wedding" | "fire" | "flood" | "raid";
type State = { weather?: WeatherKind | undefined; feast?: FeastCode | undefined; season?: Season | undefined; edge?: { core: number; grain: number } | undefined; ev: Partial<Record<LabEvent, number>> };
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
export const labSeason = (): Season | null => (isLab() && st.season) || null;
export const labEvent = (e: LabEvent): number | null => (isLab() && st.ev[e]) || null;

/** Pilot 3 prototype: forest core + fringe, test map only (null = current production look). */
export const labEdge = (): { core: number; grain: number; v2?: boolean } | null => (isLab() && st.edge) || null;
export function setLabEdge(e: { core: number; grain: number; v2?: boolean } | null) { st.edge = e ?? undefined; save(); }
export function setLabWeather(w: WeatherKind | null) { st.weather = w ?? undefined; save(); }
export function setLabSeason(x: Season | null) { st.season = x ?? undefined; save(); }
export function setLabFeast(f: FeastCode | null) { st.feast = f ?? undefined; save(); }
export function triggerLab(e: LabEvent, now: number) { st.ev[e] = now; save(); }
export function clearLabEvent(e: LabEvent) { delete st.ev[e]; save(); }
export function resetLab() { st = { ev: {} }; save(); }
