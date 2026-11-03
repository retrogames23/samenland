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
  errand: Record<"gardener" | "groom", [string, string]>;
  errandTitle: string;
  errandDone: string;
  errandWho: Record<"gardener" | "groom", string>;
  errandReady: string;
  errandHint: string;
};

export const PRINCELY: Record<Lang, Text> = {
  de: {
    task: { wonder: "Sucht ein Naturwunder oder eine Landmarke in der Wildnis auf.", letter: "Schickt einen Brief an ein anderes Dorf.", visit: "Besucht persönlich einen anderen Schulzen.", build: "Lasst in Eurem Dorf ein Gebäude errichten.", gift: "Schickt einem Nachbarn ein Geschenk.", road: "Beschließt eine neue Handelsstraße.", court: 'Leistet Hofdienst: Sprecht auf dem Schlossgut mit dem Hofgärtner im Rosengarten und dem Stallmeister am Marstall.' },
    newTask: (t, r) => `„Wir erteilen Euch einen Erlass: ${t} Unser Bote kommt wieder in Euer Dorf und nimmt Euren Bericht entgegen – Lohn: ${r} Taler.“`,
    open: (t) => `„Euer Erlass ist noch nicht erfüllt: ${t}“`,
    done: (r) => `„Wohlgetan! Nehmt ${r} Taler aus Unserer Schatulle und Unsere Gunst.“`,
    rest: "„Ruht Euch aus. Morgen haben Wir einen neuen Auftrag für Euch.“",
    all: "„Ihr habt Uns treu gedient. Bald werden Wir Euch zum Ritter schlagen.“",
    favour: (n, of) => `Fürstliche Gunst: ${n} von ${of} Erlassen erfüllt`,
    ask: "Nach Erlassen fragen", fail: "Der Hof konnte Euch gerade nicht anhören.",
    swap: 'Um einen anderen Erlass bitten', swapped: '„Nun gut, dient Uns stattdessen bei Hofe: Sucht den Hofgärtner im Rosengarten und den Stallmeister am Marstall auf. Danach tretet wieder vor Uns.“', wait: '„Ihr habt heute schon um einen anderen Auftrag gebeten.“',
    kneel: 'Niederknien zum Ritterschlag', dubbed: (t) => 'Der Fürst berührt mit dem Schwert Eure Schultern: „Erhebt Euch, ${t}! Nehmt dieses Reitpferd aus Unserem Marstall – fortan reist Ihr doppelt so schnell durchs Land.“'.replace('${t}', t), sir: (f) => (f ? 'Dame' : 'Ritter'), notYet: '„Noch habt Ihr nicht genug Erlasse erfüllt.“',
    seen: "Diesen Ort habt Ihr schon früher erkundet – er steht bereits in Eurem Gipfelbuch.", tired: "Ihr habt heute schon 3 Wunder erkundet – Eure Füße sind müde. Morgen könnt Ihr weitere entdecken.", ready: "Euer fürstlicher Erlass ist erfüllt – der Bote des Fürsten wartet in Eurem Dorf auf Euren Bericht.",
    errand: { gardener: ['Mit dem Hofgärtner sprechen', 'Der Hofgärtner schneidet Euch ein Gebinde duftender Rosen für die Fürstin.'], groom: ['Mit dem Stallmeister sprechen', 'Der Stallmeister nimmt Eure Order entgegen und lässt die Pferde für die Jagd satteln.'] }, errandTitle: 'Hofdienst', errandDone: 'Bereits erledigt', errandWho: { gardener: 'Gärtner im Rosengarten (6–17 Uhr)', groom: 'Stallmeister am Marstall (6–19 Uhr)' }, errandReady: 'Euer Hofdienst ist vollbracht – bittet beim Schloss um Audienz.', errandHint: 'Geht im Flaniermodus nah an die Figur heran, dann erscheint ein Knopf zum Ansprechen.',
  },
  en: {
    task: { wonder: "Seek out a natural wonder or landmark in the wild.", letter: "Send a letter to another village.", visit: "Visit another mayor in person.", build: "Have a building raised in your village.", gift: "Send a neighbour a gift.", road: "Decide on a new trade road.", court: 'Serve at court: on the estate, speak to the gardener in the rose garden and the groom at the stables.' },
    newTask: (t, r) => `"We grant you a decree: ${t} Our messenger will return to your village for your report – reward: ${r} Taler."`,
    open: (t) => `"Your decree is not yet fulfilled: ${t}"`,
    done: (r) => `"Well done! Take ${r} Taler from Our coffer, and Our favour."`,
    rest: "\"Rest now. Tomorrow We shall have a new task for you.\"",
    all: "\"You have served Us faithfully. Soon We shall knight you.\"",
    favour: (n, of) => `Princely favour: ${n} of ${of} decrees fulfilled`,
    ask: "Ask for decrees", fail: "The court could not hear you just now.",
    swap: 'Ask for another decree', swapped: '"Very well, serve Us at court instead: find the gardener in the rose garden and the groom at the stables. Then come before Us again."', wait: '"You already asked for another task today."',
    kneel: 'Kneel to be knighted', dubbed: (t) => 'The Prince touches your shoulders with his sword: "Rise, ${t}! Take this horse from Our stables – from now on you travel the land twice as fast."'.replace('${t}', t), sir: (f) => (f ? 'Dame' : 'Sir Knight'), notYet: '"You have not yet fulfilled enough decrees."',
    seen: "You explored this place before – it is already in your summit book.", tired: "You have already explored 3 wonders today – your feet are weary. You can discover more tomorrow.", ready: "Your princely decree is fulfilled – the Prince's messenger awaits your report in your village.",
    errand: { gardener: ['Speak to the gardener', 'The gardener cuts you a bunch of fragrant roses for the Princess.'], groom: ['Speak to the groom', 'The groom takes your order and saddles the horses for the hunt.'] }, errandTitle: 'Court service', errandDone: 'Done', errandWho: { gardener: 'Gardener in the rose garden (6am–5pm)', groom: 'Groom at the stables (6am–7pm)' }, errandReady: 'Your court service is complete – ask for an audience at the castle.', errandHint: 'Walk close to the figure and a button to speak to them appears.',
  },
  fr: {
    task: { wonder: "Trouvez une merveille naturelle ou un site dans la nature.", letter: "Envoyez une lettre à un autre village.", visit: "Rendez visite en personne à un autre maire.", build: "Faites construire un bâtiment dans votre village.", gift: "Envoyez un cadeau à un voisin.", road: "Décidez une nouvelle route commerciale.", court: 'Servez à la cour : sur le domaine, parlez au jardinier dans la roseraie et au palefrenier aux écuries.' },
    newTask: (t, r) => `« Nous vous confions un décret : ${t} Notre messager reviendra dans votre village recueillir votre rapport – récompense : ${r} thalers. »`,
    open: (t) => `« Votre décret n'est pas encore accompli : ${t} »`,
    done: (r) => `« Bien joué ! Prenez ${r} thalers de Notre cassette, et Notre faveur. »`,
    rest: "« Reposez-vous. Demain Nous aurons une nouvelle mission. »",
    all: "« Vous Nous avez fidèlement servi. Bientôt Nous vous adouberons. »",
    favour: (n, of) => `Faveur princière : ${n} décrets sur ${of} accomplis`,
    ask: "Demander des décrets", fail: "La cour n'a pu vous entendre pour l'instant.",
    swap: 'Demander un autre décret', swapped: '« Soit, servez-Nous plutôt à la cour : trouvez le jardinier dans la roseraie et le palefrenier aux écuries. Puis revenez devant Nous. »', wait: "« Vous avez déjà demandé une autre mission aujourd'hui. »",
    kneel: "S'agenouiller pour l'adoubement", dubbed: (t) => "Le prince pose l'épée sur vos épaules : « Relevez-vous, ${t} ! Prenez ce cheval de Nos écuries – désormais vous voyagerez deux fois plus vite. »".replace('${t}', t), sir: (f) => (f ? 'Dame' : 'Chevalier'), notYet: "« Vous n'avez pas encore accompli assez de décrets. »",
    seen: "Vous avez déjà exploré ce lieu – il figure déjà dans votre livre du sommet.", tired: "Vous avez déjà exploré 3 merveilles aujourd'hui – vos pieds sont las. Revenez demain pour en découvrir d'autres.", ready: "Votre décret princier est accompli – le messager du prince attend votre rapport au village.",
    errand: { gardener: ['Parler au jardinier', 'Le jardinier vous coupe un bouquet de roses parfumées pour la princesse.'], groom: ['Parler au palefrenier', 'Le palefrenier prend votre ordre et selle les chevaux pour la chasse.'] }, errandTitle: 'Service à la cour', errandDone: 'Fait', errandWho: { gardener: 'Jardinier dans la roseraie (6h–17h)', groom: 'Palefrenier aux écuries (6h–19h)' }, errandReady: 'Votre service est accompli – demandez audience au château.', errandHint: 'Approchez-vous de la figure : un bouton pour lui parler apparaît.',
  },
  es: {
    task: { wonder: "Buscad una maravilla natural o un hito en la naturaleza.", letter: "Enviad una carta a otra aldea.", visit: "Visitad en persona a otro alcalde.", build: "Haced levantar un edificio en vuestra aldea.", gift: "Enviad un regalo a un vecino.", road: "Decidid un nuevo camino comercial.", court: 'Servid en la corte: en la finca, hablad con el jardinero del rosal y con el mozo de cuadra en las caballerizas.' },
    newTask: (t, r) => `«Os otorgamos un decreto: ${t} Nuestro mensajero volverá a vuestra aldea por vuestro informe; recompensa: ${r} táleros.»`,
    open: (t) => `«Vuestro decreto aún no está cumplido: ${t}»`,
    done: (r) => `«¡Bien hecho! Tomad ${r} táleros de Nuestro cofre y Nuestro favor.»`,
    rest: "«Descansad. Mañana tendremos una nueva tarea para vos.»",
    all: "«Nos habéis servido con lealtad. Pronto os armaremos caballero.»",
    favour: (n, of) => `Favor del príncipe: ${n} de ${of} decretos cumplidos`,
    ask: "Pedir decretos", fail: "La corte no pudo oíros ahora.",
    swap: 'Pedir otro decreto', swapped: '«Sea, servidnos en la corte: buscad al jardinero en el rosal y al mozo en las caballerizas. Luego volved ante Nos.»', wait: '«Ya pedisteis otra tarea hoy.»',
    kneel: 'Arrodillarse para ser armado caballero', dubbed: (t) => 'El príncipe toca vuestros hombros con la espada: «¡Alzaos, ${t}! Tomad este caballo de Nuestras cuadras; desde hoy viajaréis el doble de rápido.»'.replace('${t}', t), sir: (f) => (f ? 'Dama' : 'Caballero'), notYet: '«Aún no habéis cumplido suficientes decretos.»',
    seen: "Ya explorasteis este lugar – figura en vuestro libro de cumbre.", tired: "Hoy ya habéis explorado 3 maravillas – vuestros pies están cansados. Mañana podréis descubrir más.", ready: "Vuestro decreto principesco está cumplido: el mensajero del Príncipe espera vuestro informe en la aldea.",
    errand: { gardener: ['Hablar con el jardinero', 'El jardinero os corta un ramo de rosas fragantes para la princesa.'], groom: ['Hablar con el mozo de cuadra', 'El mozo recibe vuestra orden y ensilla los caballos para la caza.'] }, errandTitle: 'Servicio en la corte', errandDone: 'Hecho', errandWho: { gardener: 'Jardinero en el rosal (6–17 h)', groom: 'Mozo en las caballerizas (6–19 h)' }, errandReady: 'Vuestro servicio está cumplido: pedid audiencia en el castillo.', errandHint: 'Acercaos a la figura y aparecerá un botón para hablarle.',
  },
  ar: {
    task: { wonder: "ابحث عن أعجوبة طبيعية أو معلم في البرية.", letter: "أرسل رسالة إلى قرية أخرى.", visit: "زُر عمدة آخر بنفسك.", build: "شيّد مبنى في قريتك.", gift: "أرسل هدية إلى جار.", road: "قرّر طريقًا تجاريًا جديدًا.", court: 'اخدم في البلاط: في أرض القصر تحدّث مع البستاني في حديقة الورد ومع السائس عند الإسطبل.' },
    newTask: (t, r) => `«نمنحك مرسومًا: ${t} وسيعود رسولنا إلى قريتك ليتسلّم تقريرك – المكافأة: ${r} تالر.»`,
    open: (t) => `«لم يُنجَز مرسومك بعد: ${t}»`,
    done: (r) => `«أحسنت! خذ ${r} تالر من خزانتنا، ولك رضانا.»`,
    rest: "«استرح الآن. غدًا لدينا مهمة جديدة لك.»",
    all: "«لقد خدمتنا بإخلاص. قريبًا نقلّدك الفروسية.»",
    favour: (n, of) => `رضا الأمير: ${n} من ${of} مراسيم منجزة`,
    ask: "اسأل عن المراسيم", fail: "تعذّر على البلاط سماعك الآن.",
    swap: 'اطلب مرسومًا آخر', swapped: '«حسنًا، اخدمنا في البلاط بدلًا من ذلك: ابحث عن البستاني في حديقة الورد والسائس عند الإسطبل، ثم عُد إلينا.»', wait: '«لقد طلبت مهمة أخرى اليوم بالفعل.»',
    kneel: 'اركع لتنال لقب الفارس', dubbed: (t) => 'يلمس الأمير كتفيك بسيفه: «انهض يا ${t}! خذ هذا الحصان من إسطبلاتنا – من الآن تسافر في البلاد بضعف السرعة.»'.replace('${t}', t), sir: (f) => (f ? 'السيدة الفارسة' : 'الفارس'), notYet: '«لم تُنجز بعد ما يكفي من المراسيم.»',
    seen: "لقد استكشفت هذا المكان من قبل – إنه مسجل في سجل الرواد.", tired: "لقد استكشفت اليوم 3 عجائب بالفعل – قدماك متعبتان. يمكنك اكتشاف المزيد غدًا.", ready: "تمّ مرسوم الأمير – رسول الأمير ينتظر تقريرك في قريتك.",
    errand: { gardener: ['تحدّث مع البستاني', 'يقطف لك البستاني باقة من الورد العطر للأميرة.'], groom: ['تحدّث مع السائس', 'يتسلّم السائس أمرك ويسرج الخيل للصيد.'] }, errandTitle: 'خدمة البلاط', errandDone: 'تمّ', errandWho: { gardener: 'البستاني في حديقة الورد (6–17)', groom: 'السائس عند الإسطبل (6–19)' }, errandReady: 'اكتملت خدمتك في البلاط – اطلب المثول عند القصر.', errandHint: 'اقترب من الشخصية فيظهر زر للتحدث معها.',
  },
  hi: {
    task: { wonder: "जंगल में कोई प्राकृतिक अजूबा या स्थल खोजें।", letter: "किसी दूसरे गाँव को पत्र भेजें।", visit: "किसी दूसरे मुखिया से स्वयं मिलें।", build: "अपने गाँव में कोई इमारत बनवाएँ।", gift: "किसी पड़ोसी को उपहार भेजें।", road: "एक नई व्यापार सड़क तय करें।", court: 'दरबार में सेवा करें: महल के बाग़ में माली से और अस्तबल पर साईस से बात करें।' },
    newTask: (t, r) => `"हम आपको एक फ़रमान देते हैं: ${t} हमारा दूत आपकी रिपोर्ट लेने आपके गाँव लौटेगा – इनाम: ${r} टालर।"`,
    open: (t) => `"आपका फ़रमान अभी पूरा नहीं हुआ: ${t}"`,
    done: (r) => `"शाबाश! हमारे ख़ज़ाने से ${r} टालर और हमारी कृपा लें।"`,
    rest: "\"अब विश्राम करें। कल हमारे पास नया कार्य होगा।\"",
    all: "\"आपने निष्ठा से सेवा की। जल्द ही हम आपको नाइट बनाएँगे।\"",
    favour: (n, of) => `राजकृपा: ${of} में से ${n} फ़रमान पूरे`,
    ask: "फ़रमान पूछें", fail: "दरबार अभी आपकी बात नहीं सुन सका।",
    swap: 'दूसरा फ़रमान माँगें', swapped: '"ठीक है, इसके बजाय दरबार में सेवा करें: गुलाब-बाग़ में माली और अस्तबल पर साईस को खोजें। फिर हमारे सामने आएँ।"', wait: '"आप आज पहले ही दूसरा काम माँग चुके हैं।"',
    kneel: 'सामंत उपाधि के लिए घुटने टेकें', dubbed: (t) => 'राजकुमार तलवार से आपके कंधे छूते हैं: «उठिए, ${t}! हमारे अस्तबल का यह घोड़ा लीजिए – अब आप दोगुनी तेज़ी से यात्रा करेंगे।»'.replace('${t}', t), sir: (f) => (f ? 'दाम' : 'सर नाइट'), notYet: '«आपने अभी पर्याप्त आदेश पूरे नहीं किए हैं।»',
    seen: "आप यह स्थान पहले ही खोज चुके हैं – यह आपकी शिखर-पुस्तिका में है।", tired: "आज आप पहले ही 3 अजूबे खोज चुके हैं – आपके पैर थक गए हैं। कल और खोज सकते हैं।", ready: "राजकीय फ़रमान पूरा हुआ – राजकुमार का दूत आपके गाँव में आपकी रिपोर्ट की प्रतीक्षा कर रहा है।",
    errand: { gardener: ['माली से बात करें', 'माली राजकुमारी के लिए सुगंधित गुलाबों का गुच्छा काटकर देता है।'], groom: ['साईस से बात करें', 'साईस आपका आदेश लेता है और शिकार के लिए घोड़े कसता है।'] }, errandTitle: 'दरबार सेवा', errandDone: 'पूरा', errandWho: { gardener: 'गुलाब-बाग़ में माली (6–17 बजे)', groom: 'अस्तबल पर साईस (6–19 बजे)' }, errandReady: 'आपकी दरबार सेवा पूरी हुई – महल में दरबार की विनती करें।', errandHint: 'आकृति के पास जाएँ, बात करने का बटन दिखेगा।',
  },
  zh: {
    task: { wonder: "前往野外寻找一处自然奇观或地标。", letter: "给另一个村庄寄一封信。", visit: "亲自拜访另一位村长。", build: "在你的村庄建造一座建筑。", gift: "给邻居送一份礼物。", road: "决定修建一条新的商路。", court: '在宫廷效力：在城堡庄园里与玫瑰园的园丁和马厩的马夫交谈。' },
    newTask: (t, r) => `"本王颁你一道谕令：${t}本王的信使会再到你村中听取回报——赏金 ${r} 塔勒。"`,
    open: (t) => `"你的谕令尚未完成：${t}"`,
    done: (r) => `"干得好！从本王金库领取 ${r} 塔勒，并受本王恩宠。"`,
    rest: "\"先歇息吧。明日本王另有差遣。\"",
    all: "\"你忠心效力。不久本王将封你为骑士。\"",
    favour: (n, of) => `亲王恩宠：已完成 ${n}/${of} 道谕令`,
    ask: "询问谕令", fail: "宫廷此刻无法接见你。",
    swap: '请求另一道诏令', swapped: '"好吧，那就在宫廷为朕效力：去玫瑰园找园丁，去马厩找马夫。然后再来见朕。"', wait: '"你今天已经请求过换一项任务了。"',
    kneel: '跪下受封骑士', dubbed: (t) => '亲王以剑轻触你的双肩：「起身吧，${t}！收下我们马厩中的这匹马——从此你在大地上行进快一倍。」'.replace('${t}', t), sir: (f) => (f ? '女骑士' : '骑士'), notYet: '「你完成的诏令还不够。」',
    seen: "你曾探访过此地——它已载入你的登顶簿。", tired: "你今天已探访了 3 处奇观——双脚已疲惫。明天再去发现更多吧。", ready: "亲王的敕令已完成——亲王的信使正在你村中等候回报。",
    errand: { gardener: ['与园丁交谈', '园丁为王妃剪下一束芬芳的玫瑰交给你。'], groom: ['与马夫交谈', '马夫接过你的命令，为狩猎备好马鞍。'] }, errandTitle: '宫廷差事', errandDone: '已完成', errandWho: { gardener: '玫瑰园的园丁（6–17点）', groom: '马厩的马夫（6–19点）' }, errandReady: '宫廷差事已完成——请在城堡请求觐见。', errandHint: '走近人物，就会出现交谈按钮。',
  },
  ja: {
    task: { wonder: "荒野の自然の驚異か名所を訪ねよ。", letter: "別の村へ手紙を送れ。", visit: "別の村長を自ら訪ねよ。", build: "村に建物を建てさせよ。", gift: "隣人に贈り物を送れ。", road: "新しい交易路を決めよ。", court: '宮廷に仕えよ：城の庭園でバラ園の庭師と、厩舎の馬丁に話しかけること。' },
    newTask: (t, r) => `「そなたに勅令を授ける：${t}使者が再びそなたの村へ報告を受けに参る――褒美は${r}ターラー。」`,
    open: (t) => `「勅令はまだ果たされておらぬ：${t}」`,
    done: (r) => `「見事であった！我が金庫より${r}ターラーと我が寵愛を授ける。」`,
    rest: "「今は休め。明日、新たな務めを与えよう。」",
    all: "「よく仕えてくれた。まもなくそなたを騎士に叙そう。」",
    favour: (n, of) => `領主の寵愛：勅令 ${n}/${of} 達成`,
    ask: "勅令を尋ねる", fail: "宮廷は今そなたの話を聞けぬ。",
    swap: '別の勅令を願う', swapped: '「よかろう、代わりに宮廷に仕えよ。バラ園の庭師と厩舎の馬丁を訪ね、その後また我が前に参れ。」', wait: '「今日はすでに別の任務を願い出ている。」',
    kneel: 'ひざまずいて騎士に叙される', dubbed: (t) => '大公が剣であなたの肩に触れる：「立ちなさい、${t}！我らの厩舎の馬を授けよう――これより汝は二倍の速さで旅をする。」'.replace('${t}', t), sir: (f) => (f ? '女騎士' : '騎士'), notYet: '「まだ十分な勅令を果たしていない。」',
    seen: "ここは以前に探索済みです。すでに登頂記に記されています。", tired: "今日はもう3つの名所を探索しました。足が疲れています。続きは明日どうぞ。", ready: "領主の勅令は果たされました――使者がそなたの村で報告を待っています。",
    errand: { gardener: ['庭師に話しかける', '庭師が大公妃のために香り高いバラの花束を切ってくれた。'], groom: ['馬丁に話しかける', '馬丁は命令を受け取り、狩りのために馬に鞍を置いた。'] }, errandTitle: '宮廷の務め', errandDone: '済', errandWho: { gardener: 'バラ園の庭師（6–17時）', groom: '厩舎の馬丁（6–19時）' }, errandReady: '宮廷の務めを果たしました。城で謁見を願い出ましょう。', errandHint: '人物に近づくと、話しかけるボタンが現れます。',
  },
};
