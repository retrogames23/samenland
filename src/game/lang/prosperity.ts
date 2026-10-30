import type { Lang } from "../i18n";
import type { Estate } from "../prosperity";
type Text = { estates: Record<Estate, string>; tax: (n: number) => string; household: (n: number) => string };
export const PROSPERITY: Record<Lang, Text> = {
  de: { estates: { ordinary: "Einfache Bürger", skilled: "Facharbeiter", wealthy: "Wohlhabende Bürger" }, tax: n => `Steuerbeitrag: ${n} Taler pro Tag`, household: n => `Haushalt: ${n} Taler pro Tag` },
  en: { estates: { ordinary: "Ordinary citizens", skilled: "Skilled workers", wealthy: "Wealthy citizens" }, tax: n => `Tax contribution: ${n} Taler per day`, household: n => `Household: ${n} Taler per day` },
  fr: { estates: { ordinary: "Citoyens modestes", skilled: "Ouvriers qualifiés", wealthy: "Citoyens aisés" }, tax: n => `Contribution fiscale : ${n} thalers par jour`, household: n => `Foyer : ${n} thalers par jour` },
  es: { estates: { ordinary: "Ciudadanos humildes", skilled: "Trabajadores cualificados", wealthy: "Ciudadanos acomodados" }, tax: n => `Contribución fiscal: ${n} táleros al día`, household: n => `Hogar: ${n} táleros al día` },
  ar: { estates: { ordinary: "مواطنون بسطاء", skilled: "عمّال مهرة", wealthy: "مواطنون ميسورون" }, tax: n => `المساهمة الضريبية: ${n} تالر يوميًا`, household: n => `الأسرة: ${n} تالر يوميًا` },
  hi: { estates: { ordinary: "साधारण नागरिक", skilled: "कुशल कामगार", wealthy: "समृद्ध नागरिक" }, tax: n => `कर योगदान: प्रतिदिन ${n} टालर`, household: n => `परिवार: प्रतिदिन ${n} टालर` },
  zh: { estates: { ordinary: "普通居民", skilled: "熟练工匠", wealthy: "富裕市民" }, tax: n => `税收贡献：每天 ${n} 塔勒`, household: n => `家庭：每天 ${n} 塔勒` },
  ja: { estates: { ordinary: "一般市民", skilled: "熟練職人", wealthy: "裕福な市民" }, tax: n => `納税額：1日 ${n} ターラー`, household: n => `世帯：1日 ${n} ターラー` },
};