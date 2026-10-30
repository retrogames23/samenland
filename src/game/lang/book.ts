import type { Lang } from "../i18n";

/** Two-part guide: the one-time founding letter and the detailed "Book of the town". */
export type Book = {
  first: { title: string; rules: [string, string][]; go: string; more: string };
  title: string;
  chapters: [string, [string, string][]][];
};

const de: Book = {
  first: {
    title: "Willkommen in deinem Dorf!",
    rules: [
      ["Du pflanzt ein Dorf und schaust zu, wie es wächst.", "Du bist der Dorfschulze."],
      ["Du musst absolut nichts tun.", "Es wächst und gedeiht von ganz allein in Echtzeit – selbst wenn du gar nicht eingeloggt bist oder wochenlang nicht nachsiehst."],
      ["Wenn du zuschaust, kannst du lenken:", "Neue Gebäude in Auftrag geben, den täglichen Segen spenden und Entscheidungen treffen, wenn Reisende am Brunnen anklopfen."],
    ],
    go: "Das reicht mir, lass uns loslegen", more: "Erzähl mir mehr!",
  },
  title: "Das Buch der Stadt",
  chapters: [
    ["Die Grundregel", [["", "Samenland ist ein langsames Spiel in stetigem Echtzeit-Tempo. Du pflanzt deinen Ort und schaust ihm beim Wachsen zu. Es gibt keinen Klick-Zwang, keinen Verfall bei Abwesenheit und keinen Grind – das Land entfaltet sich von allein."]]],
    ["Weltzeit, Licht & Jahreszeiten", [
      ["Echtzeit nach Zeitzone", "Der Lauf der Sonne, Dämmerung und Nacht richten sich nach der Zeitzone deiner Spielwelt. Geht bei dir die Sonne unter, dämmert es auch über den Dächern. Nachts gehen warme Lichter in den Fenstern an und die Bewohner schlafen in ihren Betten."],
      ["Sonntagsruhe", "Jeden Sonntag ruht die schwere Arbeit. Die Bewohner legen ihr Werkzeug nieder und versammeln sich an der Kapelle oder auf dem Dorfplatz."],
      ["Frühling", "Tauwetter und blühende Wiesen."],
      ["Sommer", "Lange Tage und emsiges Treiben auf Feldern und Werkplätzen."],
      ["Herbst", "Die Haupternte füllt die Speicher; Getreideerträge erreichen ihren Jahreshöchstwert."],
      ["Winter", "Geschlossene Schneedecke, gefrorene Böden, kürzere Arbeitszeiten und erhöhter Bedarf an wärmenden Vorräten."],
    ]],
    ["Dorfentwicklung, Zuzug & Hochzeiten", [
      ["Vom Weiler zur Metropole", "Dein Ort wächst über Monate und Jahre durch sechs Epochen – von der ersten Rodung über Weiler und Kleinstadt bis zur weithin bekannten Handelsmetropole."],
      ["Wohnraum & Zuzug", "Mit dem Wachstum zimmern die Bauleute neue Häuser. Sobald ein Dach gerichtet ist, ziehen neue Familien mit Sack und Pack ein, bringen frische Arbeitskräfte ins Dorf und zahlen täglich Steuern."],
      ["Hochzeiten", "Wenn das Dorf heranwächst und junge Leute eine Familie gründen, läuten im Ort die Hochzeitsglocken. Das Brautpaar zieht feierlich zur Kirche und richtet seinen gemeinsamen Hausstand ein. Beide Familien stiften eine Mitgift in die Gemeindekasse, und das Fest schenkt dem Dorf Tage voller Freude und Zuversicht."],
    ]],
    ["Wege & der Handel zwischen Dörfern", [
      ["Pfade im Dorf", "Wege innerhalb des Ortes entstehen ganz von selbst. Wo Bewohner täglich zwischen Haustür, Brunnen, Acker und Werkstatt laufen, treten sie mit der Zeit sichtbare Trampelpfade und Gassen in den Boden."],
      ["Handelsstraßen nach außen", "Straßen zu Nachbardörfern entstehen dagegen nicht von allein. Du musst sie im Bau-Menü als Schulze förmlich beschließen. Der Bau dauert je nach Entfernung einige Stunden oder Tage. Baut das Nachbardorf von seiner Seite aus mit, halbiert sich die verbleibende Bauzeit."],
      ["Markttage & Fuhrwerke", "Steht die Straße, rollen Fuhrwerke, Wandergesellen kehren ein und samstags findet der gemeinsame Wochenmarkt statt."],
    ]],
    ["Ressourcen, Handwerk & wofür alles dient", [
      ["", "Du planst und beauftragst Bauten mit Talern aus der Schatzkammer. Rohstoffe musst du nicht selbst ansparen – die Dorfgemeinschaft gewinnt und verarbeitet sie im Alltag."],
      ["Nahrung", "Bauern ernten Garben, Mühlen mahlen Mehl und der Bäcker backt Brot; dazu kommen Fisch, Wildbret und Käse. Reichliche Vorräte und eine abwechslungsreiche Kost stärken die Gesundheit und den Wohlstand des Ortes."],
      ["Kornspeicher", "Getreide kann nicht endlos aufgehäuft werden. Mühlen und Kornspeicher erweitern die Lagerkapazität, damit reiche Herbst-Ernten nicht verderben, sondern das Dorf durch den Winter bringen."],
      ["Holz & Werkstoffe", "Holzfäller schlagen Stämme, Sägewerke schneiden Balken und Steinmetze hauen Quader. Steht ein Holzfällerlager im Ort oder grenzt Wald an dein Dorf, haben Bauleute stets Bauholz zur Hand – neue Gebäude werden spürbar schneller fertiggestellt."],
      ["Heilkräuter", "Die Kräuterfrau sammelt Wurzeln und Blüten im Unterholz, damit der Heiler kranke Dorfbewohner versorgen kann und Ausfälle verringert werden."],
      ["Handelsgüter & Wolle", "Was dein Umland im Überfluss hervorbringt, wird zum gefragten Exportgut. Dörfer in der Ebene liefern Wolle, Bergdörfer Stein und Erz, Waldorte Bauholz und Küstenorte Fisch und Salz. Treffen auf Handelsstraßen unterschiedliche Güter aufeinander, entsteht eine dauerhafte Synergie, die beiden Orten zusätzlichen Wohlstand bringt."],
    ]],
    ["Schatzkammer, Gesundheit & Katastrophen", [
      ["Schatzkammer", "Einfache Bürger tragen täglich einen Taler zur Steuer bei, Facharbeiter zwei und wohlhabende Bürger drei. Dauerhafter Wohlstand durch Bildung, Zünfte und Prestigebauten lässt mehr Haushalte aufsteigen: Ihre Häuser werden prächtiger und deine Steuereinnahmen steigen. Kurzzeitige Vorratsboni bedeuten dagegen keinen dauerhaften sozialen Aufstieg. Damit finanzierst du neue Gebäude und Schutzbauten."],
      ["Gesundheit", "Kranke Bewohner fallen bei der Arbeit aus, und Angehörige müssen sie pflegen. Frisches Brunnenwasser, Kräuterhütten und Arzneihäuser senken Krankheitsausfälle spürbar."],
      ["Schutz vor Unheil", "Brände und Räuberbanden stellen das Dorf auf die Probe. Spritzenhäuser löschen Brände rasch, und eine Stadtgarde schlägt Plünderer in die Flucht. Hochwasser an Flüssen überschwemmt im Frühjahr und Herbst vorübergehend Uferwiesen, hinterlässt danach jedoch besonders fruchtbaren Boden."],
    ]],
  ],
};

