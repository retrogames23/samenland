import { pickDecision } from "./decision-order";

const files = import.meta.glob<string>("@/assets/encounters/*.webp", { eager: true, import: "default" });
/** Painted scene per encounter key (plus "road" and "charter"), keyed by file name. */
export const ART: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(".webp", ""), url]),
);
export { pickDecision };
