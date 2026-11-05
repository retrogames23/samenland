import type { Lang } from "../i18n";

/** Dated historical news 1500/1501 (encounters.ts HISTORY): title + text, and the answers. */
type T = { events: Record<"werber" | "weser" | "sund" | "ablass", [string, string]>; choices: Record<string, string> };

const de: T = {
  events: {
    werber: ["Die Werber des Landesherrn", "Seit die Dithmarscher Bauern bei Hemmingstedt das Ritterheer geschlagen haben, rüstet der Landesherr neu. Zwei Knechte in Wams und Eisenhut stehen am Brunnen und verlangen Hafer für die Pferde – oder Quartier für den Winter."],
    weser: ["Aufruhr an der Weser", "Ein Fuhrmann bringt Kunde: Der Herzog von Braunschweig, der Bremer Erzbischof und der Graf von Oldenburg haben sich gegen die freien Bauern von Butjadingen und Stadland verbündet. Nun werden Karren und Gespanne für den Tross gesucht."],
    sund: ["Schlimme Zeitung aus Schweden", "Ein Hansekaufmann mit seinem Schiffer rastet am Platz. In Schweden haben sich die Herren gegen König Hans erhoben, Stockholm ist belagert. Salz, Hering und Osmund-Eisen werden knapp – er bietet seine letzten Fässer feil."],
    ablass: ["Der Ablasskasten", "Mit rotem Kreuz und päpstlichem Kasten zieht ein Prediger ins Dorf. Der Kardinal Peraudi lässt im Reich den Ablass verkünden, das Geld soll dem Zug gegen die Türken dienen. Alles strömt zum Kirchplatz."],
  },
  choices: {
    "werber:fodder": "Den Hafer geben, damit sie weiterziehen", "werber:quarter": "Die Knechte über den Winter einquartieren",
    "weser:carts": "Zwei Gespanne für den Tross stellen", "weser:ransom": "Die Spanndienste mit Geld ablösen",
    "sund:buy": "Salz und Eisen für das Dorf kaufen", "sund:shelter": "Kaufmann und Schiffer beherbergen", "sund:pass": "Abwarten, bis die Preise fallen",
    "ablass:give": "Eine Gabe aus der Gemeindekasse spenden", "ablass:sermon": "Nur die Predigt anhören",
  },
};
const en: T = {
  events: {
    werber: ["The lord's recruiters", "Since the Dithmarsh peasants routed the knights at Hemmingstedt, our lord is arming anew. Two men in doublet and kettle hat stand by the well, asking oats for their horses – or quarters for the winter."],
    weser: ["Unrest on the Weser", "A carter brings tidings: the Duke of Brunswick, the Archbishop of Bremen and the Count of Oldenburg are leagued against the free peasants of Butjadingen and Stadland. Now carts and teams are wanted for the baggage train."],
    sund: ["Ill news from Sweden", "A Hanse merchant and his skipper rest on the green. In Sweden the lords have risen against King Hans, and Stockholm lies under siege. Salt, herring and osmund iron grow scarce – he offers his last casks."],
    ablass: ["The indulgence chest", "With a red cross and the papal chest a preacher enters the village. Cardinal Peraudi has the indulgence proclaimed throughout the Empire, the coin to serve the war against the Turk. All hasten to the churchyard."],
  },
  choices: {
    "werber:fodder": "Give the oats, so they ride on", "werber:quarter": "Quarter the men over winter",
    "weser:carts": "Send two teams for the baggage train", "weser:ransom": "Buy off the carting duty with coin",
    "sund:buy": "Buy salt and iron for the village", "sund:shelter": "Lodge the merchant and his skipper", "sund:pass": "Wait until prices fall",
    "ablass:give": "Give an offering from the village chest", "ablass:sermon": "Only hear the sermon",
  },
};
const fr: T = {
  events: {
    werber: ["Les recruteurs du seigneur", "Depuis que les paysans de Dithmarse ont défait les chevaliers à Hemmingstedt, le seigneur réarme. Deux hommes en pourpoint et chapeau de fer attendent au puits : de l'avoine pour leurs chevaux, ou un logis pour l'hiver."],
    weser: ["Troubles sur la Weser", "Un charretier apporte la nouvelle : le duc de Brunswick, l'archevêque de Brême et le comte d'Oldenbourg se sont ligués contre les paysans libres du Butjadingen et du Stadland. On cherche des chariots pour le convoi."],
    sund: ["Mauvaises nouvelles de Suède", "Un marchand de la Hanse et son patron de barque font halte sur la place. En Suède, les seigneurs se sont soulevés contre le roi Jean ; Stockholm est assiégée. Sel, hareng et fer se font rares – il offre ses derniers tonneaux."],
    ablass: ["Le tronc des indulgences", "Avec la croix rouge et le tronc pontifical, un prédicateur entre au village. Le cardinal Peraudi fait prêcher l'indulgence dans l'Empire, pour la croisade contre les Turcs. Tous accourent au parvis."],
  },
  choices: {
    "werber:fodder": "Donner l'avoine pour qu'ils repartent", "werber:quarter": "Loger les hommes pour l'hiver",
    "weser:carts": "Fournir deux attelages au convoi", "weser:ransom": "Racheter la corvée à prix d'argent",
    "sund:buy": "Acheter sel et fer pour le village", "sund:shelter": "Héberger le marchand et son patron", "sund:pass": "Attendre que les prix baissent",
    "ablass:give": "Donner une offrande de la caisse commune", "ablass:sermon": "Écouter seulement le prêche",
  },
};
const es: T = {
  events: {
    werber: ["Los reclutadores del señor", "Desde que los campesinos de Dithmarschen derrotaron a los caballeros en Hemmingstedt, el señor vuelve a armarse. Dos hombres con jubón y capacete esperan junto al pozo: avena para sus caballos, o alojamiento para el invierno."],
    weser: ["Revuelta en el Weser", "Un carretero trae noticias: el duque de Brunswick, el arzobispo de Bremen y el conde de Oldemburgo se han aliado contra los campesinos libres de Butjadingen y Stadland. Se buscan carros para la impedimenta."],
    sund: ["Malas nuevas de Suecia", "Un mercader de la Hansa y su patrón descansan en la plaza. En Suecia los señores se han alzado contra el rey Juan y Estocolmo está sitiada. Escasean la sal, el arenque y el hierro: ofrece sus últimos toneles."],
    ablass: ["El arca de las indulgencias", "Con la cruz roja y el arca papal entra un predicador en la aldea. El cardenal Peraudi hace predicar la indulgencia en el Imperio, para la cruzada contra el turco. Todos acuden al atrio."],
  },
  choices: {
    "werber:fodder": "Dar la avena para que sigan su camino", "werber:quarter": "Alojar a los hombres durante el invierno",
    "weser:carts": "Aportar dos yuntas a la impedimenta", "weser:ransom": "Redimir el acarreo con dinero",
    "sund:buy": "Comprar sal y hierro para la aldea", "sund:shelter": "Hospedar al mercader y a su patrón", "sund:pass": "Esperar a que bajen los precios",
    "ablass:give": "Dar una ofrenda de la caja común", "ablass:sermon": "Solo escuchar el sermón",
  },
};
const ar: T = {
  events: {
    werber: ["مجنّدو السيّد", "منذ أن هزم فلاحو ديتمارشن الفرسان في همينغشتيت والسيّد يتسلّح من جديد. يقف رجلان بصدرية وخوذة حديد عند البئر، يطلبان شعيرًا لخيولهما أو مأوى للشتاء."],
    weser: ["اضطراب على نهر فيزر", "يأتي حوذيّ بالخبر: دوق براونشفايغ ورئيس أساقفة بريمن وكونت أولدنبورغ تحالفوا ضد الفلاحين الأحرار في بوتيادينغن وشتادلاند. والآن تُطلب العربات والدواب لقافلة الجيش."],
    sund: ["أنباء سيئة من السويد", "تاجر من الهانزا وربّانه يستريحان في الساحة. في السويد ثار النبلاء على الملك هانز، وستوكهولم محاصرة. صار الملح والرنجة والحديد نادرًا، فيعرض آخر براميله."],
    ablass: ["صندوق صكوك الغفران", "يدخل واعظ القرية بصليب أحمر وصندوق بابوي. الكاردينال بيرودي يأمر بالتبشير بالغفران في الإمبراطورية، والمال لحملة ضد العثمانيين. يهرع الجميع إلى ساحة الكنيسة."],
  },
  choices: {
    "werber:fodder": "إعطاء الشعير ليمضوا", "werber:quarter": "إيواء الرجلين طوال الشتاء",
    "weser:carts": "تقديم عربتين للقافلة", "weser:ransom": "افتداء خدمة النقل بالمال",
    "sund:buy": "شراء الملح والحديد للقرية", "sund:shelter": "استضافة التاجر وربّانه", "sund:pass": "الانتظار حتى تنخفض الأسعار",
    "ablass:give": "تقديم هبة من صندوق القرية", "ablass:sermon": "الاستماع إلى الموعظة فقط",
  },
};
const hi: T = {
  events: {
    werber: ["स्वामी के भर्तीकर्ता", "जब से डिटमार्शन के किसानों ने हेमिंगश्टेट में शूरवीरों को हराया है, स्वामी फिर से सेना जुटा रहे हैं। कुएँ के पास लोहे की टोपी पहने दो सिपाही खड़े हैं — घोड़ों के लिए जई चाहिए, या सर्दी भर ठहरने की जगह।"],
    weser: ["वेज़र पर अशांति", "एक गाड़ीवान ख़बर लाया है: ब्राउनश्वाइग के ड्यूक, ब्रेमेन के आर्चबिशप और ओल्डेनबर्ग के काउंट ने बुटयादिंगन और श्टाडलैंड के स्वतंत्र किसानों के विरुद्ध गठबंधन किया है। अब रसद के लिए गाड़ियाँ चाहिए।"],
    sund: ["स्वीडन से बुरी ख़बर", "हंसा का एक व्यापारी और उसका नाविक चौक पर ठहरे हैं। स्वीडन में सामंतों ने राजा हान्स के विरुद्ध विद्रोह किया है और स्टॉकहोम घिरा है। नमक, हेरिंग और लोहा दुर्लभ हो रहे हैं — वह अपने अंतिम पीपे बेच रहा है।"],
    ablass: ["क्षमापत्र की पेटी", "लाल क्रूस और पोप की पेटी लिए एक उपदेशक गाँव में आता है। कार्डिनल पेरौदी साम्राज्य भर में क्षमापत्र का प्रचार करवा रहे हैं, धन तुर्कों के विरुद्ध अभियान के लिए। सब गिरजे के आँगन की ओर दौड़ते हैं।"],
  },
  choices: {
    "werber:fodder": "जई दे दो, ताकि वे आगे बढ़ें", "werber:quarter": "सिपाहियों को सर्दी भर ठहराओ",
    "weser:carts": "रसद के लिए दो गाड़ियाँ दो", "weser:ransom": "ढुलाई की सेवा पैसे देकर छुड़ाओ",
    "sund:buy": "गाँव के लिए नमक और लोहा ख़रीदो", "sund:shelter": "व्यापारी और नाविक को ठहराओ", "sund:pass": "दाम गिरने तक रुको",
    "ablass:give": "गाँव की तिजोरी से दान दो", "ablass:sermon": "केवल उपदेश सुनो",
  },
};
const zh: T = {
  events: {
    werber: ["领主的募兵", "自从迪特马申的农民在海明施泰特击败骑士军，领主便重新整军。两名身穿短褂、头戴铁盔的兵丁站在井边，要为马匹索取燕麦，或在村中过冬。"],
    weser: ["威悉河畔的动乱", "一名车夫带来消息：不伦瑞克公爵、不来梅大主教和奥尔登堡伯爵结盟，要征讨布特亚丁根和施塔德兰的自由农民。如今要为辎重队征用车马。"],
    sund: ["瑞典的坏消息", "一位汉萨商人和他的船长在广场歇脚。瑞典贵族起兵反抗汉斯国王，斯德哥尔摩被围。盐、鲱鱼和铁都紧缺了——他拿出最后几桶货出售。"],
    ablass: ["赎罪券之箱", "一位传道人举着红十字、带着教宗的钱箱走进村子。佩罗迪枢机在帝国各地宣讲赎罪券，钱款用于讨伐奥斯曼人。众人涌向教堂前的空地。"],
  },
  choices: {
    "werber:fodder": "给燕麦，让他们继续上路", "werber:quarter": "让兵丁在村里过冬",
    "weser:carts": "为辎重队出两副车马", "weser:ransom": "用钱折抵运输劳役",
    "sund:buy": "为村子买下盐和铁", "sund:shelter": "收留商人和船长", "sund:pass": "等价格回落",
    "ablass:give": "从村库中捐一份献金", "ablass:sermon": "只听讲道",
  },
};
const ja: T = {
  events: {
    werber: ["領主の徴兵係", "ディトマルシェンの農民がヘミングシュテットで騎士軍を打ち破って以来、領主は再び軍備を整えている。胴衣に鉄帽の男が二人、井戸のそばで馬の燕麦を、あるいは冬の宿を求めている。"],
    weser: ["ヴェーザー川の騒乱", "荷馬車引きが知らせを運んできた。ブラウンシュヴァイク公、ブレーメン大司教、オルデンブルク伯が手を結び、ブートヤーディンゲンとシュタートラントの自由農民を攻めるという。輜重のための荷車が求められている。"],
    sund: ["スウェーデンからの凶報", "ハンザの商人と船頭が広場で休んでいる。スウェーデンでは貴族がハンス王に反旗を翻し、ストックホルムが包囲された。塩もニシンも鉄も乏しくなり、彼は最後の樽を売りに出している。"],
    ablass: ["贖宥状の箱", "赤い十字と教皇の箱を携えた説教師が村に入ってくる。ペローディ枢機卿が帝国中で贖宥を説かせており、その金はトルコ討伐に充てられるという。皆が教会前の広場へ急ぐ。"],
  },
  choices: {
    "werber:fodder": "燕麦を渡して立ち去ってもらう", "werber:quarter": "兵を冬の間泊める",
    "weser:carts": "輜重に二組の荷車を出す", "weser:ransom": "運送の務めを金で済ませる",
    "sund:buy": "村のために塩と鉄を買う", "sund:shelter": "商人と船頭を泊める", "sund:pass": "値が下がるまで待つ",
    "ablass:give": "村の金庫から献金する", "ablass:sermon": "説教だけ聞く",
  },
};
export const HISTORY_TEXT: Record<Lang, T> = { de, en, fr, es, ar, hi, zh, ja };
