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
      ["Du musst absolut nichts tun: Dein Ort stirbt nie.", "Er wächst in Echtzeit von ganz allein heran – selbst wenn du wochenlang nicht nachsiehst. Doch ohne deine Fürsorge bleibt er ein beschauliches Dorf."],
      ["Wenn du zuschaust, führst du es zur Blüte:", "Mit neuen Gewerben, Handelsstraßen, dem täglichen Segen und klugen Entscheidungen wächst dein Dorf über seine Grenzen hinaus zur Stadt."],
    ],
    go: "Das reicht mir, lass uns loslegen", more: "Erzähl mir mehr!",
  },
  title: "Das Buch der Stadt",
  chapters: [
    ["Die Grundregel", [
      ["", "Samenland ist ein langsames Spiel in stetigem Echtzeit-Tempo. Es gibt keinen Klick-Zwang, keinen Verfall bei Abwesenheit, und dein Ort kann niemals untergehen."],
      ["Die Grenzen des Dorfes", "Ohne die lenkende Hand des Schulzen wächst dein Ort bis zur Größe eines Dorfes und pendelt sich dort ein – mehr Menschen kann das unbestellte Land nicht ernähren. Zur Stadt erwächst er nur, wenn du für Nahrung, Gesundheit, Handwerk und Wege sorgst. Was du einmal erreicht hast, fällt nicht ins Bodenlose: Lässt deine Fürsorge nach, wandern höchstens einige Familien ab, bis Ort und Versorgung wieder im Gleichgewicht sind."],
    ]],
    ["Weltzeit, Licht & Jahreszeiten", [
      ["Echtzeit nach Zeitzone", "Der Lauf der Sonne, Dämmerung und Nacht richten sich nach der Zeitzone deiner Spielwelt. Geht bei dir die Sonne unter, dämmert es auch über den Dächern. Nachts gehen warme Lichter in den Fenstern an und die Bewohner schlafen in ihren Betten."],
      ["Sonntagsruhe", "Jeden Sonntag ruht die schwere Arbeit. Die Bewohner legen ihr Werkzeug nieder und versammeln sich an der Kapelle oder auf dem Dorfplatz."],
      ["Frühling", "Tauwetter und blühende Wiesen."],
      ["Sommer", "Lange Tage und emsiges Treiben auf Feldern und Werkplätzen."],
      ["Herbst", "Die Haupternte füllt die Speicher; Getreideerträge erreichen ihren Jahreshöchstwert."],
      ["Winter", "Geschlossene Schneedecke, gefrorene Böden, kürzere Arbeitszeiten, mehr Hunger und mehr Kranke."],
    ]],
    ["Dorfentwicklung, Zuzug & Hochzeiten", [
      ["Vom Weiler zur Metropole", "Dein Ort wächst über Monate und Jahre durch sechs Epochen – von der ersten Rodung über Weiler und Kleinstadt bis zur weithin bekannten Handelsmetropole. Jede Schwelle über das Dorf hinaus will aber durch gute Versorgung verdient sein."],
      ["Wohnraum, Zuzug & Wegzug", "Mit dem Wachstum zimmern die Bauleute neue Häuser. Sobald ein Dach gerichtet ist, ziehen neue Familien ein, bringen frische Arbeitskräfte ins Dorf und zahlen täglich Steuern. Doch die Natur allein ernährt nur eine begrenzte Zahl von Familien: Fehlt es an Nahrung und Gewerbe, wandern Familien ab und Häuser am Ortsrand stehen leer, bis neue Versorgungsbauten sie wieder füllen."],
      ["Hochzeiten", "Wenn junge Leute einen Hausstand gründen, läuten die Hochzeitsglocken. Je größer, satter und wohlhabender dein Ort ist, desto öfter wird geheiratet. Im kleinen Dorf ist jede Hochzeit ein Großereignis: Alle versammeln sich und der Schulze wird um seinen Segen gebeten. In der Stadt feiert man meist im Kreis der Familie – nur seltene Prunkhochzeiten rufen noch den ganzen Ort zusammen. Jede Hochzeit stiftet eine Mitgift in die Gemeindekasse, die mit dem Wohlstand wächst."],
    ]],
    ["Wege & der Handel zwischen Dörfern", [
      ["Pfade im Dorf", "Wege innerhalb des Ortes entstehen ganz von selbst. Wo Bewohner täglich zwischen Haustür, Brunnen, Acker und Werkstatt laufen, treten sie mit der Zeit sichtbare Trampelpfade und Gassen in den Boden."],
      ["Handelsstraßen nach außen", "Straßen zu Nachbardörfern entstehen dagegen nicht von allein. Du musst sie im Bau-Menü als Schulze förmlich beschließen. Der Bau dauert je nach Entfernung einige Stunden oder Tage. Baut das Nachbardorf von seiner Seite aus mit, halbiert sich die verbleibende Bauzeit. Jede fertige Straße hebt außerdem den Wohlstand deines Ortes."],
      ["Markttage & Fuhrwerke", "Steht die Straße, rollen Fuhrwerke, Wandergesellen kehren ein und samstags findet der gemeinsame Wochenmarkt statt."],
    ]],
    ["Ressourcen, Handwerk & wofür alles dient", [
      ["", "Du planst und beauftragst Bauten mit Talern aus der Schatzkammer. Rohstoffe musst du nicht selbst ansparen – die Dorfgemeinschaft gewinnt und verarbeitet sie im Alltag."],
      ["Nahrung", "Bauern ernten Garben, Mühlen mahlen Mehl und der Bäcker backt Brot; dazu kommen Fisch, Wildbret und Käse. Ein reich gedeckter Tisch ist der Schlüssel zum Wachstum: Nur wenn Nahrungsgewerbe den Speisezettel erweitern, reicht das Essen für den Schritt vom Dorf zur Stadt. Satte Bürger bleiben zudem gesünder."],
      ["Kornspeicher", "Getreide kann nicht endlos aufgehäuft werden. Mühlen und Kornspeicher erweitern die Lagerkapazität, damit reiche Herbst-Ernten nicht verderben, sondern das Dorf durch den Winter bringen."],
      ["Holz & Werkstoffe", "Holzfäller schlagen Stämme, Sägewerke schneiden Balken und Steinmetze hauen Quader. Steht ein Holzfällerlager im Ort und später ein eigenes Sägewerk, haben Bauleute stets Bauholz zur Hand – neue Gebäude werden spürbar schneller fertiggestellt."],
      ["Heilkräuter", "Die Kräuterfrau sammelt Wurzeln und Blüten im Unterholz, damit der Heiler kranke Dorfbewohner versorgen kann und Ausfälle verringert werden."],
      ["Handelsgüter & Wolle", "Was dein Umland im Überfluss hervorbringt, wird zum gefragten Exportgut. Dörfer in der Ebene liefern Wolle, Bergdörfer Stein und Erz, Waldorte Bauholz und Küstenorte Fisch und Salz. Treffen auf Handelsstraßen unterschiedliche Güter aufeinander, entsteht eine dauerhafte Synergie, die beiden Orten zusätzliches Wachstum bringt."],
    ]],
    ["Wohlstand, Bürgerstände & Steuern", [
      ["Drei Bürgerstände", "Jeder Haushalt gehört einem Stand an: Einfache Bürger zahlen täglich einen Taler Steuer, Facharbeiter zwei und wohlhabende Bürger drei. Ein armes Dorf besteht fast nur aus einfachen Leuten – in einer wohlhabenden Stadt gleicher Größe fließt pro Kopf beinahe doppelt so viel Steuer in die Schatzkammer."],
      ["Wohlstand mehren", "Wohlstand entsteht durch Investitionen, die bleiben: fertige Handelsstraßen, Bildung und Bürgerbauten wie Schule, Zunfthaus, Markthalle und Bibliothek sowie prächtige Prestigebauten. Mit dem Wohlstand steigen nach und nach mehr Haushalte auf. Volle Speicher machen satt und gesund, lassen aber niemanden dauerhaft in einen höheren Stand aufsteigen."],
      ["Sichtbarer Aufstieg", "Den Aufstieg siehst du im Stadtbild: Aus schlichten Katen werden Fachwerk- und Handwerkerhäuser, aus ihnen stattliche Patrizierhäuser. Tippst du einen Bürger oder ein Haus an, zeigt dir das Pergament Stand, Beruf und täglichen Steuerbeitrag."],
      ["Wofür die Taler dienen", "Mit Steuern, Mitgiften und Geschenken finanzierst du neue Gewerbe, Bürger- und Prestigebauten sowie Schutzbauten – und mehrst damit wiederum den Wohlstand."],
    ]],
    ["Gesundheit & Schutz vor Unheil", [
      ["Gesundheit", "Kranke Bewohner bleiben im Bett, fallen bei der Arbeit aus, müssen von Angehörigen gepflegt werden und zahlen an diesem Tag keine Steuer. Im frostigen Winter liegen spürbar mehr Bürger danieder. Frisches Brunnenwasser, Kräuterhütten und Arzneihäuser senken die Ausfälle und schützen so auch die Schatzkammer."],
      ["Schutz vor Unheil", "Brände und Räuberbanden stellen das Dorf auf die Probe. Spritzenhäuser löschen Brände rasch, und eine Stadtgarde schlägt Plünderer in die Flucht. Hochwasser an Flüssen überschwemmt im Frühjahr und Herbst vorübergehend Uferwiesen, hinterlässt danach jedoch besonders fruchtbaren Boden."],
    ]],
  ],
};

