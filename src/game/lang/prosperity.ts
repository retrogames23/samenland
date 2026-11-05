import type { Lang } from "../i18n";
import type { Estate } from "../prosperity";
type Text = { estates: Record<Estate, string>; tax: (n: number) => string; household: (n: number) => string };
export const PROSPERITY: Record<Lang, Text> = {
  de: { estates: { ordinary: "Einfache Bürger", skilled: "Zunfthandwerker", wealthy: "Wohlhabende Bürger" }, tax: n => `Steuerbeitrag: ${n} Mark pro Tag`, household: n => `Haushalt: ${n} Mark pro Tag` },
  en: { estates: { ordinary: "Ordinary citizens", skilled: "Skilled workers", wealthy: "Wealthy citizens" }, tax: n => `Tax contribution: ${n} Mark per day`, household: n => `Household: ${n} Mark per day` },
  fr: { estates: { ordinary: "Citoyens modestes", skilled: "Ouvriers qualifiés", wealthy: "Citoyens aisés" }, tax: n => `Contribution fiscale : ${n} marks par jour`, household: n => `Foyer : ${n} marks par jour` },
  es: { estates: { ordinary: "Ciudadanos humildes", skilled: "Trabajadores cualificados", wealthy: "Ciudadanos acomodados" }, tax: n => `Contribución fiscal: ${n} marcos al día`, household: n => `Hogar: ${n} marcos al día` },
  ar: { estates: { ordinary: "مواطنون بسطاء", skilled: "عمّال مهرة", wealthy: "مواطنون ميسورون" }, tax: n => `المساهمة الضريبية: ${n} مارك يوميًا`, household: n => `الأسرة: ${n} مارك يوميًا` },
  hi: { estates: { ordinary: "साधारण नागरिक", skilled: "कुशल कामगार", wealthy: "समृद्ध नागरिक" }, tax: n => `कर योगदान: प्रतिदिन ${n} मार्क`, household: n => `परिवार: प्रतिदिन ${n} मार्क` },
  zh: { estates: { ordinary: "普通居民", skilled: "熟练工匠", wealthy: "富裕市民" }, tax: n => `税收贡献：每天 ${n} 马克`, household: n => `家庭：每天 ${n} 马克` },
  ja: { estates: { ordinary: "一般市民", skilled: "熟練職人", wealthy: "裕福な市民" }, tax: n => `納税額：1日 ${n} マルク`, household: n => `世帯：1日 ${n} マルク` },
};