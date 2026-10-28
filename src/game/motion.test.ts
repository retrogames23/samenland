import { describe, expect, it } from "vitest";
import { pathHeading, pathPoint, roadMotion, screenFacing, type MotionPoint } from "./motion";

describe("travel directions", () => {
  const road: MotionPoint[] = Array.from({ length: 10 }, (_, i) => [i, 0]);
  it("turns at the last point without extrapolating", () => {
    expect(roadMotion(road, 9).position).toEqual([9, 0]);
    expect(roadMotion(road, 9.5).position).toEqual([8.5, 0]);
    for (let p = 0; p < 36; p += 0.125) {
      const q = roadMotion(road, p);
      expect(q.position[0]).toBeGreaterThanOrEqual(0);
      expect(q.position[0]).toBeLessThanOrEqual(9);
    }
  });
  it("reverses facing and motion on the return leg", () => {
    expect(roadMotion(road, 8.5).direction).toEqual([1, 0]);
    expect(roadMotion(road, 9.5).direction[0]).toBe(-1);
    expect(roadMotion(road, 9.6).position[0]).toBeLessThan(roadMotion(road, 9.5).position[0]);
  });
  it("does not flip at every step of a vertical staircase", () => {
    const stairs: MotionPoint[] = Array.from({ length: 20 }, (_, i) => [i % 2, i]);
    const faces = Array.from({ length: 40 }, (_, i) => {
      const [dx, dy] = pathHeading(stairs, 4 + i / 4);
      return screenFacing(dx, dy);
    });
    expect(new Set(faces)).toEqual(new Set([1]));
    const [dx, dy] = pathHeading(stairs, 8, false);
    expect(screenFacing(dx, dy)).toBe(-1);
  });
  it("handles both isometric tile axes and their return directions", () => {
    for (const points of [[[0, 0], [5, 0]], [[0, 0], [0, 5]]] as MotionPoint[][]) {
      const d = pathHeading(points, 0.5), r = pathHeading(points, 0.5, false);
      expect(screenFacing(d[0] - d[1], (d[0] + d[1]) / 2)).toBe(points[1]?.[0] ? 1 : -1);
      expect(r[0]).toBeCloseTo(-d[0]);
      expect(r[1]).toBeCloseTo(-d[1]);
    }
  });
  it("handles empty, stationary and clamped paths", () => {
    expect(pathPoint([], 1)).toEqual([0, 0]);
    expect(roadMotion([[2, 3]], 999).position).toEqual([2, 3]);
    expect(pathPoint(road, -1)).toEqual([0, 0]);
  });
});
describe("walkers heading b→a", () => {
  it("start at b and face towards a", () => {
    const road: MotionPoint[] = Array.from({ length: 10 }, (_, i) => [i * 10, i * 5]);
    const end = road.length - 1;
    const start = roadMotion(road, end + 0.5), mid = roadMotion(road, end + 4);
    expect(start.position[0]).toBeGreaterThan(mid.position[0]);
    expect(screenFacing(mid.direction[0], mid.direction[1])).toBe(-1);
  });
});
