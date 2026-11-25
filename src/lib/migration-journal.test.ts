// Drizzle runs a migration only if its journal `when` is later than the newest migration already applied
// (__drizzle_migrations.created_at). A migration whose `when` is not strictly later than every earlier entry is
// skipped without an error — e.g. 0153 if Lovable's companion 0152 lands with a later `when`. This test keeps the
// journal in a state where that cannot happen.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = new globalThis.URL("../../drizzle/migrations/", import.meta.url);
const journal = JSON.parse(readFileSync(new globalThis.URL("meta/_journal.json", dir), "utf8")) as {
  entries: { idx: number; when: number; tag: string }[];
};
const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
/** Older files without a journal entry (found 25.11.2026, not part of F-P2-1; to be clarified separately). */
const UNREGISTERED = [
  "0070_chat_dedupe.sql",
  "0108_referral_any_map.sql",
  "0134_encounters_free_without_effect.sql",
];

describe("drizzle migration journal", () => {
  it("indexes and `when` rise strictly in journal order", () => {
    const e = journal.entries;
    for (let i = 1; i < e.length; i++) {
      expect(e[i]!.idx, `${e[i]!.tag} after ${e[i - 1]!.tag}`).toBeGreaterThan(e[i - 1]!.idx);
      expect(e[i]!.when, `${e[i]!.tag} after ${e[i - 1]!.tag}`).toBeGreaterThan(e[i - 1]!.when);
    }
  });
  it("every journal entry has its file and every migration file has exactly one entry", () => {
    const tags = journal.entries.map((x) => x.tag);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags.filter((t) => !files.includes(`${t}.sql`))).toEqual([]);
    expect(
      files.filter((f) => !tags.includes(f.replace(/\.sql$/, "")) && !UNREGISTERED.includes(f)),
    ).toEqual([]);
  });
});
