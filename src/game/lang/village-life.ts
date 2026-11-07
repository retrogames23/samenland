import type { Lang } from "../i18n";

/**
 * Village life around 1500 (commons.ts): everyday disputes, common work and pastimes of a north German
 * village. Texts were checked against the period (no Knick hedges, no reformation poor chest, no
 * shooting guild in the village; Papagay shooting is kept for towns). {a} = the resident who brings it,
 * {b} = the other party — both real villagers, filled in by the parchment; `someone` is the fallback.
 * Advice: [0] spring/summer, [1] autumn/winter.
 */
export type LifeKey = "zaun" | "flur" | "plaggen" | "schelte" | "scharwerk" | "pfingsten" | "lichtstube";
type T = {
  events: Record<LifeKey, [string, string]>;
  choices: Record<string, string>;
  advice: Record<LifeKey, [string, string]>;
  someone: [string, string];
};

const de: T = {
  events: {
    zaun: ["Der Zaunbruch am Sommerkorn", "{a} hat den Flechtzaun am Bachlauf nicht rechtzeitig mit frischen Weidenruten ausgebessert. Die Kuh von {b} brach durch und fraß am jungen Sommerkorn. Nun streiten beide auf dem Anger."],
    flur: ["Vieh auf den Stoppeln", "In der Flur am Mühlenweg gilt gemeinsame Ordnung: Erst wenn alle Garben geborgen sind, darf das Vieh auf die Stoppeln. Doch {a} hat die Rinder schon hinausgetrieben, während {b} noch Gerste schneidet."],
    plaggen: ["Der Plaggenhieb in der Heide", "Zwei Höfe haben die Heide am Hang bis auf den nackten Sand abgeplaggt – Soden für die Stallstreu und den Dung der Roggenäcker. Nun weht der Wind Sand über den Kirchweg. {a}, von der Gemeinde mit der Aufsicht über die Heide betraut, schlägt Alarm."],
    schelte: ["Scheltworte am Brunnen", "Am Schöpfbrunnen kam es zum Hader: {a} hat {b} lautstark einer Schandtat und der Zauberei bezichtigt. Das halbe Dorf hat es gehört, und die Verwandten verlangen vor Zeugen Genugtuung."],
    scharwerk: ["Der Mühlendamm", "Das Hochwasser hat Damm und Steg am Mühlenteich unterspült. Einige Häusler murren, das sei allein des Müllers Sache – doch {a} warnt: Ohne Wasserstau mahlt die Mühle kein Korn für das Dorf. Je nach Ortsbrauch schuldet das Dorf hier Gemeinwerk."],
    pfingsten: ["Pfingsten auf dem Anger", "Zu Pfingsten wollen die Dorfleute auf dem Anger Fässer anstechen. Während Fiedel und Sackpfeife zum Reigen aufspielen, wollen sich einige junge Männer mit Bogen und Armbrust an einer hölzernen Scheibe messen."],
    lichtstube: ["Die Spinnstube", "Draußen liegt Reif über den Wiesen. In der warmen Stube schnurren die Spinnräder beim Schein der Kienspäne, Wolle und Flachs werden versponnen. Nun klopfen die Burschen mit Fiedel und Pfeife an und bitten um Einlass."],
  },
  choices: {
    "zaun:buss": "Nachbarbuße: Zaun binnen dreier Tage flechten, ein Fass Bier für die Nachbarn", "zaun:holz": "Ruten und Pfähle aus der Gemeinde stellen", "zaun:pfand": "Die Kuh als Pfand behalten lassen, bis der Schaden geschätzt ist",
    "flur:schau": "Flurschau halten: zwei Scheffel Korn Ersatz, Buße in die Gemeindekasse", "flur:hilfe": "Die Jungen helfen, das Korn vor dem Regen einzufahren",
    "plaggen:mass": "Gemeindebeschluss: zehn Fuder je Hof, der Hang ruht zwei Sommer", "plaggen:laub": "Laubstreu aus dem Eichenwald erlauben",
    "schelte:widerruf": "Öffentlicher Widerruf am Sonntag vor der Gemeinde", "schelte:spende": "Der Pfarrer vermittelt, beide stiften Wachs für die Altarkerzen",
    "scharwerk:aufgebot": "Gemeinwerk aufbieten: jeder verpflichtete Hof schickt Leute", "scharwerk:dingen": "Zimmerleute und Bohlen aus der Gemeindekasse bezahlen",
    "pfingsten:preis": "Ein Fass Bier stiften und den besten Schützen bekränzen", "pfingsten:reigen": "Das Fest sich selbst tragen lassen",
    "lichtstube:reigen": "Lied und Reigen bis zum Abendläuten erlauben", "lichtstube:andacht": "Nur Spinnen und fromme Lieder",
  },
  advice: {
    zaun: ["„Ein Zaun hält nur so gut wie der, der ihn flicht. Lasst ihn selbst Hand anlegen.“", "„Vergesst nicht: Wer heute pfändet, braucht morgen den Nachbarn.“"],
    flur: ["„Die Flur gehört allen, die Garben jedem selbst. Sonst traut keiner mehr dem anderen.“", "„Schnell, ehe der Regen kommt – nasses Korn verdirbt in der Scheune.“"],
    plaggen: ["„Die Heide wächst langsamer nach, als man sie sticht. Was der Sand nimmt, gibt er nicht zurück.“", "„Laub ist auch Streu – aber nehmt nicht alles, der Wald braucht seinen Boden.“"],
    schelte: ["„Ein böses Wort ist schnell gesagt und lange nicht vergessen. Es muss vor allen zurückgenommen werden.“", "„Mit Zauberei-Gerede spielt man nicht. Bringt es zur Ruhe, ehe es Kreise zieht.“"],
    scharwerk: ["„Was alle brauchen, tragen alle. Der Müller allein schafft den Damm nicht.“", "„Das Wasser ist kalt – wer im Teich steht, holt sich das Fieber. Bezahlte Zimmerleute sind schneller.“"],
    pfingsten: ["„Lasst die Jungen feiern, aber haltet die Armbrüste fern vom Tanzplatz.“", "„Ein Fest schweißt zusammen – auch ohne Geld aus der Truhe.“"],
    lichtstube: ["„In der Stube findet sich manches Paar. Die Alten passen schon auf.“", "„Lange Abende sind gut für das Garn. Aber ein Lied hat noch keinem Faden geschadet.“"],
  },
  someone: ["ein Nachbar", "ein anderer Hof"],
};

