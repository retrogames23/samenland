// Cozy founding-name suggestions: compound place names, skipping names already on the map.
const PRE = ["Linden","Hasel","Korn","Mühl","Eichen","Birken","Wiesen","Hopfen","Buchen","Tannen","Erlen","Eschen","Ahorn","Weiden","Falken","Finken","Lerchen","Rosen","Quell","Moos","Heide","Roggen","Hafer","Flachs","Holunder","Schlehen","Apfel","Kirsch","Brunnen","Stein","Sonnen","Nebel","Fichten","Kranich","Otter","Biber","Dachs","Hirsch","Kleeb","Distel"];
const SUF = ["au","brunn","hain","bach","tal","rode","winkel","feld","grund","wiese","heim","dorf","hausen","furt","stedt","berg","born","wald","horst","mühle"];

const norm = (s: string) => s.trim().toLocaleLowerCase();

export function allTownNames(): string[] {
  const out: string[] = [];
  for (const p of PRE) for (const s of SUF) {
    // avoid doubled letters like "Mühlmühle" or "Bachbach"
    if (norm(p).endsWith(s.slice(0, 3)) || norm(p).startsWith(s)) continue;
    out.push(p + s);
  }
  return out;
}

const POOL = allTownNames();

/** A random name not yet used on this map (case-insensitive); falls back to the full pool. */
export function suggestTownName(taken: Iterable<string>, rnd: () => number = Math.random, avoid?: string): string {
  const used = new Set([...taken].map(norm));
  if (avoid) used.add(norm(avoid));
  const free = POOL.filter((n) => !used.has(norm(n)));
  const list = free.length ? free : POOL;
  return list[Math.floor(rnd() * list.length)] ?? "Lindenau";
}
