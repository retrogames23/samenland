import type { Lang } from "../i18n";

/**
 * Village life around 1500, second set (commons.ts): Besthaupt, bee swarm, sparks on the thatch, flax
 * retting, wolf tracks, wood theft, the plundered beet clamp. Checked against the period: the Besthaupt is
 * the lord's due at a death (often redeemed in money), not a burial fund; swarm rights differed by place;
 * no annual hearth inspection, no bread scale in the village (that belongs to towns).
 * {a} = the resident who brings it, {b} = the other party. Advice: [0] spring/summer, [1] autumn/winter.
 */
export type Life2Key = "besthaupt" | "schwarm" | "funken" | "rotte" | "wolfspur" | "frevel" | "miete";
type T = { events: Record<Life2Key, [string, string]>; choices: Record<string, string>; advice: Record<Life2Key, [string, string]> };

const de: T = {
  events: {
    besthaupt: ["Das Besthaupt", "Auf dem Hof von {a} ist der alte Bauer gestorben. Nun kommt der Vogt des Grundherrn und fordert, wie es Brauch ist, das Besthaupt: das beste Rind aus dem Stall. Ohne die Kuh fehlt der Familie im Winter Milch und Butter."],
    schwarm: ["Der Bienenschwarm in der Eiche", "Ein kräftiger Schwarm hat sich in einer hohlen Eiche am Gemeindeholz niedergelassen. {a} schwört, es seien die entflogenen Bienen aus seinem Korb. {b} hält dagegen: Ein herrenloser Schwarm gehöre dem, der ihn einfängt."],
    funken: ["Funken auf dem Strohdach", "Bei böigem Wind fliegen Funken aus dem schadhaften Rauchfang von {a} hinüber auf das trockene Strohdach von {b}. Zweimal schon musste man mit Eimern löschen. {b} verlangt, dass das Feuer kalt bleibt, bis der Schaden behoben ist."],
    rotte: ["Flachs im Bach", "{a} hat Bündel von Flachs zum Rotten in den Bach gelegt, damit sich die Fasern lösen. Bachabwärts klagt {b}: Das Wasser stinke faulig, das Vieh wolle nicht saufen und die Wäsche werde grau."],
    wolfspur: ["Wolfsspuren im Schnee", "Nach dem ersten Schnee findet {a} frische Wolfsspuren am Pferch, und ein Schaf liegt gerissen am Waldsaum. Der Amtmann lässt ausrichten, man solle sich bereithalten – das Dorf berät, was zu tun ist."],
    frevel: ["Holzfrevel im Eichengehölz", "Im Eichengehölz am Dorfrand sind junge Stämme ohne Erlaubnis geschlagen worden. {a}, der für das Holz mitverantwortlich ist, findet die frischen Pfähle hinter der Scheune von {b}. Nutzung von Holz und Mast ist dort genau verteilt."],
    miete: ["Die geplünderte Rübenmiete", "In der mageren Zeit vor dem Frühjahr wurde die mit Stroh und Erde abgedeckte Rübenmiete von {a} aufgebrochen. Man hat {b} erwischt, als er Rüben für seine hungrigen Kinder davontrug."],
  },
  choices: {
    "besthaupt:loesen": "Die Gemeinde streckt das Geld zur Ablösung vor – die Kuh bleibt", "besthaupt:bitte": "Mit dem Pfarrer beim Vogt um Gnade und Aufschub bitten", "besthaupt:geben": "Das Recht des Herrn achten, die Nachbarn helfen mit Milch aus",
    "schwarm:teilen": "Teilen: Der Fänger bekommt das Volk, der Eigner das Wachs im Herbst", "schwarm:korb": "Wer den Korb zuerst ansetzt, behält das Volk", "schwarm:pfarrer": "Der Pfarrer soll schlichten",
    "funken:kalt": "Das Herdfeuer bleibt kalt, bis der Rauchfang neu gesetzt ist", "funken:helfer": "Nachbarn helfen, den Rauchfang mit Lehm neu aufzusetzen", "funken:lehm": "Lehm und Ruten aus dem Gemeindevorrat stellen",
    "rotte:kuhle": "Den Flachs in eine eigene Rottekuhle abseits des Bachs legen", "rotte:unten": "Nur unterhalb der Tränke rotten lassen", "rotte:bier": "Buße: ein Fass Bier für die Nachbarn bachabwärts",
    "wolfspur:treib": "Männer zur Treibjagd aufbieten, wie der Amtmann es will", "wolfspur:stall": "Die Herden früher einstallen und nachts Feuer halten", "wolfspur:fallen": "Fanggruben am Waldsaum ausheben lassen",
    "frevel:pflanz": "Zur Sühne junge Eichen setzen", "frevel:pfand": "Die Pfähle einziehen und für den Gemeindezaun nutzen", "frevel:warn": "Bei einer Verwarnung vor den Nachbarn belassen",
    "miete:arbeit": "Den Schaden auf dem Hof von {a} abarbeiten lassen", "miete:korn": "Aus der Gemeindekasse Korn für die hungernde Familie", "miete:stein": "Den Lasterstein am Sonntag vor der Kirche tragen lassen",
  },
  advice: {
    besthaupt: ["„Gegen den Herrn kommt keiner an. Aber eine Kuh weniger heißt Hunger im Winter.“", "„Der Vogt ist auch nur ein Mensch – eine gute Fürsprache wirkt manchmal Wunder.“"],
    schwarm: ["„Bienen kennen keine Grenzen. Teilt den Segen, dann bleibt der Frieden.“", "„Ein Streit um Honig ist bitterer als jeder Wermut.“"],
    funken: ["„Ein Funke genügt, und das halbe Dorf brennt. Hier gibt es kein Zögern.“", "„Im Winter braucht jeder sein Feuer – helft lieber, als nur zu verbieten.“"],
    rotte: ["„Flachs muss rotten, sonst gibt es kein Leinen. Aber nicht dort, wo das Vieh trinkt.“", "„Wasser gehört allen, die am Bach wohnen.“"],
    wolfspur: ["„Ein Wolf, der einmal Schafe gerissen hat, kommt wieder.“", "„Im Winter sind Wolf und Mensch beide hungrig. Haltet die Tiere nah beim Haus.“"],
    frevel: ["„Wer Eichen schlägt, muss Eichen setzen – sonst haben die Enkel kein Holz.“", "„Ein Pfahl ist schnell geschlagen, ein Baum wächst ein Menschenleben lang.“"],
    miete: ["„Not kennt kein Gebot. Strafe allein macht keinen Magen satt.“", "„Wer stiehlt, muss es gutmachen – aber lasst die Kinder nicht hungern.“"],
  },
};