const en: Book = {
  first: {
    title: "Welcome to your village!",
    rules: [
      ["You plant a village and watch it grow.", "You are the village headman."],
      ["You don't have to do anything at all.", "It grows and thrives on its own in real time – even when you're not signed in or don't look for weeks."],
      ["When you watch, you can steer:", "Commission new buildings, give the daily blessing and make decisions when travellers knock at the well."],
    ],
    go: "That's enough, let's go", more: "Tell me more!",
  },
  title: "The Book of the Town",
  chapters: [
    ["The ground rule", [["", "Samenland is a slow game at a steady real-time pace. You plant your settlement and watch it grow. There is no clicking pressure, no decay while you're away and no grind – the land unfolds by itself."]]],
    ["World time, light & seasons", [
      ["Real time by time zone", "Sunrise, dusk and night follow the time zone of your world. When the sun sets for you, dusk falls over the roofs too. At night warm lights glow in the windows and the villagers sleep in their beds."],
      ["Sunday rest", "Every Sunday heavy work rests. The villagers lay down their tools and gather at the chapel or on the village square."],
      ["Spring", "Thaw and blooming meadows."],
      ["Summer", "Long days and busy bustle on fields and workyards."],
      ["Autumn", "The main harvest fills the stores; grain yields reach their yearly peak."],
      ["Winter", "Closed snow cover, frozen ground, shorter working hours and a greater need for warming supplies."],
    ]],
    ["Growth, newcomers & weddings", [
      ["From hamlet to metropolis", "Your settlement grows over months and years through six eras – from the first clearing via hamlet and small town to a far-famed trading metropolis."],
      ["Homes & newcomers", "As it grows, the builders raise new houses. As soon as a roof is up, new families move in with all their belongings, bring fresh hands to the village and pay taxes every day."],
      ["Weddings", "As the village grows and young people start families, the wedding bells ring. The couple walks solemnly to church and sets up their shared home. Both families give a dowry to the village chest, and the feast brings the village days of joy and confidence."],
    ]],
    ["Roads & trade between villages", [
      ["Paths in the village", "Paths inside the settlement appear by themselves. Where villagers walk daily between door, well, field and workshop, they tread visible trails and lanes into the ground over time."],
      ["Trade roads to the outside", "Roads to neighbouring villages, however, don't appear by themselves. As headman you must formally decide on them in the build menu. Building takes a few hours or days depending on distance. If the neighbour builds from their side too, the remaining time is halved."],
      ["Market days & carts", "Once the road stands, carts roll, journeymen stop by and on Saturdays the shared weekly market takes place."],
    ]],
    ["Resources, crafts & what they're for", [
      ["", "You plan and commission buildings with taler from the treasury. You never have to stockpile raw materials – the village community gathers and processes them in daily life."],
      ["Food", "Farmers harvest sheaves, mills grind flour and the baker bakes bread; fish, venison and cheese join them. Ample stores and a varied diet strengthen the health and prosperity of the village."],
      ["Granary", "Grain cannot be heaped up endlessly. Mills and granaries add storage so rich autumn harvests don't spoil but carry the village through winter."],
      ["Wood & building materials", "Woodcutters fell trunks, sawmills cut beams and masons hew blocks. With a woodcutters' camp in the village or forest nearby, builders always have timber at hand – new buildings are finished noticeably faster."],
      ["Healing herbs", "The herb woman gathers roots and blossoms in the undergrowth so the healer can tend sick villagers and fewer fall out of work."],
      ["Trade goods & wool", "What your land yields in plenty becomes a sought-after export. Lowland villages supply wool, mountain villages stone and ore, forest villages timber and coastal villages fish and salt. Where different goods meet on trade roads, a lasting synergy brings both places extra prosperity."],
    ]],
    ["Treasury, health & disasters", [
      ["Treasury", "Ordinary citizens contribute one taler a day, skilled workers two and wealthy citizens three. Lasting prosperity from education, guilds and prestige buildings promotes more households: their homes become grander and your tax income rises. Temporary stock bonuses do not cause lasting social promotion. Taxes fund new buildings and protection."],
      ["Health", "Sick villagers miss work, and relatives must nurse them. Fresh well water, herb huts and infirmaries noticeably reduce sick days."],
      ["Protection from harm", "Fires and robber bands put the village to the test. Fire houses put out fires quickly and a town guard drives off looters. Floods on rivers briefly swamp the shore meadows in spring and autumn, but leave especially fertile soil behind."],
    ]],
  ],
};

