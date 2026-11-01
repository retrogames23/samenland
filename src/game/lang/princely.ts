import type { Lang } from "../i18n";
import type { PrincelyKind } from "../princely";

type Text = {
  task: Record<PrincelyKind, string>;
  newTask: (task: string, reward: number) => string;
  open: (task: string) => string;
  done: (reward: number) => string;
  rest: string;
  all: string;
  favour: (n: number, of: number) => string;
  ask: string;
  fail: string;
};

export const PRINCELY: Record<Lang, Text> = {
  de: {
    task: { wonder: "Sucht ein Naturwunder oder eine Landmarke in der Wildnis auf.", letter: "Schickt einen Brief an ein anderes Dorf.", visit: "Besucht persönlich einen anderen Schulzen.", build: "Lasst in Eurem Dorf ein Gebäude errichten.", gift: "Schickt einem Nachbarn ein Geschenk.", road: "Beschließt eine neue Handelsstraße." },
    newTask: (t, r) => `„Wir erteilen Euch einen Erlass: ${t} Kehrt danach zu Uns zurück – Lohn: ${r} Taler.“`,
    open: (t) => `„Euer Erlass ist noch nicht erfüllt: ${t}“`,
    done: (r) => `„Wohlgetan! Nehmt ${r} Taler aus Unserer Schatulle und Unsere Gunst.“`,
    rest: "„Ruht Euch aus. Morgen haben Wir einen neuen Auftrag für Euch.“",
    all: "„Ihr habt Uns treu gedient. Bald werden Wir Euch zum Ritter schlagen.“",
    favour: (n, of) => `Fürstliche Gunst: ${n} von ${of} Erlassen erfüllt`,
    ask: "Nach Erlassen fragen", fail: "Der Hof konnte Euch gerade nicht anhören.",
  },
  en: {
    task: { wonder: "Seek out a natural wonder or landmark in the wild.", letter: "Send a letter to another village.", visit: "Visit another mayor in person.", build: "Have a building raised in your village.", gift: "Send a neighbour a gift.", road: "Decide on a new trade road." },
    newTask: (t, r) => `"We grant you a decree: ${t} Then return to Us – reward: ${r} Taler."`,
    open: (t) => `"Your decree is not yet fulfilled: ${t}"`,
    done: (r) => `"Well done! Take ${r} Taler from Our coffer, and Our favour."`,
    rest: "\"Rest now. Tomorrow We shall have a new task for you.\"",
    all: "\"You have served Us faithfully. Soon We shall knight you.\"",
    favour: (n, of) => `Princely favour: ${n} of ${of} decrees fulfilled`,
    ask: "Ask for decrees", fail: "The court could not hear you just now.",
  },
  fr: {
    task: { wonder: "Trouvez une merveille naturelle ou un site dans la nature.", letter: "Envoyez une lettre à un autre village.", visit: "Rendez visite en personne à un autre maire.", build: "Faites construire un bâtiment dans votre village.", gift: "Envoyez un cadeau à un voisin.", road: "Décidez une nouvelle route commerciale." },
    newTask: (t, r) => `« Nous vous confions un décret : ${t} Revenez ensuite – récompense : ${r} thalers. »`,
    open: (t) => `« Votre décret n'est pas encore accompli : ${t} »`,
    done: (r) => `« Bien joué ! Prenez ${r} thalers de Notre cassette, et Notre faveur. »`,
    rest: "« Reposez-vous. Demain Nous aurons une nouvelle mission. »",
    all: "« Vous Nous avez fidèlement servi. Bientôt Nous vous adouberons. »",
    favour: (n, of) => `Faveur princière : ${n} décrets sur ${of} accomplis`,
    ask: "Demander des décrets", fail: "La cour n'a pu vous entendre pour l'instant.",
  },
  es: {
    task: { wonder: "Buscad una maravilla natural o un hito en la naturaleza.", letter: "Enviad una carta a otra aldea.", visit: "Visitad en persona a otro alcalde.", build: "Haced levantar un edificio en vuestra aldea.", gift: "Enviad un regalo a un vecino.", road: "Decidid un nuevo camino comercial." },
    newTask: (t, r) => `«Os otorgamos un decreto: ${t} Luego volved a Nos; recompensa: ${r} táleros.»`,
    open: (t) => `«Vuestro decreto aún no está cumplido: ${t}»`,
    done: (r) => `«¡Bien hecho! Tomad ${r} táleros de Nuestro cofre y Nuestro favor.»`,
    rest: "«Descansad. Mañana tendremos una nueva tarea para vos.»",
    all: "«Nos habéis servido con lealtad. Pronto os armaremos caballero.»",
    favour: (n, of) => `Favor del príncipe: ${n} de ${of} decretos cumplidos`,
    ask: "Pedir decretos", fail: "La corte no pudo oíros ahora.",
  },
  ar: {
    task: { wonder: "ابحث عن أعجوبة طبيعية أو معلم في البرية.", letter: "أرسل رسالة إلى قرية أخرى.", visit: "زُر عمدة آخر بنفسك.", build: "شيّد مبنى في قريتك.", gift: "أرسل هدية إلى جار.", road: "قرّر طريقًا تجاريًا جديدًا." },
    newTask: (t, r) => `«نمنحك مرسومًا: ${t} ثم عُد إلينا – المكافأة: ${r} تالر.»`,
    open: (t) => `«لم يُنجَز مرسومك بعد: ${t}»`,
    done: (r) => `«أحسنت! خذ ${r} تالر من خزانتنا، ولك رضانا.»`,
    rest: "«استرح الآن. غدًا لدينا مهمة جديدة لك.»",
    all: "«لقد خدمتنا بإخلاص. قريبًا نقلّدك الفروسية.»",
    favour: (n, of) => `رضا الأمير: ${n} من ${of} مراسيم منجزة`,
    ask: "اسأل عن المراسيم", fail: "تعذّر على البلاط سماعك الآن.",
  },
  hi: {
    task: { wonder: "जंगल में कोई प्राकृतिक अजूबा या स्थल खोजें।", letter: "किसी दूसरे गाँव को पत्र भेजें।", visit: "किसी दूसरे मुखिया से स्वयं मिलें।", build: "अपने गाँव में कोई इमारत बनवाएँ।", gift: "किसी पड़ोसी को उपहार भेजें।", road: "एक नई व्यापार सड़क तय करें।" },
    newTask: (t, r) => `"हम आपको एक फ़रमान देते हैं: ${t} फिर हमारे पास लौटें – इनाम: ${r} टालर।"`,
    open: (t) => `"आपका फ़रमान अभी पूरा नहीं हुआ: ${t}"`,
    done: (r) => `"शाबाश! हमारे ख़ज़ाने से ${r} टालर और हमारी कृपा लें।"`,
    rest: "\"अब विश्राम करें। कल हमारे पास नया कार्य होगा।\"",
    all: "\"आपने निष्ठा से सेवा की। जल्द ही हम आपको नाइट बनाएँगे।\"",
    favour: (n, of) => `राजकृपा: ${of} में से ${n} फ़रमान पूरे`,
    ask: "फ़रमान पूछें", fail: "दरबार अभी आपकी बात नहीं सुन सका।",
  },
  zh: {
    task: { wonder: "前往野外寻找一处自然奇观或地标。", letter: "给另一个村庄寄一封信。", visit: "亲自拜访另一位村长。", build: "在你的村庄建造一座建筑。", gift: "给邻居送一份礼物。", road: "决定修建一条新的商路。" },
    newTask: (t, r) => `"本王颁你一道谕令：${t}完成后回来复命——赏金 ${r} 塔勒。"`,
    open: (t) => `"你的谕令尚未完成：${t}"`,
    done: (r) => `"干得好！从本王金库领取 ${r} 塔勒，并受本王恩宠。"`,
    rest: "\"先歇息吧。明日本王另有差遣。\"",
    all: "\"你忠心效力。不久本王将封你为骑士。\"",
    favour: (n, of) => `亲王恩宠：已完成 ${n}/${of} 道谕令`,
    ask: "询问谕令", fail: "宫廷此刻无法接见你。",
  },
  ja: {
    task: { wonder: "荒野の自然の驚異か名所を訪ねよ。", letter: "別の村へ手紙を送れ。", visit: "別の村長を自ら訪ねよ。", build: "村に建物を建てさせよ。", gift: "隣人に贈り物を送れ。", road: "新しい交易路を決めよ。" },
    newTask: (t, r) => `「そなたに勅令を授ける：${t}果たしたら戻れ――褒美は${r}ターラー。」`,
    open: (t) => `「勅令はまだ果たされておらぬ：${t}」`,
    done: (r) => `「見事であった！我が金庫より${r}ターラーと我が寵愛を授ける。」`,
    rest: "「今は休め。明日、新たな務めを与えよう。」",
    all: "「よく仕えてくれた。まもなくそなたを騎士に叙そう。」",
    favour: (n, of) => `領主の寵愛：勅令 ${n}/${of} 達成`,
    ask: "勅令を尋ねる", fail: "宮廷は今そなたの話を聞けぬ。",
  },
};