const en: T = {
  events: {
    besthaupt: ["The heriot", "The old farmer on {a}'s holding has died. Now the lord's bailiff comes and, as custom has it, claims the heriot: the best cow in the byre. Without her the family will lack milk and butter all winter."],
    schwarm: ["The swarm in the oak", "A strong swarm has settled in a hollow oak by the village wood. {a} swears these are the bees that flew from his skep. {b} objects: a swarm without a master belongs to whoever catches it."],
    funken: ["Sparks on the thatch", "In gusty wind, sparks fly from {a}'s damaged smoke hood onto {b}'s dry thatched roof. Twice already buckets were needed. {b} demands the fire stay cold until the damage is mended."],
    rotte: ["Flax in the brook", "{a} has laid bundles of flax in the brook to ret, so the fibres come loose. Downstream {b} complains: the water stinks of rot, the cattle won't drink and the washing turns grey."],
    wolfspur: ["Wolf tracks in the snow", "After the first snow {a} finds fresh wolf tracks by the fold, and a sheep lies torn at the wood's edge. The lord's steward sends word to be ready – the village takes counsel."],
    frevel: ["Wood theft in the oak grove", "In the oak grove at the village edge young trees were felled without leave. {a}, who shares the watch over the wood, finds the fresh posts behind {b}'s barn. Rights to wood and mast there are strictly shared."],
    miete: ["The plundered beet clamp", "In the lean weeks before spring, {a}'s beet clamp, covered with straw and earth, was broken open. {b} was caught carrying beets away for his hungry children."],
  },
  choices: {
    "besthaupt:loesen": "The village advances the money to redeem it – the cow stays", "besthaupt:bitte": "Ask the bailiff for mercy and delay, with the priest", "besthaupt:geben": "Respect the lord's right; neighbours help out with milk",
    "schwarm:teilen": "Share: the catcher keeps the bees, the owner gets the wax in autumn", "schwarm:korb": "Whoever sets the skep first keeps the swarm", "schwarm:pfarrer": "Let the priest settle it",
    "funken:kalt": "The hearth stays cold until the smoke hood is rebuilt", "funken:helfer": "Neighbours help rebuild the smoke hood with clay", "funken:lehm": "Provide clay and rods from the village store",
    "rotte:kuhle": "Move the flax to its own retting pit away from the brook", "rotte:unten": "Ret only below the watering place", "rotte:bier": "Amends: a barrel of ale for the neighbours downstream",
    "wolfspur:treib": "Call up the men for a drive hunt, as the steward wants", "wolfspur:stall": "Bring the herds in earlier and keep fires at night", "wolfspur:fallen": "Have pit traps dug at the wood's edge",
    "frevel:pflanz": "Plant young oaks in atonement", "frevel:pfand": "Seize the posts for the village fence", "frevel:warn": "Leave it at a warning before the neighbours",
    "miete:arbeit": "Let him work off the loss on {a}'s farm", "miete:korn": "Grain from the village chest for the hungry family", "miete:stein": "Make him carry the shame stone before church on Sunday",
  },
  advice: {
    besthaupt: ["“No one stands against the lord. But one cow less means hunger in winter.”", "“The bailiff is only human – a good word sometimes works wonders.”"],
    schwarm: ["“Bees know no boundaries. Share the blessing and peace will stay.”", "“A quarrel over honey is bitterer than wormwood.”"],
    funken: ["“One spark and half the village burns. No hesitating here.”", "“In winter everyone needs a fire – better to help than only forbid.”"],
    rotte: ["“Flax must ret or there's no linen. But not where the cattle drink.”", "“Water belongs to all who live along the brook.”"],
    wolfspur: ["“A wolf that has taken sheep once comes back.”", "“In winter wolf and man are both hungry. Keep the beasts close to the house.”"],
    frevel: ["“Whoever fells oaks must plant oaks – or the grandchildren have no wood.”", "“A post is cut in a moment, a tree grows a lifetime.”"],
    miete: ["“Need knows no law. Punishment alone fills no stomach.”", "“A thief must make amends – but don't let the children starve.”"],
  },
};

