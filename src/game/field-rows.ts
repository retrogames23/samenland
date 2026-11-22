/**
 * Field look helpers (display only): bake resolution per zoom and the world-anchored layout of crop rows. Used by
 * render.ts (flat cache, drawFieldRows); nothing here reads or changes fields, yields or seasons.
 */
import { hash } from "./world";

/** Rows per tile: six, at (k + 0.5) / 6 for k = -3..2 — period exactly one tile, so neighbouring tiles' rows meet. */
export const ROWS_PER_TILE = 6;
/** Row look repeats every 24 lines (4 tiles across) and every strip length (2.2 tiles along): one small pre-composed
 *  surface per look then covers any acre with a single world-anchored fill. Every third line is a ridge furrow. */
export const ROW_PERIOD = 24, ROW_ALONG = 2.2, RIDGE = 3;
/** World offset of row line ℓ across its axis, in tiles (line ℓ = tile·6 + k + 3 sits at (k + 0.5) / 6). */
export const lineOffset = (line: number) => (line - ROWS_PER_TILE / 2 + 0.5) / ROWS_PER_TILE;
export const rowOffsets = () => Array.from({ length: ROWS_PER_TILE }, (_, i) => (i - ROWS_PER_TILE / 2 + 0.5) / ROWS_PER_TILE);
/** Strip phase (px) of one continuous row line: the same for every tile the line crosses, different between lines. */
export const rowPhase = (line: number, along: boolean) => hash(((line % ROW_PERIOD) + ROW_PERIOD) % ROW_PERIOD, along ? 1 : 2, 1201) * 1024;
/** A row line's own height factor (sown by hand: rows differ a little), the same in every tile it crosses. */
export const rowHeightFactor = (line: number, along: boolean) => 0.9 + 0.2 * hash(((line % ROW_PERIOD) + ROW_PERIOD) % ROW_PERIOD, along ? 3 : 4, 1203);
/** Flat-cache bake resolution for a zoom (screen px per world unit, dpr included) — unchanged from before P5: raising
 *  it was measured to cost frame time and cache memory (larger chunks fit the byte budget less often, so more acres
 *  were drawn live). Field crispness comes from the composed row surfaces instead. */
export const flatQ = (z: number, qmax: number) => Math.min(qmax, z > 3.2 ? 4 : z > 1.6 ? 2.5 : z > 0.6 ? 1 : 0.5);
