// Strings for the "Seelen- und Standesbuch" tab of the village roll, all eight languages.
import type { Lang } from "../i18n";

export type CensusText = {
  tabRoll: string; tabBook: string;
  estatesH: string; estates: [string, string, string];
  hearths: (h: number, s: number) => string;
  agesH: string; ages: [string, string, string, string];
  tradesH: string; trades: [string, string, string];
  kinH: string; couples: (n: number) => string; widowed: (n: number) => string; newcomers: (n: number) => string;
  verdict: [string, string, string];
};

const de: CensusText = {
  tabRoll: "Bürgerrolle", tabBook: "Seelen- & Standesbuch",
  estatesH: "Die drei Stände", estates: ["Kötter, Häusler & Gesinde", "Ehrbare Bürger & Handwerker", "Erbgesessene & Patrizier"],
  hearths: (h, s) => `${h} ${h === 1 ? "Herdstelle" : "Herdstellen"} · ${s} Seelen`,
  agesH: "Die vier Lebensalter", ages: ["Kinder", "Jungvolk & Gesellen", "Mündige Bürgersleute", "Die Ergrauten"],
  tradesH: "Vom Broterwerb", trades: ["Nährstand", "Werkstand", "Gemeinwesen"],
  kinH: "Von Ehe & Zuzug", couples: (n) => `${n} Ehepaare an eigenem Herde`, widowed: (n) => `${n} verwitwet`, newcomers: (n) => `${n} Seelen eben erst zugezogen`,
  verdict: ["Ein armer Flecken, der von seiner Hände Arbeit lebt.", "Ein ehrbarer Ort, darinnen das Handwerk floriert.", "Ein wohlhabend Gemeinwesen, reich an Erbgesessenen."],
};
const en: CensusText = {
  tabRoll: "Roll of citizens", tabBook: "Book of souls & estates",
  estatesH: "The three estates", estates: ["Cottagers & servants", "Honest burghers & craftsmen", "Freeholders & patricians"],
  hearths: (h, s) => `${h} ${h === 1 ? "hearth" : "hearths"} · ${s} souls`,
  agesH: "The four ages", ages: ["Children", "Youth & journeymen", "Grown folk", "The grey-haired"],
  tradesH: "Of livelihoods", trades: ["Those who feed", "Those who craft", "The common good"],
  kinH: "Of marriage & newcomers", couples: (n) => `${n} married couples at their own hearth`, widowed: (n) => `${n} widowed`, newcomers: (n) => `${n} souls newly arrived`,
  verdict: ["A poor place living by the work of its hands.", "An honest place where the crafts flourish.", "A wealthy commune, rich in freeholders."],
};
const fr: CensusText = {
  tabRoll: "Rôle des habitants", tabBook: "Livre des âmes & des états",
  estatesH: "Les trois états", estates: ["Journaliers & domestiques", "Bourgeois & artisans", "Notables & patriciens"],
  hearths: (h, s) => `${h} ${h === 1 ? "feu" : "feux"} · ${s} âmes`,
  agesH: "Les quatre âges", ages: ["Enfants", "Jeunesse & compagnons", "Gens d'âge mûr", "Les anciens"],
  tradesH: "Des métiers", trades: ["Ceux qui nourrissent", "Ceux qui façonnent", "Le bien commun"],
  kinH: "Des mariages & des arrivants", couples: (n) => `${n} couples en leur propre foyer`, widowed: (n) => `${n} veufs ou veuves`, newcomers: (n) => `${n} âmes tout juste arrivées`,
  verdict: ["Un pauvre bourg qui vit du travail de ses mains.", "Un lieu honnête où fleurit l'artisanat.", "Une commune prospère, riche en notables."],
};
const es: CensusText = {
  tabRoll: "Padrón de vecinos", tabBook: "Libro de almas y estados",
  estatesH: "Los tres estados", estates: ["Jornaleros y criados", "Vecinos honrados y artesanos", "Hacendados y patricios"],
  hearths: (h, s) => `${h} ${h === 1 ? "hogar" : "hogares"} · ${s} almas`,
  agesH: "Las cuatro edades", ages: ["Niños", "Mozos y oficiales", "Gente adulta", "Los ancianos"],
  tradesH: "Del sustento", trades: ["Los que alimentan", "Los que labran oficios", "El bien común"],
  kinH: "De bodas y forasteros", couples: (n) => `${n} matrimonios con hogar propio`, widowed: (n) => `${n} viudos`, newcomers: (n) => `${n} almas recién llegadas`,
  verdict: ["Un lugar pobre que vive del trabajo de sus manos.", "Un lugar honrado donde florecen los oficios.", "Una villa próspera, rica en hacendados."],
};
const ar: CensusText = {
  tabRoll: "سجلّ الأهالي", tabBook: "دفتر النفوس والطبقات",
  estatesH: "الطبقات الثلاث", estates: ["الأجراء والخدم", "الحرفيون وأهل البلد", "الأعيان والوجهاء"],
  hearths: (h, s) => `${h} بيت · ${s} نفس`,
  agesH: "أعمار الحياة الأربعة", ages: ["الأطفال", "الفتيان والصنّاع", "الراشدون", "الشيوخ"],
  tradesH: "في أسباب الرزق", trades: ["أهل القوت", "أهل الصنعة", "الصالح العام"],
  kinH: "في الزواج والوافدين", couples: (n) => `${n} زوجًا في بيوتهم`, widowed: (n) => `${n} أرامل`, newcomers: (n) => `${n} نفسًا وفدوا حديثًا`,
  verdict: ["بلدة فقيرة تعيش من كدّ يديها.", "بلدة كريمة تزدهر فيها الحرف.", "جماعة ميسورة غنية بالأعيان."],
};
const hi: CensusText = {
  tabRoll: "नागरिक पंजी", tabBook: "जन एवं वर्ग पुस्तिका",
  estatesH: "तीन वर्ग", estates: ["मज़दूर व सेवक", "प्रतिष्ठित नागरिक व कारीगर", "ज़मींदार व कुलीन"],
  hearths: (h, s) => `${h} चूल्हे · ${s} जन`,
  agesH: "जीवन की चार अवस्थाएँ", ages: ["बच्चे", "युवा व शागिर्द", "वयस्क", "बुज़ुर्ग"],
  tradesH: "आजीविका", trades: ["अन्नदाता", "कारीगर", "लोकहित"],
  kinH: "विवाह व नए आगंतुक", couples: (n) => `अपने घर में ${n} दंपती`, widowed: (n) => `${n} विधुर/विधवा`, newcomers: (n) => `${n} जन हाल ही में आए`,
  verdict: ["एक गरीब बस्ती जो हाथों की मेहनत से जीती है।", "एक प्रतिष्ठित स्थान जहाँ शिल्प फलता है।", "एक समृद्ध समुदाय, कुलीनों से भरा।"],
};
const zh: CensusText = {
  tabRoll: "居民名册", tabBook: "户口与等第簿",
  estatesH: "三等人户", estates: ["佃户与仆役", "良民与工匠", "世家与望族"],
  hearths: (h, s) => `${h}户 · ${s}口`,
  agesH: "人生四龄", ages: ["孩童", "少年与学徒", "壮年", "耆老"],
  tradesH: "生计", trades: ["农食之业", "百工之业", "公众之事"],
  kinH: "婚姻与迁入", couples: (n) => `自立门户的夫妇${n}对`, widowed: (n) => `鳏寡${n}人`, newcomers: (n) => `新近迁入${n}口`,
  verdict: ["贫寒小村，靠双手劳作为生。", "殷实之地，百工兴旺。", "富庶之乡，望族云集。"],
};
const ja: CensusText = {
  tabRoll: "住民名簿", tabBook: "人別・身分帳",
  estatesH: "三つの身分", estates: ["小作人と奉公人", "町衆と職人", "旧家と名士"],
  hearths: (h, s) => `${h}戸 · ${s}人`,
  agesH: "人生の四つの年代", ages: ["子ども", "若衆と職人見習い", "一人前の大人", "年寄り"],
  tradesH: "なりわい", trades: ["食を担う者", "手業の者", "公の務め"],
  kinH: "婚姻と転入", couples: (n) => `所帯を構える夫婦 ${n}組`, widowed: (n) => `連れ合いを亡くした者 ${n}人`, newcomers: (n) => `越してきたばかりの者 ${n}人`,
  verdict: ["手仕事で暮らす貧しい村。", "職人が栄える堅実な土地。", "名士の多い豊かな共同体。"],
};

export const CENSUS: Record<Lang, CensusText> = { de, en, fr, es, ar, hi, zh, ja };
