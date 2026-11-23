import type { Lang } from "../i18n";

type Text = {
  wood: string;
  stone: string;
  perDay: (n: string) => string;
  store: string;
  next: (time: string) => string;
  need: string;
  kontor: (what: string, price: string) => string;
  short: string;
};
/** Wood and stone (resources.ts), all eight languages. */
export const RESOURCE_T: Record<Lang, Text> = {
  de: {
    wood: "Holz",
    stone: "Stein",
    perDay: (n) => `+${n}/Tag`,
    store: "Lager",
    next: (t) => `Nächste Lieferung ${t}`,
    need: "Baustoff",
    kontor: (w, p) => `Fehlt: ${w} – Zukauf im Kontor für ${p}`,
    short: "Der Baustoff reicht nicht mehr. Bitte den Preis noch einmal prüfen.",
  },
  en: {
    wood: "Wood",
    stone: "Stone",
    perDay: (n) => `+${n}/day`,
    store: "Storage",
    next: (t) => `Next delivery ${t}`,
    need: "Materials",
    kontor: (w, p) => `Missing: ${w} – bought at the Kontor for ${p}`,
    short: "The materials no longer suffice. Please check the price again.",
  },
  fr: {
    wood: "Bois",
    stone: "Pierre",
    perDay: (n) => `+${n}/jour`,
    store: "Entrepôt",
    next: (t) => `Prochaine livraison ${t}`,
    need: "Matériaux",
    kontor: (w, p) => `Manque : ${w} – acheté au comptoir pour ${p}`,
    short: "Les matériaux ne suffisent plus. Veuillez vérifier le prix à nouveau.",
  },
  es: {
    wood: "Madera",
    stone: "Piedra",
    perDay: (n) => `+${n}/día`,
    store: "Almacén",
    next: (t) => `Próxima entrega ${t}`,
    need: "Materiales",
    kontor: (w, p) => `Falta: ${w} – se compra en el kontor por ${p}`,
    short: "Los materiales ya no alcanzan. Vuelve a comprobar el precio.",
  },
  ar: {
    wood: "خشب",
    stone: "حجر",
    perDay: (n) => `+${n}/يوم`,
    store: "المخزن",
    next: (t) => `التوريد القادم ${t}`,
    need: "مواد البناء",
    kontor: (w, p) => `ينقص: ${w} – يُشترى من الوكالة مقابل ${p}`,
    short: "مواد البناء لم تعد كافية. تحقّق من السعر مرة أخرى.",
  },
  hi: {
    wood: "लकड़ी",
    stone: "पत्थर",
    perDay: (n) => `+${n}/दिन`,
    store: "भंडार",
    next: (t) => `अगली आपूर्ति ${t}`,
    need: "निर्माण सामग्री",
    kontor: (w, p) => `कमी: ${w} – कोठी से ${p} में ख़रीद`,
    short: "सामग्री अब पर्याप्त नहीं है। कृपया कीमत फिर से जाँचें।",
  },
  zh: {
    wood: "木材",
    stone: "石料",
    perDay: (n) => `+${n}/天`,
    store: "仓储",
    next: (t) => `下次送达 ${t}`,
    need: "建材",
    kontor: (w, p) => `缺少：${w}——以 ${p} 向商栈补购`,
    short: "建材已不足。请重新查看价格。",
  },
  ja: {
    wood: "木材",
    stone: "石材",
    perDay: (n) => `+${n}/日`,
    store: "倉庫",
    next: (t) => `次の納品 ${t}`,
    need: "建材",
    kontor: (w, p) => `不足：${w}――商館で ${p} にて買い足し`,
    short: "建材が足りなくなりました。価格をもう一度確認してください。",
  },
};
