import type { Lang } from "@/game/i18n";

export type Animal = "boar" | "deer" | "sheep" | "cow" | "hen";
export type Effect = "noBuild" | "slope" | "wood" | "fish" | "fertile" | "shore" | "stone" | "planted";
type T = { animals: Record<Animal, string>; fx: Record<Effect, string> };

export const TILEINFO: Record<Lang, T> = {
  de: { animals: { boar: "Wildschwein", deer: "Reh", sheep: "Schafe", cow: "Kuh", hen: "Hühner" },
    fx: { noBuild: "nicht bebaubar", slope: "bebaubar · am Hang Gärten & Weiden statt Äcker", wood: "Holz & Wild", fish: "Fischgrund", fertile: "ertragreiche Äcker", shore: "Ufer", stone: "Steine für Maurer", planted: "geschützter Baum" } },
  en: { animals: { boar: "Wild boar", deer: "Deer", sheep: "Sheep", cow: "Cow", hen: "Hens" },
    fx: { noBuild: "not buildable", slope: "buildable · gardens & pastures instead of fields", wood: "timber & game", fish: "fishing ground", fertile: "rich fields", shore: "shore", stone: "stone for masons", planted: "protected tree" } },
  fr: { animals: { boar: "Sanglier", deer: "Chevreuil", sheep: "Moutons", cow: "Vache", hen: "Poules" },
    fx: { noBuild: "non constructible", slope: "constructible · jardins & pâturages au lieu de champs", wood: "bois & gibier", fish: "zone de pêche", fertile: "champs fertiles", shore: "rive", stone: "pierre pour maçons", planted: "arbre protégé" } },
  es: { animals: { boar: "Jabalí", deer: "Corzo", sheep: "Ovejas", cow: "Vaca", hen: "Gallinas" },
    fx: { noBuild: "no edificable", slope: "edificable · huertos y pastos en vez de campos", wood: "madera y caza", fish: "zona de pesca", fertile: "campos fértiles", shore: "orilla", stone: "piedra para canteros", planted: "árbol protegido" } },
  ar: { animals: { boar: "خنزير بري", deer: "غزال", sheep: "أغنام", cow: "بقرة", hen: "دجاج" },
    fx: { noBuild: "غير صالح للبناء", slope: "صالح للبناء · حدائق ومراعٍ بدل الحقول", wood: "خشب وصيد", fish: "مكان صيد سمك", fertile: "حقول خصبة", shore: "ضفة", stone: "حجارة للبنّائين", planted: "شجرة محمية" } },
  hi: { animals: { boar: "जंगली सूअर", deer: "हिरण", sheep: "भेड़ें", cow: "गाय", hen: "मुर्गियाँ" },
    fx: { noBuild: "निर्माण योग्य नहीं", slope: "निर्माण योग्य · खेतों के बजाय बगीचे और चरागाह", wood: "लकड़ी और शिकार", fish: "मछली क्षेत्र", fertile: "उपजाऊ खेत", shore: "तट", stone: "राजमिस्त्री के लिए पत्थर", planted: "संरक्षित पेड़" } },
  zh: { animals: { boar: "野猪", deer: "狍子", sheep: "羊群", cow: "奶牛", hen: "母鸡" },
    fx: { noBuild: "不可建造", slope: "可建造 · 以菜园与牧场代替农田", wood: "木材与猎物", fish: "渔场", fertile: "肥沃农田", shore: "岸边", stone: "石匠用石", planted: "受保护的树" } },
  ja: { animals: { boar: "イノシシ", deer: "ノロジカ", sheep: "羊", cow: "牛", hen: "ニワトリ" },
    fx: { noBuild: "建設不可", slope: "建築可 · 畑の代わりに菜園と牧草地", wood: "木材と獲物", fish: "漁場", fertile: "肥沃な畑", shore: "岸辺", stone: "石工の石材", planted: "保護された木" } },
};