const fr: T = {
  events: {
    besthaupt: ["Le droit de mainmorte", "Sur la ferme de {a}, le vieux paysan est mort. Le bailli du seigneur vient réclamer, selon la coutume, la meilleure tête : la plus belle vache de l'étable. Sans elle, la famille manquera de lait et de beurre tout l'hiver."],
    schwarm: ["L'essaim dans le chêne", "Un fort essaim s'est posé dans un chêne creux près du bois communal. {a} jure que ce sont ses abeilles échappées de sa ruche. {b} réplique : un essaim sans maître appartient à qui le capture."],
    funken: ["Étincelles sur le chaume", "Par vent en rafales, des étincelles s'envolent du conduit abîmé de {a} vers le toit de chaume sec de {b}. Deux fois déjà il a fallu des seaux. {b} exige que le feu reste éteint jusqu'à la réparation."],
    rotte: ["Le lin dans le ruisseau", "{a} a mis des bottes de lin à rouir dans le ruisseau pour détacher les fibres. En aval, {b} se plaint : l'eau sent la pourriture, le bétail refuse de boire et le linge grisaille."],
    wolfspur: ["Traces de loup dans la neige", "Après la première neige, {a} trouve des traces fraîches près du parc, et un mouton gît égorgé à l'orée du bois. L'officier du seigneur fait dire de se tenir prêts – le village délibère."],
    frevel: ["Bois volé dans la chênaie", "Dans la chênaie au bord du village, de jeunes arbres ont été abattus sans permission. {a}, qui veille aussi sur le bois, trouve les pieux frais derrière la grange de {b}. Bois et glandée y sont strictement partagés."],
    miete: ["Le silo de raves pillé", "Pendant la soudure avant le printemps, le silo de raves de {a}, couvert de paille et de terre, a été forcé. On a surpris {b} emportant des raves pour ses enfants affamés."],
  },
  choices: {
    "besthaupt:loesen": "La communauté avance l'argent du rachat – la vache reste", "besthaupt:bitte": "Demander grâce et délai au bailli, avec le curé", "besthaupt:geben": "Respecter le droit du seigneur ; les voisins aident avec du lait",
    "schwarm:teilen": "Partager : le preneur garde l'essaim, le propriétaire la cire à l'automne", "schwarm:korb": "Celui qui pose la ruche le premier garde l'essaim", "schwarm:pfarrer": "Que le curé tranche",
    "funken:kalt": "Le foyer reste éteint jusqu'à ce que le conduit soit refait", "funken:helfer": "Les voisins aident à refaire le conduit en torchis", "funken:lehm": "Fournir argile et verges de la réserve commune",
    "rotte:kuhle": "Mettre le lin dans un routoir à l'écart du ruisseau", "rotte:unten": "Rouir seulement en aval de l'abreuvoir", "rotte:bier": "Amende : un tonneau de bière aux voisins d'aval",
    "wolfspur:treib": "Lever les hommes pour une battue, comme le veut l'officier", "wolfspur:stall": "Rentrer les troupeaux plus tôt et garder des feux la nuit", "wolfspur:fallen": "Faire creuser des fosses-pièges à l'orée",
    "frevel:pflanz": "Planter de jeunes chênes en réparation", "frevel:pfand": "Saisir les pieux pour la clôture commune", "frevel:warn": "S'en tenir à un avertissement devant les voisins",
    "miete:arbeit": "Lui faire réparer le tort en travaillant chez {a}", "miete:korn": "Du grain de la caisse commune pour la famille affamée", "miete:stein": "Lui faire porter la pierre d'infamie dimanche devant l'église",
  },
  advice: {
    besthaupt: ["« Nul ne tient tête au seigneur. Mais une vache de moins, c'est la faim en hiver. »", "« Le bailli n'est qu'un homme – une bonne intercession fait parfois merveille. »"],
    schwarm: ["« Les abeilles ne connaissent pas de bornes. Partagez la bénédiction et la paix restera. »", "« Une querelle de miel est plus amère que l'absinthe. »"],
    funken: ["« Une étincelle et la moitié du village brûle. Pas d'hésitation ici. »", "« En hiver chacun a besoin de son feu – aidez plutôt que d'interdire. »"],
    rotte: ["« Le lin doit rouir, sinon pas de toile. Mais pas là où boit le bétail. »", "« L'eau est à tous ceux qui vivent au bord du ruisseau. »"],
    wolfspur: ["« Un loup qui a pris des moutons revient. »", "« En hiver, loup et homme ont faim tous deux. Gardez les bêtes près de la maison. »"],
    frevel: ["« Qui abat des chênes doit planter des chênes – sinon les petits-enfants n'auront pas de bois. »", "« Un pieu se coupe vite, un arbre pousse une vie entière. »"],
    miete: ["« Nécessité n'a point de loi. La punition seule ne remplit aucun ventre. »", "« Qui vole doit réparer – mais ne laissez pas les enfants mourir de faim. »"],
  },
};