const en: Book = {
  first: {
    title: "Welcome to your village!",
    rules: [
      ["You plant a village and watch it grow.", "You are the village headman."],
      ["You don't have to do anything: your village never dies.", "It grows by itself in real time – even if you don't look for weeks. But without your care it stays a quiet village."],
      ["When you watch, you help it flourish:", "With new crafts, trade roads, the daily blessing and wise decisions your village grows beyond its limits into a town."],
    ],
    go: "That's enough, let's go", more: "Tell me more!",
  },
  title: "The Book of the Town",
  chapters: [
    ["The ground rule", [
      ["", "Samenland is a slow game at a steady real-time pace. There is no clicking pressure, no decay while you're away, and your settlement can never perish."],
      ["The village's limits", "Without the headman's guiding hand your settlement grows to the size of a village and settles there – untended land cannot feed more people. It only becomes a town if you provide food, health, crafts and roads. What you have reached never collapses: if your care slackens, at most some families move away until settlement and supply are balanced again."],
    ]],
    ["World time, light & seasons", [
      ["Real time by time zone", "Sunrise, dusk and night follow the time zone of your world. When the sun sets for you, dusk falls over the roofs too. At night warm lights glow in the windows and the villagers sleep in their beds."],
      ["Sunday rest", "Every Sunday heavy work rests. The villagers lay down their tools and gather at the chapel or on the village square."],
      ["Spring", "Thaw and blooming meadows."],
      ["Summer", "Long days and busy bustle on fields and workyards."],
      ["Autumn", "The main harvest fills the stores; grain yields reach their yearly peak."],
      ["Winter", "Closed snow cover, frozen ground, shorter working hours, more hunger and more sickness."],
    ]],
    ["Growth, newcomers & weddings", [
      ["From hamlet to metropolis", "Your settlement grows over months and years through six eras – from the first clearing via hamlet and small town to a far-famed trading metropolis. Every step beyond the village must be earned with good supply."],
      ["Homes, newcomers & leaving", "As it grows, the builders raise new houses. As soon as a roof is up, new families move in, bring fresh hands and pay taxes every day. But nature alone feeds only so many families: without food and crafts, families move away and houses on the edge stand empty until new supply buildings fill them again."],
      ["Weddings", "When young people start a household, the wedding bells ring. The larger, better fed and wealthier your settlement, the more often people marry. In a small village every wedding is a great event: everyone gathers and the headman is asked for his blessing. In a town most weddings are family affairs – only rare grand weddings still bring the whole place together. Every wedding gives a dowry to the village chest that grows with prosperity."],
    ]],
    ["Roads & trade between villages", [
      ["Paths in the village", "Paths inside the settlement appear by themselves. Where villagers walk daily between door, well, field and workshop, they tread visible trails and lanes into the ground over time."],
      ["Trade roads to the outside", "Roads to neighbouring villages don't appear by themselves. As headman you must formally decide on them in the build menu. Building takes a few hours or days depending on distance. If the neighbour builds from their side too, the remaining time is halved. Every finished road also raises your settlement's prosperity."],
      ["Market days & carts", "Once the road stands, carts roll, journeymen stop by and on Saturdays the shared weekly market takes place."],
    ]],
    ["Resources, crafts & what they're for", [
      ["", "You plan and commission buildings with taler from the treasury. You never have to stockpile raw materials – the village community gathers and processes them in daily life."],
      ["Food", "Farmers harvest sheaves, mills grind flour and the baker bakes bread; fish, venison and cheese join them. A rich table is the key to growth: only when food crafts widen the menu is there enough to eat for the step from village to town. Well-fed citizens also stay healthier."],
      ["Granary", "Grain cannot be heaped up endlessly. Mills and granaries add storage so rich autumn harvests don't spoil but carry the village through winter."],
      ["Wood & building materials", "Woodcutters fell trunks, sawmills cut beams and masons hew blocks. With a woodcutters' camp, and later the village's own sawmill, builders always have timber at hand – new buildings are finished noticeably faster."],
      ["Healing herbs", "The herb woman gathers roots and blossoms in the undergrowth so the healer can tend sick villagers and fewer fall out of work."],
      ["Trade goods & wool", "What your land yields in plenty becomes a sought-after export. Lowland villages supply wool, mountain villages stone and ore, forest villages timber and coastal villages fish and salt. Where different goods meet on trade roads, a lasting synergy brings both places extra growth."],
    ]],
    ["Prosperity, estates & taxes", [
      ["Three estates", "Every household belongs to an estate: ordinary citizens pay one taler of tax a day, skilled workers two and wealthy citizens three. A poor village consists almost only of ordinary folk – a wealthy town of the same size brings in nearly twice as much tax per head."],
      ["Growing prosperity", "Prosperity comes from investments that last: finished trade roads, education and civic buildings such as school, guild hall, market hall and library, and splendid prestige buildings. As prosperity rises, more households gradually move up. Full stores keep people fed and healthy, but promote no one lastingly."],
      ["Visible rise", "You see the rise in the townscape: simple cottages become timber-framed and craftsmen's houses, and those become stately patrician homes. Tap a citizen or a house and the parchment shows estate, trade and daily tax."],
      ["What taler are for", "With taxes, dowries and gifts you fund new crafts, civic and prestige buildings and protection – which in turn increase prosperity."],
    ]],
    ["Health & protection from harm", [
      ["Health", "Sick villagers stay in bed, miss work, need relatives to nurse them and pay no tax that day. In frosty winter noticeably more citizens are ill. Fresh well water, herb huts and infirmaries reduce sick days and so also protect the treasury."],
      ["Protection from harm", "Fires and robber bands put the village to the test. Fire houses put out fires quickly and a town guard drives off looters. Floods on rivers briefly swamp the shore meadows in spring and autumn, but leave especially fertile soil behind."],
    ]],
  ],
};