const fr: Book = {
  first: {
    title: "Bienvenue dans ton village !",
    rules: [
      ["Tu plantes un village et tu le regardes grandir.", "Tu es le bourgmestre."],
      ["Tu n'as absolument rien à faire.", "Il grandit et prospère tout seul en temps réel – même quand tu n'es pas connecté ou que tu ne viens pas pendant des semaines."],
      ["Quand tu regardes, tu peux guider :", "Commander de nouveaux bâtiments, donner la bénédiction du jour et prendre des décisions quand des voyageurs frappent au puits."],
    ],
    go: "Ça me suffit, allons-y", more: "Raconte-m'en plus !",
  },
  title: "Le livre de la cité",
  chapters: [
    ["La règle de base", [["", "Samenland est un jeu lent, au rythme constant du temps réel. Tu plantes ton village et tu le regardes grandir. Pas d'obligation de cliquer, pas de déclin en ton absence, pas de corvée – le pays se déploie de lui-même."]]],
    ["Heure du monde, lumière & saisons", [
      ["Temps réel selon le fuseau", "Le cours du soleil, le crépuscule et la nuit suivent le fuseau horaire de ton monde. Quand le soleil se couche chez toi, le soir tombe aussi sur les toits. La nuit, de chaudes lumières brillent aux fenêtres et les habitants dorment dans leurs lits."],
      ["Repos dominical", "Chaque dimanche, le gros travail cesse. Les habitants posent leurs outils et se rassemblent à la chapelle ou sur la place du village."],
      ["Printemps", "Dégel et prés en fleurs."],
      ["Été", "Longues journées et activité intense aux champs et aux ateliers."],
      ["Automne", "La grande moisson remplit les greniers ; les rendements en grain atteignent leur sommet de l'année."],
      ["Hiver", "Neige épaisse, sol gelé, journées de travail plus courtes et besoin accru de provisions."],
    ]],
    ["Croissance, nouveaux venus & mariages", [
      ["Du hameau à la métropole", "Ton village grandit au fil des mois et des années à travers six époques – du premier défrichage au hameau, à la petite ville puis à la célèbre métropole marchande."],
      ["Logis & nouveaux venus", "Avec la croissance, les bâtisseurs élèvent de nouvelles maisons. Dès qu'un toit est posé, de nouvelles familles emménagent avec armes et bagages, apportent des bras au village et paient l'impôt chaque jour."],
      ["Mariages", "Quand le village grandit et que des jeunes fondent une famille, les cloches des noces sonnent. Les mariés vont solennellement à l'église et fondent leur foyer. Les deux familles versent une dot au trésor commun, et la fête offre au village des jours de joie et de confiance."],
    ]],
    ["Chemins & commerce entre villages", [
      ["Sentiers du village", "Les chemins dans le village apparaissent d'eux-mêmes. Là où les habitants marchent chaque jour entre porte, puits, champ et atelier, ils tracent peu à peu des sentiers et des ruelles visibles."],
      ["Routes commerciales", "Les routes vers les villages voisins, elles, n'apparaissent pas seules. En tant que bourgmestre, tu dois les décider officiellement dans le menu de construction. Les travaux durent quelques heures ou jours selon la distance. Si le voisin construit aussi de son côté, le temps restant est divisé par deux."],
      ["Jours de marché & charrettes", "Une fois la route achevée, des charrettes roulent, des compagnons font halte et le samedi se tient le marché hebdomadaire commun."],
    ]],
    ["Ressources, artisanat & à quoi tout sert", [
      ["", "Tu planifies et commandes les bâtiments avec les talers du trésor. Inutile d'amasser des matières premières – la communauté les récolte et les transforme au quotidien."],
      ["Nourriture", "Les paysans récoltent des gerbes, les moulins moulent la farine et le boulanger cuit le pain ; s'y ajoutent poisson, gibier et fromage. Des réserves abondantes et une table variée renforcent la santé et la prospérité du village."],
      ["Grenier", "Le grain ne peut s'entasser sans fin. Moulins et greniers augmentent la capacité, pour que les riches moissons d'automne ne se gâtent pas mais portent le village à travers l'hiver."],
      ["Bois & matériaux", "Les bûcherons abattent des troncs, les scieries taillent des poutres et les tailleurs de pierre des moellons. Avec un camp de bûcherons ou une forêt proche, les bâtisseurs ont toujours du bois sous la main – les nouveaux bâtiments sont achevés nettement plus vite."],
      ["Herbes médicinales", "L'herboriste cueille racines et fleurs dans les sous-bois, afin que le guérisseur soigne les malades et que les absences diminuent."],
      ["Marchandises & laine", "Ce que ta contrée produit en abondance devient une exportation recherchée. Les villages de plaine fournissent la laine, ceux des montagnes la pierre et le minerai, ceux des forêts le bois et ceux des côtes le poisson et le sel. Quand des biens différents se rencontrent sur les routes, une synergie durable apporte aux deux lieux une prospérité accrue."],
    ]],
    ["Trésor, santé & catastrophes", [
      ["Trésor", "Les citoyens modestes contribuent un thaler par jour, les ouvriers qualifiés deux et les citoyens aisés trois. La prospérité durable issue de l'éducation, des guildes et des monuments fait progresser les foyers : leurs maisons deviennent plus belles et tes recettes augmentent. Les bonus temporaires de réserves ne créent pas d'ascension durable. Les impôts financent les bâtiments et la protection."],
      ["Santé", "Les malades manquent au travail et des proches doivent les soigner. L'eau fraîche du puits, les huttes d'herboriste et les infirmeries réduisent nettement les absences."],
      ["Protection contre les malheurs", "Incendies et bandes de brigands mettent le village à l'épreuve. Les maisons des pompiers éteignent vite les feux et une garde chasse les pillards. Au printemps et à l'automne, les crues inondent un temps les prés riverains, mais laissent ensuite une terre particulièrement fertile."],
    ]],
  ],
};

