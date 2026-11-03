import type { Lang } from "../i18n";

/** Courier chrome + flavoured wording of the 12 decrees (step 1..12, same kinds as princely.ts). Other languages fall back to PRINCELY.task. */
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
export const edictText = (lang: Lang, step: number): string | null => (lang === "de" ? DE : lang === "en" ? EN : null)?.[step - 1] ?? null;