const fr: Book = {
  first: {
    title: "Bienvenue dans ton village !",
    rules: [
      ["Tu plantes un village et tu le regardes grandir.", "Tu es le bourgmestre."],
      ["Tu n'as rien à faire : ton village ne meurt jamais.", "Il grandit tout seul en temps réel – même si tu ne viens pas pendant des semaines. Mais sans tes soins, il reste un paisible village."],
      ["Quand tu regardes, tu le fais prospérer :", "Avec de nouveaux métiers, des routes commerciales, la bénédiction du jour et de sages décisions, ton village dépasse ses limites et devient une ville."],
    ],
    go: "Ça me suffit, allons-y", more: "Raconte-m'en plus !",
  },
  title: "Le livre de la cité",
  chapters: [
    ["La règle de base", [
      ["", "Samenland est un jeu lent, au rythme constant du temps réel. Pas d'obligation de cliquer, pas de déclin en ton absence, et ton village ne peut jamais disparaître."],
      ["Les limites du village", "Sans la main du bourgmestre, ton bourg grandit jusqu'à la taille d'un village et s'y stabilise – la terre non cultivée ne nourrit pas davantage de monde. Il ne devient une ville que si tu veilles à la nourriture, la santé, l'artisanat et les routes. Ce que tu as atteint ne s'effondre pas : si tes soins faiblissent, quelques familles partent tout au plus, jusqu'à ce que bourg et approvisionnement retrouvent l'équilibre."],
    ]],
    ["Heure du monde, lumière & saisons", [
      ["Temps réel selon le fuseau", "Le cours du soleil, le crépuscule et la nuit suivent le fuseau horaire de ton monde. Quand le soleil se couche chez toi, le soir tombe aussi sur les toits. La nuit, de chaudes lumières brillent aux fenêtres et les habitants dorment."],
      ["Repos dominical", "Chaque dimanche, le gros travail cesse. Les habitants posent leurs outils et se rassemblent à la chapelle ou sur la place."],
      ["Printemps", "Dégel et prés en fleurs."],
      ["Été", "Longues journées et activité intense aux champs et aux ateliers."],
      ["Automne", "La grande récolte remplit les greniers ; les rendements en grain atteignent leur sommet."],
      ["Hiver", "Neige, sol gelé, journées de travail plus courtes, plus de faim et plus de malades."],
    ]],
    ["Croissance, nouveaux venus & mariages", [
      ["Du hameau à la métropole", "Ton bourg grandit pendant des mois et des années à travers six époques – du premier défrichage à la métropole marchande. Chaque étape au-delà du village se mérite par un bon approvisionnement."],
      ["Logis, arrivées & départs", "Les bâtisseurs élèvent de nouvelles maisons. Dès qu'un toit est posé, des familles emménagent, apportent des bras et paient l'impôt chaque jour. Mais la nature seule ne nourrit qu'un nombre limité de familles : sans nourriture ni métiers, des familles partent et les maisons en bordure restent vides jusqu'à ce que de nouveaux bâtiments les remplissent."],
      ["Mariages", "Quand des jeunes fondent un foyer, les cloches sonnent. Plus ton bourg est grand, bien nourri et prospère, plus on s'y marie. Au village, chaque mariage est un grand événement : tous se rassemblent et l'on demande la bénédiction du bourgmestre. En ville, on fête surtout en famille – seules de rares noces fastueuses réunissent encore toute la cité. Chaque mariage verse une dot au trésor, qui augmente avec la prospérité."],
    ]],
    ["Routes & commerce entre villages", [
      ["Sentiers du village", "Les chemins dans le bourg naissent d'eux-mêmes, là où les habitants marchent chaque jour entre porte, puits, champ et atelier."],
      ["Routes commerciales", "Les routes vers les voisins ne naissent pas seules : tu dois les décider dans le menu de construction. Les travaux durent quelques heures ou jours selon la distance ; si le voisin construit aussi de son côté, le temps restant est divisé par deux. Chaque route achevée accroît aussi la prospérité de ton bourg."],
      ["Jours de marché & charrettes", "Une fois la route prête, les charrettes roulent, les compagnons font halte et le samedi se tient le marché commun."],
    ]],
    ["Ressources, métiers & leur utilité", [
      ["", "Tu commandes les bâtiments avec les thalers du trésor. Tu n'as jamais à stocker de matières premières – la communauté les récolte et les transforme au quotidien."],
      ["Nourriture", "Les paysans moissonnent, les moulins moulent la farine et le boulanger cuit le pain ; s'y ajoutent poisson, gibier et fromage. Une table bien garnie est la clé de la croissance : seuls des métiers de bouche permettent de passer du village à la ville. Les habitants bien nourris restent aussi en meilleure santé."],
      ["Grenier", "Le grain ne s'entasse pas sans fin. Moulins et greniers augmentent le stockage pour que les récoltes d'automne portent le village à travers l'hiver."],
      ["Bois & matériaux", "Bûcherons, scieries et tailleurs de pierre fournissent bois et pierre. Avec un camp de bûcherons, puis la scierie du village, les nouveaux bâtiments sont achevés nettement plus vite."],
      ["Herbes médicinales", "La guérisseuse cueille racines et fleurs pour que le médecin soigne les malades et que moins d'habitants manquent au travail."],
      ["Marchandises & laine", "Ce que ta région produit en abondance devient un bien d'export : laine des plaines, pierre et minerai des montagnes, bois des forêts, poisson et sel des côtes. Quand des biens différents se rencontrent sur les routes, une synergie durable apporte aux deux bourgs une croissance supplémentaire."],
    ]],
    ["Prospérité, conditions & impôts", [
      ["Trois conditions", "Chaque foyer appartient à une condition : les gens simples paient un thaler d'impôt par jour, les artisans qualifiés deux et les bourgeois aisés trois. Un village pauvre ne compte presque que des gens simples – une ville prospère de même taille rapporte près de deux fois plus d'impôt par tête."],
      ["Accroître la prospérité", "La prospérité naît d'investissements durables : routes achevées, instruction et bâtiments civiques comme l'école, la maison des corporations, la halle et la bibliothèque, ainsi que de splendides monuments. Peu à peu, davantage de foyers s'élèvent. Des greniers pleins nourrissent et soignent, mais n'élèvent personne durablement."],
      ["Une ascension visible", "Tu vois l'ascension dans la ville : les chaumières deviennent maisons à colombages et d'artisans, puis demeures patriciennes. Touche un habitant ou une maison pour voir sa condition, son métier et son impôt du jour."],
      ["À quoi servent les thalers", "Impôts, dots et cadeaux financent métiers, bâtiments civiques, monuments et protections – qui accroissent à leur tour la prospérité."],
    ]],
    ["Santé & protection", [
      ["Santé", "Les malades restent au lit, manquent au travail, doivent être soignés par leurs proches et ne paient pas d'impôt ce jour-là. En hiver, ils sont nettement plus nombreux. Eau de puits, cabanes d'herboriste et apothicaireries réduisent les absences et protègent ainsi le trésor."],
      ["Protection contre les malheurs", "Incendies et brigands mettent le village à l'épreuve. La caserne de pompiers éteint vite les feux et la garde chasse les pillards. Les crues inondent brièvement les prés au printemps et en automne, mais laissent une terre très fertile."],
    ]],
  ],
};

