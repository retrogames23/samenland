import { it } from "vitest";
import { forestShape, forestExtra } from "./forest-edge";
import { terrain } from "./world";
it("perf", () => {
  const run = (f: () => unknown) => { const t = performance.now(); for (let i = 0; i < 20; i++) f(); return (performance.now() - t) / 20; };
  for (const [x, y] of [[288, 416], [304, 400], [272, 432]] as const) {
    const a = run(() => forestExtra(x - 1, x + 16, y - 1, y + 16, terrain, { core: 0.75, grain: 2.5 }));
    const b = run(() => forestShape(x - 1, x + 16, y - 1, y + 16, terrain, { core: 0.75, grain: 2.5, v2: true }));
    console.log(`chunk ${x}:${y}  prototyp1 ${a.toFixed(3)} ms  iteration2 ${b.toFixed(3)} ms`);
  }
});
