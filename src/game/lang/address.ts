import type { Lang } from "../i18n";

/** Mayor's gender choice: m, w or d (neutral); null = hashed fallback (treated as m in texts). */
export type Gender = "m" | "w" | "d" | null | undefined;
/** From this settlement rank (Kleinstadt, Amtshaus) the head of the place is addressed as mayor of a town. */
export const TOWN_ADDRESS_RANK = 3;

type DeForm = { g: "m" | "f" | "n"; nom: string; obl: string; gen: string };
const DE: Record<"m" | "w" | "d", [DeForm, DeForm]> = {
  m: [{ g: "m", nom: "Schulze", obl: "Schulzen", gen: "Schulzen" }, { g: "m", nom: "Bürgermeister", obl: "Bürgermeister", gen: "Bürgermeisters" }],
  w: [{ g: "f", nom: "Schulzin", obl: "Schulzin", gen: "Schulzin" }, { g: "f", nom: "Bürgermeisterin", obl: "Bürgermeisterin", gen: "Bürgermeisterin" }],
  d: [{ g: "n", nom: "Dorfoberhaupt", obl: "Dorfoberhaupt", gen: "Dorfoberhaupts" }, { g: "n", nom: "Stadtoberhaupt", obl: "Stadtoberhaupt", gen: "Stadtoberhaupts" }],
};

/** The plain word for the head of a place (cards, roll, menus). */
const WORD: Record<Lang, Record<"m" | "w" | "d", [string, string]>> = {
  de: { m: ["Schulze", "Bürgermeister"], w: ["Schulzin", "Bürgermeisterin"], d: ["Dorfoberhaupt", "Stadtoberhaupt"] },
  en: { m: ["Reeve", "Mayor"], w: ["Reeve", "Mayor"], d: ["Village head", "Town head"] },
  fr: { m: ["Maire", "Maire"], w: ["Mairesse", "Mairesse"], d: ["Chef du village", "Chef de la ville"] },
  es: { m: ["Alcalde", "Alcalde"], w: ["Alcaldesa", "Alcaldesa"], d: ["Cabeza de la aldea", "Cabeza de la villa"] },
  ar: { m: ["عمدة", "عمدة المدينة"], w: ["عمدة", "عمدة المدينة"], d: ["رأس القرية", "رأس المدينة"] },
  hi: { m: ["मुखिया", "नगर-प्रमुख"], w: ["मुखिया", "नगर-प्रमुख"], d: ["ग्राम-प्रधान", "नगर-प्रधान"] },
  zh: { m: ["村长", "市长"], w: ["村长", "市长"], d: ["村首", "城首"] },
  ja: { m: ["村長", "町長"], w: ["村長", "町長"], d: ["村の長", "町の長"] },
};

const key = (g: Gender): "m" | "w" | "d" => (g === "w" ? "w" : g === "d" ? "d" : "m");
const town = (rank: number) => (rank >= TOWN_ADDRESS_RANK ? 1 : 0);

/** Word for the mayor by gender and real settlement rank (never stored). */
export function mayorWord(lang: Lang, g: Gender, rank: number): string {
  return (WORD[lang] ?? WORD.en)[key(g)][town(rank)];
}

