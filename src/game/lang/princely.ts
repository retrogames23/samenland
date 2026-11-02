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
  swap: string;
  swapped: string;
  wait: string;
  kneel: string;
  dubbed: (title: string) => string;
  sir: (f: boolean) => string;
  notYet: string;
  tired: string;
  seen: string;
  ready: string;
};

export const PRINCELY: Record<Lang, Text> = {
  de: {
    task: { wonder: "Sucht ein Naturwunder oder eine Landmarke in der Wildnis auf.", letter: "Schickt einen Brief an ein anderes Dorf.", visit: "Besucht persönlich einen anderen Schulzen.", build: "Lasst in Eurem Dorf ein Gebäude errichten.", gift: "Schickt einem Nachbarn ein Geschenk.", road: "Beschließt eine neue Handelsstraße.", court: 'Leistet Hofdienst: kehrt frühestens in 8 Stunden zum Schloss zurück.' },
    newTask: (t, r) => `„Wir erteilen Euch einen Erlass: ${t} Kehrt danach zu Uns zurück – Lohn: ${r} Taler.“`,
    open: (t) => `„Euer Erlass ist noch nicht erfüllt: ${t}“`,
    done: (r) => `„Wohlgetan! Nehmt ${r} Taler aus Unserer Schatulle und Unsere Gunst.“`,
    rest: "„Ruht Euch aus. Morgen haben Wir einen neuen Auftrag für Euch.“",
    all: "„Ihr habt Uns treu gedient. Bald werden Wir Euch zum Ritter schlagen.“",
    favour: (n, of) => `Fürstliche Gunst: ${n} von ${of} Erlassen erfüllt`,
    ask: "Nach Erlassen fragen", fail: "Der Hof konnte Euch gerade nicht anhören.",
    swap: 'Um einen anderen Erlass bitten', swapped: '„Nun gut, dient Uns stattdessen bei Hofe: Kehrt in 8 Stunden zurück.“', wait: '„Ihr habt heute schon um einen anderen Auftrag gebeten.“',
    kneel: 'Niederknien zum Ritterschlag', dubbed: (t) => 'Der Fürst berührt mit dem Schwert Eure Schultern: „Erhebt Euch, ${t}! Nehmt dieses Reitpferd aus Unserem Marstall – fortan reist Ihr doppelt so schnell durchs Land.“'.replace('${t}', t), sir: (f) => (f ? 'Dame' : 'Ritter'), notYet: '„Noch habt Ihr nicht genug Erlasse erfüllt.“',
    seen: "Diesen Ort habt Ihr schon früher erkundet – er steht bereits in Eurem Gipfelbuch.", tired: "Ihr habt heute schon 3 Wunder erkundet – Eure Füße sind müde. Morgen könnt Ihr weitere entdecken.", ready: "Euer fürstlicher Erlass ist erfüllt – kehrt zum Schloss zurück und bittet um Audienz.",
  },
  en: {
    task: { wonder: "Seek out a natural wonder or landmark in the wild.", letter: "Send a letter to another village.", visit: "Visit another mayor in person.", build: "Have a building raised in your village.", gift: "Send a neighbour a gift.", road: "Decide on a new trade road.", court: 'Serve at court: return to the castle in 8 hours at the earliest.' },
    newTask: (t, r) => `"We grant you a decree: ${t} Then return to Us – reward: ${r} Taler."`,
    open: (t) => `"Your decree is not yet fulfilled: ${t}"`,
    done: (r) => `"Well done! Take ${r} Taler from Our coffer, and Our favour."`,
    rest: "\"Rest now. Tomorrow We shall have a new task for you.\"",
    all: "\"You have served Us faithfully. Soon We shall knight you.\"",
    favour: (n, of) => `Princely favour: ${n} of ${of} decrees fulfilled`,
    ask: "Ask for decrees", fail: "The court could not hear you just now.",
    swap: 'Ask for another decree', swapped: '"Very well, serve Us at court instead: return in 8 hours."', wait: '"You already asked for another task today."',
    kneel: 'Kneel to be knighted', dubbed: (t) => 'The Prince touches your shoulders with his sword: "Rise, ${t}! Take this horse from Our stables – from now on you travel the land twice as fast."'.replace('${t}', t), sir: (f) => (f ? 'Dame' : 'Sir Knight'), notYet: '"You have not yet fulfilled enough decrees."',
    seen: "You explored this place before – it is already in your summit book.", tired: "You have already explored 3 wonders today – your feet are weary. You can discover more tomorrow.", ready: "Your princely decree is fulfilled – return to the castle and ask for an audience.",
  },
  fr: {
    task: { wonder: "Trouvez une merveille naturelle ou un site dans la nature.", letter: "Envoyez une lettre à un autre village.", visit: "Rendez visite en personne à un autre maire.", build: "Faites construire un bâtiment dans votre village.", gift: "Envoyez un cadeau à un voisin.", road: "Décidez une nouvelle route commerciale.", court: 'Servez à la cour : revenez au château dans 8 heures au plus tôt.' },
    newTask: (t, r) => `« Nous vous confions un décret : ${t} Revenez ensuite – récompense : ${r} thalers. »`,
    open: (t) => `« Votre décret n'est pas encore accompli : ${t} »`,
    done: (r) => `« Bien joué ! Prenez ${r} thalers de Notre cassette, et Notre faveur. »`,
    rest: "« Reposez-vous. Demain Nous aurons une nouvelle mission. »",
    all: "« Vous Nous avez fidèlement servi. Bientôt Nous vous adouberons. »",
    favour: (n, of) => `Faveur princière : ${n} décrets sur ${of} accomplis`,
    ask: "Demander des décrets", fail: "La cour n'a pu vous entendre pour l'instant.",
    swap: 'Demander un autre décret', swapped: '« Soit, servez-Nous plutôt à la cour : revenez dans 8 heures. »', wait: "« Vous avez déjà demandé une autre mission aujourd'hui. »",
    kneel: "S'agenouiller pour l'adoubement", dubbed: (t) => "Le prince pose l'épée sur vos épaules : « Relevez-vous, ${t} ! Prenez ce cheval de Nos écuries – désormais vous voyagerez deux fois plus vite. »".replace('${t}', t), sir: (f) => (f ? 'Dame' : 'Chevalier'), notYet: "« Vous n'avez pas encore accompli assez de décrets. »",
    seen: "Vous avez déjà exploré ce lieu – il figure déjà dans votre livre du sommet.", tired: "Vous avez déjà exploré 3 merveilles aujourd'hui – vos pieds sont las. Revenez demain pour en découvrir d'autres.", ready: "Votre décret princier est accompli – retournez au château et demandez audience.",
  },
  es: {
    task: { wonder: "Buscad una maravilla natural o un hito en la naturaleza.", letter: "Enviad una carta a otra aldea.", visit: "Visitad en persona a otro alcalde.", build: "Haced levantar un edificio en vuestra aldea.", gift: "Enviad un regalo a un vecino.", road: "Decidid un nuevo camino comercial.", court: 'Servid en la corte: volved al castillo dentro de 8 horas como pronto.' },
    newTask: (t, r) => `«Os otorgamos un decreto: ${t} Luego volved a Nos; recompensa: ${r} táleros.»`,
    open: (t) => `«Vuestro decreto aún no está cumplido: ${t}»`,
    done: (r) => `«¡Bien hecho! Tomad ${r} táleros de Nuestro cofre y Nuestro favor.»`,
    rest: "«Descansad. Mañana tendremos una nueva tarea para vos.»",
    all: "«Nos habéis servido con lealtad. Pronto os armaremos caballero.»",
    favour: (n, of) => `Favor del príncipe: ${n} de ${of} decretos cumplidos`,
    ask: "Pedir decretos", fail: "La corte no pudo oíros ahora.",
    swap: 'Pedir otro decreto', swapped: '«Sea, servidnos en la corte: volved dentro de 8 horas.»', wait: '«Ya pedisteis otra tarea hoy.»',
    kneel: 'Arrodillarse para ser armado caballero', dubbed: (t) => 'El príncipe toca vuestros hombros con la espada: «¡Alzaos, ${t}! Tomad este caballo de Nuestras cuadras; desde hoy viajaréis el doble de rápido.»'.replace('${t}', t), sir: (f) => (f ? 'Dama' : 'Caballero'), notYet: '«Aún no habéis cumplido suficientes decretos.»',
    seen: "Ya explorasteis este lugar – figura en vuestro libro de cumbre.", tired: "Hoy ya habéis explorado 3 maravillas – vuestros pies están cansados. Mañana podréis descubrir más.", ready: "Vuestro decreto principesco está cumplido: volved al castillo y pedid audiencia.",
  },
  ar: {
    task: { wonder: "ابحث عن أعجوبة طبيعية أو معلم في البرية.", letter: "أرسل رسالة إلى قرية أخرى.", visit: "زُر عمدة آخر بنفسك.", build: "شيّد مبنى في قريتك.", gift: "أرسل هدية إلى جار.", road: "قرّر طريقًا تجاريًا جديدًا.", court: 'اخدم في البلاط: عُد إلى القصر بعد 8 ساعات على الأقل.' },
    newTask: (t, r) => `«نمنحك مرسومًا: ${t} ثم عُد إلينا – المكافأة: ${r} تالر.»`,
    open: (t) => `«لم يُنجَز مرسومك بعد: ${t}»`,
    done: (r) => `«أحسنت! خذ ${r} تالر من خزانتنا، ولك رضانا.»`,
    rest: "«استرح الآن. غدًا لدينا مهمة جديدة لك.»",
    all: "«لقد خدمتنا بإخلاص. قريبًا نقلّدك الفروسية.»",
    favour: (n, of) => `رضا الأمير: ${n} من ${of} مراسيم منجزة`,
    ask: "اسأل عن المراسيم", fail: "تعذّر على البلاط سماعك الآن.",
    swap: 'اطلب مرسومًا آخر', swapped: '«حسنًا، اخدمنا في البلاط بدلًا من ذلك: عُد بعد 8 ساعات.»', wait: '«لقد طلبت مهمة أخرى اليوم بالفعل.»',
    kneel: 'اركع لتنال لقب الفارس', dubbed: (t) => 'يلمس الأمير كتفيك بسيفه: «انهض يا ${t}! خذ هذا الحصان من إسطبلاتنا – من الآن تسافر في البلاد بضعف السرعة.»'.replace('${t}', t), sir: (f) => (f ? 'السيدة الفارسة' : 'الفارس'), notYet: '«لم تُنجز بعد ما يكفي من المراسيم.»',
    seen: "لقد استكشفت هذا المكان من قبل – إنه مسجل في سجل الرواد.", tired: "لقد استكشفت اليوم 3 عجائب بالفعل – قدماك متعبتان. يمكنك اكتشاف المزيد غدًا.", ready: "تم تنفيذ مرسوم الأمير – عد إلى القصر واطلب المثول.",
  },
  hi: {
    task: { wonder: "जंगल में कोई प्राकृतिक अजूबा या स्थल खोजें।", letter: "किसी दूसरे गाँव को पत्र भेजें।", visit: "किसी दूसरे मुखिया से स्वयं मिलें।", build: "अपने गाँव में कोई इमारत बनवाएँ।", gift: "किसी पड़ोसी को उपहार भेजें।", road: "एक नई व्यापार सड़क तय करें।", court: 'दरबार में सेवा करें: कम से कम 8 घंटे बाद महल लौटें।' },
    newTask: (t, r) => `"हम आपको एक फ़रमान देते हैं: ${t} फिर हमारे पास लौटें – इनाम: ${r} टालर।"`,
    open: (t) => `"आपका फ़रमान अभी पूरा नहीं हुआ: ${t}"`,
    done: (r) => `"शाबाश! हमारे ख़ज़ाने से ${r} टालर और हमारी कृपा लें।"`,
    rest: "\"अब विश्राम करें। कल हमारे पास नया कार्य होगा।\"",
    all: "\"आपने निष्ठा से सेवा की। जल्द ही हम आपको नाइट बनाएँगे।\"",
    favour: (n, of) => `राजकृपा: ${of} में से ${n} फ़रमान पूरे`,
    ask: "फ़रमान पूछें", fail: "दरबार अभी आपकी बात नहीं सुन सका।",
    swap: 'दूसरा फ़रमान माँगें', swapped: '"ठीक है, इसके बजाय दरबार में सेवा करें: 8 घंटे बाद लौटें।"', wait: '"आप आज पहले ही दूसरा काम माँग चुके हैं।"',
    kneel: 'सामंत उपाधि के लिए घुटने टेकें', dubbed: (t) => 'राजकुमार तलवार से आपके कंधे छूते हैं: «उठिए, ${t}! हमारे अस्तबल का यह घोड़ा लीजिए – अब आप दोगुनी तेज़ी से यात्रा करेंगे।»'.replace('${t}', t), sir: (f) => (f ? 'दाम' : 'सर नाइट'), notYet: '«आपने अभी पर्याप्त आदेश पूरे नहीं किए हैं।»',
    seen: "आप यह स्थान पहले ही खोज चुके हैं – यह आपकी शिखर-पुस्तिका में है।", tired: "आज आप पहले ही 3 अजूबे खोज चुके हैं – आपके पैर थक गए हैं। कल और खोज सकते हैं।", ready: "आपका राजकीय फ़रमान पूरा हो गया – महल लौटें और दरबार की विनती करें।",
  },
  zh: {
    task: { wonder: "前往野外寻找一处自然奇观或地标。", letter: "给另一个村庄寄一封信。", visit: "亲自拜访另一位村长。", build: "在你的村庄建造一座建筑。", gift: "给邻居送一份礼物。", road: "决定修建一条新的商路。", court: '在宫廷效力：至少8小时后返回城堡。' },
    newTask: (t, r) => `"本王颁你一道谕令：${t}完成后回来复命——赏金 ${r} 塔勒。"`,
    open: (t) => `"你的谕令尚未完成：${t}"`,
    done: (r) => `"干得好！从本王金库领取 ${r} 塔勒，并受本王恩宠。"`,
    rest: "\"先歇息吧。明日本王另有差遣。\"",
    all: "\"你忠心效力。不久本王将封你为骑士。\"",
    favour: (n, of) => `亲王恩宠：已完成 ${n}/${of} 道谕令`,
    ask: "询问谕令", fail: "宫廷此刻无法接见你。",
    swap: '请求另一道诏令', swapped: '"好吧，那就在宫廷为朕效力：8小时后再来。"', wait: '"你今天已经请求过换一项任务了。"',
    kneel: '跪下受封骑士', dubbed: (t) => '亲王以剑轻触你的双肩：「起身吧，${t}！收下我们马厩中的这匹马——从此你在大地上行进快一倍。」'.replace('${t}', t), sir: (f) => (f ? '女骑士' : '骑士'), notYet: '「你完成的诏令还不够。」',
    seen: "你曾探访过此地——它已载入你的登顶簿。", tired: "你今天已探访了 3 处奇观——双脚已疲惫。明天再去发现更多吧。", ready: "亲王的敕令已完成——请回城堡请求觐见。",
  },
  ja: {
    task: { wonder: "荒野の自然の驚異か名所を訪ねよ。", letter: "別の村へ手紙を送れ。", visit: "別の村長を自ら訪ねよ。", build: "村に建物を建てさせよ。", gift: "隣人に贈り物を送れ。", road: "新しい交易路を決めよ。", court: '宮廷に仕えよ：早くとも8時間後に城へ戻ること。' },
    newTask: (t, r) => `「そなたに勅令を授ける：${t}果たしたら戻れ――褒美は${r}ターラー。」`,
    open: (t) => `「勅令はまだ果たされておらぬ：${t}」`,
    done: (r) => `「見事であった！我が金庫より${r}ターラーと我が寵愛を授ける。」`,
    rest: "「今は休め。明日、新たな務めを与えよう。」",
    all: "「よく仕えてくれた。まもなくそなたを騎士に叙そう。」",
    favour: (n, of) => `領主の寵愛：勅令 ${n}/${of} 達成`,
    ask: "勅令を尋ねる", fail: "宮廷は今そなたの話を聞けぬ。",
    swap: '別の勅令を願う', swapped: '「よかろう、代わりに宮廷に仕えよ。8時間後に戻るがよい。」', wait: '「今日はすでに別の任務を願い出ている。」',
    kneel: 'ひざまずいて騎士に叙される', dubbed: (t) => '大公が剣であなたの肩に触れる：「立ちなさい、${t}！我らの厩舎の馬を授けよう――これより汝は二倍の速さで旅をする。」'.replace('${t}', t), sir: (f) => (f ? '女騎士' : '騎士'), notYet: '「まだ十分な勅令を果たしていない。」',
    seen: "ここは以前に探索済みです。すでに登頂記に記されています。", tired: "今日はもう3つの名所を探索しました。足が疲れています。続きは明日どうぞ。", ready: "大公の勅令は果たされました。城へ戻り、謁見を願い出ましょう。",
  },
};
