import { describe, it, expect } from "vitest";
import { readBodies, toFetch, bodyView } from "./letter-bodies";

// Laird_Thomas (Mondwahn): every guestbook entry said "sealed" although all three letters were stored for him.
// One failed chunk aborted the whole read, nothing caught or retried it, and a missing text read as "sealed".
type Rows = { letter_id: string; body: string }[];
const fake = (rows: Rows, failChunk = -1) => {
  let n = 0;
  return (c: string[]) => {
    const k = n++;
    const sel = rows.filter((r) => c.includes(r.letter_id));
    const b = {
      gt: () => b,
      or: () => b,
      order: () => b,
      limit: () =>
        Promise.resolve(
          k === failChunk
            ? { data: null, error: { message: "timeout" } }
            : { data: sel, error: null },
        ),
    };
    return b;
  };
};

describe("letter bodies", () => {
  const ids = Array.from({ length: 438 }, (_, i) => `l${i}`);
  const rows = ids
    .filter((_, i) => i % 7 === 0)
    .map((id) => ({ letter_id: id, body: `text ${id}` }));

  it("reads across chunks and marks ids the server does not return as failed", async () => {
    const r = await readBodies(ids, fake(rows));
    expect(Object.keys(r.got)).toHaveLength(rows.length);
    expect(r.got["l7"]).toBe("text l7");
    expect(r.failed).toHaveLength(ids.length - rows.length);
  });

  it("a failed chunk no longer throws: all asked ids are marked failed", async () => {
    const r = await readBodies(ids, fake(rows, 1));
    expect(r.got).toEqual({});
    expect(r.failed).toEqual(ids);
  });

  it("asks only for missing texts that are not on the way; failed ones only on retry", () => {
    const miss = { a: "loading", b: "failed" } as const;
    expect(toFetch(["a", "b", "c", "d", "c"], { d: "x" }, miss)).toEqual(["c"]);
    expect(toFetch(["a", "b", "c"], {}, miss, true)).toEqual(["b", "c"]);
  });

  it("a missing text shows as opening or failed, never as sealed", () => {
    expect(bodyView("a", { a: "Moin." }, {})).toEqual({ text: "Moin." });
    expect(bodyView("b", {}, {})).toEqual({ state: "loading" });
    expect(bodyView("b", {}, { b: "loading" })).toEqual({ state: "loading" });
    expect(bodyView("b", {}, { b: "failed" })).toEqual({ state: "failed" });
  });
});
