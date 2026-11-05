import type { Lang } from "../i18n";

/** Extra guide chapter: treasury chest, blessing, discoveries and the prince's seat. */
export const BOOK_EXTRA: Record<Lang, [string, [string, string][]]> = {
  de: ["Truhe, Segen, Entdeckungen & Fürstenhof", [
    ["Gemeindetruhe", "Die Schatzkammer fasst nicht unbegrenzt Lübische Mark: anfangs 800, nach Ausbauten 2.500, 6.000 und 15.000. Die Ausbauten kosten 250, 800 und 2.000 Mark. Ist die Truhe voll, verfallen weitere Einnahmen – ab 90 % Füllstand erinnert dich eine Nachricht daran, das Geld zu investieren oder die Truhe auszubauen."],
    ["Dorfsegen", "Einmal alle 24 Stunden kannst du deinem Ort den Segen spenden. Er beschleunigt das Wachstum für 24 Stunden um 10 %."],
    ["Naturwunder & Funde", "Auf jeder Karte liegen verborgene Orte: Wracks, Höhlen, Naturwunder, verunglückte Kaufmannswagen. Ein feines Glitzern verrät sie. Führe deinen Schulzen im Spaziermodus hin: Jeder Schulze erhält an jedem Fund einmal eine Belohnung – der Erstentdecker 60 Mark und eine dauerhafte Ehrung mit Name und Tag, alle späteren 50 Mark. Höchstens drei Funde am Tag."],
    ["Der Fürstensitz", "Nahe der Kartenmitte liegt das Schloss mit Gärten, Marstall und Hofstaat. Vor Ort kannst du um eine Audienz bitten: Vormittags empfängt dich der Fürst, sonst der Hofmarschall, nachts nur die Wache. Der Hof vergibt Erlasse – Briefe, Besuche, Bauten, Geschenke, Straßen oder Funde – mit Lübischer Mark und Gunst als Lohn."],
    ["Ritterschlag & Reitpferd", "Wer zwölf Erlasse erfüllt hat, kann vor dem Fürsten niederknien und wird zum Ritter geschlagen. Der Ritter erhält ein Reitpferd und reist damit gut doppelt so schnell über die Karte."],
  ]],
  en: ["Chest, blessing, discoveries & the court", [
    ["Town chest", "The treasury cannot hold unlimited Lübeck marks: 800 at first, then 2,500, 6,000 and 15,000 after upgrades costing 250, 800 and 2,000 mark. When the chest is full, further income is lost – at 90 % a message reminds you to invest or upgrade."],
    ["Village blessing", "Once every 24 hours you can bless your town. It speeds up growth by 10 % for 24 hours."],
    ["Wonders & finds", "Every map hides places to discover: wrecks, caves, natural wonders, broken-down merchant wagons. A faint glitter gives them away. Walk your mayor there: every mayor is rewarded once per find – the first discoverer gets 60 mark and a lasting honour with name and day, everyone after 50 mark. At most three finds per day."],
    ["The prince's seat", "Near the centre of the map lies the castle with gardens, stables and court. On site you can ask for an audience: in the morning the prince receives you, otherwise the marshal, at night only the guard. The court issues decrees – letters, visits, buildings, gifts, roads or finds – rewarded with mark and favour."],
    ["Knighthood & horse", "After fulfilling twelve decrees you may kneel before the prince and be knighted. The knight receives a riding horse and crosses the map more than twice as fast."],
  ]],
  fr: ["Coffre, bénédiction, découvertes & la cour", [
    ["Coffre communal", "Le trésor ne contient pas des marks à l'infini : 800 au départ, puis 2 500, 6 000 et 15 000 après des agrandissements à 250, 800 et 2 000 marks. Coffre plein, les recettes suivantes sont perdues – à 90 % un message te le rappelle."],
    ["Bénédiction", "Toutes les 24 heures, tu peux bénir ton village : la croissance est accélérée de 10 % pendant 24 heures."],
    ["Merveilles & trouvailles", "Chaque carte cache des lieux : épaves, grottes, merveilles naturelles, chariots marchands accidentés. Un léger scintillement les trahit. Chaque maire est récompensé une fois par lieu – le premier découvreur reçoit 60 marks et un hommage durable, les suivants 50 marks. Trois trouvailles par jour au plus."],
    ["Le siège du prince", "Près du centre de la carte se trouve le château avec jardins, écuries et cour. Sur place, tu peux demander audience : le matin le prince, sinon le maréchal, la nuit seulement la garde. La cour confie des édits récompensés par des marks et sa faveur."],
    ["Adoubement & cheval", "Après douze édits accomplis, tu peux t'agenouiller devant le prince et être adoubé. Le chevalier reçoit un cheval et voyage plus de deux fois plus vite."],
  ]],
  es: ["Cofre, bendición, hallazgos y la corte", [
    ["Cofre comunal", "El tesoro no guarda marcos sin límite: 800 al principio, luego 2.500, 6.000 y 15.000 tras ampliaciones de 250, 800 y 2.000 marcos. Con el cofre lleno, los ingresos se pierden; al 90 % un mensaje te avisa."],
    ["Bendición", "Cada 24 horas puedes bendecir tu aldea: el crecimiento aumenta un 10 % durante 24 horas."],
    ["Maravillas y hallazgos", "Cada mapa esconde lugares: naufragios, cuevas, maravillas naturales, carros mercantes averiados. Un leve brillo los delata. Cada alcalde recibe una recompensa por lugar: el primer descubridor 60 marcos y un honor permanente, los demás 50. Como máximo tres hallazgos al día."],
    ["La sede del príncipe", "Cerca del centro del mapa está el castillo con jardines, caballerizas y corte. Allí puedes pedir audiencia: por la mañana el príncipe, si no el mariscal, de noche solo la guardia. La corte encarga edictos recompensados con marcos y favor."],
    ["Caballería y caballo", "Tras cumplir doce edictos puedes arrodillarte ante el príncipe y ser armado caballero. Recibes un caballo y viajas más del doble de rápido."],
  ]],
  ar: ["الخزنة والبركة والاكتشافات والبلاط", [
    ["خزنة البلدة", "لا تتسع الخزنة لعدد لا نهائي من الماركات: 800 في البداية، ثم 2500 و6000 و15000 بعد توسعات تكلف 250 و800 و2000 مارك. إذا امتلأت ضاع الدخل الإضافي، وعند 90٪ تصلك رسالة تذكير."],
    ["بركة القرية", "مرة كل 24 ساعة يمكنك مباركة بلدتك، فيتسارع النمو بنسبة 10٪ لمدة 24 ساعة."],
    ["العجائب والاكتشافات", "تخفي كل خريطة أماكن: حطام سفن وكهوف وعجائب طبيعية وقوافل عالقة، يكشفها بريق خافت. ينال كل عمدة مكافأة مرة واحدة لكل مكان: المكتشف الأول 60 ماركًا وتكريمًا دائمًا، والبقية 50. ثلاثة اكتشافات يوميًا على الأكثر."],
    ["مقر الأمير", "قرب وسط الخريطة يقع القصر بحدائقه وإسطبله وحاشيته. في الموقع يمكنك طلب مقابلة: صباحًا الأمير، وإلا كبير الحجاب، وليلًا الحرس فقط. يمنح البلاط مراسيم تُكافأ بالماركات والحظوة."],
    ["الفروسية والحصان", "بعد إنجاز اثني عشر مرسومًا يمكنك الركوع أمام الأمير لتصبح فارسًا، فتنال حصانًا وتسافر بأكثر من ضعف السرعة."],
  ]],
  hi: ["तिजोरी, आशीर्वाद, खोजें और दरबार", [
    ["नगर तिजोरी", "तिजोरी में असीमित थेलर नहीं समाते: शुरू में 800, फिर 250, 800 और 2000 थेलर के विस्तार के बाद 2500, 6000 और 15000। भरी तिजोरी में आगे की आय खो जाती है – 90% पर संदेश याद दिलाता है।"],
    ["गाँव का आशीर्वाद", "हर 24 घंटे में एक बार तुम अपने गाँव को आशीर्वाद दे सकते हो: 24 घंटे तक विकास 10% तेज़ होता है।"],
    ["अजूबे और खोजें", "हर नक्शे में छिपी जगहें हैं: जहाज़ के मलबे, गुफाएँ, प्राकृतिक अजूबे, फँसे कारवाँ – हल्की चमक उन्हें दिखाती है। हर मुखिया को हर जगह पर एक बार इनाम मिलता है: पहले खोजकर्ता को 60 थेलर और स्थायी सम्मान, बाकी को 50। दिन में अधिकतम तीन खोजें।"],
    ["राजकुमार का महल", "नक्शे के बीच के पास बगीचों, अस्तबल और दरबार वाला महल है। वहाँ पहुँचकर दर्शन माँग सकते हो: सुबह राजकुमार, वरना दरबार-प्रमुख, रात में सिर्फ़ पहरेदार। दरबार फ़रमान देता है, जिनका इनाम थेलर और कृपा है।"],
    ["नाइट की उपाधि और घोड़ा", "बारह फ़रमान पूरे करने पर तुम राजकुमार के आगे घुटने टेककर नाइट बन सकते हो। नाइट को घोड़ा मिलता है और वह दोगुने से भी तेज़ यात्रा करता है।"],
  ]],
  zh: ["金库、祝福、发现与宫廷", [
    ["村镇金库", "金库容量有限：起初800马克，扩建后为2500、6000和15000，扩建费用分别为250、800和2000马克。金库满后新收入会流失——达到90%时会有提醒。"],
    ["村庄祝福", "每24小时可为村镇祝福一次，使增长在24小时内加快10%。"],
    ["奇观与发现", "每张地图都藏着地点：沉船、洞穴、自然奇观、搁浅的商队，微光会暴露它们。每位村长在每处只获奖励一次：首位发现者得60马克和永久荣誉，之后的人得50马克。每天最多三处。"],
    ["亲王府邸", "地图中央附近有带花园、马厩和宫廷的城堡。到场可请求觐见：上午由亲王接见，其他时间由宫廷总管，夜里只有卫兵。宫廷颁布敕令，奖励马克与恩宠。"],
    ["册封骑士与坐骑", "完成十二道敕令后，可在亲王面前跪下受封为骑士，获得坐骑，旅行速度提高到两倍以上。"],
  ]],
  ja: ["金庫、祝福、発見と宮廷", [
    ["村の金庫", "金庫の容量には限りがあります。最初は800マルク、250・800・2000マルクの拡張で2500・6000・15000になります。満杯になると以後の収入は失われ、90%で通知が届きます。"],
    ["村の祝福", "24時間に一度、村を祝福できます。24時間のあいだ成長が10%速くなります。"],
    ["不思議と発見", "どの地図にも難破船、洞窟、自然の驚異、立ち往生した隊商などが隠れており、かすかなきらめきが目印です。各村長は場所ごとに一度報酬を得ます。最初の発見者は60マルクと永続する栄誉、以後の人は50マルク。1日最大3件です。"],
    ["領主の城", "地図の中央付近に庭園、厩舎、宮廷を備えた城があります。現地で謁見を願えば、午前は領主、それ以外は侍従長、夜は衛兵だけが応じます。宮廷はマルクと恩寵が得られる勅令を与えます。"],
    ["騎士叙任と馬", "勅令を12件果たすと領主の前でひざまずき騎士に叙されます。騎士は乗馬を授かり、2倍以上の速さで旅します。"],
  ]],
};