const es: Book = {
  first: {
    title: "¡Bienvenido a tu aldea!",
    rules: [
      ["Plantas una aldea y la ves crecer.", "Tú eres el alcalde."],
      ["No tienes que hacer nada: tu aldea nunca muere.", "Crece sola en tiempo real, aunque no la mires durante semanas. Pero sin tus cuidados se queda en una tranquila aldea."],
      ["Cuando miras, la haces florecer:", "Con nuevos oficios, caminos comerciales, la bendición diaria y sabias decisiones, tu aldea supera sus límites y se convierte en ciudad."],
    ],
    go: "Con esto me basta, empecemos", more: "¡Cuéntame más!",
  },
  title: "El libro de la ciudad",
  chapters: [
    ["La regla básica", [
      ["", "Samenland es un juego lento, al ritmo constante del tiempo real. No hay obligación de hacer clic, no hay decadencia en tu ausencia y tu pueblo nunca puede desaparecer."],
      ["Los límites de la aldea", "Sin la mano del alcalde, tu pueblo crece hasta el tamaño de una aldea y se estabiliza allí: la tierra sin cuidar no alimenta a más gente. Solo se convierte en ciudad si cuidas la comida, la salud, los oficios y los caminos. Lo alcanzado no se derrumba: si tus cuidados disminuyen, como mucho algunas familias se marchan hasta que pueblo y abastecimiento vuelven a equilibrarse."],
    ]],
    ["Hora del mundo, luz y estaciones", [
      ["Tiempo real según zona horaria", "El sol, el crepúsculo y la noche siguen la zona horaria de tu mundo. Cuando el sol se pone para ti, también anochece sobre los tejados. De noche brillan luces cálidas y los vecinos duermen."],
      ["Descanso dominical", "Cada domingo descansa el trabajo pesado. Los vecinos dejan sus herramientas y se reúnen en la capilla o la plaza."],
      ["Primavera", "Deshielo y prados en flor."],
      ["Verano", "Días largos y mucho ajetreo en campos y talleres."],
      ["Otoño", "La gran cosecha llena los graneros; el grano alcanza su máximo anual."],
      ["Invierno", "Nieve, suelo helado, jornadas más cortas, más hambre y más enfermos."],
    ]],
    ["Crecimiento, recién llegados y bodas", [
      ["De caserío a metrópoli", "Tu pueblo crece durante meses y años a través de seis épocas, del primer claro a la metrópoli comercial. Cada paso más allá de la aldea hay que ganarlo con buen abastecimiento."],
      ["Viviendas, llegadas y partidas", "Los constructores levantan casas nuevas. En cuanto hay tejado, llegan familias, aportan manos y pagan impuestos cada día. Pero la naturaleza sola alimenta a pocas familias: sin comida ni oficios, algunas se marchan y las casas de las afueras quedan vacías hasta que nuevos edificios de abastecimiento las llenan."],
      ["Bodas", "Cuando los jóvenes forman un hogar, suenan las campanas. Cuanto más grande, mejor alimentado y próspero es tu pueblo, más bodas hay. En la aldea cada boda es un gran acontecimiento: todos se reúnen y se pide la bendición del alcalde. En la ciudad se celebra sobre todo en familia; solo raras bodas fastuosas reúnen aún a todo el lugar. Cada boda aporta una dote al tesoro que crece con la prosperidad."],
    ]],
    ["Caminos y comercio entre aldeas", [
      ["Senderos en la aldea", "Los caminos dentro del pueblo surgen solos, donde los vecinos andan cada día entre puerta, pozo, campo y taller."],
      ["Caminos comerciales", "Los caminos a los vecinos no surgen solos: debes decidirlos en el menú de construcción. Tardan horas o días según la distancia; si el vecino construye desde su lado, el tiempo restante se reduce a la mitad. Cada camino terminado también aumenta la prosperidad de tu pueblo."],
      ["Días de mercado y carros", "Con el camino listo, ruedan carros, llegan oficiales errantes y los sábados se celebra el mercado común."],
    ]],
    ["Recursos, oficios y su utilidad", [
      ["", "Encargas edificios con táleros del tesoro. Nunca tienes que acumular materias primas: la comunidad las obtiene y elabora a diario."],
      ["Comida", "Los campesinos siegan, los molinos muelen harina y el panadero hornea; además hay pescado, caza y queso. Una mesa bien servida es la clave del crecimiento: solo con oficios de alimentación hay comida suficiente para pasar de aldea a ciudad. Los vecinos bien alimentados también enferman menos."],
      ["Granero", "El grano no se amontona sin fin. Molinos y graneros amplían el almacenaje para que las cosechas de otoño lleven a la aldea a través del invierno."],
      ["Madera y materiales", "Leñadores, aserraderos y canteros aportan madera y piedra. Con un campamento de leñadores y, más tarde, el aserradero del pueblo, los edificios nuevos se terminan mucho más rápido."],
      ["Hierbas medicinales", "La herbolaria recoge raíces y flores para que el curandero atienda a los enfermos y menos vecinos falten al trabajo."],
      ["Mercancías y lana", "Lo que tu región produce en abundancia se exporta: lana de las llanuras, piedra y mineral de las montañas, madera de los bosques, pescado y sal de la costa. Cuando bienes distintos se encuentran en los caminos, una sinergia duradera da a ambos pueblos crecimiento extra."],
    ]],
    ["Prosperidad, estamentos e impuestos", [
      ["Tres estamentos", "Cada hogar pertenece a un estamento: la gente sencilla paga un tálero de impuesto al día, los artesanos cualificados dos y los ciudadanos acomodados tres. Una aldea pobre es casi solo gente sencilla; una ciudad próspera del mismo tamaño recauda casi el doble por cabeza."],
      ["Aumentar la prosperidad", "La prosperidad nace de inversiones duraderas: caminos terminados, educación y edificios cívicos como escuela, casa gremial, lonja y biblioteca, y espléndidos monumentos. Poco a poco ascienden más hogares. Los graneros llenos alimentan y dan salud, pero no hacen ascender a nadie de forma duradera."],
      ["Ascenso visible", "Ves el ascenso en la ciudad: las chozas se vuelven casas de entramado y de artesanos, y estas, mansiones patricias. Toca a un vecino o una casa para ver su estamento, oficio e impuesto diario."],
      ["Para qué sirven los táleros", "Con impuestos, dotes y regalos financias oficios, edificios cívicos, monumentos y defensas, que a su vez aumentan la prosperidad."],
    ]],
    ["Salud y protección", [
      ["Salud", "Los enfermos guardan cama, faltan al trabajo, necesitan que sus familiares los cuiden y ese día no pagan impuestos. En el frío invierno hay muchos más. El agua del pozo, las cabañas de hierbas y las boticas reducen las bajas y protegen así el tesoro."],
      ["Protección contra desgracias", "Incendios y bandidos ponen a prueba la aldea. El cuartel de bomberos apaga pronto el fuego y la guardia ahuyenta a los saqueadores. Las crecidas inundan brevemente los prados en primavera y otoño, pero dejan tierra muy fértil."],
    ]],
  ],
};