const es: T = {
  events: {
    besthaupt: ["La luctuosa", "En la granja de {a} ha muerto el viejo labrador. Ahora llega el alguacil del señor y reclama, como manda la costumbre, la luctuosa: la mejor vaca del establo. Sin ella, a la familia le faltará leche y manteca todo el invierno."],
    schwarm: ["El enjambre en el roble", "Un enjambre fuerte se ha posado en un roble hueco junto al bosque común. {a} jura que son las abejas escapadas de su colmena. {b} replica: un enjambre sin dueño es de quien lo atrapa."],
    funken: ["Chispas sobre la paja", "Con el viento a rachas, saltan chispas del tiro dañado de {a} sobre el tejado de paja seca de {b}. Ya dos veces hubo que apagar con cubos. {b} exige que el fuego siga apagado hasta que se repare."],
    rotte: ["Lino en el arroyo", "{a} ha puesto haces de lino a enriar en el arroyo para soltar las fibras. Aguas abajo, {b} se queja: el agua huele a podrido, el ganado no quiere beber y la ropa sale gris."],
    wolfspur: ["Huellas de lobo en la nieve", "Tras la primera nevada, {a} encuentra huellas frescas junto al redil, y una oveja yace despedazada en la linde del bosque. El oficial del señor manda estar preparados; el pueblo delibera."],
    frevel: ["Tala furtiva en el robledal", "En el robledal junto al pueblo se han talado árboles jóvenes sin permiso. {a}, que comparte la guarda del bosque, encuentra los postes frescos tras el granero de {b}. Allí la leña y la montanera están repartidas con rigor."],
    miete: ["El silo de nabos saqueado", "En las semanas de escasez antes de la primavera forzaron el silo de nabos de {a}, cubierto de paja y tierra. Sorprendieron a {b} llevándose nabos para sus hijos hambrientos."],
  },
  choices: {
    "besthaupt:loesen": "El común adelanta el dinero del rescate: la vaca se queda", "besthaupt:bitte": "Pedir clemencia y plazo al alguacil, con el párroco", "besthaupt:geben": "Respetar el derecho del señor; los vecinos ayudan con leche",
    "schwarm:teilen": "Repartir: el que lo atrapa se queda las abejas, el dueño la cera en otoño", "schwarm:korb": "Quien ponga primero la colmena se queda el enjambre", "schwarm:pfarrer": "Que medie el párroco",
    "funken:kalt": "El hogar sigue apagado hasta rehacer el tiro", "funken:helfer": "Los vecinos ayudan a rehacer el tiro con barro", "funken:lehm": "Dar barro y varas de la reserva común",
    "rotte:kuhle": "Llevar el lino a una poza propia lejos del arroyo", "rotte:unten": "Enriar solo aguas abajo del abrevadero", "rotte:bier": "Reparación: un barril de cerveza para los vecinos de abajo",
    "wolfspur:treib": "Convocar a los hombres para una batida, como quiere el oficial", "wolfspur:stall": "Recoger antes los rebaños y mantener fuegos de noche", "wolfspur:fallen": "Cavar fosas trampa en la linde",
    "frevel:pflanz": "Plantar robles jóvenes como reparación", "frevel:pfand": "Confiscar los postes para la cerca común", "frevel:warn": "Dejarlo en una amonestación ante los vecinos",
    "miete:arbeit": "Que repare el daño trabajando en la granja de {a}", "miete:korn": "Grano de la caja común para la familia hambrienta", "miete:stein": "Que cargue la piedra de la vergüenza el domingo ante la iglesia",
  },
  advice: {
    besthaupt: ["«Nadie puede contra el señor. Pero una vaca menos es hambre en invierno.»", "«El alguacil también es hombre: una buena intercesión a veces obra milagros.»"],
    schwarm: ["«Las abejas no conocen lindes. Repartid la bendición y quedará la paz.»", "«Una riña por miel es más amarga que el ajenjo.»"],
    funken: ["«Una chispa y arde medio pueblo. Aquí no hay que dudar.»", "«En invierno todos necesitan su fuego: mejor ayudar que solo prohibir.»"],
    rotte: ["«El lino debe enriarse o no hay lienzo. Pero no donde bebe el ganado.»", "«El agua es de todos los que viven junto al arroyo.»"],
    wolfspur: ["«Un lobo que ya ha matado ovejas, vuelve.»", "«En invierno lobo y hombre tienen hambre. Tened los animales cerca de casa.»"],
    frevel: ["«Quien tala robles debe plantar robles, o los nietos no tendrán leña.»", "«Un poste se corta en un momento; un árbol crece una vida entera.»"],
    miete: ["«La necesidad no conoce ley. El castigo solo no llena ningún estómago.»", "«Quien roba debe reparar, pero no dejéis pasar hambre a los niños.»"],
  },
};