const en: T = {
  events: {
    zaun: ["The broken fence", "{a} did not mend the wattle fence by the brook with fresh willow rods in time. The cow of {b} broke through and grazed the young summer corn. Now both quarrel on the green."],
    flur: ["Cattle on the stubble", "The open field by the mill road keeps a common rule: only when every sheaf is in may cattle go onto the stubble. Yet {a} has already driven the cattle out while {b} is still cutting barley."],
    plaggen: ["Sod cutting on the heath", "Two farms have stripped the heath on the slope down to bare sand – sods for stable litter and dung for the rye fields. Now the wind blows sand across the church path. {a}, entrusted by the village with watching the heath, raises the alarm."],
    schelte: ["Harsh words at the well", "A quarrel broke out at the well: {a} loudly accused {b} of a shameful deed and of witchcraft. Half the village heard it, and the kin demand satisfaction before witnesses."],
    scharwerk: ["The mill dam", "The high water has undermined the dam and footbridge at the mill pond. Some cottagers grumble that it is the miller's business alone – but {a} warns: without the head of water the mill grinds no corn for the village. By local custom the village may owe common labour here."],
    pfingsten: ["Whitsun on the green", "At Whitsun the villagers want to tap barrels on the green. While fiddle and bagpipe play for the round dance, some young men want to try their bows and crossbows at a wooden target."],
    lichtstube: ["The spinning room", "Frost lies over the meadows. In the warm room the spinning wheels whirr by the light of pine splints, spinning wool and flax. Now the young men knock with fiddle and pipe and ask to come in."],
  },
  choices: {
    "zaun:buss": "Neighbours' fine: weave the fence within three days, a barrel of ale for the neighbours", "zaun:holz": "Provide rods and posts from the village", "zaun:pfand": "Let the cow be kept as a pledge until the damage is assessed",
    "flur:schau": "Inspect the field: two bushels in amends, a fine to the village chest", "flur:hilfe": "The young folk help bring the corn in before the rain",
    "plaggen:mass": "Village ruling: ten cartloads per farm, the slope rests two summers", "plaggen:laub": "Allow leaf litter from the oak wood",
    "schelte:widerruf": "Public retraction before the parish on Sunday", "schelte:spende": "The priest mediates; both give wax for the altar candles",
    "scharwerk:aufgebot": "Call out common labour: every bound farm sends hands", "scharwerk:dingen": "Pay carpenters and planks from the village chest",
    "pfingsten:preis": "Give a barrel of ale and crown the best shot with a wreath", "pfingsten:reigen": "Let the feast carry itself",
    "lichtstube:reigen": "Allow song and dance until the evening bell", "lichtstube:andacht": "Only spinning and pious songs",
  },
  advice: {
    zaun: ["“A fence holds only as well as the one who weaves it. Let him set his own hand to it.”", "“Remember: whoever takes a pledge today needs the neighbour tomorrow.”"],
    flur: ["“The field belongs to all, the sheaves to each. Otherwise no one trusts the other.”", "“Quick, before the rain – wet corn spoils in the barn.”"],
    plaggen: ["“The heath grows back slower than it is cut. What the sand takes, it never returns.”", "“Leaves make litter too – but don't take them all, the wood needs its soil.”"],
    schelte: ["“A wicked word is soon said and long remembered. It must be taken back before everyone.”", "“Talk of witchcraft is no game. Lay it to rest before it spreads.”"],
    scharwerk: ["“What all need, all carry. The miller cannot mend the dam alone.”", "“The water is cold – whoever stands in the pond catches a fever. Paid carpenters are quicker.”"],
    pfingsten: ["“Let the young ones feast, but keep the crossbows away from the dancing.”", "“A feast binds us together – even without coin from the chest.”"],
    lichtstube: ["“Many a couple has found each other in the spinning room. The old ones keep an eye out.”", "“Long evenings are good for the yarn. And a song never broke a thread.”"],
  },
  someone: ["a neighbour", "another farm"],
};

