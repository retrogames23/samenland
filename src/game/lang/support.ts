import type { Lang } from "../i18n";
import type { RewardKey } from "../supporter";

type Text = {
  button: string; title: string; intro: string; cosmetic: string;
  tier3: string; tier5: string; tier10: string; owned: string; pick: string; amount: string; pay: (e: number) => string; two: string;
  needVillage: string; signIn: string; thanks: string; test: string; back: string; taken: string;
  names: Record<RewardKey, string>; desc: Record<RewardKey, string>; seal: string;
};

export const SUPPORT: Record<Lang, Text> = {
  de: {
    button: "Samenland unterstützen", title: "Samenland unterstützen",
    intro: "Samenland ist ein privates Hobbyprojekt. Dein Beitrag hilft, Server und KI zu bezahlen. Als Dank darfst du für jeden Beitrag eine Verzierung für dein Dorf wählen.",
    cosmetic: "Alle Belohnungen sind reiner Schmuck. Sie bringen keine Mark, kein Wachstum und keinen anderen Vorteil im Spiel.",
    tier3: "Ab 3 €", tier5: "Ab 5 €", tier10: "Ab 10 €", owned: "Schon verliehen", two: "Mit 10 € darfst du bis zu zwei Verzierungen wählen.", pick: "1. Verzierung wählen", amount: "2. Betrag wählen", pay: (e) => `${e} € beitragen`,
    needVillage: "Gründe zuerst ein Dorf, dann kannst du eine Verzierung wählen.", signIn: "Bitte melde dich an.",
    thanks: "Herzlichen Dank! Deine Verzierung erscheint in wenigen Augenblicken im Dorf.", test: "Testmodus: Hier wird kein echtes Geld abgebucht.", back: "Zurück", taken: "Diese Verzierung hat dein Dorf schon.",
    names: { seal: "Goldenes Stifter-Siegel", vane: "Goldene Wetterfahne", beegarden: "Bauerngarten mit Bienenkorb", lanterns: "Laternen am Schulzenhaus", statue: "Goldene Schulzen-Statue", linden: "Uralte Dorflinde", fountain: "Prunkbrunnen", rosearch: "Rosenbogen mit Bank", dog: "Treuer Dorfhund" },
    desc: { seal: "Ein goldenes Siegel neben dem Namen deines Schulzen.", vane: "Ein goldener Hahn dreht sich auf dem Dach des Schulzenhauses.", beegarden: "Kräuter, Rosen und ein Strohbienenkorb neben dem Schulzenhaus.", lanterns: "Schmiedeeiserne Laternen, die nachts warm leuchten.", statue: "Eine vergoldete Statue auf einem Steinsockel.", linden: "Eine mächtige Linde mit Rundbank.", fountain: "Ein Steinbrunnen mit goldener Plakette.", rosearch: "Ein Rosenbogen mit Gartenbank zum Verweilen.", dog: "Ein lockiger Hund, der tagsüber durchs Dorf tollt, dem Schulzen folgt und nachts im Schulzenhaus schläft. Du darfst ihm einen Namen geben." },
    seal: "Stifter von Samenland",
  },
  en: {
    button: "Support Samenland", title: "Support Samenland",
    intro: "Samenland is a private hobby project. Your contribution helps pay for servers and AI. As thanks, you can pick one decoration for your village per contribution.",
    cosmetic: "All rewards are purely decorative. They give no coins, no growth and no other advantage in the game.",
    tier3: "From €3", tier5: "From €5", tier10: "From €10", owned: "Already granted", two: "With €10 you may choose up to two decorations.", pick: "1. Choose a decoration", amount: "2. Choose an amount", pay: (e) => `Contribute €${e}`,
    needVillage: "Found a village first, then you can choose a decoration.", signIn: "Please sign in.",
    thanks: "Thank you so much! Your decoration will appear in your village in a moment.", test: "Test mode: no real money is charged here.", back: "Back", taken: "Your village already has this decoration.",
    names: { seal: "Golden patron's seal", vane: "Golden weather vane", beegarden: "Cottage garden with beehive", lanterns: "Lanterns at the mayor's house", statue: "Golden mayor statue", linden: "Ancient village linden", fountain: "Grand fountain", rosearch: "Rose arch with bench", dog: "Loyal village dog" },
    desc: { seal: "A golden seal next to your mayor's name.", vane: "A golden rooster turns on the mayor's roof.", beegarden: "Herbs, roses and a straw beehive beside the mayor's house.", lanterns: "Wrought-iron lanterns glowing warmly at night.", statue: "A gilded statue on a stone pedestal.", linden: "A mighty linden tree with a round bench.", fountain: "A stone fountain with a golden plaque.", rosearch: "A rose arch with a garden bench.", dog: "A curly dog that romps through the village by day, follows your mayor and sleeps in the mayor's house at night. You can name it." },
    seal: "Patron of Samenland",
  },
  fr: {
    button: "Soutenir Samenland", title: "Soutenir Samenland",
    intro: "Samenland est un projet personnel. Ta contribution aide à payer les serveurs et l'IA. En remerciement, tu choisis une décoration pour ton village à chaque contribution.",
    cosmetic: "Toutes les récompenses sont purement décoratives. Elles n'apportent ni marks, ni croissance, ni aucun autre avantage en jeu.",
    tier3: "Dès 3 €", tier5: "Dès 5 €", tier10: "Dès 10 €", owned: "Déjà accordée", two: "Avec 10 € tu peux choisir jusqu'à deux décorations.", pick: "1. Choisis une décoration", amount: "2. Choisis un montant", pay: (e) => `Contribuer ${e} €`,
    needVillage: "Fonde d'abord un village pour choisir une décoration.", signIn: "Connecte-toi, s'il te plaît.",
    thanks: "Merci beaucoup ! Ta décoration apparaîtra dans ton village dans un instant.", test: "Mode test : aucun argent réel n'est débité.", back: "Retour", taken: "Ton village possède déjà cette décoration.",
    names: { seal: "Sceau doré de mécène", vane: "Girouette dorée", beegarden: "Jardin avec ruche", lanterns: "Lanternes chez le maire", statue: "Statue dorée du maire", linden: "Tilleul séculaire", fountain: "Fontaine d'apparat", rosearch: "Arche de roses et banc", dog: "Fidèle chien du village" },
    desc: { seal: "Un sceau doré à côté du nom de ton maire.", vane: "Un coq doré tourne sur le toit du maire.", beegarden: "Herbes, roses et ruche en paille près de la maison du maire.", lanterns: "Des lanternes en fer forgé qui brillent la nuit.", statue: "Une statue dorée sur un socle de pierre.", linden: "Un grand tilleul avec banc circulaire.", fountain: "Une fontaine en pierre à plaque dorée.", rosearch: "Une arche de roses avec un banc.", dog: "Un chien bouclé qui gambade le jour, suit ton maire et dort la nuit chez lui. Tu peux lui donner un nom." },
    seal: "Mécène de Samenland",
  },
  es: {
    button: "Apoyar Samenland", title: "Apoyar Samenland",
    intro: "Samenland es un proyecto personal. Tu aporte ayuda a pagar servidores e IA. Como agradecimiento, eliges una decoración para tu aldea por cada aporte.",
    cosmetic: "Todas las recompensas son solo decorativas. No dan marcos, ni crecimiento, ni ninguna otra ventaja en el juego.",
    tier3: "Desde 3 €", tier5: "Desde 5 €", tier10: "Desde 10 €", owned: "Ya concedida", two: "Con 10 € puedes elegir hasta dos decoraciones.", pick: "1. Elige una decoración", amount: "2. Elige un importe", pay: (e) => `Aportar ${e} €`,
    needVillage: "Funda primero una aldea para elegir una decoración.", signIn: "Inicia sesión, por favor.",
    thanks: "¡Muchas gracias! Tu decoración aparecerá en tu aldea en un momento.", test: "Modo de prueba: no se cobra dinero real.", back: "Volver", taken: "Tu aldea ya tiene esta decoración.",
    names: { seal: "Sello dorado de mecenas", vane: "Veleta dorada", beegarden: "Huerto con colmena", lanterns: "Faroles en la casa del alcalde", statue: "Estatua dorada del alcalde", linden: "Tilo centenario", fountain: "Fuente de gala", rosearch: "Arco de rosas con banco", dog: "Fiel perro del pueblo" },
    desc: { seal: "Un sello dorado junto al nombre de tu alcalde.", vane: "Un gallo dorado gira en el tejado del alcalde.", beegarden: "Hierbas, rosas y una colmena de paja junto a la casa del alcalde.", lanterns: "Faroles de hierro forjado que brillan de noche.", statue: "Una estatua dorada sobre un pedestal de piedra.", linden: "Un gran tilo con banco redondo.", fountain: "Una fuente de piedra con placa dorada.", rosearch: "Un arco de rosas con banco de jardín.", dog: "Un perro rizado que retoza de día, sigue a tu alcalde y duerme de noche en su casa. Puedes ponerle nombre." },
    seal: "Mecenas de Samenland",
  },
  ar: {
    button: "ادعم سامنلاند", title: "ادعم سامنلاند",
    intro: "سامنلاند مشروع هواية شخصي. تساعد مساهمتك في دفع تكاليف الخوادم والذكاء الاصطناعي. شكرًا لك، تختار زينة واحدة لقريتك مقابل كل مساهمة.",
    cosmetic: "جميع المكافآت زينة فقط. لا تمنح نقودًا ولا نموًا ولا أي ميزة أخرى في اللعبة.",
    tier3: "من 3 €", tier5: "من 5 €", tier10: "من 10 €", owned: "مُنحت بالفعل", two: "بـ 10 € يمكنك اختيار زينتين.", pick: "1. اختر زينة", amount: "2. اختر المبلغ", pay: (e) => `ساهم بـ ${e} €`,
    needVillage: "أسّس قرية أولًا ثم اختر زينة.", signIn: "يرجى تسجيل الدخول.",
    thanks: "شكرًا جزيلًا! ستظهر زينتك في قريتك بعد لحظات.", test: "وضع تجريبي: لا يتم خصم أموال حقيقية.", back: "رجوع", taken: "قريتك تملك هذه الزينة بالفعل.",
    names: { seal: "ختم المانح الذهبي", vane: "دوّارة رياح ذهبية", beegarden: "حديقة مع خلية نحل", lanterns: "فوانيس عند بيت العمدة", statue: "تمثال العمدة الذهبي", linden: "شجرة زيزفون عتيقة", fountain: "نافورة فاخرة", rosearch: "قوس ورود مع مقعد", dog: "كلب القرية الوفي" },
    desc: { seal: "ختم ذهبي بجانب اسم العمدة.", vane: "ديك ذهبي يدور فوق سطح بيت العمدة.", beegarden: "أعشاب وورود وخلية قش بجانب بيت العمدة.", lanterns: "فوانيس حديدية تضيء ليلًا.", statue: "تمثال مذهّب على قاعدة حجرية.", linden: "شجرة زيزفون ضخمة مع مقعد دائري.", fountain: "نافورة حجرية بلوحة ذهبية.", rosearch: "قوس ورود مع مقعد حديقة.", dog: "كلب مجعّد الشعر يلعب في القرية نهارًا ويتبع العمدة وينام ليلًا في بيته. يمكنك تسميته." },
    seal: "راعي سامنلاند",
  },
  hi: {
    button: "Samenland का समर्थन करें", title: "Samenland का समर्थन करें",
    intro: "Samenland एक निजी शौकिया परियोजना है। आपका योगदान सर्वर और AI का खर्च उठाने में मदद करता है। धन्यवाद स्वरूप, हर योगदान पर आप अपने गाँव के लिए एक सजावट चुनते हैं।",
    cosmetic: "सभी इनाम केवल सजावट हैं। इनसे कोई सिक्के, विकास या खेल में कोई और लाभ नहीं मिलता।",
    tier3: "3 € से", tier5: "5 € से", tier10: "10 € से", owned: "पहले से मिला", two: "10 € में आप दो सजावटें चुन सकते हैं।", pick: "1. सजावट चुनें", amount: "2. राशि चुनें", pay: (e) => `${e} € योगदान दें`,
    needVillage: "पहले एक गाँव बसाइए, फिर सजावट चुनिए।", signIn: "कृपया साइन इन करें।",
    thanks: "बहुत धन्यवाद! आपकी सजावट कुछ ही पलों में गाँव में दिखेगी।", test: "परीक्षण मोड: यहाँ असली पैसे नहीं कटते।", back: "वापस", taken: "आपके गाँव में यह सजावट पहले से है।",
    names: { seal: "स्वर्ण दाता मुहर", vane: "सुनहरी हवा-सूचक", beegarden: "मधुमक्खी छत्ते वाला बगीचा", lanterns: "मुखिया के घर पर लालटेन", statue: "मुखिया की स्वर्ण प्रतिमा", linden: "प्राचीन लिंडन पेड़", fountain: "भव्य फव्वारा", rosearch: "गुलाब मेहराब और बेंच", dog: "वफ़ादार गाँव का कुत्ता" },
    desc: { seal: "मुखिया के नाम के पास एक सुनहरी मुहर।", vane: "मुखिया की छत पर घूमता सुनहरा मुर्गा।", beegarden: "मुखिया के घर के पास जड़ी-बूटियाँ, गुलाब और छत्ता।", lanterns: "रात में गर्माहट से जलती लोहे की लालटेनें।", statue: "पत्थर के चबूतरे पर सुनहरी प्रतिमा।", linden: "गोल बेंच वाला विशाल लिंडन पेड़।", fountain: "सुनहरी पट्टिका वाला पत्थर का फव्वारा।", rosearch: "बगीचे की बेंच के साथ गुलाब मेहराब।", dog: "घुँघराले बालों वाला कुत्ता जो दिन में गाँव में खेलता है, मुखिया के पीछे चलता है और रात को उसके घर में सोता है। आप उसका नाम रख सकते हैं।" },
    seal: "Samenland संरक्षक",
  },
  zh: {
    button: "支持 Samenland", title: "支持 Samenland",
    intro: "Samenland 是一个个人兴趣项目。你的支持帮助支付服务器和 AI 费用。作为感谢，每次支持你都可以为村庄选择一件装饰。",
    cosmetic: "所有奖励都只是装饰，不会带来金币、成长或任何其他游戏优势。",
    tier3: "3 € 起", tier5: "5 € 起", tier10: "10 € 起", owned: "已获得", two: "支持 10 € 可选择最多两件装饰。", pick: "1. 选择装饰", amount: "2. 选择金额", pay: (e) => `支持 ${e} €`,
    needVillage: "请先建立村庄，再选择装饰。", signIn: "请先登录。",
    thanks: "非常感谢！你的装饰很快就会出现在村庄里。", test: "测试模式：不会扣除真实费用。", back: "返回", taken: "你的村庄已经拥有此装饰。",
    names: { seal: "金色赞助印章", vane: "金色风向标", beegarden: "带蜂箱的农家花园", lanterns: "村长家灯笼", statue: "金色村长雕像", linden: "古老椴树", fountain: "华丽喷泉", rosearch: "玫瑰拱门与长椅", dog: "忠诚的村犬" },
    desc: { seal: "村长名字旁的金色印章。", vane: "村长屋顶上转动的金色公鸡。", beegarden: "村长家旁的香草、玫瑰和草编蜂箱。", lanterns: "夜晚温暖发光的铁艺灯笼。", statue: "石座上的镀金雕像。", linden: "带环形长椅的大椴树。", fountain: "带金色铭牌的石砌喷泉。", rosearch: "带花园长椅的玫瑰拱门。", dog: "一只卷毛小狗，白天在村里撒欢、跟着村长，晚上睡在村长家里。你可以给它起名。" },
    seal: "Samenland 赞助人",
  },
  ja: {
    button: "Samenlandを応援", title: "Samenlandを応援",
    intro: "Samenlandは個人の趣味のプロジェクトです。ご支援はサーバーとAIの費用に充てられます。お礼として、支援ごとに村の飾りをひとつ選べます。",
    cosmetic: "すべての特典は見た目だけの飾りです。マルクや成長など、ゲーム上の利点は一切ありません。",
    tier3: "3 €から", tier5: "5 €から", tier10: "10 € から", owned: "授与済み", two: "10 €なら飾りを2つまで選べます。", pick: "1. 飾りを選ぶ", amount: "2. 金額を選ぶ", pay: (e) => `${e} €で応援`,
    needVillage: "まず村を作ってから飾りを選んでください。", signIn: "ログインしてください。",
    thanks: "ありがとうございます！飾りはまもなく村に現れます。", test: "テストモード：実際の料金はかかりません。", back: "戻る", taken: "この飾りはすでに村にあります。",
    names: { seal: "金の後援者の印", vane: "金の風見鶏", beegarden: "巣箱のある農家の庭", lanterns: "村長の家のランタン", statue: "村長の金の像", linden: "古い菩提樹", fountain: "豪華な噴水", rosearch: "バラのアーチとベンチ", dog: "忠実な村の犬" },
    desc: { seal: "村長の名前の横に金の印。", vane: "村長の屋根で回る金の雄鶏。", beegarden: "村長の家の横にハーブとバラと藁の巣箱。", lanterns: "夜に温かく灯る鉄のランタン。", statue: "石の台座に立つ金色の像。", linden: "丸いベンチのある大きな菩提樹。", fountain: "金のプレートのある石の噴水。", rosearch: "庭のベンチ付きバラのアーチ。", dog: "昼は村を駆け回り村長について歩き、夜は村長の家で眠る巻き毛の犬。名前を付けられます。" },
    seal: "Samenland後援者",
  },
};
