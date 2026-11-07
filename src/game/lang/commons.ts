import type { Lang } from "../i18n";
import { LIFE_TEXT } from "./village-life";

/** Allmende questions: title + the resident's question, the answers, header and the advisor's counsel. */
type T = {
  events: Record<string, [string, string]>;
  choices: Record<string, string>;
  /** Parchment header: who brings the question before the village. */
  asks: (name: string, job: string) => string;
  /** Header of the counsel line. */
  counsel: (name: string, role: string) => string;
  /** Advisor's role (herb-wife / midwife, or the eldest). */
  roles: { herb: string; elder: string };
  /** Counsel per question; [0] in spring/summer, [1] in autumn/winter. */
  advice: Record<string, [string, string]>;
  find: string;
};

const de: T = {
  events: {
    hutewald: ["Der Hutewald", "„Schulze, die Eicheln fallen unter den alten Eichen. Dürfen unsere Schweine diese Woche in den Hutewald? Die Gemeinde soll es entscheiden.“"],
    backtag: ["Das Backhausrecht", "„Jede Familie heizt ihren eigenen Ofen – das frisst Holz. Wollen wir nicht einen festen Backtag im Gemeindebackofen haben, für die ganze Nachbarschaft?“"],
    steg: ["Der Steg am Mühlenbach", "„Wer zur Mühle will, muss durch den Bach waten. Bauen wir einen Steg – alle gemeinsam, oder soll der Zimmermann ihn für Lohn errichten?“"],
  },
  choices: {
    "hutewald:mast": "Ja, die Schweine dürfen zur Mast in den Wald", "hutewald:wild": "Nein, die Eicheln bleiben dem Wild und dem Jungwald",
    "backtag:bake": "Einen festen Backtag einführen (Holz für den Ofen)", "backtag:home": "Jeder bäckt weiter daheim",
    "steg:together": "Gemeinschaftsarbeit – alle packen einen Tag lang mit an", "steg:carpenter": "Den Zimmermann beauftragen, das geht schneller",
  },
  asks: (n, j) => `${n}, ${j}, bringt eine Frage vor die Gemeinde`,
  counsel: (n, r) => `Rat von ${n}, ${r}`,
  roles: { herb: "der weisen Frau", elder: "der Ältesten" },
  advice: {
    hutewald: ["„Im Sommer finden die Schweine wenig unter den Eichen. Lasst den Wald lieber in Ruhe wachsen.“", "„Die Eicheln liegen dick, und nass war der Herbst – sie faulen sonst. Lasst die Schweine ruhig hinein.“"],
    backtag: ["„Ein gemeinsamer Ofen spart Holz, und am Ofen erfährt man, wem es nicht gut geht.“", "„Im Winter ist ein warmes Backhaus ein Segen für die Alten. Ein fester Tag hält uns zusammen.“"],
    steg: ["„Was alle gemeinsam bauen, wird auch von allen gepflegt.“", "„Das Wasser ist kalt jetzt. Wer im Bach steht, holt sich das Fieber – überlegt es gut.“"],
  },
  find: "Auf der Karte zeigen",
};
const en: T = {
  events: {
    hutewald: ["The wood pasture", "“Mayor, the acorns are falling under the old oaks. May our pigs go into the wood pasture this week? Let the village decide.”"],
    backtag: ["The oven right", "“Every family heats its own oven – it eats up wood. Shouldn't we have a fixed baking day at the common oven, for the whole neighbourhood?”"],
    steg: ["The footbridge at the mill stream", "“Whoever goes to the mill has to wade through the stream. Let's build a footbridge – all of us together, or shall the carpenter build it for pay?”"],
  },
  choices: {
    "hutewald:mast": "Yes, the pigs may fatten in the wood", "hutewald:wild": "No, the acorns stay for the game and the young trees",
    "backtag:bake": "Set a fixed baking day (wood for the oven)", "backtag:home": "Everyone keeps baking at home",
    "steg:together": "Common work – everyone lends a hand for a day", "steg:carpenter": "Hire the carpenter, it's quicker",
  },
  asks: (n, j) => `${n}, ${j}, brings a question before the village`,
  counsel: (n, r) => `Counsel from ${n}, ${r}`,
  roles: { herb: "the wise woman", elder: "the eldest" },
  advice: {
    hutewald: ["“In summer the pigs find little under the oaks. Better let the wood grow in peace.”", "“The acorns lie thick and the autumn was wet – they'll rot otherwise. Let the pigs in.”"],
    backtag: ["“A common oven saves wood, and at the oven you hear who is not doing well.”", "“In winter a warm bakehouse is a blessing for the old. A fixed day keeps us together.”"],
    steg: ["“What everyone builds together, everyone looks after.”", "“The water is cold now. Whoever stands in the stream catches a fever – think it over.”"],
  },
  find: "Show on the map",
};
const fr: T = {
  events: {
    hutewald: ["Le bois pâturé", "« Maire, les glands tombent sous les vieux chênes. Nos porcs peuvent-ils aller au bois cette semaine ? Que la communauté en décide. »"],
    backtag: ["Le droit du four", "« Chaque famille chauffe son propre four – cela dévore le bois. Ne voulons-nous pas un jour de cuisson fixe au four commun, pour tout le voisinage ? »"],
    steg: ["La passerelle du bief", "« Qui veut aller au moulin doit traverser le ruisseau à gué. Construisons une passerelle – tous ensemble, ou le charpentier la bâtira-t-il contre salaire ? »"],
  },
  choices: {
    "hutewald:mast": "Oui, les porcs vont à la glandée", "hutewald:wild": "Non, les glands restent au gibier et aux jeunes arbres",
    "backtag:bake": "Fixer un jour de cuisson (bois pour le four)", "backtag:home": "Chacun continue de cuire chez soi",
    "steg:together": "Corvée commune – tous aident une journée", "steg:carpenter": "Engager le charpentier, c'est plus rapide",
  },
  asks: (n, j) => `${n}, ${j}, soumet une question à la communauté`,
  counsel: (n, r) => `Conseil de ${n}, ${r}`,
  roles: { herb: "la femme sage", elder: "l'aînée" },
  advice: {
    hutewald: ["« En été, les porcs trouvent peu sous les chênes. Laissez plutôt le bois pousser en paix. »", "« Les glands sont épais et l'automne fut humide – ils pourriront sinon. Laissez entrer les porcs. »"],
    backtag: ["« Un four commun épargne le bois, et au four on apprend qui va mal. »", "« En hiver, un fournil chaud est une bénédiction pour les vieux. Un jour fixe nous tient ensemble. »"],
    steg: ["« Ce que tous bâtissent ensemble, tous l'entretiennent. »", "« L'eau est froide maintenant. Qui reste dans le ruisseau attrape la fièvre – réfléchissez bien. »"],
  },
  find: "Montrer sur la carte",
};
const es: T = {
  events: {
    hutewald: ["La dehesa del bosque", "«Alcalde, las bellotas caen bajo los viejos robles. ¿Pueden nuestros cerdos entrar al bosque esta semana? Que lo decida la comunidad.»"],
    backtag: ["El derecho del horno", "«Cada familia calienta su propio horno y eso devora leña. ¿No queremos un día fijo de horneado en el horno comunal para todo el vecindario?»"],
    steg: ["La pasarela del arroyo del molino", "«Quien va al molino tiene que vadear el arroyo. Hagamos una pasarela: ¿todos juntos, o que la levante el carpintero a jornal?»"],
  },
  choices: {
    "hutewald:mast": "Sí, los cerdos van a la montanera", "hutewald:wild": "No, las bellotas quedan para la caza y los árboles jóvenes",
    "backtag:bake": "Fijar un día de horneado (leña para el horno)", "backtag:home": "Cada cual sigue horneando en casa",
    "steg:together": "Trabajo vecinal: todos ayudan un día", "steg:carpenter": "Encargarlo al carpintero, es más rápido",
  },
  asks: (n, j) => `${n}, ${j}, plantea una cuestión a la comunidad`,
  counsel: (n, r) => `Consejo de ${n}, ${r}`,
  roles: { herb: "la mujer sabia", elder: "la mayor del pueblo" },
  advice: {
    hutewald: ["«En verano los cerdos encuentran poco bajo los robles. Mejor dejad crecer el bosque en paz.»", "«Las bellotas están espesas y el otoño fue húmedo; si no, se pudren. Dejad entrar a los cerdos.»"],
    backtag: ["«Un horno común ahorra leña, y junto al horno se sabe a quién le va mal.»", "«En invierno una tahona caliente es una bendición para los viejos. Un día fijo nos mantiene unidos.»"],
    steg: ["«Lo que todos construyen juntos, todos lo cuidan.»", "«El agua está fría ahora. Quien se mete en el arroyo coge fiebre: pensadlo bien.»"],
  },
  find: "Mostrar en el mapa",
};
const ar: T = {
  events: {
    hutewald: ["مرعى البلوط", "«يا شيخ القرية، البلّوط يتساقط تحت السنديانات القديمة. أتأذنون لخنازيرنا بالرعي في الغابة هذا الأسبوع؟ فلتقرّر الجماعة.»"],
    backtag: ["حقّ الفرن", "«كل عائلة توقد فرنها وحدها، وهذا يأكل الحطب. ألا نجعل يومًا ثابتًا للخَبز في فرن الجماعة لكل الجيران؟»"],
    steg: ["جسر جدول الطاحونة", "«من أراد الطاحونة خاض الجدول. لنبنِ جسرًا خشبيًا: نبنيه معًا، أم يبنيه النجّار بأجر؟»"],
  },
  choices: {
    "hutewald:mast": "نعم، تُسمَّن الخنازير في الغابة", "hutewald:wild": "لا، يبقى البلّوط للطرائد والأشجار الفتية",
    "backtag:bake": "يوم خَبز ثابت (حطب للفرن)", "backtag:home": "يخبز كلٌّ في بيته",
    "steg:together": "عمل جماعي: الجميع يساعد يومًا كاملًا", "steg:carpenter": "تكليف النجّار، فهو أسرع",
  },
  asks: (n, j) => `${n}، ${j}، تعرض مسألة على الجماعة`,
  counsel: (n, r) => `مشورة ${n}، ${r}`,
  roles: { herb: "المرأة الحكيمة", elder: "كبيرة القرية" },
  advice: {
    hutewald: ["«في الصيف لا تجد الخنازير تحت السنديان إلا القليل. دعوا الغابة تنمو بسلام.»", "«البلّوط كثيف والخريف كان ماطرًا، وإلا تعفّن. أدخلوا الخنازير.»"],
    backtag: ["«الفرن المشترك يوفّر الحطب، وعنده نعرف من ليس بخير.»", "«في الشتاء بيت الخَبز الدافئ نعمة للمسنّين. اليوم الثابت يجمعنا.»"],
    steg: ["«ما يبنيه الجميع معًا يرعاه الجميع.»", "«الماء بارد الآن، ومن وقف في الجدول أصابته الحمّى. فكّروا جيدًا.»"],
  },
  find: "أرِني على الخريطة",
};
const hi: T = {
  events: {
    hutewald: ["बलूत का चरागाह", "“मुखिया जी, पुराने बलूतों के नीचे बलूत-फल गिर रहे हैं। क्या इस हफ़्ते हमारे सूअर जंगल में चर सकते हैं? पंचायत तय करे।”"],
    backtag: ["तंदूर का हक़", "“हर परिवार अपना चूल्हा अलग जलाता है – लकड़ी बहुत लगती है। क्या पूरे मोहल्ले के लिए साझे तंदूर में एक तय दिन न रखें?”"],
    steg: ["पनचक्की नाले का पुल", "“चक्की जाने वाले को नाला पार करना पड़ता है। एक छोटा पुल बनाएँ – सब मिलकर, या बढ़ई मज़दूरी पर बनाए?”"],
  },
  choices: {
    "hutewald:mast": "हाँ, सूअर जंगल में चरें", "hutewald:wild": "नहीं, बलूत-फल जंगली जानवरों और नए पेड़ों के लिए",
    "backtag:bake": "साझा सेंकने का तय दिन (तंदूर की लकड़ी)", "backtag:home": "सब घर पर ही सेंकें",
    "steg:together": "श्रमदान – सब एक दिन हाथ बँटाएँ", "steg:carpenter": "बढ़ई को काम दें, जल्दी होगा",
  },
  asks: (n, j) => `${n}, ${j}, पंचायत के सामने एक सवाल रखती/रखता है`,
  counsel: (n, r) => `${n} की सलाह, ${r}`,
  roles: { herb: "सयानी औरत", elder: "गाँव की बुज़ुर्ग" },
  advice: {
    hutewald: ["“गर्मी में बलूतों के नीचे सूअरों को कम मिलता है। जंगल को चैन से बढ़ने दो।”", "“बलूत-फल ढेरों पड़े हैं और पतझड़ गीला रहा – वरना सड़ जाएँगे। सूअरों को जाने दो।”"],
    backtag: ["“साझा तंदूर लकड़ी बचाता है, और तंदूर पर पता चलता है कि किसका हाल ठीक नहीं।”", "“सर्दियों में गरम तंदूरघर बूढ़ों के लिए वरदान है। तय दिन हमें जोड़े रखता है।”"],
    steg: ["“जो सब मिलकर बनाते हैं, उसकी देखभाल भी सब करते हैं।”", "“पानी अभी ठंडा है। नाले में खड़ा रहने वाला बुख़ार पकड़ लेगा – सोच-समझ लो।”"],
  },
  find: "नक़्शे पर दिखाएँ",
};
const zh: T = {
  events: {
    hutewald: ["橡林牧场", "“村长，老橡树下的橡子落了。这周能让我们的猪进林子吃橡子吗？请乡亲们一起定夺。”"],
    backtag: ["公共烤炉之权", "“每家都烧自己的炉子，太费柴了。我们何不在公共烤炉定一个固定的烤面包日，给整个邻里用？”"],
    steg: ["磨坊溪上的木桥", "“去磨坊的人都得蹚水过溪。我们修一座木桥吧——大家一起动手，还是请木匠拿工钱来修？”"],
  },
  choices: {
    "hutewald:mast": "好，让猪进林子育肥", "hutewald:wild": "不，橡子留给野兽和幼树",
    "backtag:bake": "定下固定烤面包日（烤炉用柴）", "backtag:home": "各家照旧在家烤",
    "steg:together": "众人出工——大家帮忙一天", "steg:carpenter": "请木匠来修，更快",
  },
  asks: (n, j) => `${j}${n}向乡亲们提出一件事`,
  counsel: (n, r) => `${r}${n}的建议`,
  roles: { herb: "智慧的老妇", elder: "最年长者" },
  advice: {
    hutewald: ["“夏天橡树下没什么可吃的。还是让林子安静生长吧。”", "“橡子落得厚，秋天又潮湿——不然会烂掉。让猪进去吧。”"],
    backtag: ["“共用一个炉子省柴，在炉边也能知道谁家过得不好。”", "“冬天暖和的烤房是老人的福气。固定的日子把我们聚在一起。”"],
    steg: ["“大家一起修的东西，大家都会爱护。”", "“现在水凉。站在溪里的人会发烧——要想清楚。”"],
  },
  find: "在地图上显示",
};
const ja: T = {
  events: {
    hutewald: ["樫の森の放牧", "「村長さん、古い樫の下にどんぐりが落ちています。今週、うちの豚を森へ入れてもいいでしょうか？村のみんなで決めてください。」"],
    backtag: ["共同かまどの権利", "「どの家も自分のかまどを焚いて、薪をたくさん使います。近所みんなで共同かまどの決まったパン焼き日を作りませんか？」"],
    steg: ["水車小川の小橋", "「水車小屋へ行く人はみな小川を歩いて渡ります。小橋を架けましょう――みんなで力を合わせるか、大工に賃金を払って頼むか。」"],
  },
  choices: {
    "hutewald:mast": "はい、豚を森で肥やす", "hutewald:wild": "いいえ、どんぐりは獣と若木のために残す",
    "backtag:bake": "決まったパン焼き日を作る（かまどの薪）", "backtag:home": "これまでどおり各家で焼く",
    "steg:together": "共同作業――みんなで一日手伝う", "steg:carpenter": "大工に頼む、そのほうが早い",
  },
  asks: (n, j) => `${j}の${n}が村に問いかけています`,
  counsel: (n, r) => `${r}${n}の助言`,
  roles: { herb: "賢い女", elder: "最年長の人" },
  advice: {
    hutewald: ["「夏の樫の下には豚の食べ物はあまりありません。森は静かに育てましょう。」", "「どんぐりがたっぷり落ちて、秋は雨続きでした――このままでは腐ります。豚を入れましょう。」"],
    backtag: ["「共同のかまどは薪の節約になり、かまどのそばで誰が具合悪いかも分かります。」", "「冬の暖かいパン小屋はお年寄りへの恵みです。決まった日がみんなをつなぎます。」"],
    steg: ["「みんなで建てたものは、みんなで大事にします。」", "「今は水が冷たい。小川に立つ人は熱を出します――よく考えて。」"],
  },
  find: "地図で見る",
};

export const COMMONS_TEXT: Record<Lang, T> = { de, en, fr, es, ar, hi, zh, ja };
// village-life questions (lang/village-life.ts) share the parchment with the commons
for (const l of Object.keys(COMMONS_TEXT) as Lang[]) {
  Object.assign(COMMONS_TEXT[l].events, LIFE_TEXT[l].events);
  Object.assign(COMMONS_TEXT[l].choices, LIFE_TEXT[l].choices);
  Object.assign(COMMONS_TEXT[l].advice, LIFE_TEXT[l].advice);
}