const es: Book = {
  first: {
    title: "¡Bienvenido a tu aldea!",
    rules: [
      ["Plantas una aldea y la ves crecer.", "Tú eres el alcalde."],
      ["No tienes que hacer absolutamente nada.", "Crece y prospera sola en tiempo real, incluso si no inicias sesión o no la miras durante semanas."],
      ["Cuando miras, puedes guiarla:", "Encargar nuevos edificios, dar la bendición diaria y tomar decisiones cuando los viajeros llaman junto al pozo."],
    ],
    go: "Me basta, empecemos", more: "¡Cuéntame más!",
  },
  title: "El libro de la villa",
  chapters: [
    ["La regla básica", [["", "Samenland es un juego lento, al ritmo constante del tiempo real. Plantas tu aldea y la ves crecer. No hay obligación de hacer clic, no hay decadencia en tu ausencia ni rutina pesada: la tierra se despliega sola."]]],
    ["Hora del mundo, luz y estaciones", [
      ["Tiempo real según zona horaria", "El curso del sol, el ocaso y la noche siguen la zona horaria de tu mundo. Cuando el sol se pone para ti, también anochece sobre los tejados. De noche brillan luces cálidas en las ventanas y los aldeanos duermen en sus camas."],
      ["Descanso dominical", "Cada domingo descansa el trabajo pesado. Los aldeanos dejan sus herramientas y se reúnen en la capilla o en la plaza."],
      ["Primavera", "Deshielo y prados en flor."],
      ["Verano", "Días largos y gran ajetreo en campos y talleres."],
      ["Otoño", "La gran cosecha llena los graneros; el grano alcanza su máximo del año."],
      ["Invierno", "Nieve espesa, suelo helado, jornadas más cortas y mayor necesidad de provisiones."],
    ]],
    ["Crecimiento, recién llegados y bodas", [
      ["De caserío a metrópoli", "Tu aldea crece durante meses y años a través de seis épocas: desde el primer claro, pasando por caserío y villa, hasta una célebre metrópoli comercial."],
      ["Viviendas y recién llegados", "Con el crecimiento, los constructores levantan casas nuevas. En cuanto se pone un tejado, llegan familias con todos sus enseres, traen brazos a la aldea y pagan impuestos cada día."],
      ["Bodas", "Cuando la aldea crece y los jóvenes forman familia, repican las campanas de boda. Los novios van solemnes a la iglesia y fundan su hogar. Ambas familias aportan una dote a la caja común, y la fiesta regala a la aldea días de alegría y confianza."],
    ]],
    ["Caminos y comercio entre aldeas", [
      ["Senderos en la aldea", "Los caminos dentro de la aldea surgen solos. Donde los aldeanos andan a diario entre puerta, pozo, campo y taller, con el tiempo marcan senderos y callejas visibles."],
      ["Caminos comerciales", "Los caminos hacia aldeas vecinas, en cambio, no surgen solos. Como alcalde debes acordarlos en el menú de construcción. La obra dura unas horas o días según la distancia. Si el vecino también construye desde su lado, el tiempo restante se reduce a la mitad."],
      ["Días de mercado y carretas", "Terminado el camino, ruedan carretas, pasan oficiales andariegos y los sábados se celebra el mercado semanal común."],
    ]],
    ["Recursos, oficios y para qué sirve todo", [
      ["", "Planificas y encargas edificios con táleros del tesoro. No tienes que acumular materias primas: la comunidad las obtiene y transforma en su día a día."],
      ["Comida", "Los campesinos cosechan gavillas, los molinos muelen harina y el panadero hornea pan; además hay pescado, caza y queso. Despensas llenas y una dieta variada fortalecen la salud y la prosperidad de la aldea."],
      ["Granero", "El grano no puede amontonarse sin fin. Molinos y graneros amplían la capacidad para que las ricas cosechas de otoño no se pierdan y lleven la aldea a través del invierno."],
      ["Madera y materiales", "Los leñadores talan troncos, los aserraderos cortan vigas y los canteros labran sillares. Con un campamento de leñadores o un bosque cercano, los constructores siempre tienen madera a mano y los edificios se terminan bastante más rápido."],
      ["Hierbas medicinales", "La herbolaria recoge raíces y flores en el sotobosque para que el sanador atienda a los enfermos y haya menos ausencias."],
      ["Mercancías y lana", "Lo que tu comarca produce en abundancia se convierte en codiciada exportación. Las aldeas del llano dan lana, las de montaña piedra y mineral, las del bosque madera y las costeras pescado y sal. Cuando bienes distintos se encuentran en los caminos, surge una sinergia duradera que da más prosperidad a ambos lugares."],
    ]],
    ["Tesoro, salud y desastres", [
      ["Tesoro", "Los ciudadanos humildes contribuyen un tálero al día, los trabajadores cualificados dos y los ciudadanos acomodados tres. La prosperidad duradera de la educación, los gremios y los monumentos permite ascender a más hogares: sus casas mejoran y tus ingresos aumentan. Las reservas temporales no crean un ascenso permanente. Los impuestos financian edificios y protección."],
      ["Salud", "Los enfermos faltan al trabajo y sus familiares deben cuidarlos. El agua fresca del pozo, las chozas de hierbas y los hospitales reducen mucho las ausencias."],
      ["Protección contra desgracias", "Incendios y bandas de ladrones ponen a prueba la aldea. Las casas de bomberos apagan pronto los fuegos y una guardia ahuyenta a los saqueadores. En primavera y otoño las crecidas inundan por un tiempo los prados ribereños, pero después dejan una tierra especialmente fértil."],
    ]],
  ],
};

