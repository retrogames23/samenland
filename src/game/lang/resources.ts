import type { Lang } from "../i18n";
import type { TownWay } from "../character";

type Text = {
  wood: string;
  stone: string;
  perDay: (n: string) => string;
  store: string;
  next: (time: string) => string;
  need: string;
  kontor: (what: string, price: string) => string;
  short: string;
  /** Steingrube (Paket 2): name and the build-menu description */
  quarry: string;
  quarryText: string;
  build: string;
  running: (stone: string) => string;
  paid: string;
  sites: Record<TownWay, string>;
  coast: string;
};
/** Wood, stone and the Steingrube (resources.ts), all eight languages. */
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
    quarry: "Steingrube",
    quarryText:
      "Eine Steingrube fördert täglich zusätzlichen Stein. Die Fördermenge hängt vom Standort deines Dorfes ab.",
    build: "Steingrube anlegen",
    running: (s) => `Steingrube in Betrieb: +${s} Stein/Tag`,
    paid: "Die Steingrube ist angelegt. Ab dem nächsten Morgen liefert sie Stein.",
    sites: { grain: "Binnenland", workshop: "Wald und Hügel", gateway: "Küste" },
    coast: "Küste: 10 % Nachlass im Kontor",
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
    quarry: "Stone pit",
    quarryText:
      "A stone pit yields extra stone every day. How much depends on where your village lies.",
    build: "Open the stone pit",
    running: (s) => `Stone pit at work: +${s} stone/day`,
    paid: "The stone pit is open. It delivers stone from tomorrow morning.",
    sites: { grain: "inland", workshop: "forest and hills", gateway: "coast" },
    coast: "Coast: 10 % off at the Kontor",
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
    quarry: "Carrière",
    quarryText:
      "Une carrière fournit chaque jour de la pierre en plus. La quantité dépend de l'emplacement de ton village.",
    build: "Ouvrir la carrière",
    running: (s) => `Carrière en service : +${s} pierres/jour`,
    paid: "La carrière est ouverte. Elle livre de la pierre dès demain matin.",
    sites: { grain: "intérieur des terres", workshop: "forêt et collines", gateway: "côte" },
    coast: "Côte : 10 % de remise au comptoir",
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
    quarry: "Cantera",
    quarryText:
      "Una cantera aporta piedra adicional cada día. La cantidad depende de la ubicación de tu aldea.",
    build: "Abrir la cantera",
    running: (s) => `Cantera en marcha: +${s} piedras/día`,
    paid: "La cantera está abierta. Entrega piedra desde mañana por la mañana.",
    sites: { grain: "interior", workshop: "bosque y colinas", gateway: "costa" },
    coast: "Costa: 10 % de descuento en el kontor",
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
    quarry: "مقلع حجارة",
    quarryText: "يُخرج مقلع الحجارة حجارة إضافية كل يوم. وتتوقف الكمية على موقع قريتك.",
    build: "افتح المقلع",
    running: (s) => `المقلع يعمل: +${s} حجر/يوم`,
    paid: "فُتح المقلع. يورّد الحجارة ابتداءً من صباح الغد.",
    sites: { grain: "الداخل", workshop: "الغابة والتلال", gateway: "الساحل" },
    coast: "الساحل: خصم 10 % في الوكالة",
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
    quarry: "पत्थर की खदान",
    quarryText:
      "पत्थर की खदान रोज़ अतिरिक्त पत्थर निकालती है। मात्रा आपके गाँव के स्थान पर निर्भर करती है।",
    build: "खदान खोलें",
    running: (s) => `खदान चालू: +${s} पत्थर/दिन`,
    paid: "खदान खुल गई। कल सुबह से पत्थर आने लगेगा।",
    sites: { grain: "भीतरी इलाक़ा", workshop: "जंगल और पहाड़ियाँ", gateway: "तट" },
    coast: "तट: कोठी में 10 % छूट",
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
    quarry: "采石场",
    quarryText: "采石场每天额外产出石料。产量取决于你村庄的位置。",
    build: "开设采石场",
    running: (s) => `采石场运作中：+${s} 石料/天`,
    paid: "采石场已开设。明早起开始供应石料。",
    sites: { grain: "内陆", workshop: "森林与丘陵", gateway: "海岸" },
    coast: "海岸：商栈九折",
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
    quarry: "石切り場",
    quarryText: "石切り場は毎日、追加の石材を産出します。産出量は村の立地によって変わります。",
    build: "石切り場を開く",
    running: (s) => `石切り場が稼働中：+${s} 石材/日`,
    paid: "石切り場を開きました。明朝から石材が届きます。",
    sites: { grain: "内陸", workshop: "森と丘", gateway: "海岸" },
    coast: "海岸：商館で10%引き",
  },
};