const ar: T = {
  events: {
    besthaupt: ["ضريبة الوفاة", "مات الفلاح العجوز في مزرعة {a}. وجاء وكيل السيد يطالب، كما جرى العرف، بأفضل رأس من الماشية: خير بقرة في الحظيرة. وبدونها تفقد الأسرة الحليب والزبدة طوال الشتاء."],
    schwarm: ["سرب النحل في البلوطة", "حطّ سرب قوي من النحل في بلوطة مجوفة عند غابة القرية. يقسم {a} أنه نحله الذي فرّ من خليته. ويعترض {b}: السرب الذي لا صاحب له لمن يمسكه."],
    funken: ["شرر على سقف القش", "في الريح العاصفة يتطاير الشرر من مدخنة {a} المتصدعة إلى سقف القش اليابس عند {b}. لقد احتاجوا الدلاء مرتين. ويطالب {b} بأن تبقى النار مطفأة حتى يُصلح العطب."],
    rotte: ["الكتان في الجدول", "وضع {a} حزم الكتان في الجدول لتتعطّن وتنفصل أليافها. وفي أسفل الجدول يشكو {b}: الماء نتن، والماشية تعاف الشرب، والغسيل يصير رماديًا."],
    wolfspur: ["آثار ذئب في الثلج", "بعد أول ثلج يجد {a} آثار ذئب حديثة عند الحظيرة، وشاة ممزقة عند حافة الغابة. ويرسل وكيل السيد أن استعدوا، والقرية تتشاور."],
    frevel: ["قطع جائر في غيضة البلوط", "قُطعت أشجار فتية في غيضة البلوط عند طرف القرية بلا إذن. ويجد {a}، المشارك في حراسة الغابة، الأوتاد الطرية خلف حظيرة {b}. والحطب والمرعى هناك مقسومان بدقة."],
    miete: ["مخزن اللفت المنهوب", "في أسابيع الشح قبل الربيع كُسر مخزن اللفت عند {a} المغطى بالقش والتراب. وضُبط {b} وهو يحمل اللفت لأطفاله الجياع."],
  },
  choices: {
    "besthaupt:loesen": "تقرض الجماعة مال الفداء فتبقى البقرة", "besthaupt:bitte": "التوسل إلى الوكيل مع القسيس طلبًا للرحمة والإمهال", "besthaupt:geben": "احترام حق السيد، ويعين الجيران بالحليب",
    "schwarm:teilen": "القسمة: للماسك السرب، وللمالك الشمع في الخريف", "schwarm:korb": "من يضع الخلية أولًا يأخذ السرب", "schwarm:pfarrer": "ليحكم القسيس بينهما",
    "funken:kalt": "يبقى الموقد باردًا حتى تُبنى المدخنة من جديد", "funken:helfer": "يساعد الجيران في إعادة بناء المدخنة بالطين", "funken:lehm": "تقديم الطين والأغصان من مخزن الجماعة",
    "rotte:kuhle": "نقل الكتان إلى حفرة تعطين بعيدة عن الجدول", "rotte:unten": "التعطين أسفل موضع السقي فقط", "rotte:bier": "تعويض: برميل جعة لجيران أسفل الجدول",
    "wolfspur:treib": "استنفار الرجال لصيد بالتطويق كما يريد الوكيل", "wolfspur:stall": "إدخال القطعان مبكرًا وإبقاء النيران ليلًا", "wolfspur:fallen": "حفر حفر مصائد عند حافة الغابة",
    "frevel:pflanz": "غرس بلوط فتي كفارة", "frevel:pfand": "مصادرة الأوتاد لسياج الجماعة", "frevel:warn": "الاكتفاء بإنذار أمام الجيران",
    "miete:arbeit": "أن يعوّض الضرر بالعمل في مزرعة {a}", "miete:korn": "حبوب من صندوق الجماعة للأسرة الجائعة", "miete:stein": "أن يحمل حجر العار يوم الأحد أمام الكنيسة",
  },
  advice: {
    besthaupt: ["«لا أحد يقف في وجه السيد. لكن بقرة أقل تعني جوعًا في الشتاء.»", "«الوكيل بشر أيضًا، والشفاعة الحسنة تصنع العجائب أحيانًا.»"],
    schwarm: ["«النحل لا يعرف الحدود. اقتسموا البركة يبقَ السلام.»", "«الخصام على العسل أمرّ من الأفسنتين.»"],
    funken: ["«شرارة واحدة ويحترق نصف القرية. لا تردد هنا.»", "«في الشتاء يحتاج كل واحد ناره، فالعون خير من المنع وحده.»"],
    rotte: ["«لا بد من تعطين الكتان وإلا فلا كتّان. لكن ليس حيث تشرب الماشية.»", "«الماء لكل من يسكن على الجدول.»"],
    wolfspur: ["«الذئب الذي افترس الغنم مرة يعود.»", "«في الشتاء يجوع الذئب والإنسان معًا. أبقوا الدواب قرب البيت.»"],
    frevel: ["«من يقطع البلوط فليغرس البلوط، وإلا فلا حطب للأحفاد.»", "«الوتد يُقطع في لحظة، والشجرة تنمو عمرًا كاملًا.»"],
    miete: ["«الضرورة لا تعرف قانونًا. والعقاب وحده لا يشبع بطنًا.»", "«على السارق أن يعوّض، لكن لا تدعوا الأطفال يجوعون.»"],
  },
};

