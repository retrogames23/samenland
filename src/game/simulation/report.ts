/** CLI: bun src/game/simulation/report.ts <inDir> <out.csv> — one summary row per scenario JSON. */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import type { SimResult } from "./types";
const [dir = "/tmp/sim-out", csv = "/tmp/sim-matrix.csv"] = process.argv.slice(2);
const cols = ["profile", "charter", "location", "way", "hansestadt", "strategyDone", "unlockedDone", "saturation", "idleDays", "afterHanseIdle", "population", "households",
  "gross", "tax", "dowry", "quest", "prince", "wonder", "visit", "raid", "spent", "volume", "lost", "lostShare", "taxShare", "firstOverflow", "regularOverflow", "overflowDays",
  "finalBalance", "taxPerDayAtHanse", "taxPerDayEnd", "incomePerDayAfterSat", "lostShareAfterSat", "remaining"];
const rows = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => {
  const r = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as SimResult, b = r.bySource;
  const at = (d: number | null) => (d === null ? "" : r.daily[d - 1]?.tax ?? "");
  const after = r.phases[2]!;
  return [r.profile, r.charter, r.location, r.way, r.hansestadtDay ?? "", r.strategyDoneDay ?? "", r.unlockedDoneDay ?? "", r.saturationDay ?? "", r.idleDays,
    r.hansestadtDay === null || r.saturationDay === null ? "" : r.days - r.hansestadtDay, r.population, r.households,
    r.gross, b["tax"] ?? 0, b["dowry"] ?? 0, b["quest"] ?? 0, b["prince"] ?? 0, b["wonder"] ?? 0, b["visit"] ?? 0, b["raid"] ?? 0, r.spent, r.volume, r.lost, r.lostShare, r.taxShare,
    r.firstOverflowDay ?? "", r.regularOverflowDay ?? "", r.overflowDays, r.finalBalance, at(r.hansestadtDay), r.daily.at(-1)!.tax,
    r.saturationDay === null ? "" : after.incomePerDay, r.saturationDay === null ? "" : after.lostShare, r.remaining.length].join(";");
});
writeFileSync(csv, [cols.join(";"), ...rows].join("\n"));
console.log(rows.length, "rows →", csv);