const ar: Book = {
  first: {
    title: "مرحباً بك في قريتك!",
    rules: [
      ["تغرس قرية وتشاهدها تنمو.", "أنت شيخ القرية."],
      ["لا يلزمك فعل أي شيء: قريتك لا تموت أبداً.", "تنمو وحدها في الزمن الحقيقي حتى لو غبت عنها أسابيع. لكنها بدون رعايتك تبقى قرية هادئة."],
      ["حين تشاهد، تقودها إلى الازدهار:", "بالحِرف الجديدة وطرق التجارة والبركة اليومية والقرارات الحكيمة تتجاوز قريتك حدودها وتصير بلدة."],
    ],
    go: "يكفيني هذا، لنبدأ", more: "أخبرني بالمزيد!",
  },
  title: "كتاب البلدة",
  chapters: [
    ["القاعدة الأساسية", [
      ["", "سامنلاند لعبة هادئة تسير بإيقاع ثابت في الزمن الحقيقي. لا إلزام بالنقر، ولا اضمحلال في غيابك، ولا يمكن لبلدتك أن تفنى أبداً."],
      ["حدود القرية", "بدون يد الشيخ الموجِّهة تنمو بلدتك حتى حجم قرية وتستقر عنده، فالأرض غير المعتنى بها لا تُطعم أكثر من ذلك. ولا تصير بلدة إلا إذا اعتنيت بالطعام والصحة والحِرف والطرق. وما بلغته لا ينهار: إن قلّت رعايتك رحلت بعض العائلات فقط حتى يتوازن السكان والمؤن من جديد."],
    ]],
    ["زمن العالم والضوء والفصول", [
      ["زمن حقيقي حسب المنطقة الزمنية", "شروق الشمس والغسق والليل تتبع المنطقة الزمنية لعالمك. حين تغرب الشمس عندك يحل المساء فوق السطوح أيضاً، وفي الليل تتوهج أضواء دافئة في النوافذ وينام الأهالي."],
      ["راحة الأحد", "في كل أحد يتوقف العمل الشاق ويجتمع الأهالي عند المصلى أو في ساحة القرية."],
      ["الربيع", "ذوبان الثلج ومروج مزهرة."],
      ["الصيف", "أيام طويلة ونشاط حثيث في الحقول والورش."],
      ["الخريف", "الحصاد الكبير يملأ المخازن ويبلغ محصول الحبوب ذروته."],
      ["الشتاء", "ثلج وأرض متجمدة وساعات عمل أقصر وجوع ومرض أكثر."],
    ]],
    ["النمو والوافدون والأعراس", [
      ["من نجع إلى حاضرة", "تنمو بلدتك عبر شهور وسنين خلال ست حقب، من أول أرض مُستصلحة حتى حاضرة تجارية. وكل خطوة بعد القرية تُكتسب بحسن التموين."],
      ["المساكن والوافدون والراحلون", "يبني البنّاؤون بيوتاً جديدة، وحين يكتمل سقف تنتقل إليها عائلات تجلب أيدي عاملة وتدفع الضرائب يومياً. لكن الطبيعة وحدها لا تطعم إلا عدداً محدوداً: بلا طعام وحِرف ترحل عائلات وتبقى بيوت الأطراف خالية حتى تملأها مبانٍ تموينية جديدة."],
      ["الأعراس", "حين يؤسس الشباب بيتاً تُقرع أجراس العرس. كلما كبرت بلدتك وشبع أهلها وازدادوا رخاءً كثرت الأعراس. في القرية الصغيرة كل عرس حدث كبير يجتمع فيه الجميع ويُطلب فيه دعاء الشيخ، أما في المدينة فيُحتفل غالباً بين الأهل، ولا تجمع البلدة كلها إلا أعراس فاخرة نادرة. وكل عرس يهب مهراً للخزينة يزداد مع الرخاء."],
    ]],
    ["الطرق والتجارة بين القرى", [
      ["دروب القرية", "تنشأ الدروب داخل البلدة وحدها حيث يمشي الأهالي يومياً بين الباب والبئر والحقل والورشة."],
      ["طرق التجارة", "أما الطرق إلى الجيران فلا تنشأ وحدها، بل تقررها في قائمة البناء. يستغرق بناؤها ساعات أو أياماً حسب المسافة، وإن بنى الجار من جهته انتصف الوقت المتبقي. وكل طريق مكتمل يرفع رخاء بلدتك أيضاً."],
      ["أيام السوق والعربات", "حين يكتمل الطريق تسير العربات ويحل الصنّاع الجوّالون، ويقام السوق المشترك كل سبت."],
    ]],
    ["الموارد والحِرف وفائدتها", [
      ["", "تكلّف بالمباني بالتالرات من الخزينة، ولا تحتاج أبداً إلى ادخار المواد الخام، فالأهالي يجمعونها ويصنعونها في حياتهم اليومية."],
      ["الطعام", "يحصد الفلاحون وتطحن المطاحن ويخبز الخبّاز، ويضاف السمك والصيد والجبن. المائدة العامرة مفتاح النمو: لا يكفي الطعام للانتقال من قرية إلى مدينة إلا إذا وسّعت حِرف الطعام الموائد. والأهالي الشبعى أصح أيضاً."],
      ["مخزن الحبوب", "لا تُكدّس الحبوب بلا حد؛ المطاحن والمخازن توسّع السعة لتعبر محاصيل الخريف بالقرية الشتاء."],
      ["الخشب ومواد البناء", "الحطّابون والمناشر والنحّاتون يوفرون الخشب والحجر. مع معسكر حطّابين ثم منشرة البلدة تكتمل المباني الجديدة أسرع بكثير."],
      ["الأعشاب الطبية", "تجمع العشّابة الجذور والأزهار ليعالج المداوي المرضى ويقل غيابهم عن العمل."],
      ["سلع التجارة والصوف", "ما تنتجه أرضك بوفرة يصير سلعة تصدير: صوف السهول، وحجر الجبال وخامها، وخشب الغابات، وسمك السواحل وملحها. وحين تلتقي سلع مختلفة على الطرق ينشأ تآزر دائم يمنح البلدتين نمواً إضافياً."],
    ]],
    ["الرخاء والطبقات والضرائب", [
      ["ثلاث طبقات", "ينتمي كل بيت إلى طبقة: العامة يدفعون تالراً واحداً يومياً، والحرفيون المهرة اثنين، والميسورون ثلاثة. القرية الفقيرة تكاد تكون من العامة وحدهم، بينما تجبي مدينة مزدهرة بالحجم نفسه نحو ضعف الضريبة للفرد."],
      ["زيادة الرخاء", "ينشأ الرخاء من استثمارات باقية: طرق مكتملة، وتعليم ومبانٍ مدنية كالمدرسة ودار النقابة والسوق المسقوف والمكتبة، ومعالم فاخرة. ومع الرخاء ترتقي بيوت أكثر شيئاً فشيئاً. المخازن الممتلئة تُشبع وتُصحّ لكنها لا ترفع أحداً إلى طبقة أعلى بشكل دائم."],
      ["ارتقاء مرئي", "ترى الارتقاء في صورة البلدة: الأكواخ البسيطة تصير بيوتاً خشبية وبيوت حرفيين، ثم دوراً أرستقراطية فخمة. المس أحد الأهالي أو بيتاً لترى طبقته وحرفته وضريبته اليومية."],
      ["فيمَ تُنفق التالرات", "بالضرائب والمهور والهدايا تموّل الحِرف والمباني المدنية والمعالم والتحصينات، فيزداد الرخاء بدوره."],
    ]],
    ["الصحة والحماية", [
      ["الصحة", "المرضى يلزمون الفراش ويغيبون عن العمل ويحتاجون رعاية ذويهم ولا يدفعون ضريبة ذلك اليوم. وفي الشتاء القارس يكثرون بوضوح. ماء البئر وأكواخ الأعشاب ودور الدواء تقلل الغياب وتحمي الخزينة."],
      ["الحماية من المصائب", "الحرائق وعصابات اللصوص تختبر القرية. دار الإطفاء تطفئ النار سريعاً والحرس يطرد الناهبين. والفيضانات تغمر المروج قليلاً في الربيع والخريف لكنها تترك تربة خصبة."],
    ]],
  ],
};

