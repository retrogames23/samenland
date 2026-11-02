import type { Lang } from "../i18n";

type Text = {
  open: string; look: string; who: string; charter: string; noCharter: string; people: (c: number, h: number) => string;
  built: string; noBuilt: string; exp: string; imp: string; vsTitle: (a: string) => string;
  sameWay: string; otherWay: string; sameCharter: string; bigger: string; smaller: string; sameSize: string;
  theyGive: (g: string) => string; weGive: (g: string) => string; road: string; noRoad: string; ride: (m: number) => string; gifts: (n: number) => string;
  note: string;
};

export const PROFILE: Record<Lang, Text> = {
  de: { open: "Steckbrief", look: "Auf der Karte ansehen", who: "Ortsvorsteher", charter: "Charta", noCharter: "noch keine Charta gesiegelt", people: (c, h) => `${c} Bewohner in ${h} Wohnungen`,
    built: "Besondere Bauten", noBuilt: "Noch keine besonderen Bauten.", exp: "Bietet an", imp: "Sucht", vsTitle: (a) => `Im Vergleich zu ${a}`,
    sameWay: "Ihr geht denselben Weg.", otherWay: "Ihr geht verschiedene Wege – das ergänzt sich im Handel.", sameCharter: "Beide Orte haben dieselbe Charta gesiegelt.",
    bigger: "Dieser Ort ist eine Stufe weiter gewachsen.", smaller: "Dieser Ort ist noch eine Stufe kleiner.", sameSize: "Ihr seid gleich weit gewachsen.",
    theyGive: (g) => `Sie könnten euch liefern: ${g}`, weGive: (g) => `Ihr könntet ihnen liefern: ${g}`, road: "Eine Handelsstraße verbindet euch.", noRoad: "Noch keine Straße zwischen euch.",
    ride: (m) => `Ein Bote reitet etwa ${m} Min.`, gifts: (n) => `${n} Geschenke wurden schon ausgetauscht.`, note: "Kein Wettstreit – nur ein Blick zum Nachbarn." },
  en: { open: "Profile", look: "View on map", who: "Mayor", charter: "Charter", noCharter: "no charter sealed yet", people: (c, h) => `${c} residents in ${h} homes`,
    built: "Special buildings", noBuilt: "No special buildings yet.", exp: "Offers", imp: "Seeks", vsTitle: (a) => `Compared with ${a}`,
    sameWay: "You follow the same path.", otherWay: "You follow different paths – good for trade.", sameCharter: "Both towns sealed the same charter.",
    bigger: "This town has grown one stage further.", smaller: "This town is still a stage smaller.", sameSize: "You have grown equally far.",
    theyGive: (g) => `They could supply you: ${g}`, weGive: (g) => `You could supply them: ${g}`, road: "A trade road links you.", noRoad: "No road between you yet.",
    ride: (m) => `A messenger rides about ${m} min.`, gifts: (n) => `${n} gifts exchanged so far.`, note: "Not a contest – just a look at the neighbours." },
  fr: { open: "Fiche", look: "Voir sur la carte", who: "Maire", charter: "Charte", noCharter: "aucune charte scellée", people: (c, h) => `${c} habitants dans ${h} logis`,
    built: "Bâtiments particuliers", noBuilt: "Pas encore de bâtiments particuliers.", exp: "Propose", imp: "Recherche", vsTitle: (a) => `Comparé à ${a}`,
    sameWay: "Vous suivez la même voie.", otherWay: "Vos voies diffèrent – idéal pour le commerce.", sameCharter: "Les deux villes ont scellé la même charte.",
    bigger: "Cette ville a grandi d'un rang de plus.", smaller: "Cette ville a encore un rang de moins.", sameSize: "Vous avez grandi autant.",
    theyGive: (g) => `Ils pourraient vous livrer : ${g}`, weGive: (g) => `Vous pourriez leur livrer : ${g}`, road: "Une route commerciale vous relie.", noRoad: "Pas encore de route entre vous.",
    ride: (m) => `Un messager chevauche environ ${m} min.`, gifts: (n) => `${n} cadeaux déjà échangés.`, note: "Pas une compétition – juste un regard chez le voisin." },
  es: { open: "Ficha", look: "Ver en el mapa", who: "Alcalde", charter: "Carta", noCharter: "aún sin carta sellada", people: (c, h) => `${c} vecinos en ${h} hogares`,
    built: "Edificios especiales", noBuilt: "Aún sin edificios especiales.", exp: "Ofrece", imp: "Busca", vsTitle: (a) => `Comparado con ${a}`,
    sameWay: "Seguís el mismo camino.", otherWay: "Seguís caminos distintos: bueno para el comercio.", sameCharter: "Ambos pueblos sellaron la misma carta.",
    bigger: "Este pueblo ha crecido una etapa más.", smaller: "Este pueblo es aún una etapa menor.", sameSize: "Habéis crecido lo mismo.",
    theyGive: (g) => `Podrían suministraros: ${g}`, weGive: (g) => `Podríais suministrarles: ${g}`, road: "Un camino comercial os une.", noRoad: "Aún no hay camino entre vosotros.",
    ride: (m) => `Un mensajero cabalga unos ${m} min.`, gifts: (n) => `${n} regalos intercambiados.`, note: "No es una competición: solo una mirada al vecino." },
  ar: { open: "بطاقة البلدة", look: "عرض على الخريطة", who: "العمدة", charter: "الميثاق", noCharter: "لم يُختم ميثاق بعد", people: (c, h) => `${c} ساكنًا في ${h} مسكنًا`,
    built: "مبانٍ خاصة", noBuilt: "لا مبانٍ خاصة بعد.", exp: "تعرض", imp: "تطلب", vsTitle: (a) => `مقارنةً بـ ${a}`,
    sameWay: "تسلكون الطريق نفسه.", otherWay: "طرقكم مختلفة – وهذا مفيد للتجارة.", sameCharter: "ختمت البلدتان الميثاق نفسه.",
    bigger: "نمت هذه البلدة مرحلة أبعد.", smaller: "هذه البلدة أصغر بمرحلة.", sameSize: "نموتم بالقدر نفسه.",
    theyGive: (g) => `يمكنهم تزويدكم بـ: ${g}`, weGive: (g) => `يمكنكم تزويدهم بـ: ${g}`, road: "يربطكم طريق تجاري.", noRoad: "لا طريق بينكم بعد.",
    ride: (m) => `يركب الرسول نحو ${m} دقيقة.`, gifts: (n) => `تم تبادل ${n} هدايا.`, note: "ليست منافسة – مجرد نظرة إلى الجيران." },
  hi: { open: "परिचय", look: "नक्शे पर देखें", who: "मुखिया", charter: "चार्टर", noCharter: "अभी कोई चार्टर नहीं", people: (c, h) => `${h} घरों में ${c} निवासी`,
    built: "विशेष इमारतें", noBuilt: "अभी कोई विशेष इमारत नहीं।", exp: "देता है", imp: "चाहता है", vsTitle: (a) => `${a} की तुलना में`,
    sameWay: "आप एक ही राह पर हैं।", otherWay: "आपकी राहें अलग हैं – व्यापार के लिए अच्छा।", sameCharter: "दोनों ने एक ही चार्टर चुना है।",
    bigger: "यह बस्ती एक चरण आगे बढ़ चुकी है।", smaller: "यह बस्ती अभी एक चरण छोटी है।", sameSize: "आप बराबर बढ़े हैं।",
    theyGive: (g) => `वे आपको दे सकते हैं: ${g}`, weGive: (g) => `आप उन्हें दे सकते हैं: ${g}`, road: "एक व्यापार मार्ग आपको जोड़ता है।", noRoad: "अभी आपके बीच कोई सड़क नहीं।",
    ride: (m) => `दूत लगभग ${m} मिनट में पहुँचता है।`, gifts: (n) => `${n} उपहार बदले जा चुके हैं।`, note: "कोई मुकाबला नहीं – बस पड़ोसी पर एक नज़र।" },
  zh: { open: "城镇简介", look: "在地图上查看", who: "村长", charter: "宪章", noCharter: "尚未封印宪章", people: (c, h) => `${h} 户住宅，${c} 位居民`,
    built: "特殊建筑", noBuilt: "尚无特殊建筑。", exp: "出产", imp: "需要", vsTitle: (a) => `与${a}相比`,
    sameWay: "你们走同一条道路。", otherWay: "你们道路不同——正适合贸易。", sameCharter: "两地封印了相同的宪章。",
    bigger: "这座城镇已多发展一个阶段。", smaller: "这座城镇还小一个阶段。", sameSize: "你们发展程度相同。",
    theyGive: (g) => `他们可以供应你们：${g}`, weGive: (g) => `你们可以供应他们：${g}`, road: "一条商路连接着你们。", noRoad: "你们之间尚无道路。",
    ride: (m) => `信使骑行约 ${m} 分钟。`, gifts: (n) => `已互赠 ${n} 份礼物。`, note: "不是比赛——只是看看邻居。" },
  ja: { open: "町のプロフィール", look: "地図で見る", who: "村長", charter: "憲章", noCharter: "まだ憲章なし", people: (c, h) => `${h} 戸に ${c} 人の住民`,
    built: "特別な建物", noBuilt: "特別な建物はまだありません。", exp: "産物", imp: "求めるもの", vsTitle: (a) => `${a}と比べて`,
    sameWay: "同じ道を歩んでいます。", otherWay: "道が違う――交易に好都合です。", sameCharter: "両方の町が同じ憲章を結びました。",
    bigger: "この町は一段階先に成長しています。", smaller: "この町はまだ一段階小さいです。", sameSize: "同じくらい成長しています。",
    theyGive: (g) => `相手から届けられるもの：${g}`, weGive: (g) => `こちらから届けられるもの：${g}`, road: "交易路でつながっています。", noRoad: "まだ道はありません。",
    ride: (m) => `使者は約 ${m} 分で到着します。`, gifts: (n) => `これまでに ${n} 個の贈り物を交換。`, note: "競争ではなく、隣町をのぞくだけ。" },
};
