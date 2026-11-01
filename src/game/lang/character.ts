import type { Lang } from "../i18n";
import type { TownWay } from "../character";

type CharacterText = {
  title: string; side: string; landscape: string;
  names: Record<TownWay, string>; land: Record<TownWay, string>;
};
export const TOWN_CHARACTER: Record<Lang, CharacterText> = {
  de: { title: "Ortscharakter", side: "Nebencharakter", landscape: "Landschaft am Gründungsort", names: { grain: "Kornkammer", workshop: "Werkbank der Hügel", gateway: "Tor zur Welt" }, land: { grain: "Ebene und Wald", workshop: "Hügel und Gebirgsrand", gateway: "Küste und Fluss" } },
  en: { title: "Town character", side: "Secondary character", landscape: "Landscape at the founding site", names: { grain: "Breadbasket", workshop: "Workshop of the Hills", gateway: "Gateway to the World" }, land: { grain: "Plains and woodland", workshop: "Hills and mountain foothills", gateway: "Coast and river" } },
  fr: { title: "Caractère du village", side: "Caractère secondaire", landscape: "Paysage du lieu de fondation", names: { grain: "Grenier à blé", workshop: "Atelier des collines", gateway: "Porte sur le monde" }, land: { grain: "Plaine et forêt", workshop: "Collines et piémont", gateway: "Côte et rivière" } },
  es: { title: "Carácter de la localidad", side: "Carácter secundario", landscape: "Paisaje del lugar de fundación", names: { grain: "Granero", workshop: "Taller de las colinas", gateway: "Puerta al mundo" }, land: { grain: "Llanura y bosque", workshop: "Colinas y piedemonte", gateway: "Costa y río" } },
  ar: { title: "طابع البلدة", side: "الطابع الثانوي", landscape: "طبيعة موقع التأسيس", names: { grain: "سلة الحبوب", workshop: "ورشة التلال", gateway: "بوابة العالم" }, land: { grain: "السهول والغابات", workshop: "التلال وسفوح الجبال", gateway: "الساحل والنهر" } },
  hi: { title: "नगर का स्वभाव", side: "द्वितीय स्वभाव", landscape: "स्थापना स्थल का भूभाग", names: { grain: "अन्न भंडार", workshop: "पहाड़ियों की कार्यशाला", gateway: "दुनिया का द्वार" }, land: { grain: "मैदान और वन", workshop: "पहाड़ियाँ और तलहटी", gateway: "तट और नदी" } },
  zh: { title: "城镇特色", side: "次要特色", landscape: "建城地点的地貌", names: { grain: "粮仓", workshop: "丘陵工坊", gateway: "世界之门" }, land: { grain: "平原与森林", workshop: "丘陵与山麓", gateway: "海岸与河流" } },
  ja: { title: "町の個性", side: "第二の個性", landscape: "創設地の地形", names: { grain: "穀倉地帯", workshop: "丘陵の工房", gateway: "世界への玄関" }, land: { grain: "平原と森", workshop: "丘陵と山麓", gateway: "海岸と川" } },
};