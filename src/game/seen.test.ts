import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LANGS } from "./i18n";
import { SEEN_WEEKS_AFTER, seenBucket, seenText } from "./seen";

describe("Zuletzt im Ort (Aktivitäts-Hinweis)", () => {
  it("buckets whole days: today, yesterday, n days, weeks", () => {
    expect(seenBucket(0)).toEqual({ kind: "today" });
    expect(seenBucket(1)).toEqual({ kind: "yesterday" });
    expect(seenBucket(3)).toEqual({ kind: "days", n: 3 });
    expect(seenBucket(SEEN_WEEKS_AFTER)).toEqual({ kind: "days", n: SEEN_WEEKS_AFTER });
    expect(seenBucket(SEEN_WEEKS_AFTER + 1)).toEqual({ kind: "weeks" });
    expect(seenBucket(90)).toEqual({ kind: "weeks" });
    expect(seenBucket(2.9)).toEqual({ kind: "days", n: 2 });
  });
  it("leaves the hint out when nothing is known", () => {
    for (const v of [null, undefined, -1, NaN, Infinity]) { expect(seenBucket(v as number)).toBeNull(); expect(seenText("de", v as number)).toBeNull(); }
  });
  it("German wording", () => {
    expect(seenText("de", 0)).toBe("Zuletzt im Ort: heute");
    expect(seenText("de", 1)).toBe("Zuletzt im Ort: gestern");
    expect(seenText("de", 3)).toBe("Zuletzt im Ort: vor 3 Tagen");
    expect(seenText("de", 30)).toBe("Zuletzt im Ort: seit Wochen nicht gesehen");
  });
  for (const l of LANGS) it(`${l} has a line for every bucket`, () => {
    const lines = [0, 1, 5, 40].map((d) => seenText(l, d));
    for (const x of lines) expect(x && x.length).toBeGreaterThan(4);
    expect(new Set(lines).size).toBe(4);
    expect(lines[2]).toContain("5");
  });
});

describe("village_last_seen (Migration 0131)", () => {
  const sql = readFileSync("drizzle/migrations/0131_village_last_seen.sql", "utf8");
  it("returns only seed id and a day count, never a user id or a timestamp", () => {
    const sig = /RETURNS TABLE \(([^)]*)\)/.exec(sql)![1]!;
    expect(sig).toMatch(/seed_id uuid/); expect(sig).toMatch(/days_ago integer/);
    expect(sig).not.toMatch(/user_id|timestamp/i);
  });
  it("is closed to anon and public, open to logged-in players, and the journal lists it", () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.village_last_seen\(uuid\[\]\) FROM public, anon/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.village_last_seen\(uuid\[\]\) TO authenticated/);
    expect(sql).toMatch(/auth\.uid\(\) IS NOT NULL/);
    expect(readFileSync("drizzle/migrations/meta/_journal.json", "utf8")).toContain("0131_village_last_seen");
  });
});