function deRules(f: DeForm): [RegExp, string][] {
  const art = (m: string, fem: string, n: string) => (f.g === "m" ? m : f.g === "f" ? fem : n);
  return [
    [/\bder Herr Schulze\b/g, art(`der Herr ${f.nom}`, `die Frau ${f.nom}`, `das ${f.nom}`)],
    [/\bHerr Schulze\b/g, art(`Herr ${f.nom}`, `Frau ${f.nom}`, f.nom)],
    [/\bdes Schulzen\b/g, art(`des ${f.gen}`, `der ${f.nom}`, `des ${f.gen}`)],
    [/\bdeines Schulzen\b/g, art(`deines ${f.gen}`, `deiner ${f.nom}`, `deines ${f.gen}`)],
    [/\bvom Schulzen\b/g, art(`vom ${f.obl}`, `von der ${f.nom}`, `vom ${f.obl}`)],
    [/\bdem Schulzen\b/g, art(`dem ${f.obl}`, `der ${f.nom}`, `dem ${f.obl}`)],
    [/\bdeinem Schulzen\b/g, art(`deinem ${f.obl}`, `deiner ${f.nom}`, `deinem ${f.obl}`)],
    [/\bden Schulzen\b/g, art(`den ${f.obl}`, `die ${f.nom}`, `das ${f.nom}`)],
    [/\b(ein|sein|dein)en Schulzen\b/g, art(`$1en ${f.obl}`, `$1e ${f.nom}`, `$1 ${f.nom}`)],
    [/\b([Dd])er beste Schulze\b/g, art(`$1er beste ${f.nom}`, `$1ie beste ${f.nom}`, `$1as beste ${f.nom}`)],
    [/\b([Dd])er Schulze\b/g, art(`$1er ${f.nom}`, `$1ie ${f.nom}`, `$1as ${f.nom}`)],
    [/\b([Ee])in Schulze\b/g, art(`$1in ${f.nom}`, `$1ine ${f.nom}`, `$1in ${f.nom}`)],
    [/\b([Jj])eder Schulze\b/g, art(`$1eder ${f.nom}`, `$1ede ${f.nom}`, `$1edes ${f.nom}`)],
    [/\bechter Schulze\b/g, art(`echter ${f.nom}`, `echte ${f.nom}`, `echtes ${f.nom}`)],
    [/\bSchulzen\b/g, f.obl],
    [/\bSchulze\b/g, f.nom],
  ];
}

/** Lines about other players' or a town's own head stay as written: they never address the player. */
const KEEP_DE = /\b(Unsere?n?|unsere?n?|[Ff]remde[rn]?|anderen|anderer|Goldene)\s+Schulze[n]?\b/g;

/**
 * Lines where villagers speak of their own head ("Unser Schulze …", "unseren Schulzen") follow that
 * place's gender and real rank. Apply after addressMayor; display only.
 */
export function ownHead(text: string, lang: Lang, g: Gender, rank: number): string {
  const k = key(g), tw = town(rank);
  if (lang === "de") {
    const f = DE[k][tw], fem = f.g === "f";
    return text
      .replace(/\b([Uu])nser Schulze\b/g, (_, u) => `${u}nser${fem ? "e" : ""} ${f.nom}`)
      .replace(/\b([Uu])nseren Schulzen\b/g, (_, u) => `${u}nsere${fem ? "" : f.g === "n" ? "s" : "n"} ${f.g === "m" ? f.obl : f.nom}`);
  }
  if (lang === "en") return text.replace(/\b([Oo])ur mayor\b/g, `$1ur ${k === "d" ? (tw ? "town head" : "village head") : tw ? "mayor" : "reeve"}`);
  if (lang === "fr") return text.replace(/\bNotre maire\b/g, k === "w" ? "Notre mairesse" : k === "d" ? `Notre ${tw ? "chef de la ville" : "chef du village"}` : "Notre maire");
  if (lang === "es") return text.replace(/\bNuestro alcalde\b/g, k === "w" ? "Nuestra alcaldesa" : k === "d" ? `Nuestra ${tw ? "cabeza de la villa" : "cabeza de la aldea"}` : "Nuestro alcalde");
  return text;
}

/**
 * Addresses the player's own head of the place in default (male village) texts: swaps the words for the
 * chosen gender (m/w/d) and from Kleinstadt on for the town title. Display only, derived from gender + townRank.
 */
