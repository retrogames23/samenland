import type { Lang } from "./i18n";
import type { Realm } from "./time";

// Island names per map (proper names, shown next to the own town in the top bar).
export const ISLAND: Record<Realm | "lab", string> = {
  europe: "Altenland", "europe-2": "Elbwerder", "us-east": "Möwenwerder", "us-west": "Westeroog", asia: "Sandwerder", lab: "Tüftelgrund",
};
const ON: Record<Lang, (n: string) => string> = {
  de: (n) => `auf ${n}`, en: (n) => `on ${n}`, fr: (n) => `sur ${n}`, es: (n) => `en ${n}`,
  ar: (n) => `في ${n}`, hi: (n) => `${n} पर`, zh: (n) => `· ${n}岛`, ja: (n) => `· ${n}島`,
};
export const onIsland = (lang: Lang, r: Realm | "lab") => ON[lang](ISLAND[r] ?? ISLAND.europe);