const fr: T = {
  events: {
    zaun: ["La clôture rompue", "{a} n'a pas réparé à temps la clôture tressée près du ruisseau avec des osiers frais. La vache de {b} est passée au travers et a brouté le jeune blé d'été. Les deux se querellent sur le pré communal."],
    flur: ["Du bétail sur les chaumes", "Dans les champs du chemin du moulin vaut une règle commune : le bétail ne va sur les chaumes que lorsque toutes les gerbes sont rentrées. Pourtant {a} y a déjà mené ses bêtes tandis que {b} coupe encore son orge."],
    plaggen: ["L'étrépage de la lande", "Deux fermes ont étrépé la lande du coteau jusqu'au sable nu – des mottes pour la litière et le fumier des seigles. Le vent souffle à présent le sable sur le chemin de l'église. {a}, chargé par la communauté de veiller sur la lande, donne l'alarme."],
    schelte: ["Injures au puits", "Une dispute a éclaté au puits : {a} a accusé {b} à grands cris d'un acte honteux et de sorcellerie. La moitié du village l'a entendu, et la parenté exige réparation devant témoins."],
    scharwerk: ["La digue du moulin", "La crue a sapé la digue et la passerelle de l'étang du moulin. Quelques journaliers grognent que c'est l'affaire du seul meunier – mais {a} prévient : sans retenue d'eau, le moulin ne moud plus le grain du village. Selon la coutume locale, le village peut devoir ici la corvée commune."],
    pfingsten: ["La Pentecôte sur le pré", "À la Pentecôte, les villageois veulent mettre des tonneaux en perce sur le pré communal. Tandis que vielle et cornemuse jouent pour la ronde, quelques jeunes gens veulent s'essayer à l'arc et à l'arbalète sur une cible de bois."],
    lichtstube: ["La veillée des fileuses", "Le givre couvre les prés. Dans la pièce chaude, les rouets ronronnent à la lueur des éclats de pin ; on file la laine et le lin. Voilà que les garçons frappent avec vielle et flûte et demandent à entrer."],
  },
  choices: {
    "zaun:buss": "Amende de voisinage : tresser la clôture en trois jours, un tonneau de bière aux voisins", "zaun:holz": "Fournir osiers et piquets de la communauté", "zaun:pfand": "Garder la vache en gage jusqu'à l'estimation du dommage",
    "flur:schau": "Visite des champs : deux boisseaux en réparation, une amende à la caisse commune", "flur:hilfe": "Les jeunes aident à rentrer le grain avant la pluie",
    "plaggen:mass": "Décision commune : dix charretées par ferme, le coteau se repose deux étés", "plaggen:laub": "Permettre la litière de feuilles de la chênaie",
    "schelte:widerruf": "Rétractation publique le dimanche devant la paroisse", "schelte:spende": "Le curé arbitre ; tous deux offrent de la cire pour les cierges",
    "scharwerk:aufgebot": "Convoquer la corvée : chaque ferme tenue envoie des bras", "scharwerk:dingen": "Payer charpentiers et madriers sur la caisse commune",
    "pfingsten:preis": "Offrir un tonneau et couronner le meilleur tireur", "pfingsten:reigen": "Laisser la fête aller d'elle-même",
    "lichtstube:reigen": "Permettre chants et rondes jusqu'à la cloche du soir", "lichtstube:andacht": "Seulement filer et chanter des cantiques",
  },
  advice: {
    zaun: ["« Une clôture ne vaut que celui qui la tresse. Qu'il y mette la main lui-même. »", "« Souvenez-vous : qui prend un gage aujourd'hui aura besoin du voisin demain. »"],
    flur: ["« Le champ est à tous, les gerbes à chacun. Sinon plus personne ne se fie à l'autre. »", "« Vite, avant la pluie – le grain mouillé pourrit dans la grange. »"],
    plaggen: ["« La lande repousse plus lentement qu'on ne l'étrépe. Ce que le sable prend, il ne le rend pas. »", "« Les feuilles font aussi litière – mais n'en prenez pas tout, le bois a besoin de son sol. »"],
    schelte: ["« Un mauvais mot est vite dit et longtemps retenu. Il faut le reprendre devant tous. »", "« On ne joue pas avec les rumeurs de sorcellerie. Apaisez-les avant qu'elles s'étendent. »"],
    scharwerk: ["« Ce dont tous ont besoin, tous le portent. Le meunier seul ne refera pas la digue. »", "« L'eau est froide – qui reste dans l'étang prend la fièvre. Des charpentiers payés iront plus vite. »"],
    pfingsten: ["« Laissez la jeunesse fêter, mais tenez les arbalètes loin de la danse. »", "« Une fête soude le village – même sans l'argent du coffre. »"],
    lichtstube: ["« Plus d'un couple s'est trouvé à la veillée. Les anciens veillent. »", "« Les longues soirées sont bonnes pour le fil. Une chanson n'a jamais rompu un fil. »"],
  },
  someone: ["un voisin", "une autre ferme"],
};