const ar: Book = {
  first: {
    title: "مرحباً بك في قريتك!",
    rules: [
      ["تغرس قرية وتشاهدها تنمو.", "أنت شيخ القرية."],
      ["لا يلزمك فعل أي شيء على الإطلاق.", "تنمو وتزدهر وحدها في الزمن الحقيقي، حتى إن لم تسجّل الدخول أو غبت عنها أسابيع."],
      ["حين تشاهد، يمكنك التوجيه:", "تكليف ببناء مبانٍ جديدة، ومنح البركة اليومية، واتخاذ القرارات حين يطرق المسافرون عند البئر."],
    ],
    go: "يكفيني هذا، لنبدأ", more: "أخبرني بالمزيد!",
  },
  title: "كتاب البلدة",
  chapters: [
    ["القاعدة الأساسية", [["", "سامنلاند لعبة هادئة تسير بإيقاع ثابت في الزمن الحقيقي. تغرس بلدتك وتشاهدها تنمو. لا إلزام بالنقر، ولا اضمحلال في غيابك، ولا عناء متكرر؛ الأرض تتفتح من تلقاء نفسها."]]],
    ["زمن العالم والضوء والفصول", [
      ["زمن حقيقي حسب المنطقة الزمنية", "شروق الشمس والغسق والليل تتبع المنطقة الزمنية لعالمك. حين تغرب الشمس عندك يحل المساء فوق السطوح أيضاً. وفي الليل تتوهج أضواء دافئة في النوافذ وينام الأهالي في أسرّتهم."],
      ["راحة الأحد", "في كل أحد يتوقف العمل الشاق. يضع الأهالي أدواتهم ويجتمعون عند المصلى أو في ساحة القرية."],
      ["الربيع", "ذوبان الثلج ومروج مزهرة."],
      ["الصيف", "أيام طويلة ونشاط حثيث في الحقول والورش."],
      ["الخريف", "الحصاد الكبير يملأ المخازن، ويبلغ محصول الحبوب ذروته في العام."],
      ["الشتاء", "غطاء ثلجي كثيف وأرض متجمدة وساعات عمل أقصر وحاجة أكبر إلى المؤن."],
    ]],
    ["النمو والوافدون والأعراس", [
      ["من نجع إلى حاضرة", "تنمو بلدتك عبر الشهور والسنين خلال ست حقب، من أول أرض مستصلحة إلى نجع فبلدة صغيرة حتى حاضرة تجارية ذائعة الصيت."],
      ["المساكن والوافدون", "مع النمو يشيّد البناؤون بيوتاً جديدة. وما إن يُرفع سقف حتى تحل عائلات جديدة بمتاعها، فتجلب سواعد جديدة إلى القرية وتدفع الضرائب كل يوم."],
      ["الأعراس", "حين تكبر القرية ويؤسس الشباب أسراً تُقرع أجراس الزفاف. يمضي العروسان في موكب إلى الكنيسة ويقيمان بيتهما المشترك. وتقدم العائلتان مهراً لخزينة القرية، ويهب العرس القرية أياماً من الفرح والطمأنينة."],
    ]],
    ["الطرق والتجارة بين القرى", [
      ["الدروب داخل القرية", "تنشأ الدروب داخل البلدة من تلقاء نفسها. فحيث يمشي الأهالي يومياً بين الباب والبئر والحقل والورشة، تنطبع مع الوقت دروب وأزقة ظاهرة."],
      ["طرق التجارة إلى الخارج", "أما الطرق إلى القرى المجاورة فلا تنشأ وحدها. عليك بصفتك شيخ القرية أن تقرّها رسمياً في قائمة البناء. يستغرق البناء ساعات أو أياماً حسب المسافة. وإن بنى الجار من جهته أيضاً، انتصف الوقت المتبقي."],
      ["أيام السوق والعربات", "متى اكتمل الطريق سارت العربات، ونزل الحرفيون الجوّالون، وأقيم كل سبت السوق الأسبوعي المشترك."],
    ]],
    ["الموارد والحِرف وفائدة كل شيء", [
      ["", "تخطط للمباني وتكلّف ببنائها بالتالرات من الخزينة. لا داعي لادخار المواد الخام بنفسك، فالأهالي يجمعونها ويصنعونها في حياتهم اليومية."],
      ["الطعام", "يحصد الفلاحون الحزم، وتطحن المطاحن الدقيق، ويخبز الخباز الخبز، ويضاف إليها السمك والطرائد والجبن. المؤن الوفيرة والغذاء المتنوع يعززان صحة البلدة ورخاءها."],
      ["مخزن الحبوب", "لا يمكن تكديس الحبوب بلا حد. المطاحن ومخازن الحبوب توسّع السعة كي لا يفسد حصاد الخريف الوفير بل يعبر بالقرية الشتاء."],
      ["الخشب ومواد البناء", "يقطع الحطابون الجذوع، وتنشر المناشر العوارض، وينحت النحاتون الحجارة. ومع معسكر للحطابين أو غابة قريبة يجد البناؤون الخشب دائماً، فتكتمل المباني الجديدة أسرع بوضوح."],
      ["الأعشاب الطبية", "تجمع العشّابة الجذور والأزهار في الأحراش ليعالج المداوي المرضى وتقل حالات الغياب."],
      ["السلع والصوف", "ما تجود به أرضك بوفرة يصبح سلعة تصدير مطلوبة. قرى السهول تقدم الصوف، وقرى الجبال الحجر والخام، وقرى الغابات الخشب، وقرى الساحل السمك والملح. وحين تلتقي سلع مختلفة على طرق التجارة ينشأ تآزر دائم يمنح البلدتين رخاءً إضافياً."],
    ]],
    ["الخزينة والصحة والكوارث", [
      ["الخزينة", "يساهم المواطن البسيط بتالر يوميًا، والعامل الماهر بتالرَين، والمواطن الميسور بثلاثة. الرخاء الدائم الناتج عن التعليم والنقابات والمباني المرموقة يرفع مكانة مزيد من الأسر، فتصبح بيوتها أجمل وتزداد إيراداتك. مكافآت المؤن المؤقتة لا تمنح ترقية اجتماعية دائمة. الضرائب تموّل المباني والحماية."],
      ["الصحة", "يتغيب المرضى عن العمل، ويضطر أقاربهم إلى رعايتهم. ماء البئر العذب وأكواخ الأعشاب ودور التطبيب تقلل الغياب بوضوح."],
      ["الحماية من المصائب", "الحرائق وعصابات اللصوص تمتحن القرية. دور الإطفاء تخمد النيران سريعاً، وحرس البلدة يطرد الناهبين. وفي الربيع والخريف تغمر فيضانات الأنهار مروج الضفاف مؤقتاً، لكنها تخلّف بعدها تربة خصبة على نحو خاص."],
    ]],
  ],
};

