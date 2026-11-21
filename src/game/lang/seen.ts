import type { Lang } from "../i18n";

/** "Last seen in town" hint (profile + island register): unobtrusive wording, whole days only. */
type Text = { label: string; today: string; yesterday: string; days: (n: number) => string; weeks: string };
export const SEEN: Record<Lang, Text> = {
  de: { label: "Zuletzt im Ort", today: "heute", yesterday: "gestern", days: (n) => `vor ${n} Tagen`, weeks: "seit Wochen nicht gesehen" },
  en: { label: "Last seen in town", today: "today", yesterday: "yesterday", days: (n) => `${n} days ago`, weeks: "not seen for weeks" },
  fr: { label: "Dernière visite au village", today: "aujourd'hui", yesterday: "hier", days: (n) => `il y a ${n} jours`, weeks: "absent depuis des semaines" },
  es: { label: "Última visita al pueblo", today: "hoy", yesterday: "ayer", days: (n) => `hace ${n} días`, weeks: "sin verse desde hace semanas" },
  ar: { label: "آخر زيارة للبلدة", today: "اليوم", yesterday: "أمس", days: (n) => `قبل ${n} أيام`, weeks: "لم يُرَ منذ أسابيع" },
  hi: { label: "गाँव में अंतिम बार", today: "आज", yesterday: "कल", days: (n) => `${n} दिन पहले`, weeks: "कई हफ़्तों से नहीं दिखे" },
  zh: { label: "上次到访", today: "今天", yesterday: "昨天", days: (n) => `${n}天前`, weeks: "已数周未见" },
  ja: { label: "最後の訪問", today: "今日", yesterday: "昨日", days: (n) => `${n}日前`, weeks: "数週間見かけていません" },
};