const es: T = {
  events: {
    zaun: ["La cerca rota", "{a} no reparó a tiempo la cerca de mimbre junto al arroyo con varas frescas. La vaca de {b} la atravesó y pació el trigo tierno de verano. Ahora ambos discuten en el ejido."],
    flur: ["Ganado en el rastrojo", "En los campos del camino del molino rige una norma común: el ganado solo entra al rastrojo cuando todas las gavillas están recogidas. Pero {a} ya ha sacado sus reses mientras {b} todavía siega cebada."],
    plaggen: ["El corte de tepes en el brezal", "Dos granjas han arrancado el brezal de la ladera hasta la arena desnuda: tepes para la cama del establo y el abono del centeno. Ahora el viento arrastra arena sobre el camino de la iglesia. {a}, encargado por la comunidad de vigilar el brezal, da la alarma."],
    schelte: ["Injurias en el pozo", "Junto al pozo estalló una riña: {a} acusó a voces a {b} de una acción vergonzosa y de brujería. Medio pueblo lo oyó, y la parentela exige satisfacción ante testigos."],
    scharwerk: ["La presa del molino", "La crecida ha socavado la presa y la pasarela del estanque del molino. Algunos jornaleros murmuran que es cosa del molinero, pero {a} advierte: sin agua represada el molino no muele grano para el pueblo. Según la costumbre local, el pueblo puede deber aquí trabajo comunal."],
    pfingsten: ["Pentecostés en el ejido", "Por Pentecostés los aldeanos quieren abrir barriles en el ejido. Mientras el violín y la gaita tocan para la ronda, algunos mozos quieren probarse con arco y ballesta ante una diana de madera."],
    lichtstube: ["La hilandería de invierno", "La escarcha cubre los prados. En la sala caliente zumban las ruecas a la luz de las astillas de tea; se hila lana y lino. Ahora los mozos llaman con violín y flauta y piden entrar."],
  },
  choices: {
    "zaun:buss": "Multa vecinal: trenzar la cerca en tres días y un barril de cerveza para los vecinos", "zaun:holz": "Dar varas y estacas del común", "zaun:pfand": "Retener la vaca en prenda hasta tasar el daño",
    "flur:schau": "Inspección del campo: dos fanegas de reparación y multa a la caja común", "flur:hilfe": "Los jóvenes ayudan a meter el grano antes de la lluvia",
    "plaggen:mass": "Acuerdo común: diez carretadas por granja, la ladera descansa dos veranos", "plaggen:laub": "Permitir hojarasca del robledal",
    "schelte:widerruf": "Retractación pública el domingo ante la parroquia", "schelte:spende": "El párroco media; ambos donan cera para las velas del altar",
    "scharwerk:aufgebot": "Convocar el trabajo comunal: cada granja obligada envía brazos", "scharwerk:dingen": "Pagar carpinteros y tablones de la caja común",
    "pfingsten:preis": "Donar un barril y coronar al mejor tirador", "pfingsten:reigen": "Dejar que la fiesta siga sola",
    "lichtstube:reigen": "Permitir canto y ronda hasta el toque de vísperas", "lichtstube:andacht": "Solo hilar y cantos piadosos",
  },
  advice: {
    zaun: ["«Una cerca aguanta lo que aguanta quien la trenza. Que ponga él mismo la mano.»", "«Recordad: quien hoy toma prenda, mañana necesita al vecino.»"],
    flur: ["«El campo es de todos, las gavillas de cada uno. Si no, nadie se fía de nadie.»", "«Rápido, antes de la lluvia: el grano mojado se pudre en el granero.»"],
    plaggen: ["«El brezal crece más despacio de lo que se corta. Lo que la arena toma, no lo devuelve.»", "«La hoja también sirve de cama, pero no la toméis toda: el bosque necesita su suelo.»"],
    schelte: ["«Una mala palabra se dice pronto y se recuerda mucho. Debe retirarse ante todos.»", "«Con habladurías de brujería no se juega. Calmadlas antes de que se extiendan.»"],
    scharwerk: ["«Lo que todos necesitan, todos lo cargan. El molinero solo no rehará la presa.»", "«El agua está fría: quien se mete en el estanque coge fiebre. Los carpinteros pagados van más rápido.»"],
    pfingsten: ["«Dejad que los jóvenes festejen, pero lejos las ballestas del baile.»", "«Una fiesta une al pueblo, aun sin dinero del arca.»"],
    lichtstube: ["«Más de una pareja se encontró en la hilandería. Los mayores vigilan.»", "«Las veladas largas son buenas para el hilo. Una canción nunca rompió una hebra.»"],
  },
  someone: ["un vecino", "otra granja"],
};

