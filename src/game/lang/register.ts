import type { Lang } from "../i18n";

/** Island register (towns tab) chrome. */
type R = { places: (n: number) => string; citizens: (n: number) => string; homes: (n: number) => string; sortBy: string; byPop: string; byDist: string; byName: string; road: string; building: string; ride: (m: number) => string; mine: string; more: string; less: string; goTo: string };
const n = (x: number) => x.toLocaleString();
export const REGISTER: Record<Lang, R> = {
  de: { places: (k) => `${k} Orte`, citizens: (k) => `${n(k)} Bürger`, homes: (k) => `${k} Haushalte`, sortBy: "Sortieren", byPop: "Bürger", byDist: "Entfernung", byName: "Name", road: "Handelsstraße", building: "Straße im Bau", ride: (m) => `${m} Reitminuten`, mine: "Euer Ort", more: "Mehr", less: "Weniger", goTo: "Hinreisen" },
  en: { places: (k) => `${k} places`, citizens: (k) => `${n(k)} citizens`, homes: (k) => `${k} households`, sortBy: "Sort", byPop: "Citizens", byDist: "Distance", byName: "Name", road: "Trade road", building: "Road being built", ride: (m) => `${m} min ride`, mine: "Your town", more: "More", less: "Less", goTo: "Travel there" },
  fr: { places: (k) => `${k} lieux`, citizens: (k) => `${n(k)} bourgeois`, homes: (k) => `${k} foyers`, sortBy: "Trier", byPop: "Habitants", byDist: "Distance", byName: "Nom", road: "Route commerciale", building: "Route en construction", ride: (m) => `${m} min à cheval`, mine: "Votre ville", more: "Plus", less: "Moins", goTo: "S'y rendre" },
  es: { places: (k) => `${k} lugares`, citizens: (k) => `${n(k)} vecinos`, homes: (k) => `${k} hogares`, sortBy: "Ordenar", byPop: "Vecinos", byDist: "Distancia", byName: "Nombre", road: "Camino comercial", building: "Camino en obras", ride: (m) => `${m} min a caballo`, mine: "Tu pueblo", more: "Más", less: "Menos", goTo: "Viajar allí" },
  ar: { places: (k) => `${k} أماكن`, citizens: (k) => `${n(k)} مواطن`, homes: (k) => `${k} أسر`, sortBy: "ترتيب", byPop: "السكان", byDist: "المسافة", byName: "الاسم", road: "طريق تجاري", building: "طريق قيد البناء", ride: (m) => `${m} دقيقة ركوبًا`, mine: "بلدتك", more: "المزيد", less: "أقل", goTo: "اذهب إلى هناك" },
  hi: { places: (k) => `${k} स्थान`, citizens: (k) => `${n(k)} नागरिक`, homes: (k) => `${k} परिवार`, sortBy: "क्रम", byPop: "नागरिक", byDist: "दूरी", byName: "नाम", road: "व्यापार मार्ग", building: "मार्ग बन रहा है", ride: (m) => `${m} मिनट घुड़सवारी`, mine: "आपका गाँव", more: "और", less: "कम", goTo: "वहाँ जाएँ" },
  zh: { places: (k) => `${k} 个地方`, citizens: (k) => `${n(k)} 位市民`, homes: (k) => `${k} 户`, sortBy: "排序", byPop: "市民", byDist: "距离", byName: "名称", road: "商路", building: "道路在建", ride: (m) => `骑马 ${m} 分钟`, mine: "你的城镇", more: "更多", less: "收起", goTo: "前往" },
  ja: { places: (k) => `${k} か所`, citizens: (k) => `市民 ${n(k)} 人`, homes: (k) => `${k} 世帯`, sortBy: "並べ替え", byPop: "市民", byDist: "距離", byName: "名前", road: "交易路", building: "道路建設中", ride: (m) => `騎馬 ${m} 分`, mine: "あなたの町", more: "詳しく", less: "閉じる", goTo: "そこへ行く" },
};