const hi: Book = {
  first: {
    title: "अपने गाँव में स्वागत है!",
    rules: [
      ["तुम एक गाँव बोते हो और उसे बढ़ता देखते हो।", "तुम गाँव के प्रधान हो।"],
      ["तुम्हें बिल्कुल कुछ नहीं करना है।", "यह असली समय में अपने आप बढ़ता और फलता-फूलता है – तब भी जब तुम लॉग इन न हो या हफ़्तों तक न देखो।"],
      ["जब तुम देखते हो, तो दिशा दे सकते हो:", "नई इमारतें बनवाओ, रोज़ का आशीर्वाद दो और फ़ैसले करो जब यात्री कुएँ पर दस्तक दें।"],
    ],
    go: "इतना काफ़ी है, चलो शुरू करें", more: "मुझे और बताओ!",
  },
  title: "नगर की पुस्तक",
  chapters: [
    ["मूल नियम", [["", "Samenland असली समय की स्थिर गति वाला धीमा खेल है। तुम अपनी बस्ती बोते हो और उसे बढ़ता देखते हो। न क्लिक की मजबूरी, न अनुपस्थिति में पतन, न थकाऊ दोहराव – धरती अपने आप खिलती है।"]]],
    ["विश्व-समय, प्रकाश और ऋतुएँ", [
      ["समय-क्षेत्र के अनुसार असली समय", "सूरज का चढ़ना, संध्या और रात तुम्हारी दुनिया के समय-क्षेत्र के अनुसार चलते हैं। जब तुम्हारे यहाँ सूरज ढलता है, छतों पर भी शाम उतरती है। रात में खिड़कियों में गर्म रोशनी जलती है और ग्रामीण अपने बिस्तरों में सोते हैं।"],
      ["रविवार का विश्राम", "हर रविवार भारी काम रुकता है। ग्रामीण औज़ार रखकर प्रार्थनाघर या गाँव के चौक पर इकट्ठा होते हैं।"],
      ["वसंत", "बर्फ़ पिघलती है और घास के मैदान खिलते हैं।"],
      ["ग्रीष्म", "लंबे दिन और खेतों व कार्यशालाओं में भरपूर चहल-पहल।"],
      ["शरद", "मुख्य फ़सल भंडार भरती है; अनाज की उपज साल के शिखर पर होती है।"],
      ["शीत", "बर्फ़ की घनी चादर, जमी धरती, छोटे काम के घंटे और गर्म रखने वाली रसद की अधिक ज़रूरत।"],
    ]],
    ["विकास, नए लोग और विवाह", [
      ["पुरवे से महानगर तक", "तुम्हारी बस्ती महीनों और वर्षों में छह युगों से गुज़रती है – पहली साफ़ की गई ज़मीन से पुरवा, कस्बा और फिर दूर-दूर तक प्रसिद्ध व्यापारिक महानगर तक।"],
      ["घर और नए लोग", "विकास के साथ कारीगर नए घर बनाते हैं। जैसे ही छत चढ़ती है, नए परिवार सारे सामान के साथ आ बसते हैं, गाँव को नए हाथ देते हैं और रोज़ कर चुकाते हैं।"],
      ["विवाह", "जब गाँव बढ़ता है और युवा परिवार बसाते हैं, विवाह की घंटियाँ बजती हैं। वर-वधू शान से गिरजे तक जाते हैं और अपना साझा घर बसाते हैं। दोनों परिवार गाँव के कोष में दहेज देते हैं, और उत्सव गाँव को आनंद और भरोसे के दिन देता है।"],
    ]],
    ["रास्ते और गाँवों के बीच व्यापार", [
      ["गाँव की पगडंडियाँ", "बस्ती के भीतर के रास्ते अपने आप बनते हैं। जहाँ ग्रामीण रोज़ दरवाज़े, कुएँ, खेत और कार्यशाला के बीच चलते हैं, वहाँ समय के साथ दिखने वाली पगडंडियाँ और गलियाँ बन जाती हैं।"],
      ["बाहर के व्यापार-मार्ग", "पड़ोसी गाँवों तक की सड़कें अपने आप नहीं बनतीं। प्रधान के रूप में तुम्हें निर्माण-मेनू में उनका औपचारिक निर्णय लेना होता है। दूरी के अनुसार निर्माण कुछ घंटे या दिन लेता है। अगर पड़ोसी भी अपनी ओर से बनाए, तो बचा समय आधा हो जाता है।"],
      ["हाट के दिन और गाड़ियाँ", "सड़क बनते ही गाड़ियाँ चलती हैं, घुमंतू कारीगर रुकते हैं और हर शनिवार साझा साप्ताहिक हाट लगता है।"],
    ]],
    ["संसाधन, शिल्प और किसका क्या उपयोग", [
      ["", "तुम कोष के Taler से इमारतों की योजना बनाते और उन्हें बनवाते हो। कच्चा माल ख़ुद जमा करने की ज़रूरत नहीं – गाँव का समुदाय रोज़मर्रा में उसे जुटाता और तैयार करता है।"],
      ["भोजन", "किसान पूले काटते हैं, चक्कियाँ आटा पीसती हैं और नानबाई रोटी पकाता है; साथ में मछली, शिकार और पनीर। भरे भंडार और विविध भोजन गाँव के स्वास्थ्य और समृद्धि को बढ़ाते हैं।"],
      ["अन्न-भंडार", "अनाज अनंत तक नहीं जमा हो सकता। चक्कियाँ और अन्न-भंडार क्षमता बढ़ाते हैं, ताकि शरद की भरपूर फ़सल ख़राब न हो बल्कि गाँव को सर्दी पार कराए।"],
      ["लकड़ी और निर्माण-सामग्री", "लकड़हारे तने काटते हैं, आरा-मिलें शहतीर चीरती हैं और संगतराश पत्थर गढ़ते हैं। गाँव में लकड़हारों का डेरा हो या पास में जंगल हो, तो कारीगरों के पास हमेशा लकड़ी रहती है – नई इमारतें काफ़ी जल्दी पूरी होती हैं।"],
      ["औषधीय जड़ी-बूटियाँ", "जड़ी-बूटी वाली झाड़ियों में जड़ें और फूल चुनती है, ताकि वैद्य बीमारों का इलाज करे और काम से ग़ैरहाज़िरी घटे।"],
      ["व्यापारिक माल और ऊन", "जो तुम्हारा इलाक़ा भरपूर देता है, वह माँग वाला निर्यात बनता है। मैदानी गाँव ऊन देते हैं, पहाड़ी गाँव पत्थर और कच्चा लोहा, जंगल के गाँव लकड़ी और तटीय गाँव मछली और नमक। जब व्यापार-मार्गों पर अलग-अलग माल मिलते हैं, तो एक स्थायी तालमेल दोनों जगहों को अतिरिक्त समृद्धि देता है।"],
    ]],
    ["कोष, स्वास्थ्य और आपदाएँ", [
      ["कोष", "साधारण नागरिक रोज़ एक टालर, कुशल कामगार दो और समृद्ध नागरिक तीन का कर योगदान देते हैं। शिक्षा, श्रेणियों और प्रतिष्ठित इमारतों की स्थायी समृद्धि अधिक परिवारों को ऊपर उठाती है: उनके घर सुंदर होते हैं और तुम्हारी आय बढ़ती है। अस्थायी भंडार बोनस स्थायी सामाजिक उन्नति नहीं देते। कर से इमारतें और सुरक्षा मिलती हैं।"],
      ["स्वास्थ्य", "बीमार ग्रामीण काम पर नहीं जा पाते, और परिजनों को उनकी देखभाल करनी पड़ती है। कुएँ का ताज़ा पानी, जड़ी-बूटी की झोपड़ियाँ और औषधालय बीमारी की ग़ैरहाज़िरी काफ़ी घटाते हैं।"],
      ["विपदा से रक्षा", "आग और लुटेरों के गिरोह गाँव की परीक्षा लेते हैं। अग्नि-भवन आग जल्दी बुझाते हैं और नगर-रक्षक लुटेरों को भगाते हैं। वसंत और शरद में नदियों की बाढ़ कुछ समय के लिए तट के मैदान डुबोती है, पर बाद में विशेष उपजाऊ मिट्टी छोड़ जाती है।"],
    ]],
  ],
};