const hi: Book = {
  first: {
    title: "अपने गाँव में स्वागत है!",
    rules: [
      ["तुम एक गाँव बोते हो और उसे बढ़ता देखते हो।", "तुम गाँव के प्रधान हो।"],
      ["तुम्हें कुछ नहीं करना है: तुम्हारा गाँव कभी नहीं मरता।", "यह असली समय में अपने आप बढ़ता है – चाहे तुम हफ़्तों न देखो। पर तुम्हारी देखभाल के बिना यह एक शांत गाँव ही रहता है।"],
      ["जब तुम देखते हो, तो इसे फलने-फूलने देते हो:", "नए धंधों, व्यापार मार्गों, रोज़ के आशीर्वाद और समझदार फ़ैसलों से तुम्हारा गाँव अपनी सीमाओं से आगे बढ़कर शहर बनता है।"],
    ],
    go: "इतना काफ़ी है, चलो शुरू करें", more: "और बताओ!",
  },
  title: "नगर की पुस्तक",
  chapters: [
    ["मूल नियम", [
      ["", "सामेनलैंड असली समय की स्थिर गति वाला धीमा खेल है। क्लिक की मजबूरी नहीं, तुम्हारी ग़ैरहाज़िरी में कोई गिरावट नहीं, और तुम्हारी बस्ती कभी नष्ट नहीं हो सकती।"],
      ["गाँव की सीमाएँ", "प्रधान के मार्गदर्शन के बिना तुम्हारी बस्ती गाँव के आकार तक बढ़कर वहीं ठहर जाती है – बिना जोती ज़मीन इससे ज़्यादा लोगों को नहीं खिला सकती। शहर तभी बनता है जब तुम भोजन, स्वास्थ्य, धंधों और रास्तों का ध्यान रखो। जो पा लिया वह ढहता नहीं: देखभाल घटे तो बस कुछ परिवार चले जाते हैं, जब तक बस्ती और आपूर्ति फिर संतुलित न हो जाएँ।"],
    ]],
    ["दुनिया का समय, रोशनी और ऋतुएँ", [
      ["समय क्षेत्र के अनुसार असली समय", "सूर्योदय, साँझ और रात तुम्हारी दुनिया के समय क्षेत्र के अनुसार चलते हैं। रात में खिड़कियों में गर्म रोशनी जलती है और लोग सोते हैं।"],
      ["रविवार का आराम", "हर रविवार भारी काम रुकता है और लोग प्रार्थनाघर या चौक पर इकट्ठा होते हैं।"],
      ["वसंत", "बर्फ़ पिघलती है और घास के मैदान खिलते हैं।"],
      ["गर्मी", "लंबे दिन और खेतों व कार्यशालाओं में चहल-पहल।"],
      ["पतझड़", "मुख्य फ़सल भंडार भरती है; अनाज की उपज साल के शिखर पर होती है।"],
      ["सर्दी", "बर्फ़, जमी ज़मीन, छोटे काम के घंटे, ज़्यादा भूख और ज़्यादा बीमार।"],
    ]],
    ["विकास, नए लोग और विवाह", [
      ["पुरवे से महानगर तक", "तुम्हारी बस्ती महीनों और सालों में छह युगों से गुज़रती है – पहली सफ़ाई से व्यापारिक महानगर तक। गाँव से आगे हर कदम अच्छी आपूर्ति से कमाना पड़ता है।"],
      ["घर, आगमन और पलायन", "कारीगर नए घर बनाते हैं; छत पड़ते ही परिवार आते हैं, काम करते हैं और रोज़ कर देते हैं। पर अकेली प्रकृति सीमित परिवारों को ही खिलाती है: भोजन और धंधों के बिना परिवार चले जाते हैं और किनारे के घर ख़ाली रहते हैं, जब तक नई आपूर्ति इमारतें उन्हें फिर न भर दें।"],
      ["विवाह", "जब युवा घर बसाते हैं, तो शादी की घंटियाँ बजती हैं। बस्ती जितनी बड़ी, भरपेट और समृद्ध, उतनी ज़्यादा शादियाँ। छोटे गाँव में हर शादी बड़ा उत्सव है: सब इकट्ठा होते हैं और प्रधान का आशीर्वाद माँगा जाता है। शहर में ज़्यादातर शादियाँ परिवार तक सीमित रहती हैं – केवल दुर्लभ भव्य शादियाँ पूरे नगर को जुटाती हैं। हर शादी ख़ज़ाने में दहेज देती है, जो समृद्धि के साथ बढ़ता है।"],
    ]],
    ["रास्ते और गाँवों के बीच व्यापार", [
      ["गाँव की पगडंडियाँ", "बस्ती के भीतर रास्ते अपने आप बनते हैं, जहाँ लोग रोज़ दरवाज़े, कुएँ, खेत और कार्यशाला के बीच चलते हैं।"],
      ["व्यापार मार्ग", "पड़ोसियों तक सड़कें अपने आप नहीं बनतीं: तुम्हें निर्माण मेनू में इन्हें तय करना होता है। दूरी के अनुसार घंटे या दिन लगते हैं; पड़ोसी भी बनाए तो बचा समय आधा हो जाता है। हर पूरी सड़क तुम्हारी बस्ती की समृद्धि भी बढ़ाती है।"],
      ["बाज़ार के दिन और गाड़ियाँ", "सड़क तैयार होते ही गाड़ियाँ चलती हैं, घुमंतू कारीगर आते हैं और शनिवार को साझा हाट लगता है।"],
    ]],
    ["संसाधन, धंधे और उनका उपयोग", [
      ["", "तुम ख़ज़ाने के तालरों से इमारतें बनवाते हो। कच्चा माल जमा नहीं करना पड़ता – समुदाय रोज़ उसे जुटाता और तैयार करता है।"],
      ["भोजन", "किसान फ़सल काटते हैं, चक्कियाँ आटा पीसती हैं, नानबाई रोटी पकाता है; साथ में मछली, शिकार और पनीर। भरी थाली विकास की कुंजी है: भोजन के धंधे ही गाँव से शहर बनने लायक खाना जुटाते हैं। भरपेट लोग स्वस्थ भी रहते हैं।"],
      ["अनाज भंडार", "अनाज अनंत नहीं जमा होता। चक्कियाँ और भंडार क्षमता बढ़ाते हैं ताकि पतझड़ की फ़सल सर्दी पार करा दे।"],
      ["लकड़ी और निर्माण सामग्री", "लकड़हारे, आरा मिलें और संगतराश लकड़ी व पत्थर देते हैं। लकड़हारों का शिविर और बाद में नगर की अपनी आरा मिल हो तो इमारतें काफ़ी जल्दी बनती हैं।"],
      ["औषधीय जड़ी-बूटियाँ", "जड़ी-बूटी वाली जड़ें और फूल चुनती है ताकि वैद्य बीमारों का इलाज करे और कम लोग काम से छूटें।"],
      ["व्यापारिक माल और ऊन", "जो तुम्हारी ज़मीन भरपूर देती है, वह निर्यात बनता है: मैदानों से ऊन, पहाड़ों से पत्थर और अयस्क, जंगलों से लकड़ी, तटों से मछली और नमक। अलग-अलग माल सड़कों पर मिलें तो दोनों बस्तियों को स्थायी अतिरिक्त विकास मिलता है।"],
    ]],
    ["समृद्धि, वर्ग और कर", [
      ["तीन वर्ग", "हर घर एक वर्ग का होता है: आम नागरिक रोज़ एक तालर कर देते हैं, कुशल कारीगर दो और धनी नागरिक तीन। ग़रीब गाँव में लगभग सब आम लोग हैं – उतने ही बड़े समृद्ध शहर में प्रति व्यक्ति लगभग दोगुना कर आता है।"],
      ["समृद्धि बढ़ाना", "समृद्धि टिकाऊ निवेश से आती है: पूरी सड़कें, शिक्षा और विद्यालय, शिल्प-संघ भवन, बाज़ार भवन व पुस्तकालय जैसी नागरिक इमारतें, और शानदार प्रतिष्ठा भवन। समृद्धि के साथ धीरे-धीरे ज़्यादा घर ऊपर उठते हैं। भरे भंडार पेट भरते और स्वस्थ रखते हैं, पर किसी को स्थायी रूप से ऊँचे वर्ग में नहीं ले जाते।"],
      ["दिखता उत्थान", "उत्थान नगर में दिखता है: साधारण झोपड़ियाँ लकड़ी-ढाँचे और कारीगरों के घर बनती हैं, फिर भव्य कुलीन हवेलियाँ। किसी नागरिक या घर को छूकर उसका वर्ग, धंधा और रोज़ का कर देखो।"],
      ["तालर किसलिए", "कर, दहेज और उपहारों से तुम धंधे, नागरिक व प्रतिष्ठा भवन और सुरक्षा बनाते हो – जो बदले में समृद्धि बढ़ाते हैं।"],
    ]],
    ["स्वास्थ्य और सुरक्षा", [
      ["स्वास्थ्य", "बीमार बिस्तर पर रहते हैं, काम से छूटते हैं, परिजनों को उनकी सेवा करनी पड़ती है और उस दिन वे कर नहीं देते। कड़ाके की सर्दी में बीमार काफ़ी बढ़ जाते हैं। कुएँ का पानी, जड़ी-बूटी कुटिया और औषधालय छुट्टियाँ घटाकर ख़ज़ाने को भी बचाते हैं।"],
      ["विपत्ति से सुरक्षा", "आग और डाकू गाँव की परीक्षा लेते हैं। अग्निशाला आग जल्दी बुझाती है और नगर रक्षक लुटेरों को भगाते हैं। बाढ़ वसंत और पतझड़ में कुछ समय मैदान डुबोती है, पर उपजाऊ मिट्टी छोड़ जाती है।"],
    ]],
  ],
};

