import type { Lang } from "../i18n";
import type { TownWay } from "../character";

/** Book text for the three ways to a Hanseatic city: equal chances, own buildings, complementary trade. */
type WaysText = { intro: string; build: Record<TownWay, string>; trade: [string, string]; first: [string, string] };

export const TOWN_WAYS: Record<Lang, WaysText> = {
  de: {
    intro: "Kein Gründungsort ist schlechter als ein anderer: Jeder Ort kann zur Hansestadt werden – nur der Weg dorthin und das Stadtbild unterscheiden sich. Die Landschaft rund um die Gründung bestimmt den Charakter, und er bleibt für immer.",
    build: {
      grain: "Eigene Bauten: Großspeicher (ab Dorf) und Windmühlenreihe (ab Handelsstadt), als Prestigebau die Erntedankhalle (ab Kleinstadt). Der Schulze verlangt einen Wintervorrat im Großspeicher und später die Mühlenreihe.",
      workshop: "Eigene Bauten: Steinmetzhütte (ab Dorf) und Hammerwerk (ab Handelsstadt), als Prestigebau der Zunftturm (ab Kleinstadt). Häuser aus Bruchstein und Schiefer; der Schulze verlangt den ersten Stein und später das Hammerwerk.",
      gateway: "Eigene Bauten: Fischhalle & Räucherei (ab Dorf) und Salzkontor am Kai (ab Handelsstadt), als Prestigebau der Leuchtturm (ab Kleinstadt). Backstein- und Giebelhäuser säumen das Ufer; der Schulze verlangt Räucherfisch und später das Salzkontor.",
    },
    trade: ["Handel zwischen den Wegen", "Verbindet eine Handelsstraße Orte unterschiedlichen Charakters – etwa Kornkammer und Werkbank –, ergänzen sich ihre Waren und beide Orte gewinnen etwas mehr aus dem Handel als mit einem gleichartigen Nachbarn."],
    first: ["Jeder Ort hat seinen eigenen Charakter.", "Ob Ebene, Hügel oder Küste: Die Landschaft prägt dein Dorf – und jeder Weg führt zur Hansestadt."],
  },
  en: {
    intro: "No founding site is worse than another: every place can become a Hanseatic city – only the road there and the townscape differ. The landscape around the founding sets the character, and it stays forever.",
    build: {
      grain: "Own buildings: Great Granary (from village) and Windmill Row (from trade town), plus the Harvest Hall as prestige building (from small town). The headman asks for a winter store in the Great Granary and later the Windmill Row.",
      workshop: "Own buildings: Stonemason's Lodge (from village) and Hammer Works (from trade town), plus the Guild Tower as prestige building (from small town). Houses of rubble stone and slate; the headman asks for the first stone and later the Hammer Works.",
      gateway: "Own buildings: Fish Hall & Smokehouse (from village) and Salt Quay (from trade town), plus the Lighthouse as prestige building (from small town). Brick and gabled houses line the shore; the headman asks for smoked fish and later the Salt Quay.",
    },
    trade: ["Trade between the ways", "When a trade road joins towns of different character – say a Breadbasket and a Workshop – their goods complement each other and both earn a little more than with a neighbour of the same kind."],
    first: ["Every place has its own character.", "Plains, hills or coast: the landscape shapes your village – and every way leads to a Hanseatic city."],
  },
  fr: {
    intro: "Aucun lieu de fondation n'est moins bon qu'un autre : chaque localité peut devenir une ville hanséatique – seuls le chemin et l'aspect de la ville diffèrent. Le paysage autour de la fondation fixe le caractère, pour toujours.",
    build: {
      grain: "Bâtiments propres : Grand grenier (dès le village) et Rangée de moulins (dès la ville marchande), et la Halle des moissons comme bâtiment de prestige (dès la petite ville). Le maire demande une réserve d'hiver puis la rangée de moulins.",
      workshop: "Bâtiments propres : Loge des tailleurs de pierre (dès le village) et Martinet (dès la ville marchande), et la Tour des guildes comme bâtiment de prestige (dès la petite ville). Maisons de moellons et d'ardoise ; le maire demande la première pierre puis le martinet.",
      gateway: "Bâtiments propres : Halle aux poissons & fumoir (dès le village) et Comptoir du sel (dès la ville marchande), et le Phare comme bâtiment de prestige (dès la petite ville). Maisons de brique à pignons au bord de l'eau ; le maire demande du poisson fumé puis le comptoir du sel.",
    },
    trade: ["Commerce entre les chemins", "Quand une route relie des localités de caractère différent – un grenier et un atelier par exemple –, leurs marchandises se complètent et toutes deux gagnent un peu plus qu'avec un voisin semblable."],
    first: ["Chaque lieu a son propre caractère.", "Plaine, collines ou côte : le paysage façonne ton village – et chaque chemin mène à la ville hanséatique."],
  },
  es: {
    intro: "Ningún lugar de fundación es peor que otro: toda localidad puede llegar a metrópoli; solo cambian el camino y el aspecto de la ciudad. El paisaje alrededor de la fundación fija el carácter para siempre.",
    build: {
      grain: "Edificios propios: Gran granero (desde aldea) y Hilera de molinos (desde ciudad comercial), y la Sala de la cosecha como edificio de prestigio (desde pueblo). El alcalde pide una reserva de invierno y luego la hilera de molinos.",
      workshop: "Edificios propios: Taller de canteros (desde aldea) y Martinete (desde ciudad comercial), y la Torre gremial como edificio de prestigio (desde pueblo). Casas de mampostería y pizarra; el alcalde pide la primera piedra y luego el martinete.",
      gateway: "Edificios propios: Lonja y ahumadero (desde aldea) y Almacén de sal en el muelle (desde ciudad comercial), y el Faro como edificio de prestigio (desde pueblo). Casas de ladrillo con hastiales junto al agua; el alcalde pide pescado ahumado y luego el almacén de sal.",
    },
    trade: ["Comercio entre caminos", "Cuando un camino une localidades de distinto carácter – por ejemplo, un granero y un taller –, sus mercancías se complementan y ambas ganan algo más que con un vecino del mismo tipo."],
    first: ["Cada lugar tiene su propio carácter.", "Llanura, colinas o costa: el paisaje da forma a tu aldea, y todo camino lleva a la metrópoli."],
  },
  ar: {
    intro: "لا يوجد موقع تأسيس أسوأ من غيره: كل بلدة يمكن أن تصبح حاضرة، ولا يختلف إلا الطريق إليها وشكل المدينة. الطبيعة حول موقع التأسيس تحدد الطابع إلى الأبد.",
    build: {
      grain: "مبانٍ خاصة: المخزن الكبير (من مرحلة القرية) وصف طواحين الهواء (من مرحلة المدينة التجارية)، وقاعة الحصاد مبنى فخر (من البلدة الصغيرة). يطلب المختار مؤونة الشتاء ثم صف الطواحين.",
      workshop: "مبانٍ خاصة: كوخ النحّاتين (من مرحلة القرية) ومطرقة الحدادة المائية (من المدينة التجارية)، وبرج النقابة مبنى فخر (من البلدة الصغيرة). بيوت من الحجر والأردواز؛ يطلب المختار الحجر الأول ثم المطرقة.",
      gateway: "مبانٍ خاصة: سوق السمك والمدخنة (من مرحلة القرية) ومخزن الملح على الرصيف (من المدينة التجارية)، والمنارة مبنى فخر (من البلدة الصغيرة). بيوت من الطوب على الشاطئ؛ يطلب المختار السمك المدخن ثم مخزن الملح.",
    },
    trade: ["التجارة بين الطرق", "حين يربط طريق تجاري بلدتين مختلفتي الطابع، مثل سلة الحبوب وورشة التلال، تتكامل بضائعهما ويكسب كلاهما أكثر قليلاً مما يكسبه مع جار مشابه."],
    first: ["لكل مكان طابعه الخاص.", "سهل أو تلال أو ساحل: الطبيعة تشكّل قريتك، وكل طريق يقود إلى الحاضرة."],
  },
  hi: {
    intro: "कोई भी स्थापना स्थल दूसरे से कमतर नहीं है: हर बस्ती हंसा नगर बन सकती है – केवल वहाँ तक का रास्ता और नगर का रूप अलग होता है। स्थापना के आसपास का भूभाग स्वभाव तय करता है, हमेशा के लिए।",
    build: {
      grain: "अपनी इमारतें: बड़ा भंडार (गाँव से) और पवनचक्कियों की कतार (व्यापार नगर से), और प्रतिष्ठा भवन के रूप में फ़सल-उत्सव भवन (छोटे नगर से)। मुखिया पहले जाड़े का भंडार और फिर चक्कियों की कतार माँगता है।",
      workshop: "अपनी इमारतें: संगतराशों की कुटिया (गाँव से) और हथौड़ा कारखाना (व्यापार नगर से), और प्रतिष्ठा भवन के रूप में गिल्ड मीनार (छोटे नगर से)। पत्थर और स्लेट के घर; मुखिया पहला पत्थर और फिर हथौड़ा कारखाना माँगता है।",
      gateway: "अपनी इमारतें: मछली हॉल और धुआँघर (गाँव से) और घाट पर नमक कोठी (व्यापार नगर से), और प्रतिष्ठा भवन के रूप में प्रकाशस्तंभ (छोटे नगर से)। तट पर ईंट के नुकीले घर; मुखिया धुएँ वाली मछली और फिर नमक कोठी माँगता है।",
    },
    trade: ["रास्तों के बीच व्यापार", "जब व्यापार मार्ग अलग स्वभाव वाली बस्तियों को जोड़ता है – जैसे अन्न भंडार और कार्यशाला – तो उनका माल एक-दूसरे का पूरक होता है और दोनों को समान पड़ोसी से थोड़ा अधिक लाभ मिलता है।"],
    first: ["हर जगह का अपना स्वभाव है।", "मैदान, पहाड़ी या तट: भूभाग तुम्हारे गाँव को आकार देता है – और हर रास्ता हंसा नगर तक जाता है।"],
  },
  zh: {
    intro: "没有哪个建城地点比别处差：每个地方都能成为汉萨城市——不同的只是道路和城镇面貌。建城处周围的地貌决定城镇特色，并永远不变。",
    build: {
      grain: "专属建筑：大粮仓（村庄起）和风车长排（商业城起），以及作为荣耀建筑的丰收大厅（小镇起）。村长会要求在大粮仓备下冬粮，之后建起风车长排。",
      workshop: "专属建筑：石匠工棚（村庄起）和锻锤工坊（商业城起），以及作为荣耀建筑的行会塔（小镇起）。房屋以毛石和石板瓦建成；村长会要求奠下第一块石头，之后建起锻锤工坊。",
      gateway: "专属建筑：鱼市与熏鱼坊（村庄起）和码头盐栈（商业城起），以及作为荣耀建筑的灯塔（小镇起）。岸边排列着砖砌山墙屋；村长会要求熏鱼，之后建起盐栈。",
    },
    trade: ["不同道路之间的贸易", "当商路连接特色不同的城镇（例如粮仓与工坊）时，双方货物互补，两地的收益都会比与同类邻居通商时略多。"],
    first: ["每个地方都有自己的特色。", "平原、丘陵或海岸：地貌塑造你的村庄——每条道路都通往汉萨城市。"],
  },
  ja: {
    intro: "劣った創設地はありません。どの町もハンザ都市になれます。違うのはそこへ至る道と町並みだけです。創設地周辺の地形が個性を決め、それは永遠に変わりません。",
    build: {
      grain: "専用の建物：大穀倉（村から）と風車の列（交易都市から）、名誉建築として収穫祭の館（小さな町から）。村長はまず大穀倉に冬の蓄えを、のちに風車の列を求めます。",
      workshop: "専用の建物：石工小屋（村から）とハンマー工房（交易都市から）、名誉建築としてギルドの塔（小さな町から）。家は割石とスレート造り。村長は最初の石を、のちにハンマー工房を求めます。",
      gateway: "専用の建物：魚市場と燻製所（村から）と岸壁の塩商館（交易都市から）、名誉建築として灯台（小さな町から）。水辺には切妻のれんが造りの家が並び、村長は燻製魚を、のちに塩商館を求めます。",
    },
    trade: ["道どうしの交易", "交易路が個性の異なる町（たとえば穀倉地帯と工房）を結ぶと、品物が補い合い、同じ種類の隣町と結ぶより両方が少し多く稼げます。"],
    first: ["どの場所にも独自の個性があります。", "平原、丘陵、海岸――地形があなたの村を形づくり、どの道もハンザ都市へ通じています。"],
  },
};