const hi: T = {
  events: {
    besthaupt: ["मृत्यु-कर", "{a} के खेत पर बूढ़े किसान की मृत्यु हो गई। अब ज़मींदार का कारिंदा आकर रीति के अनुसार सबसे अच्छा पशु माँगता है: गोशाला की सबसे अच्छी गाय। उसके बिना परिवार को पूरी सर्दी दूध और मक्खन नहीं मिलेगा।"],
    schwarm: ["बलूत में मधुमक्खियों का झुंड", "गाँव के वन के पास एक खोखले बलूत में मधुमक्खियों का बड़ा झुंड आ बैठा है। {a} क़सम खाता है कि ये उसके छत्ते से उड़ी मक्खियाँ हैं। {b} कहता है: बिना मालिक का झुंड उसी का है जो उसे पकड़े।"],
    funken: ["फूस की छत पर चिंगारियाँ", "तेज़ हवा में {a} की टूटी चिमनी से चिंगारियाँ उड़कर {b} की सूखी फूस की छत पर गिरती हैं। दो बार बाल्टियों से आग बुझानी पड़ी। {b} माँगता है कि मरम्मत तक चूल्हा ठंडा रहे।"],
    rotte: ["नाले में सन", "{a} ने रेशे अलग करने के लिए सन के गट्ठर नाले में सड़ने को डाले हैं। नीचे की ओर {b} शिकायत करता है: पानी सड़ी बदबू देता है, मवेशी पानी नहीं पीते और कपड़े मटमैले हो जाते हैं।"],
    wolfspur: ["बर्फ़ में भेड़िये के निशान", "पहली बर्फ़ के बाद {a} को बाड़े के पास भेड़िये के ताज़ा निशान मिलते हैं, और जंगल के किनारे एक भेड़ फटी पड़ी है। ज़मींदार का अमला तैयार रहने को कहता है – गाँव सलाह करता है।"],
    frevel: ["बलूत-कुंज में चोरी की कटाई", "गाँव के किनारे बलूत-कुंज में बिना अनुमति कच्चे पेड़ काटे गए हैं। वन की निगरानी में साझेदार {a} को {b} के खलिहान के पीछे ताज़ा खूँटे मिलते हैं। वहाँ लकड़ी और चराई के हक़ बँटे हुए हैं।"],
    miete: ["लूटा गया शलजम-भंडार", "वसंत से पहले के तंगी के हफ़्तों में {a} का पुआल और मिट्टी से ढका शलजम-भंडार तोड़ा गया। {b} को अपने भूखे बच्चों के लिए शलजम ले जाते पकड़ा गया।"],
  },
  choices: {
    "besthaupt:loesen": "गाँव छुड़ाने का पैसा उधार दे – गाय रहेगी", "besthaupt:bitte": "पादरी के साथ कारिंदे से दया और मोहलत माँगो", "besthaupt:geben": "मालिक का हक़ मानो; पड़ोसी दूध से मदद करें",
    "schwarm:teilen": "बाँटो: पकड़ने वाले को झुंड, मालिक को पतझड़ में मोम", "schwarm:korb": "जो पहले छत्ता लगाए, झुंड उसका", "schwarm:pfarrer": "पादरी फ़ैसला करे",
    "funken:kalt": "चिमनी दोबारा बनने तक चूल्हा ठंडा रहे", "funken:helfer": "पड़ोसी मिट्टी से चिमनी फिर बनाने में मदद करें", "funken:lehm": "गाँव के भंडार से मिट्टी और टहनियाँ दो",
    "rotte:kuhle": "सन को नाले से दूर अलग गड्ढे में डालो", "rotte:unten": "केवल घाट के नीचे सड़ाने दो", "rotte:bier": "हर्जाना: नीचे वाले पड़ोसियों को एक पीपा बियर",
    "wolfspur:treib": "अमले की इच्छा से हँकाई-शिकार के लिए आदमी बुलाओ", "wolfspur:stall": "रेवड़ जल्दी अंदर लाओ और रात को आग जलाए रखो", "wolfspur:fallen": "जंगल के किनारे फंदे के गड्ढे खुदवाओ",
    "frevel:pflanz": "प्रायश्चित में बलूत के पौधे लगाओ", "frevel:pfand": "खूँटे ज़ब्त कर गाँव की बाड़ में लगाओ", "frevel:warn": "पड़ोसियों के सामने चेतावनी पर छोड़ दो",
    "miete:arbeit": "{a} के खेत पर काम करके नुक़सान भरवाओ", "miete:korn": "भूखे परिवार को गाँव के कोष से अनाज", "miete:stein": "रविवार को गिरजे के सामने कलंक-पत्थर उठवाओ",
  },
  advice: {
    besthaupt: ["“मालिक के आगे कोई नहीं टिकता। पर एक गाय कम मतलब सर्दी में भूख।”", "“कारिंदा भी इंसान है – अच्छी सिफ़ारिश कभी-कभी चमत्कार करती है।”"],
    schwarm: ["“मधुमक्खियाँ सीमाएँ नहीं जानतीं। बरकत बाँटो तो शांति रहेगी।”", "“शहद का झगड़ा किसी भी कड़वाहट से कड़वा है।”"],
    funken: ["“एक चिंगारी और आधा गाँव जल जाए। यहाँ हिचकना नहीं।”", "“सर्दी में सबको आग चाहिए – रोकने से अच्छा मदद करना।”"],
    rotte: ["“सन सड़ाना ज़रूरी है, वरना कपड़ा नहीं। पर वहाँ नहीं जहाँ मवेशी पीते हैं।”", "“पानी नाले के किनारे रहने वाले सबका है।”"],
    wolfspur: ["“जो भेड़िया एक बार भेड़ उठा ले, वह लौटता है।”", "“सर्दी में भेड़िया और इंसान दोनों भूखे हैं। पशु घर के पास रखो।”"],
    frevel: ["“जो बलूत काटे, वह बलूत लगाए – वरना पोतों को लकड़ी नहीं।”", "“खूँटा पल में कटता है, पेड़ एक उम्र में बढ़ता है।”"],
    miete: ["“मजबूरी कोई नियम नहीं जानती। सज़ा अकेले पेट नहीं भरती।”", "“चोर को भरपाई करनी होगी – पर बच्चों को भूखा मत रहने दो।”"],
  },
};