const zh: Book = {
  first: {
    title: "欢迎来到你的村庄！",
    rules: [
      ["你种下一座村庄，看着它成长。", "你就是村长。"],
      ["你什么都不必做：你的村庄永远不会消亡。", "它在真实时间里自行成长——即使你几周都不来看。但没有你的照料，它只会是一座宁静的村庄。"],
      ["当你观看时，你能让它繁荣：", "借助新的行业、商路、每日祝福和明智的决定，你的村庄将突破极限，成长为城镇。"],
    ],
    go: "够了，我们开始吧", more: "再多告诉我一些！",
  },
  title: "城镇之书",
  chapters: [
    ["基本规则", [
      ["", "Samenland 是一款节奏缓慢、按真实时间稳步推进的游戏。没有点击压力，你不在时不会衰败，你的聚落也永远不会灭亡。"],
      ["村庄的极限", "没有村长的引导，你的聚落会长到村庄规模并稳定在那里——无人照料的土地养不活更多的人。只有你照顾好食物、健康、手艺和道路，它才会成为城镇。已经达到的不会崩塌：若照料减少，最多有几户人家迁走，直到聚落与供给重新平衡。"],
    ]],
    ["世界时间、光线与季节", [
      ["按时区的真实时间", "日出、黄昏和夜晚遵循你所在世界的时区。夜里窗户亮起温暖的灯光，村民在床上入睡。"],
      ["星期日休息", "每逢星期日，繁重的劳作暂停，村民聚在礼拜堂或村广场。"],
      ["春", "冰雪消融，草地花开。"],
      ["夏", "白昼漫长，田间与作坊一片繁忙。"],
      ["秋", "大丰收装满粮仓，谷物产量达到全年顶峰。"],
      ["冬", "积雪覆盖，土地冰封，劳作时间缩短，饥饿与病人增多。"],
    ]],
    ["发展、新居民与婚礼", [
      ["从小村到大都会", "你的聚落在数月数年间经历六个时代——从第一片开垦地到远近闻名的商业大都会。村庄之后的每一步，都要靠良好的供给来赢得。"],
      ["住房、迁入与迁出", "工匠们建起新房，屋顶一盖好，新家庭便搬进来，带来人手并每天纳税。但单靠大自然只能养活有限的家庭：缺少食物和行业时，人家会迁走，边缘的房屋空着，直到新的供给建筑把它们重新填满。"],
      ["婚礼", "年轻人成家时，婚礼钟声响起。聚落越大、越富足、越繁荣，婚礼就越频繁。在小村庄里，每场婚礼都是盛事：人人聚集，并请村长祝福。在城镇里，婚礼多在家人间举行——只有罕见的盛大婚礼才会召集全城。每场婚礼都会向公库献上嫁妆，数额随繁荣增长。"],
    ]],
    ["道路与村庄间的贸易", [
      ["村中小径", "聚落内的道路会自行形成，村民每天在门口、水井、田地和作坊之间往来，踏出小径。"],
      ["对外商路", "通往邻村的道路不会自行出现：你必须在建造菜单中正式决定。按距离需要数小时或数天；若邻村也从另一端修建，剩余时间减半。每条建成的道路还会提升你聚落的繁荣。"],
      ["集市日与马车", "道路建成后，马车往来，游方工匠到访，每逢星期六举行共同的集市。"],
    ]],
    ["资源、手艺及其用途", [
      ["", "你用公库的塔勒委托建造。你从不需要囤积原料——村民在日常中自行采集和加工。"],
      ["食物", "农民收割，磨坊磨面，面包师烤面包；还有鱼、野味和奶酪。丰盛的餐桌是成长的关键：只有食物行业丰富了菜单，食物才足以让村庄迈向城镇。吃饱的村民也更健康。"],
      ["粮仓", "谷物不能无限堆积。磨坊和粮仓扩大储量，让秋收带村庄度过冬天。"],
      ["木材与建材", "伐木工、锯木厂和石匠提供木材和石料。有伐木营地、后来又有本镇锯木厂时，新建筑会明显更快完工。"],
      ["草药", "草药婆在林下采集根茎与花朵，让医者照料病人，减少缺工。"],
      ["商品与羊毛", "你的土地盛产之物会成为抢手的出口品：平原出羊毛，山地出石料和矿石，林地出木材，海岸出鱼和盐。不同商品在商路上相遇时，会形成持久的协同，为两地带来额外的成长。"],
    ]],
    ["繁荣、阶层与税收", [
      ["三个阶层", "每户人家属于一个阶层：平民每天缴一塔勒税，熟练工匠两塔勒，富裕市民三塔勒。贫穷的村庄几乎全是平民——同等规模的繁荣城镇，人均税收几乎翻倍。"],
      ["增进繁荣", "繁荣来自持久的投资：建成的商路、教育以及学校、行会会馆、市场大厅和图书馆等公共建筑，还有壮丽的荣耀建筑。随着繁荣提升，越来越多的人家逐步上升。满仓让人吃饱、健康，但不会让任何人长久地升入更高阶层。"],
      ["看得见的上升", "上升体现在城貌中：简陋的小屋变成木构房与工匠屋，再变成气派的贵族宅邸。点一下村民或房屋，羊皮纸会显示其阶层、职业和每日税额。"],
      ["塔勒的用处", "用税收、嫁妆和礼物资助新行业、公共与荣耀建筑以及防护设施——它们又反过来提升繁荣。"],
    ]],
    ["健康与防护", [
      ["健康", "病人卧床、缺工，需要亲人照料，当天也不纳税。严冬时病人明显增多。干净的井水、草药屋和药房能减少缺工，也保护了公库。"],
      ["防范灾祸", "火灾和强盗考验着村庄。消防站迅速灭火，城卫驱逐劫掠者。河水在春秋两季短暂淹没河滩草地，却会留下格外肥沃的土壤。"],
    ]],
  ],
};