export function addressMayor(text: string, lang: Lang, g: Gender, rank: number): string {
  const k = key(g), tw = town(rank);
  if (k === "m" && !tw) return text;
  if (lang === "de") {
    const kept: string[] = [];
    let out = text.replace(KEEP_DE, (m) => { kept.push(m); return `\u0000${kept.length - 1}\u0000`; });
    for (const [re, to] of deRules(DE[k][tw])) out = out.replace(re, to);
    return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]!);
  }
  if (lang === "en") {
    if (k === "d") { const w = tw ? "town head" : "village head"; return text.replace(/\b(reeve|mayor|headman)\b/g, w).replace(/\b(Reeve|Mayor|Headman)\b/g, w[0]!.toUpperCase() + w.slice(1)); }
    return tw ? text.replace(/\b(reeve|headman)\b/g, "mayor").replace(/\b(Reeve|Headman)\b/g, "Mayor") : text;
  }
  if (lang === "fr") {
    if (k === "w") return text.replace(/\b([Ll])e maire\b/g, "$1a mairesse").replace(/\bdu maire\b/g, "de la mairesse").replace(/\bau maire\b/g, "à la mairesse").replace(/\bmaire\b/g, "mairesse").replace(/\bMaire\b/g, "Mairesse");
    if (k === "d") { const w = tw ? "chef de la ville" : "chef du village"; return text.replace(/\bmaire\b/g, w).replace(/\bMaire\b/g, w[0]!.toUpperCase() + w.slice(1)); }
    return text;
  }
  if (lang === "es") {
    if (k === "w") return text.replace(/\b([Ee])l alcalde\b/g, (_, e) => (e === "E" ? "La" : "la") + " alcaldesa").replace(/\bdel alcalde\b/g, "de la alcaldesa").replace(/\bal alcalde\b/g, "a la alcaldesa").replace(/\balcalde\b/g, "alcaldesa").replace(/\bAlcalde\b/g, "Alcaldesa");
    if (k === "d") { const w = tw ? "cabeza de la villa" : "cabeza de la aldea"; return text.replace(/\balcalde\b/g, w).replace(/\bAlcalde\b/g, w[0]!.toUpperCase() + w.slice(1)); }
    return text;
  }
  if (lang === "ar") return k === "d" ? text.replace(/عمدة/g, tw ? "رأس المدينة" : "رأس القرية") : tw ? text.replace(/عمدة(?! المدينة)/g, "عمدة المدينة") : text;
  if (lang === "hi") return k === "d" ? text.replace(/मुखिया/g, tw ? "नगर-प्रधान" : "ग्राम-प्रधान") : tw ? text.replace(/मुखिया/g, "नगर-प्रमुख") : text;
  if (lang === "zh") return k === "d" ? text.replace(/村长/g, tw ? "城首" : "村首") : tw ? text.replace(/村长/g, "市长") : text;
  if (lang === "ja") return k === "d" ? text.replace(/村長/g, tw ? "町の長" : "村の長") : tw ? text.replace(/村長/g, "町長") : text;
  return text;
}

/** Female and neutral forms of the honorary titles (Amt & Würden) per charter path; missing forms fall back to the male one. Latin offices stay as written. */
const TITLE_FORMS: Partial<Record<Lang, Partial<Record<"w" | "d", Record<string, (string | undefined)[]>>>>> = {
  de: {
    w: { trade: ["Ratsfrau der Gilde", "Älterfrau des Kontors", "Ratssendbotin zum Hansetag"], craft: ["Zunftälteste", "Obermeisterin der Bauhütte", "Oberälteste der Ämter"], farm: ["Flurvögtin", "Erbdrostin der Kornmark", "Landeshauptfrau"] },
    d: { trade: ["Ratsmitglied der Gilde"], craft: ["Zunftältestes Mitglied"] },
  },
  fr: { w: { trade: ["Conseillère de la guilde"], craft: ["Doyenne de la guilde"] } },
  es: { w: { trade: ["Consejera del gremio"], craft: ["Decana del gremio"] } },
};
/** Honorary title in the chosen gender form, falling back to the male (given) name. */
export function titleForm(lang: Lang, g: Gender, path: string, k: number, male: string): string {
  const gk = key(g);
  if (gk === "m") return male;
  return TITLE_FORMS[lang]?.[gk]?.[path]?.[k] ?? male;
}