const zh: T = {
  events: {
    besthaupt: ["死亡税", "{a}家农庄的老农去世了。领主的管家前来，按惯例索要“最佳牲畜”：牛棚里最好的一头牛。没有它，这家人整个冬天都缺奶缺黄油。"],
    schwarm: ["橡树里的蜂群", "一大群蜜蜂落在村林边一棵空心橡树里。{a}发誓那是从他蜂筐里飞走的蜂。{b}反驳：无主的蜂群归捉到它的人。"],
    funken: ["草顶上的火星", "阵风中，火星从{a}破损的烟道飞到{b}干燥的草屋顶上。已经两次要用水桶扑火。{b}要求在修好之前不许生火。"],
    rotte: ["溪中沤麻", "{a}把成捆的亚麻放进溪里沤，让纤维脱开。下游的{b}抱怨：水有腐臭，牲口不肯喝，洗的衣服也发灰。"],
    wolfspur: ["雪中的狼迹", "初雪之后，{a}在羊圈旁发现新鲜的狼迹，林边还躺着一只被咬死的羊。领主的官员传话要大家准备——村里正在商议。"],
    frevel: ["橡树林盗伐", "村边的橡树林里有幼树未经许可被砍。共同看管林木的{a}在{b}的谷仓后发现了新削的木桩。那里的木材和放猪权都分得很清楚。"],
    miete: ["被盗的萝卜窖", "开春前青黄不接时，{a}用稻草和泥土盖着的萝卜窖被撬开了。{b}被当场抓住，正背着萝卜回去给饥饿的孩子。"],
  },
  choices: {
    "besthaupt:loesen": "村里垫钱赎回——牛留下", "besthaupt:bitte": "和神父一起向管家求情宽限", "besthaupt:geben": "尊重领主之权，邻居们接济牛奶",
    "schwarm:teilen": "分享：捉蜂者得蜂群，原主秋天得蜂蜡", "schwarm:korb": "谁先放上蜂筐，蜂群归谁", "schwarm:pfarrer": "请神父调解",
    "funken:kalt": "烟道重砌之前炉灶不许生火", "funken:helfer": "邻居帮忙用泥重砌烟道", "funken:lehm": "从村里的储备拿出黏土和枝条",
    "rotte:kuhle": "把亚麻挪到远离小溪的沤麻坑", "rotte:unten": "只许在饮牲口处下游沤麻", "rotte:bier": "赔礼：给下游邻居一桶啤酒",
    "wolfspur:treib": "照官员的意思召集男人围猎", "wolfspur:stall": "牲口早些入圈，夜里守火", "wolfspur:fallen": "在林边挖陷阱坑",
    "frevel:pflanz": "种下橡树苗赎过", "frevel:pfand": "没收木桩用于村里的篱笆", "frevel:warn": "当着邻居警告一番了事",
    "miete:arbeit": "让他在{a}的农庄做工抵偿", "miete:korn": "从村库拿粮食给饥饿的一家", "miete:stein": "让他星期天在教堂前背耻辱石",
  },
  advice: {
    besthaupt: ["“没人斗得过领主。但少一头牛，冬天就要挨饿。”", "“管家也是人——好言相求有时能出奇效。”"],
    schwarm: ["“蜜蜂不认地界。分享福气，和气自留。”", "“为蜂蜜争吵，比苦艾还苦。”"],
    funken: ["“一颗火星就能烧掉半个村子。这事不能犹豫。”", "“冬天谁都离不开火——帮忙比只是禁止好。”"],
    rotte: ["“亚麻不沤就没有麻布。可别在牲口喝水的地方。”", "“水属于住在溪边的每个人。”"],
    wolfspur: ["“叼过一次羊的狼还会再来。”", "“冬天狼和人都饿。把牲口拢在屋边。”"],
    frevel: ["“砍橡树的就得种橡树——不然孙辈没柴烧。”", "“木桩一会儿就削好，树要长一辈子。”"],
    miete: ["“饥寒起盗心。光是惩罚填不饱肚子。”", "“偷了就得赔——但别让孩子挨饿。”"],
  },
};