const ar: T = {
  events: {
    zaun: ["السياج المكسور", "لم يُصلح {a} السياج المجدول عند الجدول بأغصان صفصاف طرية في وقته. فاخترقته بقرة {b} وأكلت من قمح الصيف الغض. والاثنان الآن يتخاصمان في المرج المشاع."],
    flur: ["ماشية على الحصيد", "في حقول طريق الطاحونة قاعدة مشتركة: لا تدخل الماشية الحصيد حتى تُجمع كل الحزم. لكن {a} ساق أبقاره إليه، و{b} ما زال يحصد الشعير."],
    plaggen: ["قطع الأعشاب في البراري", "قشرت مزرعتان البراري على المنحدر حتى الرمل العاري، طلبًا لفرشة الحظائر وسماد حقول الجاودار. والآن تذرو الريح الرمل على طريق الكنيسة. ويطلق {a}، المكلف من الجماعة بحراسة البراري، صيحة التحذير."],
    schelte: ["شتائم عند البئر", "نشب شجار عند البئر: اتهم {a} جهارًا {b} بفعلة مخزية وبالسحر. سمعه نصف القرية، والأقارب يطلبون الإنصاف أمام الشهود."],
    scharwerk: ["سد الطاحونة", "جرف الفيضان أسفل السد والجسر الخشبي عند بركة الطاحونة. يتذمر بعض الفقراء بأن الأمر شأن الطحان وحده، لكن {a} يحذر: بلا حبس الماء لا تطحن الطاحونة حبًّا للقرية. وبحسب عرف المكان قد تدين القرية هنا بالعمل المشترك."],
    pfingsten: ["عيد العنصرة في المرج", "في العنصرة يريد أهل القرية فتح البراميل في المرج. وبينما تعزف الربابة والمزمار للرقص الدائري، يريد بعض الشبان التباري بالقوس والقوس المستعرض على هدف خشبي."],
    lichtstube: ["غرفة الغزل", "الصقيع يغطي المروج. وفي الغرفة الدافئة تدور المغازل على ضوء شظايا الصنوبر، ويُغزل الصوف والكتان. والآن يطرق الشبان الباب بالربابة والناي ويستأذنون في الدخول."],
  },
  choices: {
    "zaun:buss": "غرامة الجيرة: يُجدل السياج خلال ثلاثة أيام وبرميل جعة للجيران", "zaun:holz": "تقديم أغصان وأوتاد من مال الجماعة", "zaun:pfand": "إبقاء البقرة رهنًا حتى يُقدَّر الضرر",
    "flur:schau": "معاينة الحقل: مكيالان من الحب تعويضًا وغرامة لصندوق الجماعة", "flur:hilfe": "يساعد الشبان في إدخال الحب قبل المطر",
    "plaggen:mass": "قرار الجماعة: عشر حمولات لكل مزرعة ويستريح المنحدر صيفين", "plaggen:laub": "السماح بفرشة الأوراق من غابة البلوط",
    "schelte:widerruf": "تراجع علني يوم الأحد أمام الأبرشية", "schelte:spende": "يتوسط الكاهن ويقدم الطرفان شمعًا لشموع المذبح",
    "scharwerk:aufgebot": "الدعوة إلى العمل المشترك: كل مزرعة ملزمة ترسل أيديًا", "scharwerk:dingen": "دفع أجر النجارين والألواح من صندوق الجماعة",
    "pfingsten:preis": "التبرع ببرميل وتتويج أمهر رامٍ بإكليل", "pfingsten:reigen": "ترك العيد يمضي وحده",
    "lichtstube:reigen": "السماح بالغناء والرقص حتى جرس المساء", "lichtstube:andacht": "الغزل والأناشيد الورعة فحسب",
  },
  advice: {
    zaun: ["«السياج لا يصمد إلا بقدر من يجدله. فليضع يده فيه بنفسه.»", "«تذكروا: من يأخذ رهنًا اليوم يحتاج جاره غدًا.»"],
    flur: ["«الحقل للجميع والحزم لكل صاحبها، وإلا لم يثق أحد بأحد.»", "«أسرعوا قبل المطر، فالحب المبتل يفسد في المخزن.»"],
    plaggen: ["«البراري تنبت أبطأ مما تُقطع، وما يأخذه الرمل لا يرده.»", "«الأوراق فرشة أيضًا، لكن لا تأخذوها كلها؛ فالغابة تحتاج تربتها.»"],
    schelte: ["«الكلمة الخبيثة تقال سريعًا وتُذكر طويلًا، فلتُسحب أمام الجميع.»", "«حديث السحر ليس لعبًا، فأخمدوه قبل أن ينتشر.»"],
    scharwerk: ["«ما يحتاجه الجميع يحمله الجميع، والطحان وحده لا يصلح السد.»", "«الماء بارد، ومن يقف في البركة تصيبه الحمى. النجارون المأجورون أسرع.»"],
    pfingsten: ["«دعوا الشباب يحتفلون، وأبعدوا الأقواس عن ساحة الرقص.»", "«العيد يجمع القرية، ولو بلا مال من الصندوق.»"],
    lichtstube: ["«كم من زوجين تعارفا في غرفة الغزل، والكبار يراقبون.»", "«الأمسيات الطويلة خير للخيط، وما قطعت أغنية خيطًا قط.»"],
  },
  someone: ["أحد الجيران", "مزرعة أخرى"],
};

