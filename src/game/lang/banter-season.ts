/** Seasonal lines matching what the map shows (sheaves, firewood, ice, straw mantles, laundry, bell). */
import type { Lang } from "../i18n";
type S = Record<"autumn" | "winter" | "spring" | "summer", string[]>;

export const SEASON_BANTER: Record<Lang, S> = {
  de: {
    autumn: ["Die Garben stehen zum Trocknen auf dem Feld – bloß kein Regen jetzt.", "Holz an die Nordwand, so ist's Brauch. Da hält es trocken und die Kälte draußen.", "Im Dörrofen liegen die Äpfel. Riecht Ihr das bis hierher?"],
    winter: ["Die Tränke ist wieder zugefroren. Ich hol die Axt fürs Eis.", "Ich hab den Weg zum Brunnen freigeschaufelt. Gern geschehen.", "Den jungen Kirschbaum hab ich in Stroh gewickelt. Der soll mir nicht erfrieren."],
    spring: ["Die Beete sind gejätet, jetzt kann der Kohl kommen.", "Frische Weidenruten für den Zaun – das Flechten verlernt man nie.", "Endlich wieder Wäsche auf der Leine. Riecht nach Frühling."],
    summer: ["Wenn die Mittagsglocke läutet, halt ich kurz inne. Ein Atemzug, dann weiter.", "Die Wäsche ist trocken, bevor ich die letzte aufgehängt hab."],
  },
  en: {
    autumn: ["The sheaves are drying in the field – no rain now, please.", "Firewood goes against the north wall, as is custom. Keeps it dry and the cold out.", "The apples are in the drying oven. Can you smell it from here?"],
    winter: ["The trough froze over again. I'll fetch the axe for the ice.", "I've shovelled the path to the well. You're welcome.", "I wrapped the young cherry tree in straw. It shan't freeze on my watch."],
    spring: ["The beds are weeded, now the cabbage can come.", "Fresh willow rods for the fence – you never forget how to weave.", "Laundry on the line at last. Smells of spring."],
    summer: ["When the midday bell rings I stop for a breath. Then back to work.", "The washing's dry before I've hung the last piece."],
  },
  fr: {
    autumn: ["Les gerbes sèchent au champ – surtout pas de pluie maintenant.", "Le bois contre le mur nord, c'est la coutume. Il y reste sec et le froid dehors.", "Les pommes sont au four à sécher. Vous sentez jusqu'ici ?"],
    winter: ["L'abreuvoir a encore gelé. Je vais chercher la hache pour la glace.", "J'ai dégagé le chemin jusqu'au puits. De rien.", "J'ai enveloppé le jeune cerisier de paille. Il ne gèlera pas."],
    spring: ["Les plates-bandes sont désherbées, le chou peut venir.", "De l'osier frais pour la clôture – on n'oublie jamais comment tresser.", "Enfin du linge sur la corde. Ça sent le printemps."],
    summer: ["Quand sonne la cloche de midi, je m'arrête un souffle. Puis on reprend.", "Le linge est sec avant que j'aie étendu le dernier."],
  },
  es: {
    autumn: ["Las gavillas se secan en el campo; ahora nada de lluvia, por favor.", "La leña contra la pared norte, como manda la costumbre. Allí se seca y el frío se queda fuera.", "Las manzanas están en el horno de secado. ¿Lo oléis desde aquí?"],
    winter: ["El abrevadero se ha vuelto a helar. Voy por el hacha para el hielo.", "He despejado el camino hasta el pozo. De nada.", "He envuelto el cerezo joven en paja. No se me helará."],
    spring: ["Los bancales están escardados, ya puede venir la col.", "Mimbre fresco para la cerca: trenzar no se olvida nunca.", "Por fin ropa en el tendedero. Huele a primavera."],
    summer: ["Cuando tocan las campanas del mediodía, me detengo un respiro. Luego sigo.", "La ropa está seca antes de tender la última prenda."],
  },
  ar: {
    autumn: ["الحُزَم تجفّ في الحقل، فلا مطر الآن رجاءً.", "الحطب عند الجدار الشمالي كما جرت العادة، يبقى جافًا والبرد خارجًا.", "التفاح في فرن التجفيف. أتشمّ رائحته من هنا؟"],
    winter: ["تجمّد الحوض مرة أخرى. سأحضر الفأس لكسر الجليد.", "جرفتُ الطريق إلى البئر. لا شكر على واجب.", "لففتُ شجرة الكرز الصغيرة بالقش، لن تتجمّد."],
    spring: ["نُقّيت الأحواض من الأعشاب، فليأتِ الملفوف الآن.", "أغصان صفصاف طرية للسياج، لا يُنسى الضفر أبدًا.", "أخيرًا غسيل على الحبل. رائحته رائحة الربيع."],
    summer: ["حين يدق جرس الظهيرة أتوقف لحظة لألتقط أنفاسي، ثم أعود للعمل.", "يجفّ الغسيل قبل أن أعلّق آخر قطعة."],
  },
  hi: {
    autumn: ["पूले खेत में सूख रहे हैं – अभी बारिश न हो, बस।", "लकड़ी उत्तर की दीवार से लगाकर रखते हैं, यही रीत है। सूखी रहती है और ठंड बाहर।", "सेब सुखाने के भट्ठे में हैं। यहाँ तक खुशबू आ रही है न?"],
    winter: ["नाँद फिर जम गई। बर्फ़ तोड़ने को कुल्हाड़ी लाता हूँ।", "कुएँ तक का रास्ता मैंने साफ़ कर दिया। कोई बात नहीं।", "छोटे चेरी के पेड़ को पुआल में लपेट दिया। ठंड से बचा रहेगा।"],
    spring: ["क्यारियों की निराई हो गई, अब गोभी आ सकती है।", "बाड़ के लिए ताज़ी बेंत – बुनना कोई नहीं भूलता।", "आख़िरकार रस्सी पर कपड़े। वसंत की महक है।"],
    summer: ["दोपहर की घंटी बजती है तो मैं एक साँस भर रुकता हूँ, फिर काम पर।", "आख़िरी कपड़ा टाँगने से पहले ही पहले वाले सूख जाते हैं।"],
  },
  zh: {
    autumn: ["麦捆在田里晾着——这会儿可千万别下雨。", "柴火码在北墙边，老规矩了。这样干燥，也挡寒气。", "苹果在烘房里烘着呢。您在这儿闻得到吗？"],
    winter: ["水槽又冻上了。我去拿斧子破冰。", "去井边的路我已经铲开了。不客气。", "我给小樱桃树裹了草衣，可不能让它冻着。"],
    spring: ["菜畦除过草了，可以种白菜了。", "新柳条编篱笆——编法一辈子忘不了。", "终于又能晾衣服了。满是春天的味道。"],
    summer: ["午钟一响，我就停下喘口气，然后接着干。", "最后一件还没晾上，头一件已经干了。"],
  },
  ja: {
    autumn: ["麦束を畑で干しているところです。今だけは雨はご勘弁を。", "薪は北の壁に積むのが習わし。乾いたままで寒さも防げます。", "乾燥窯にりんごが入っています。ここまで香りませんか？"],
    winter: ["水槽がまた凍りました。氷を割る斧を取ってきます。", "井戸までの道を雪かきしておきました。どういたしまして。", "若い桜の木をわらで包みました。凍えさせはしません。"],
    spring: ["畝の草取りが済みました。さあキャベツを植えましょう。", "垣根用の新しい柳の枝。編み方は一生忘れません。", "ようやく物干しに洗濯物。春の匂いがします。"],
    summer: ["昼の鐘が鳴ったら、ひと息だけ手を止めます。それからまた仕事です。", "最後の一枚を干す前に、最初のが乾いてしまいます。"],
  },
};