const zh: Book = {
  first: {
    title: "欢迎来到你的村庄！",
    rules: [
      ["你种下一座村庄，看着它成长。", "你就是村长。"],
      ["你完全不必做任何事。", "它会在真实时间里自行成长、兴旺——即使你没有登录，或几周都不来看。"],
      ["当你旁观时，可以引导它：", "委托建造新建筑、赐予每日祝福，并在旅人来到井边敲门时作出决定。"],
    ],
    go: "这就够了，开始吧", more: "再多讲讲！",
  },
  title: "城镇之书",
  chapters: [
    ["基本法则", [["", "Samenland是一款节奏缓慢、按真实时间稳步推进的游戏。你种下聚落，看着它成长。没有点击压力，离开时不会衰败，也没有重复苦工——大地自会舒展。"]]],
    ["世界时间、光影与四季", [
      ["随时区的真实时间", "日出、黄昏与夜晚随你所在世界的时区而定。你那里日落时，屋顶上也暮色降临。夜里窗中亮起温暖的灯光，村民们在床上安睡。"],
      ["主日休息", "每逢周日，繁重的劳作停歇。村民放下工具，聚到小教堂或村中广场。"],
      ["春", "冰雪消融，草地开花。"],
      ["夏", "白昼漫长，田间与作坊一片忙碌。"],
      ["秋", "大丰收填满仓库，谷物产量达到全年顶峰。"],
      ["冬", "积雪覆盖，土地冰冻，劳作时间缩短，对御寒储备的需求增加。"],
    ]],
    ["成长、新居民与婚礼", [
      ["从小村落到大都会", "你的聚落历经数月数年，穿越六个时代——从最初的开垦，到小村落、小镇，直至远近闻名的商贸大都会。"],
      ["住房与新居民", "随着成长，工匠们建起新房。屋顶一落成，新家庭就带着全部家当搬入，为村庄带来新的人手，并每天缴税。"],
      ["婚礼", "当村庄成长、年轻人成家时，婚礼的钟声便会响起。新人庄重地走向教堂，建立共同的家。两家向村库献上嫁妆，喜宴为村庄带来充满欢乐与信心的日子。"],
    ]],
    ["道路与村庄间的贸易", [
      ["村中小路", "聚落内的道路会自行形成。村民每天在家门、水井、田地和作坊之间往来之处，久而久之便踩出清晰的小径与街巷。"],
      ["对外商路", "通往邻村的道路则不会自行出现。身为村长，你必须在建造菜单中正式决定修建。工期视距离而定，需要数小时或数天。若邻村也从另一端一起修，剩余工期减半。"],
      ["集市日与马车", "道路建成后，马车往来，游历帮工前来歇脚，每逢周六举行共同的周集。"],
    ]],
    ["资源、手艺与用途", [
      ["", "你用金库中的塔勒来规划和委托建筑。原料无需你亲自囤积——村民们在日常生活中自行采集和加工。"],
      ["食物", "农夫收割麦捆，磨坊磨面，面包师烤面包；还有鱼、野味和奶酪。充足的储备与多样的饮食会增进村庄的健康与繁荣。"],
      ["粮仓", "谷物不能无限堆积。磨坊和粮仓扩充储量，让秋天的丰收不会腐坏，而能帮村庄度过寒冬。"],
      ["木材与建材", "樵夫伐木，锯木坊锯出梁木，石匠凿出石块。村里有樵夫营地或附近有森林时，工匠们随时有木料可用——新建筑会明显更快完工。"],
      ["草药", "草药婆在林下采集根茎与花朵，好让医者照料病人，减少误工。"],
      ["商货与羊毛", "你的乡土所盛产之物会成为抢手的出口货。平原村庄出产羊毛，山村出产石料与矿石，林村出产木材，海滨村庄出产鱼和盐。当不同货物在商路上相遇，便会形成持久的互补，为两地带来额外的繁荣。"],
    ]],
    ["金库、健康与灾害", [
      ["金库", "普通居民每天贡献一塔勒税金，熟练工匠两塔勒，富裕市民三塔勒。教育、行会和宏伟建筑带来的持久繁荣让更多家庭晋升，房屋更加华美，税收也随之增加。暂时的储备加成不会带来永久的社会晋升。税金用于建筑与防护。"],
      ["健康", "生病的村民无法劳作，家人还得照料他们。清洁的井水、草药小屋和医馆能明显减少病休。"],
      ["抵御灾祸", "火灾与盗匪会考验村庄。消防屋能迅速扑灭火灾，城镇卫队会赶走劫掠者。春秋两季，河水泛滥会暂时淹没岸边草地，但退去后会留下格外肥沃的土地。"],
    ]],
  ],
};

