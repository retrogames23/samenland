import type { Lang } from "../i18n";

/** Courier chrome + flavoured wording of the 12 decrees (step 1..12, same kinds as princely.ts). */
type Chrome = { title: string; arrive: string; button: string; ask: string; read: string; leave: string };
export const HERALD: Record<Lang, Chrome> = {
  de: { title: "Ein Bote des Fürsten", arrive: "Ein Reiter in den Farben des Hofes zügelt sein Pferd vor dem Schulzenhaus und zieht eine versiegelte Depesche hervor.", button: "Bote des Fürsten", ask: "Depesche entgegennehmen", read: "„Ich trage Euren Bericht zurück an den Hof.“", leave: "Den Boten ziehen lassen" },
  en: { title: "A messenger of the Prince", arrive: "A rider in the court's colours reins in his horse before the mayor's house and draws out a sealed dispatch.", button: "Prince's messenger", ask: "Receive the dispatch", read: "\"I shall carry your report back to court.\"", leave: "Let the messenger go" },
  fr: { title: "Un messager du prince", arrive: "Un cavalier aux couleurs de la cour s'arrête devant la maison du maire et tire une dépêche scellée.", button: "Messager du prince", ask: "Recevoir la dépêche", read: "« Je porterai votre rapport à la cour. »", leave: "Laisser partir le messager" },
  es: { title: "Un mensajero del Príncipe", arrive: "Un jinete con los colores de la corte se detiene ante la casa del alcalde y saca un despacho sellado.", button: "Mensajero del Príncipe", ask: "Recibir el despacho", read: "«Llevaré vuestro informe a la corte.»", leave: "Dejar ir al mensajero" },
  ar: { title: "رسول الأمير", arrive: "فارس بألوان البلاط يوقف حصانه أمام بيت العمدة ويُخرج رسالة مختومة.", button: "رسول الأمير", ask: "استلام الرسالة", read: "«سأحمل تقريرك إلى البلاط.»", leave: "دع الرسول يمضي" },
  hi: { title: "राजकुमार का दूत", arrive: "दरबार के रंगों में एक घुड़सवार मुखिया के घर के आगे रुकता है और मुहरबंद पत्र निकालता है।", button: "राजकुमार का दूत", ask: "पत्र लें", read: "\"मैं आपका समाचार दरबार तक पहुँचाऊँगा।\"", leave: "दूत को जाने दें" },
  zh: { title: "亲王的信使", arrive: "一位身着宫廷服色的骑手在村长家门前勒马，取出一封密封的公文。", button: "亲王信使", ask: "接收公文", read: "\"我会把您的回报带回宫廷。\"", leave: "让信使离开" },
  ja: { title: "領主の使者", arrive: "宮廷の色をまとった騎手が村長の家の前で馬を止め、封印された書状を取り出す。", button: "領主の使者", ask: "書状を受け取る", read: "「ご報告は私が宮廷へお届けします。」", leave: "使者を見送る" },
};

/** HUD label for the open decree shown in the quest panel. */
export const DECREE_HEAD: Record<Lang, string> = {
  de: "Erlass des Fürsten", en: "The Prince's decree", fr: "Décret du prince", es: "Decreto del Príncipe",
  ar: "مرسوم الأمير", hi: "राजकुमार का आदेश", zh: "亲王的敕令", ja: "領主の布告",
};