const ja: Book = {
  first: {
    title: "あなたの村へようこそ！",
    rules: [
      ["村をつくり、育つのを見守ります。", "あなたは村長です。"],
      ["何もしなくて大丈夫：村は決して滅びません。", "何週間見に来なくても、現実の時間とともにひとりでに育ちます。ただし、あなたの世話がなければ穏やかな村のままです。"],
      ["見守るとき、村を栄えさせられます：", "新しい生業、交易路、毎日の祝福、賢い決断によって、村は限界を越えて町へと育ちます。"],
    ],
    go: "これで十分、始めよう", more: "もっと教えて！",
  },
  title: "町の書",
  chapters: [
    ["基本のルール", [
      ["", "Samenland は現実の時間で着実に進む、ゆっくりとしたゲームです。クリックの義務も、留守中の衰退もなく、あなたの集落が滅びることは決してありません。"],
      ["村の限界", "村長の導きがなければ、集落は村の大きさまで育ってそこで落ち着きます——手入れされない土地はそれ以上の人を養えません。食べ物、健康、手仕事、道を整えたときにだけ町へと育ちます。一度到達したものは崩れません。世話が減っても、集落と供給が再び釣り合うまで、いくつかの家族が去るだけです。"],
    ]],
    ["世界の時間、光、季節", [
      ["タイムゾーンに沿った現実の時間", "日の出、夕暮れ、夜はあなたの世界のタイムゾーンに従います。夜には窓に温かな灯がともり、村人は眠ります。"],
      ["日曜の安息", "毎週日曜は重労働が休みになり、村人は礼拝堂や広場に集まります。"],
      ["春", "雪解けと花咲く草原。"],
      ["夏", "長い昼と、畑や作業場のにぎわい。"],
      ["秋", "大収穫が蔵を満たし、穀物の収量が一年で最も高くなります。"],
      ["冬", "雪に覆われ、地面は凍り、働く時間は短くなり、飢えと病人が増えます。"],
    ]],
    ["発展、移住者、婚礼", [
      ["小村から大都市へ", "集落は数か月、数年をかけて六つの時代を進みます——最初の開墾地から名高い交易都市まで。村から先の一歩一歩は、よい供給で勝ち取る必要があります。"],
      ["住まい、移住と転出", "大工が新しい家を建て、屋根がかかると新しい家族が移り住み、働き手となって毎日税を納めます。けれど自然だけでは養える家族に限りがあります。食べ物や生業が足りないと家族は去り、外れの家は新しい供給の建物が埋めるまで空き家になります。"],
      ["婚礼", "若者が所帯を持つと婚礼の鐘が鳴ります。集落が大きく、満ち足り、豊かなほど婚礼は増えます。小さな村ではどの婚礼も一大行事で、皆が集まり村長に祝福を願います。町では多くが家族内の祝いになり、まれな盛大な婚礼だけが町じゅうを集めます。婚礼ごとに持参金が金庫に納められ、その額は豊かさとともに増えます。"],
    ]],
    ["道と村どうしの交易", [
      ["村の小道", "集落の中の道は、村人が毎日戸口、井戸、畑、作業場を行き来するうちに自然とできます。"],
      ["外への交易路", "隣村への道は自然にはできません。村長として建設メニューで正式に決めます。距離に応じて数時間から数日かかり、隣村も向こうから建てれば残り時間は半分になります。完成した道はそれぞれ集落の豊かさも高めます。"],
      ["市の日と荷車", "道ができれば荷車が行き交い、遍歴職人が立ち寄り、土曜には共同の市が開かれます。"],
    ]],
    ["資源、手仕事とその役割", [
      ["", "建物は金庫のターラーで依頼します。原料を貯める必要はなく、村人が日々の暮らしで集めて加工します。"],
      ["食べ物", "農夫が刈り入れ、水車小屋が粉をひき、パン屋がパンを焼きます。魚、獣肉、チーズも加わります。豊かな食卓は成長の鍵です。食の生業が献立を広げてはじめて、村から町へ進むだけの食べ物がそろいます。満腹の村人は健康にもなります。"],
      ["穀物蔵", "穀物は際限なく積めません。水車小屋と蔵が容量を広げ、秋の収穫で冬を越せます。"],
      ["木材と建材", "木こり、製材所、石工が木と石を用意します。木こり小屋や、のちに町の製材所があれば、新しい建物がずっと早く完成します。"],
      ["薬草", "薬草摘みが根や花を集め、治療師が病人を看て、仕事を休む人が減ります。"],
      ["交易品と羊毛", "土地が豊かに生むものは人気の輸出品になります。平野は羊毛、山は石と鉱石、森は木材、海辺は魚と塩。異なる品が交易路で出会うと、両方の集落に長く続く追加の成長をもたらします。"],
    ]],
    ["豊かさ、身分、税", [
      ["三つの身分", "どの世帯もいずれかの身分に属します。庶民は毎日1ターラー、熟練職人は2、裕福な市民は3の税を納めます。貧しい村はほぼ庶民ばかりですが、同じ大きさの豊かな町は一人あたりほぼ倍の税を集めます。"],
      ["豊かさを高める", "豊かさは残る投資から生まれます。完成した交易路、教育、学校・ギルド会館・市場ホール・図書館などの公共建築、そして壮麗な威信建築。豊かさが増すと、少しずつ多くの世帯が上の身分へ上がります。満ちた蔵は腹を満たし健康を保ちますが、誰かを長く上の身分に上げることはありません。"],
      ["目に見える出世", "出世は町並みに表れます。素朴な小屋が木組みの家や職人の家に、さらに堂々たる貴族の館になります。村人や家をタップすると、羊皮紙に身分、職業、日々の税が表示されます。"],
      ["ターラーの使い道", "税、持参金、贈り物で新しい生業、公共・威信建築、防備をまかない、それがまた豊かさを高めます。"],
    ]],
    ["健康と災いへの備え", [
      ["健康", "病人は床に伏し、仕事を休み、家族の看病が必要になり、その日は税を納めません。厳しい冬には病人がはっきり増えます。井戸の水、薬草小屋、薬局が休みを減らし、金庫も守ります。"],
      ["災いへの備え", "火事と盗賊団が村を試します。消防小屋はすばやく火を消し、町の衛兵が略奪者を追い払います。川の洪水は春と秋に一時河原を水に沈めますが、とても肥えた土を残します。"],
    ]],
  ],
};

export const BOOK: Record<Lang, Book> = { de, en, fr, es, ar, hi, zh, ja };