const hi: T = {
  events: {
    zaun: ["टूटी बाड़", "{a} ने नाले के पास की बुनी हुई बाड़ को समय पर ताज़ी बेंत से नहीं सुधारा। {b} की गाय उसे तोड़कर गर्मी की कच्ची फ़सल चर गई। अब दोनों चरागाह पर झगड़ रहे हैं।"],
    flur: ["ठूँठों पर मवेशी", "चक्की वाले रास्ते के खेतों में साझा नियम है: जब तक सारे पूले न उठ जाएँ, मवेशी ठूँठों पर नहीं जाते। पर {a} अपने मवेशी पहले ही ले गया, जबकि {b} अभी जौ काट रहा है।"],
    plaggen: ["झाड़ी-भूमि की परत कटाई", "दो खेतिहरों ने ढलान की झाड़ी-भूमि को नंगी रेत तक छील डाला – पशुशाला के बिछौने और राई के खेतों की खाद के लिए। अब हवा गिरजे के रास्ते पर रेत उड़ा रही है। गाँव द्वारा झाड़ी-भूमि की निगरानी सौंपे गए {a} चेतावनी दे रहे हैं।"],
    schelte: ["कुएँ पर कटु वचन", "कुएँ पर झगड़ा हो गया: {a} ने ऊँचे स्वर में {b} पर एक शर्मनाक काम और जादू-टोने का आरोप लगाया। आधे गाँव ने सुना, और परिजन गवाहों के सामने न्याय माँगते हैं।"],
    scharwerk: ["चक्की का बाँध", "बाढ़ ने चक्की-तालाब के बाँध और पुलिया को खोखला कर दिया है। कुछ लोग बड़बड़ाते हैं कि यह केवल चक्कीवाले का काम है – पर {a} चेताते हैं: पानी रुके बिना चक्की गाँव का अनाज नहीं पीसेगी। स्थानीय रीति के अनुसार यहाँ गाँव पर साझा श्रम बनता है।"],
    pfingsten: ["चरागाह पर पेंटेकोस्ट", "पेंटेकोस्ट पर गाँव वाले चरागाह पर पीपे खोलना चाहते हैं। जब सारंगी और मशक-बाजा घेरा-नृत्य के लिए बजते हैं, कुछ युवक लकड़ी के निशाने पर धनुष और क्रॉसबो से होड़ करना चाहते हैं।"],
    lichtstube: ["कताई की बैठक", "घास के मैदानों पर पाला जमा है। गर्म कमरे में चीड़ की खपच्चियों की रोशनी में चरखे घूम रहे हैं, ऊन और सन काते जा रहे हैं। अब युवक सारंगी और बाँसुरी लेकर दरवाज़ा खटखटाते हैं और भीतर आने की अनुमति माँगते हैं।"],
  },
  choices: {
    "zaun:buss": "पड़ोसी-दंड: तीन दिन में बाड़ बुनो, पड़ोसियों को एक पीपा बियर", "zaun:holz": "गाँव की ओर से बेंत और खूँटे दो", "zaun:pfand": "हानि आँकने तक गाय गिरवी रखने दो",
    "flur:schau": "खेत का निरीक्षण: दो माप अनाज हर्जाना, गाँव के कोष में दंड", "flur:hilfe": "युवा बारिश से पहले अनाज भीतर लाने में मदद करें",
    "plaggen:mass": "गाँव का निर्णय: हर खेत दस गाड़ी, ढलान दो गर्मियाँ आराम करे", "plaggen:laub": "बलूत-वन से पत्तों का बिछौना ले जाने दो",
    "schelte:widerruf": "रविवार को सबके सामने सार्वजनिक क्षमा-याचना", "schelte:spende": "पादरी मध्यस्थ बनें; दोनों वेदी की मोमबत्तियों के लिए मोम दें",
    "scharwerk:aufgebot": "साझा श्रम बुलाओ: हर बाध्य खेत हाथ भेजे", "scharwerk:dingen": "गाँव के कोष से बढ़ई और तख़्ते मँगाओ",
    "pfingsten:preis": "एक पीपा दो और सबसे अच्छे निशानेबाज़ को माला पहनाओ", "pfingsten:reigen": "उत्सव को अपने आप चलने दो",
    "lichtstube:reigen": "संध्या-घंटी तक गीत और नृत्य की अनुमति", "lichtstube:andacht": "केवल कताई और भक्ति-गीत",
  },
  advice: {
    zaun: ["“बाड़ उतनी ही टिकती है जितना उसे बुनने वाला। उसे स्वयं हाथ लगाने दो।”", "“याद रखो: जो आज गिरवी लेता है, उसे कल पड़ोसी की ज़रूरत पड़ेगी।”"],
    flur: ["“खेत सबका है, पूले हर एक के। वरना कोई किसी पर भरोसा नहीं करेगा।”", "“जल्दी करो, बारिश से पहले – गीला अनाज खलिहान में सड़ जाता है।”"],
    plaggen: ["“झाड़ी-भूमि कटने से धीमी उगती है। जो रेत ले लेती है, लौटाती नहीं।”", "“पत्ते भी बिछौना हैं – पर सब मत ले जाओ, वन को अपनी मिट्टी चाहिए।”"],
    schelte: ["“बुरा शब्द जल्दी कहा जाता है और देर तक याद रहता है। उसे सबके सामने वापस लेना होगा।”", "“जादू-टोने की बातें खेल नहीं। फैलने से पहले शांत करो।”"],
    scharwerk: ["“जिसकी सबको ज़रूरत है, उसे सब उठाते हैं। अकेला चक्कीवाला बाँध नहीं बना सकता।”", "“पानी ठंडा है – जो तालाब में खड़ा होगा उसे बुख़ार आएगा। मज़दूरी वाले बढ़ई जल्दी करेंगे।”"],
    pfingsten: ["“युवाओं को उत्सव मनाने दो, पर क्रॉसबो नृत्य से दूर रखो।”", "“उत्सव गाँव को जोड़ता है – कोष के पैसे के बिना भी।”"],
    lichtstube: ["“कताई की बैठक में कई जोड़े मिले हैं। बुज़ुर्ग नज़र रखते हैं।”", "“लंबी शामें धागे के लिए अच्छी हैं। गीत ने कभी धागा नहीं तोड़ा।”"],
  },
  someone: ["एक पड़ोसी", "दूसरा खेत"],
};

