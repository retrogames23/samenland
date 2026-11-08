import type { Lang } from "../i18n";

/** Names of the three quest tracks (build, community, faith), in TRACKS order. */
export const TRACK_NAMES: Record<Lang, readonly [string, string, string]> = {
  de: ["Bau & Siedlung", "Gemeinschaft", "Andacht"],
  en: ["Building & growth", "Community", "Devotion"],
  fr: ["Bâtir & grandir", "Communauté", "Dévotion"],
  es: ["Construcción y crecimiento", "Comunidad", "Devoción"],
  ar: ["البناء والنمو", "الجماعة", "العبادة"],
  hi: ["निर्माण और विकास", "समुदाय", "भक्ति"],
  zh: ["建设与发展", "邻里", "祈福"],
  ja: ["建設と発展", "共同体", "祈り"],
};
export const TRACK_ICONS = ["🔨", "🕊️", "🔔"] as const;