const ja: T = {
  events: {
    besthaupt: ["死亡税", "{a}の農家で老いた農夫が亡くなった。領主の代官が来て、慣わしどおり「最良の家畜」を求める――牛舎で一番の牛だ。それがなければ、一家は冬じゅう乳もバターもない。"],
    schwarm: ["樫の木の蜂の群れ", "村の林のそばの洞のある樫に、大きな蜂の群れがとまった。{a}は自分の巣籠から逃げた蜂だと誓う。{b}は言い返す。主のない群れは捕らえた者のものだ、と。"],
    funken: ["わら屋根に火の粉", "突風の中、{a}の傷んだ煙出しから火の粉が{b}の乾いたわら屋根へ飛ぶ。もう二度も桶で消した。{b}は直るまで火を使うなと求める。"],
    rotte: ["小川の亜麻", "{a}は繊維をほぐすため、亜麻の束を小川に浸けた。下流の{b}が訴える。水が腐ったにおいで、牛は飲まず、洗濯物も灰色になる、と。"],
    wolfspur: ["雪の中の狼の足跡", "初雪のあと、{a}は囲いのそばに新しい狼の足跡を見つけ、林のはずれでは羊が一頭やられていた。領主の役人は備えよと伝えてくる――村は相談する。"],
    frevel: ["樫林の盗伐", "村はずれの樫林で、若木が許しなく切られた。林の見張りを分け持つ{a}が、{b}の納屋の裏で削りたての杭を見つける。そこでは薪も豚の放牧も厳しく割り当てられている。"],
    miete: ["荒らされたかぶ室", "春前の乏しい時期に、わらと土をかぶせた{a}のかぶ室が破られた。飢えた子らのためにかぶを運び出す{b}が見つかった。"],
  },
  choices: {
    "besthaupt:loesen": "村が買い戻しの金を立て替える――牛は残る", "besthaupt:bitte": "司祭とともに代官へ慈悲と猶予を願う", "besthaupt:geben": "領主の権利を尊重し、近所が乳で助ける",
    "schwarm:teilen": "分ける：捕らえた者に群れ、元の主に秋の蜜蝋", "schwarm:korb": "先に巣籠を据えた者が群れを得る", "schwarm:pfarrer": "司祭に裁いてもらう",
    "funken:kalt": "煙出しを作り直すまでかまどは火を入れない", "funken:helfer": "近所が粘土で煙出しを作り直すのを手伝う", "funken:lehm": "村の蓄えから粘土と枝を出す",
    "rotte:kuhle": "亜麻を小川から離れた浸け穴へ移す", "rotte:unten": "水飲み場より下流だけで浸ける", "rotte:bier": "償い：下流の近所にビールを一樽",
    "wolfspur:treib": "役人の望みどおり男たちを巻き狩りに集める", "wolfspur:stall": "家畜を早めに入れ、夜は火を絶やさない", "wolfspur:fallen": "林のはずれに落とし穴を掘らせる",
    "frevel:pflanz": "償いに樫の若木を植える", "frevel:pfand": "杭を没収して村の柵に使う", "frevel:warn": "近所の前での戒めにとどめる",
    "miete:arbeit": "{a}の農家で働いて償わせる", "miete:korn": "村の金庫から飢えた一家に穀物を", "miete:stein": "日曜に教会の前で恥の石を担がせる",
  },
  advice: {
    besthaupt: ["「領主には誰も逆らえません。でも牛が一頭減れば冬は飢えます。」", "「代官も人の子。よいとりなしが効くこともあります。」"],
    schwarm: ["「蜂は境を知りません。恵みを分ければ和が保てます。」", "「蜜をめぐる争いは苦よもぎより苦いもの。」"],
    funken: ["「火の粉ひとつで村の半分が燃えます。ためらってはいけません。」", "「冬は誰にも火が要ります。禁じるだけより手を貸しましょう。」"],
    rotte: ["「亜麻は浸けなければ布になりません。でも牛が飲む所ではだめ。」", "「水は小川沿いに住む皆のものです。」"],
    wolfspur: ["「一度羊を襲った狼はまた来ます。」", "「冬は狼も人も飢えています。家畜は家の近くに。」"],
    frevel: ["「樫を切る者は樫を植えるべき。でなければ孫に薪がありません。」", "「杭はすぐ削れますが、木は一生かけて育ちます。」"],
    miete: ["「背に腹はかえられません。罰だけでは腹は満ちません。」", "「盗んだら償うこと。でも子どもを飢えさせてはいけません。」"],
  },
};

export const LIFE2_TEXT: Record<Lang, T> = { de, en, fr, es, ar, hi, zh, ja };