const DE = [
  "Unsere Landkarten zeigen weiße Flecken. Erkundet ein Naturwunder oder eine Landmarke und bringt Uns Kunde davon.",
  "Eintracht hält ein Land zusammen. Schreibt im Namen der Krone einen Brief an ein anderes Dorf.",
  "Ein Fürst muss wissen, wie es seinen Schulzen ergeht. Reist zu einem Nachbarn und seht selbst nach dem Rechten.",
  "Ein Dorf, das wächst, mehrt den Ruhm des Landes. Lasst ein neues Gebäude errichten.",
  "Freundschaft gedeiht durch Gaben. Sendet einem Nachbardorf ein Geschenk als Zeichen fürstlicher Huld.",
  "Handel ist das Blut des Reiches. Bindet Euer Dorf an das Straßennetz der Krone.",
  "Die Fürstin wünscht von den Wundern des Landes zu hören. Sucht einen Ort auf, den Eure Füße noch nicht kennen.",
  "Ein Nachbar soll wissen, dass der Hof an ihn denkt. Überbringt ihm einen Brief mit Unserem Gruß.",
  "Ein junger Weiler müht sich ab. Besucht einen anderen Schulzen und steht ihm mit Rat zur Seite.",
  "Zur Hofjagd erwarten Wir hohen Besuch. Zeigt, dass Euer Dorf Gäste würdig empfangen kann – baut aus.",
  "Ein Winter ohne Hilfe ist hart. Schickt einem Nachbarn eine Gabe, damit niemand im Land darben muss.",
  "Unser letzter Wunsch: Ein Land aus einem Guss. Beschließt eine Straße, die Dörfer verbindet – dann tretet zum Ritterschlag vor Uns.",
];
const EN = [
  "Our maps still show blank spots. Explore a natural wonder or landmark and bring Us word of it.",
  "Harmony holds a land together. Write a letter to another village in the Crown's name.",
  "A prince must know how his mayors fare. Travel to a neighbour and see for yourself.",
  "A growing village adds to the land's renown. Have a new building raised.",
  "Friendship thrives on gifts. Send a neighbouring village a present as a token of princely favour.",
  "Trade is the lifeblood of the realm. Join your village to the Crown's road network.",
  "The Princess wishes to hear of the land's wonders. Seek out a place your feet do not yet know.",
  "Let a neighbour know the court remembers him. Bring him a letter with Our greetings.",
  "A young hamlet is struggling. Visit another mayor and stand by him with counsel.",
  "We expect noble guests for the royal hunt. Show that your village can receive them worthily – build.",
  "A winter without help is hard. Send a neighbour a gift so that no one in the land goes hungry.",
  "Our last wish: a land of one piece. Decide on a road that joins villages – then come before Us to be knighted.",
];
const FR = ["Nos cartes montrent encore des taches blanches. Explorez une merveille naturelle ou un site remarquable et rapportez-Nous-en des nouvelles.", "La concorde tient un pays uni. Écrivez au nom de la Couronne une lettre à un autre village.", "Un prince doit savoir comment se portent ses maires. Rendez visite à un voisin et voyez par vous-même.", "Un village qui grandit accroît la gloire du pays. Faites élever un nouveau bâtiment.", "L'amitié se nourrit de présents. Envoyez un cadeau à un village voisin en signe de faveur princière.", "Le commerce est le sang du royaume. Reliez votre village au réseau routier de la Couronne.", "La princesse veut entendre parler des merveilles du pays. Cherchez un lieu que vos pas ne connaissent pas encore.", "Qu'un voisin sache que la cour pense à lui. Portez-lui une lettre avec Nos salutations.", "Un jeune hameau peine. Rendez visite à un autre maire et soutenez-le de vos conseils.", "Nous attendons de nobles hôtes pour la chasse. Montrez que votre village sait les recevoir dignement : bâtissez.", "Un hiver sans aide est rude. Envoyez un présent à un voisin, que nul ne manque de rien au pays.", "Notre dernier vœu : un pays d'un seul tenant. Décidez d'une route reliant des villages, puis présentez-vous à Nous pour l'adoubement."];
const ES = ["Nuestros mapas aún muestran manchas blancas. Explorad una maravilla natural o un lugar señalado y traednos noticia de él.", "La concordia mantiene unida una tierra. Escribid en nombre de la Corona una carta a otra aldea.", "Un príncipe debe saber cómo les va a sus alcaldes. Visitad a un vecino y vedlo con vuestros propios ojos.", "Una aldea que crece acrecienta la fama del país. Mandad levantar un nuevo edificio.", "La amistad florece con regalos. Enviad un obsequio a una aldea vecina en señal del favor principesco.", "El comercio es la sangre del reino. Unid vuestra aldea a la red de caminos de la Corona.", "La princesa desea oír de las maravillas del país. Buscad un lugar que vuestros pies aún no conozcan.", "Que un vecino sepa que la corte piensa en él. Llevadle una carta con Nuestro saludo.", "Un joven caserío pasa apuros. Visitad a otro alcalde y apoyadle con vuestro consejo.", "Esperamos nobles huéspedes para la cacería. Mostrad que vuestra aldea sabe recibirlos dignamente: construid.", "Un invierno sin ayuda es duro. Enviad un obsequio a un vecino para que nadie pase penurias en el país.", "Nuestro último deseo: una tierra unida. Decidid un camino que una aldeas y presentaos ante Nos para ser armado caballero."];
const AR = ["لا تزال خرائطنا تحوي بقاعًا بيضاء. استكشف أعجوبة طبيعية أو معلمًا وائتنا بخبره.", "الوئام يجمع البلاد. اكتب باسم التاج رسالة إلى قرية أخرى.", "على الأمير أن يعرف أحوال عُمَده. زُر جارًا وانظر بنفسك.", "القرية التي تنمو تزيد البلاد مجدًا. شيّد مبنى جديدًا.", "الصداقة تزدهر بالهدايا. أرسل هدية إلى قرية مجاورة علامةً على رضا الأمير.", "التجارة دم المملكة. اربط قريتك بشبكة طرق التاج.", "تودّ الأميرة أن تسمع عن عجائب البلاد. ابحث عن مكان لم تطأه قدماك بعد.", "ليعلم جارٌ أن البلاط يذكره. احمل إليه رسالة بتحيتنا.", "قرية صغيرة ناشئة تكابد. زُر عمدة آخر وقف إلى جانبه بالمشورة.", "ننتظر ضيوفًا نبلاء للصيد الملكي. أظهر أن قريتك تحسن استقبالهم: ابنِ.", "الشتاء بلا عون قاسٍ. أرسل هدية إلى جار كي لا يجوع أحد في البلاد.", "أمنيتنا الأخيرة: بلاد متصلة. قرّر طريقًا يصل القرى، ثم امثُل أمامنا لتُقلَّد الفروسية."];
const HI = ["हमारे नक्शों में अब भी कोरे स्थान हैं। कोई प्राकृतिक अजूबा या स्थल खोजिए और हमें उसकी ख़बर दीजिए।", "मेल-जोल देश को जोड़े रखता है। राजमुकुट के नाम से किसी दूसरे गाँव को पत्र लिखिए।", "राजकुमार को जानना चाहिए कि उसके मुखिया कैसे हैं। किसी पड़ोसी के यहाँ जाकर स्वयं देखिए।", "बढ़ता गाँव देश का यश बढ़ाता है। एक नया भवन बनवाइए।", "मित्रता उपहारों से फलती है। राजकृपा के चिह्न के रूप में किसी पड़ोसी गाँव को उपहार भेजिए।", "व्यापार राज्य की धड़कन है। अपने गाँव को राजमुकुट के मार्ग-जाल से जोड़िए।", "राजकुमारी देश के अजूबों के बारे में सुनना चाहती हैं। कोई ऐसा स्थान खोजिए जहाँ आपके कदम अभी नहीं पहुँचे।", "पड़ोसी जाने कि दरबार उसे याद करता है। हमारे अभिवादन के साथ उसे एक पत्र पहुँचाइए।", "एक नया पुरवा संघर्ष कर रहा है। किसी दूसरे मुखिया से मिलिए और सलाह से उसका साथ दीजिए।", "शाही शिकार पर हम उच्च अतिथियों की प्रतीक्षा में हैं। दिखाइए कि आपका गाँव उनका योग्य स्वागत कर सकता है – निर्माण कीजिए।", "बिना सहायता की सर्दी कठोर होती है। किसी पड़ोसी को उपहार भेजिए ताकि देश में कोई भूखा न रहे।", "हमारी अंतिम इच्छा: एक जुड़ा हुआ देश। गाँवों को जोड़ने वाली सड़क तय कीजिए – फिर नाइट की उपाधि के लिए हमारे सामने आइए।"];
const ZH = ["本王的地图上仍有空白。去探访一处自然奇观或地标，并将消息带回。", "和睦使国土团结。以王冠之名给另一个村庄写一封信。", "亲王须知晓村长们的境况。亲自去拜访一位邻居。", "兴旺的村庄为国增光。下令建造一座新建筑。", "友谊因礼物而深厚。向邻村送去一份礼物，以示亲王的恩宠。", "贸易是王国的血脉。将你的村庄接入王冠的道路网。", "公主想听闻国土上的奇观。去寻找一处你尚未踏足之地。", "让邻居知道宫廷挂念着他。带去一封附有本王问候的信。", "一个年轻的小村正艰难度日。拜访另一位村长，以良言相助。", "本王将为狩猎迎接贵客。证明你的村庄能体面地接待他们——去建设吧。", "无助的冬天十分难熬。给邻居送去礼物，让国中无人挨饿。", "本王最后的心愿：国土连成一片。修一条连接村庄的道路——然后前来受封骑士。"];
const JA = ["我らの地図にはまだ空白がある。自然の驚異か名所を訪れ、その知らせを持ち帰れ。", "和こそ国をひとつにする。王冠の名において、他の村へ手紙を書け。", "領主は村長たちの様子を知らねばならぬ。隣人を訪ね、自らの目で確かめよ。", "栄える村は国の誉れを高める。新たな建物を建てさせよ。", "友情は贈り物で育つ。領主の恩寵のしるしとして、隣村に贈り物を送れ。", "交易は王国の血潮である。そなたの村を王冠の街道網につなげ。", "姫が国の驚異について聞きたがっておる。まだ足を踏み入れたことのない地を探せ。", "宮廷が気にかけていると隣人に知らせよ。我らの挨拶を添えた手紙を届けよ。", "若い集落が苦しんでおる。他の村長を訪ね、助言で支えてやれ。", "狩りに高貴な客人を迎える。そなたの村がふさわしくもてなせることを示せ――建てよ。", "助けのない冬は厳しい。国の誰も飢えぬよう、隣人に贈り物を送れ。", "我らの最後の願い：ひとつにつながった国。村々を結ぶ道を定めよ――そして騎士叙任のため我らの前に参れ。"];
const ALL: Record<Lang, string[]> = { de: DE, en: EN, fr: FR, es: ES, ar: AR, hi: HI, zh: ZH, ja: JA };
export const edictText = (lang: Lang, step: number): string | null => ALL[lang]?.[step - 1] ?? null;