const zh: T = {
  events: {
    zaun: ["破篱笆", "{a}没有及时用新柳条修补溪边的编篱。{b}家的牛冲了进来，啃食了嫩夏麦。如今两人在公地上争吵。"],
    flur: ["麦茬地上的牲口", "磨坊路边的田地有共同的规矩：所有麦捆收完，牲口才能上茬地。可{a}已经把牛赶了出去，而{b}还在割大麦。"],
    plaggen: ["荒原上铲草皮", "两户人家把山坡上的荒原一直铲到光秃的沙地——草皮用作畜栏垫草和黑麦田的肥料。如今风把沙子吹到了去教堂的路上。受村社委托看管荒原的{a}发出了警告。"],
    schelte: ["井边恶语", "井边起了争执：{a}大声指控{b}做了丑事，还会巫术。半个村子都听见了，亲属们要求当着证人讨回公道。"],
    scharwerk: ["磨坊堤坝", "洪水冲空了磨坊池塘的堤坝和小桥。有些贫户抱怨这只是磨坊主的事——可{a}警告说：没有蓄水，磨坊就不能为全村磨粮。按当地习俗，村里在此可能要出公役。"],
    pfingsten: ["公地上的圣灵降临节", "圣灵降临节时，村民们想在公地上开桶。提琴和风笛为圆圈舞伴奏时，几个年轻人想用弓和弩射木靶一较高下。"],
    lichtstube: ["纺纱屋", "草地上结着白霜。暖和的屋里，松明的光下纺车嗡嗡作响，纺着羊毛和亚麻。这时小伙子们带着提琴和笛子来敲门，请求进屋。"],
  },
  choices: {
    "zaun:buss": "邻里罚：三天内编好篱笆，请邻居喝一桶啤酒", "zaun:holz": "由村里提供柳条和木桩", "zaun:pfand": "让对方扣下牛作抵押，直到估定损失",
    "flur:schau": "查看田地：赔两斗粮，罚金入村库", "flur:hilfe": "年轻人帮忙在下雨前把粮食运进来",
    "plaggen:mass": "村社决议：每户十车，山坡休养两个夏天", "plaggen:laub": "允许到橡树林里耙落叶作垫草",
    "schelte:widerruf": "周日当着全教区公开收回", "schelte:spende": "神父调解，双方为祭坛蜡烛捐蜡",
    "scharwerk:aufgebot": "召集公役：每户有义务的人家出人手", "scharwerk:dingen": "用村库雇木匠、买木板",
    "pfingsten:preis": "捐一桶酒，给最好的射手戴花环", "pfingsten:reigen": "让节日自然进行",
    "lichtstube:reigen": "允许唱歌跳舞到晚钟", "lichtstube:andacht": "只纺纱、唱圣歌",
  },
  advice: {
    zaun: ["“篱笆牢不牢，全看编的人。让他自己动手。”", "“记住：今天扣人抵押的，明天还要求邻居。”"],
    flur: ["“田地是大家的，麦捆是各家的。不然谁也不信谁。”", "“快，趁雨还没来——湿粮在仓里会坏。”"],
    plaggen: ["“荒原长得比铲得慢。沙子拿走的，不会还回来。”", "“落叶也能垫圈——但别全拿走，林子也需要土。”"],
    schelte: ["“恶语说得快，记得久。必须当众收回。”", "“巫术的闲话不是儿戏。趁没传开先平息。”"],
    scharwerk: ["“大家都要用的，大家一起担。磨坊主一个人修不好堤。”", "“水冷——站在池里会发烧。雇的木匠更快。”"],
    pfingsten: ["“让年轻人热闹，但弩要离舞场远些。”", "“节日让村子团结——不花村库的钱也行。”"],
    lichtstube: ["“不少夫妻是在纺纱屋认识的。老人们会看着。”", "“长夜正好纺纱。唱首歌从没扯断过线。”"],
  },
  someone: ["一位邻居", "另一户人家"],
};