const ja: Book = {
  first: {
    title: "あなたの村へようこそ！",
    rules: [
      ["村をつくり、育つのを見守ります。", "あなたは村長です。"],
      ["何もする必要はありません。", "村は現実の時間とともにひとりでに育ち、栄えます――ログインしていなくても、何週間見に来なくても。"],
      ["見守っているときは、導くことができます：", "新しい建物を依頼し、毎日の祝福を授け、旅人が井戸を訪れたときに決断を下しましょう。"],
    ],
    go: "これで十分、始めよう", more: "もっと教えて！",
  },
  title: "町の書",
  chapters: [
    ["基本のきまり", [["", "Samenlandは現実の時間とともに着実に進む、ゆったりとした遊びです。村をつくり、育つのを見守りましょう。クリックに追われることも、留守中に衰えることも、単調な作業もありません――大地はひとりでに広がっていきます。"]]],
    ["世界の時間、光、季節", [
      ["時間帯に合わせた現実の時間", "日の出、夕暮れ、夜はあなたの世界の時間帯に従います。あなたのところで日が沈むと、屋根の上にも夕闇が訪れます。夜には窓に温かな灯りがともり、村人たちは寝床で眠ります。"],
      ["日曜の休み", "毎週日曜日は重い仕事が休みです。村人は道具を置き、礼拝堂や村の広場に集まります。"],
      ["春", "雪解けと花咲く草地。"],
      ["夏", "長い日と、畑や作業場のにぎやかな営み。"],
      ["秋", "大収穫が倉を満たし、穀物の収量は一年で最高になります。"],
      ["冬", "一面の雪、凍った大地、短い労働時間、そして暖をとる蓄えへの需要の高まり。"],
    ]],
    ["発展、移住者、婚礼", [
      ["小さな集落から大都市へ", "あなたの村は何か月、何年もかけて六つの時代を進みます――最初の開墾から集落、小さな町を経て、名高い交易の大都市まで。"],
      ["住まいと移住者", "発展とともに大工たちが新しい家を建てます。屋根が上がると、新しい家族が家財を携えて移り住み、村に新たな働き手をもたらし、毎日税を納めます。"],
      ["婚礼", "村が育ち、若者が家庭を持つと、婚礼の鐘が鳴ります。新郎新婦はおごそかに教会へ向かい、ふたりの家を構えます。両家は村の金庫に持参金を納め、祝宴は村に喜びと希望に満ちた日々をもたらします。"],
    ]],
    ["道と村どうしの交易", [
      ["村の小道", "村の中の道はひとりでにできます。村人が毎日、戸口、井戸、畑、作業場のあいだを歩くところに、やがて目に見える小道や路地が踏み固められます。"],
      ["外への交易路", "一方、隣村への道はひとりでにはできません。村長として建築メニューで正式に決める必要があります。工事は距離に応じて数時間から数日かかります。隣村も自分の側から建設すると、残りの期間は半分になります。"],
      ["市の日と荷車", "道が完成すると荷車が行き交い、旅職人が立ち寄り、土曜日には共同の週市が開かれます。"],
    ]],
    ["資源、手仕事、それぞれの役目", [
      ["", "建物は金庫のターラーで計画し、依頼します。原材料を自分で貯める必要はありません――村の人々が日々の暮らしの中で集め、加工します。"],
      ["食べ物", "農夫が麦束を刈り、製粉所が粉をひき、パン屋がパンを焼きます。魚、獣肉、チーズも加わります。たっぷりの蓄えと変化に富んだ食事は、村の健康と繁栄を高めます。"],
      ["穀物倉", "穀物は際限なく積み上げられません。製粉所と穀物倉が蓄えの量を広げ、秋の豊作が傷まずに村の冬越しを支えます。"],
      ["木材と建材", "木こりが幹を切り、製材所が梁を挽き、石工が石を切り出します。村に木こり小屋があるか近くに森があれば、大工はいつでも木材を手にでき、新しい建物は目に見えて早く仕上がります。"],
      ["薬草", "薬草摘みが下草の中で根や花を集め、治療師が病人を看病できるようにして、仕事を休む人を減らします。"],
      ["交易品と羊毛", "あなたの土地が豊かに生むものは、求められる輸出品になります。平野の村は羊毛、山の村は石と鉱石、森の村は木材、海辺の村は魚と塩を送り出します。交易路で異なる品が出会うと、長く続く相乗効果が両方の村にさらなる繁栄をもたらします。"],
    ]],
    ["金庫、健康、災い", [
      ["金庫", "一般市民は毎日1ターラー、熟練職人は2、裕福な市民は3の税を負担します。教育、ギルド、立派な建物による持続的な繁栄でより多くの世帯が昇格し、家が華やかになり税収も増えます。一時的な備蓄ボーナスは恒久的な昇格にはなりません。税で建物と守りをまかないます。"],
      ["健康", "病気の村人は仕事を休み、家族が看病しなければなりません。井戸のきれいな水、薬草小屋、施療院は病欠をはっきり減らします。"],
      ["災いへの備え", "火事と盗賊団が村を試します。消防小屋は火事をすばやく消し止め、町の衛兵は略奪者を追い払います。春と秋には川の洪水が岸辺の草地を一時水に沈めますが、そのあとには特に肥えた土が残ります。"],
    ]],
  ],
};

export const BOOK: Record<Lang, Book> = { de, en, fr, es, ar, hi, zh, ja };
