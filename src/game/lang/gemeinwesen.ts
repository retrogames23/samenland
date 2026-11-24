import type { Lang } from "../i18n";

/** Gemeinwesen (gemeinwesen.ts): one line on the five Gemeinwesen build cards from the cut-over, all eight languages. */
export const GEMEINWESEN_T: Record<Lang, string> = {
  de: "Gemeinwesen: Für Handelsstadt und Hansestadt reichen 1 bzw. 2 beliebige von Kräuterhütte, Heiler, Bibliothek, Badestube und Beginenhof. Jedes weitere gibt noch etwas Platz für Haushalte.",
  en: "Community care: a trading town needs any 1, a Hanseatic city any 2 of herb hut, healer, library, bathhouse and beguinage. Each further one still adds some room for households.",
  fr: "Bien commun : une ville marchande en demande 1, une ville hanséatique 2, au choix parmi herboristerie, guérisseuse, bibliothèque, étuves et béguinage. Chaque bâtiment supplémentaire ajoute encore un peu de place pour les foyers.",
  es: "Bien común: una ciudad mercantil necesita 1 y una ciudad hanseática 2, cualesquiera de choza de hierbas, curandera, biblioteca, baños y beguinaje. Cada uno más añade aún algo de espacio para hogares.",
  ar: "الرعاية العامة: تحتاج المدينة التجارية إلى واحد، والمدينة الهانزية إلى اثنين، أيًّا كانا من كوخ الأعشاب والمعالجة والمكتبة والحمّام وبيت البيغينات. وكل مبنى إضافي يزيد قليلًا من مكان الأسر.",
  hi: "सामुदायिक सेवा: व्यापार नगर के लिए कोई 1 और हंसा नगर के लिए कोई 2 चाहिए — जड़ी-बूटी कुटिया, वैद्य, पुस्तकालय, स्नानघर और बेगीन आश्रम में से। हर अतिरिक्त भवन घरों के लिए थोड़ी और जगह देता है।",
  zh: "公共福祉：商贸城需任选1座、汉萨城需任选2座——草药屋、医者、图书馆、浴堂、贝居安会院皆可。每多建一座，仍可再容纳些许住户。",
  ja: "共同福祉：商業都市には1つ、ハンザ都市には2つ、薬草小屋・治療師・図書館・浴場・ベギン会院のどれでも足ります。さらに建てるごとに世帯の余地が少し増えます。",
};

/** Badestube build card from the cut-over: its own effect (sickness.ts), all eight languages. */
export const BADESTUBE_WINTER_T: Record<Lang, string> = {
  de: "Halbiert den Krankheitszuschlag im Winter (mit Erntedankhalle Stufe 3 bleibt ein Viertel).",
  en: "Halves the winter sickness surcharge (with harvest hall step 3 a quarter remains).",
  fr: "Réduit de moitié le supplément de maladie en hiver (avec la halle des moissons niveau 3, il n’en reste qu’un quart).",
  es: "Reduce a la mitad el recargo de enfermedad en invierno (con la sala de la cosecha nivel 3 queda una cuarta parte).",
  ar: "يخفّض زيادة المرض في الشتاء إلى النصف (ومع قاعة الحصاد في المرحلة 3 يبقى الربع).",
  hi: "सर्दियों में बीमारी की अतिरिक्त दर आधी करता है (फ़सल-उत्सव भवन चरण 3 के साथ एक चौथाई बचती है)।",
  zh: "冬季额外的患病率减半（与丰收节大厅第3阶段同时具备时，只剩四分之一）。",
  ja: "冬の病気の上乗せを半分にします（収穫祭ホール第3段階と合わせると4分の1）。",
};