const ja: T = {
  events: {
    zaun: ["壊れた柵", "{a}は小川沿いの編み柵を新しい柳の枝で間に合うように直さなかった。{b}の牛が突き破り、若い夏麦を食べてしまった。いま二人は共有地で言い争っている。"],
    flur: ["刈り株の上の家畜", "水車道の畑には共通の決まりがある――すべての麦束を取り込むまで、家畜を刈り株に入れてはならない。だが{a}はもう牛を追い出し、{b}はまだ大麦を刈っている。"],
    plaggen: ["荒れ野の芝はぎ", "二つの農家が斜面の荒れ野をむき出しの砂まではぎ取った――家畜小屋の敷きわらとライ麦畑の肥料のためだ。いまや風が教会道に砂を吹き付けている。村から荒れ野の見張りを任された{a}が警告する。"],
    schelte: ["井戸端の悪口", "井戸端でけんかが起きた。{a}が大声で{b}を恥ずべき行いと魔術のかどで責めたのだ。村の半分が聞いており、親族は証人の前での償いを求めている。"],
    scharwerk: ["水車の堤", "洪水で水車池の堤と小橋の下がえぐられた。粉屋だけの仕事だと不平を言う者もいるが、{a}は警告する――水をせき止めなければ、水車は村の穀物をひけない。土地の慣習によっては、村はここで共同労働を負う。"],
    pfingsten: ["共有地の聖霊降臨祭", "聖霊降臨祭に、村人たちは共有地で樽を開けたいと言う。フィドルとバグパイプが輪舞を奏でるあいだ、何人かの若者が弓とクロスボウで木の的を競いたがっている。"],
    lichtstube: ["糸紡ぎ部屋", "牧草地に霜が降りている。暖かい部屋では松明の明かりのもと糸車が回り、羊毛と亜麻が紡がれる。そこへ若者たちがフィドルと笛を手に戸をたたき、入れてほしいと頼む。"],
  },
  choices: {
    "zaun:buss": "近所の罰：三日以内に柵を編み、近所にビールを一樽", "zaun:holz": "村から柳の枝と杭を出す", "zaun:pfand": "損害を見積もるまで牛を質に取らせる",
    "flur:schau": "畑の検分：穀物二升の弁償と村の金庫へ罰金", "flur:hilfe": "若者たちが雨の前に穀物の取り込みを手伝う",
    "plaggen:mass": "村の決め事：一戸十車まで、斜面は二夏休ませる", "plaggen:laub": "樫の森の落ち葉かきを許す",
    "schelte:widerruf": "日曜に教区の前で公に取り消させる", "schelte:spende": "司祭が仲裁し、双方が祭壇のろうそくに蝋を寄進",
    "scharwerk:aufgebot": "共同労働を呼びかける：義務のある家が人手を出す", "scharwerk:dingen": "村の金庫で大工と板を雇う",
    "pfingsten:preis": "ビールを一樽寄付し、一番の射手に花冠を", "pfingsten:reigen": "祭りは自然に任せる",
    "lichtstube:reigen": "夕べの鐘まで歌と輪舞を許す", "lichtstube:andacht": "糸紡ぎと賛美歌だけにする",
  },
  advice: {
    zaun: ["「柵は編む者しだい。本人に手を動かさせなさい。」", "「忘れないで。今日質を取る者も、明日は隣人を頼るのです。」"],
    flur: ["「畑はみんなのもの、麦束は各自のもの。でなければ誰も互いを信じません。」", "「急いで、雨の前に――濡れた穀物は納屋で傷みます。」"],
    plaggen: ["「荒れ野ははぐより遅く育ちます。砂が奪ったものは戻りません。」", "「落ち葉も敷きわらになります――でも全部はだめ、森にも土が要ります。」"],
    schelte: ["「悪口はすぐ言えて、長く覚えられます。皆の前で取り消させねば。」", "「魔術のうわさは遊びではありません。広まる前に鎮めなさい。」"],
    scharwerk: ["「皆が使うものは皆で担う。粉屋ひとりでは堤は直せません。」", "「水は冷たい――池に立てば熱を出します。雇った大工のほうが早いでしょう。」"],
    pfingsten: ["「若い者には楽しませなさい。でもクロスボウは踊りの場から離して。」", "「祭りは村をまとめます――金庫のお金がなくても。」"],
    lichtstube: ["「糸紡ぎ部屋で結ばれた夫婦はたくさんいます。年寄りが見ていますよ。」", "「長い夜は糸にいい。歌で糸が切れたことはありません。」"],
  },
  someone: ["近所の人", "よその家"],
};

export const LIFE_TEXT: Record<Lang, T> = { de, en, fr, es, ar, hi, zh, ja };
/** Fill the real villagers into a village-life text. */
export const fillLife = (text: string, a: string | null, b: string | null, lang: Lang) => {
  const s = (LIFE_TEXT[lang] ?? LIFE_TEXT.en).someone;
  return text.replace("{a}", a ?? s[0]).replace("{b}", b ?? s[1]);
};
