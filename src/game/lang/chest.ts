import type { Lang } from "../i18n";

/** Village chest (Gemeindetruhe): capacity, expansions and the optional overflow letter. */
export type ChestText = {
  title: string; intro: string; full: string;
  levels: [string, string, string, string];
  expand: string; need: (stage: string) => string; max: string;
  notify: string;
  mail: { subject: (t: string) => string; hello: (n: string) => string; body: (t: string, cash: number, cap: number) => string; cta: string; sign: string };
};

const de: ChestText = {
  title: "Gemeindetruhe", intro: "Die Truhe fasst nur so viele Mark. Ist sie voll, behalten die Bürger ihre Steuern – gib also aus oder baue die Truhe aus.",
  full: "Die Truhe ist voll – neue Steuern finden keinen Platz.",
  levels: ["Holztruhe", "Eisenbeschlagene Truhe", "Schatzkammer", "Stadtkasse"],
  expand: "Ausbauen", need: (s) => `ab Stufe ${s}`, max: "Die Stadtkasse ist vollständig ausgebaut.",
  notify: "E-Mail, wenn die Truhe bald voll ist",
  mail: { subject: (t) => `Die Truhe von ${t} ist fast voll`, hello: (n) => `Hallo ${n},`, body: (t, c, k) => `in der Gemeindetruhe von ${t} liegen schon ${c} von ${k} Mark. Ist sie voll, behalten die Bürger ihre Steuern. Gib etwas für dein Dorf aus oder baue die Truhe aus.`, cta: "Zum Dorf", sign: "Dein Kämmerer aus Samenland" },
};
const en: ChestText = {
  title: "Village chest", intro: "The chest holds only so many Mark. When it is full, the burghers keep their taxes – so spend, or expand the chest.",
  full: "The chest is full – new taxes find no room.",
  levels: ["Wooden chest", "Iron-bound chest", "Treasury vault", "Town exchequer"],
  expand: "Expand", need: (s) => `from stage ${s}`, max: "The town exchequer is fully expanded.",
  notify: "Email me when the chest is nearly full",
  mail: { subject: (t) => `The chest of ${t} is nearly full`, hello: (n) => `Hello ${n},`, body: (t, c, k) => `the village chest of ${t} already holds ${c} of ${k} Mark. Once it is full, the burghers keep their taxes. Spend something on your village or expand the chest.`, cta: "Visit your village", sign: "Your treasurer from Samenland" },
};
const fr: ChestText = {
  title: "Coffre communal", intro: "Le coffre ne contient qu'un nombre limité de marks. Plein, les bourgeois gardent leurs impôts – dépense ou agrandis le coffre.",
  full: "Le coffre est plein – les nouveaux impôts n'y trouvent plus de place.",
  levels: ["Coffre en bois", "Coffre ferré", "Salle du trésor", "Trésorerie de la ville"],
  expand: "Agrandir", need: (s) => `dès le stade ${s}`, max: "La trésorerie est entièrement agrandie.",
  notify: "M'écrire quand le coffre est presque plein",
  mail: { subject: (t) => `Le coffre de ${t} est presque plein`, hello: (n) => `Bonjour ${n},`, body: (t, c, k) => `le coffre communal de ${t} contient déjà ${c} marks sur ${k}. Une fois plein, les bourgeois gardent leurs impôts. Dépense pour ton village ou agrandis le coffre.`, cta: "Vers le village", sign: "Ton trésorier de Samenland" },
};
const es: ChestText = {
  title: "Arca del concejo", intro: "El arca solo guarda cierta cantidad de marcos. Llena, los vecinos se quedan sus impuestos: gasta o amplía el arca.",
  full: "El arca está llena: los nuevos impuestos no caben.",
  levels: ["Arca de madera", "Arca herrada", "Cámara del tesoro", "Tesorería de la ciudad"],
  expand: "Ampliar", need: (s) => `desde la etapa ${s}`, max: "La tesorería está totalmente ampliada.",
  notify: "Avisarme por correo cuando el arca esté casi llena",
  mail: { subject: (t) => `El arca de ${t} está casi llena`, hello: (n) => `Hola ${n}:`, body: (t, c, k) => `el arca del concejo de ${t} ya guarda ${c} de ${k} marcos. Cuando esté llena, los vecinos se quedarán sus impuestos. Gasta algo en tu pueblo o amplía el arca.`, cta: "Ir al pueblo", sign: "Tu tesorero de Samenland" },
};
const ar: ChestText = {
  title: "خزينة القرية", intro: "لا تتسع الخزينة إلا لعدد محدود من الماركات. إذا امتلأت احتفظ السكان بضرائبهم، فأنفق أو وسّع الخزينة.",
  full: "الخزينة ممتلئة، ولا مكان للضرائب الجديدة.",
  levels: ["صندوق خشبي", "صندوق مصفّح بالحديد", "غرفة الكنز", "بيت مال المدينة"],
  expand: "توسيع", need: (s) => `ابتداءً من مرحلة ${s}`, max: "بيت مال المدينة موسّع بالكامل.",
  notify: "راسلني عندما تقترب الخزينة من الامتلاء",
  mail: { subject: (t) => `خزينة ${t} على وشك الامتلاء`, hello: (n) => `مرحبًا ${n}،`, body: (t, c, k) => `في خزينة ${t} الآن ${c} من أصل ${k} مارك. عندما تمتلئ سيحتفظ السكان بضرائبهم. أنفق شيئًا على قريتك أو وسّع الخزينة.`, cta: "إلى القرية", sign: "أمين مالك من Samenland" },
};
const hi: ChestText = {
  title: "ग्राम संदूक", intro: "संदूक में सीमित मार्क ही आते हैं। भर जाने पर नागरिक अपना कर अपने पास रखते हैं – इसलिए खर्च करें या संदूक बढ़ाएँ।",
  full: "संदूक भर गया है – नए कर के लिए जगह नहीं।",
  levels: ["लकड़ी का संदूक", "लोहे से जड़ा संदूक", "खज़ाना कक्ष", "नगर कोष"],
  expand: "बढ़ाएँ", need: (s) => `${s} स्तर से`, max: "नगर कोष पूरी तरह बढ़ चुका है।",
  notify: "संदूक लगभग भरने पर मुझे ईमेल करें",
  mail: { subject: (t) => `${t} का संदूक लगभग भर गया है`, hello: (n) => `नमस्ते ${n},`, body: (t, c, k) => `${t} के ग्राम संदूक में ${k} में से ${c} मार्क हैं। भर जाने पर नागरिक अपना कर रख लेंगे। अपने गाँव पर कुछ खर्च करें या संदूक बढ़ाएँ।`, cta: "गाँव चलें", sign: "Samenland से आपका कोषाध्यक्ष" },
};
const zh: ChestText = {
  title: "村库宝箱", intro: "宝箱只能装下有限的马克。装满后，居民会自己留着税金——所以花掉它，或扩建宝箱。",
  full: "宝箱已满——新的税金放不下了。",
  levels: ["木箱", "铁箍箱", "藏宝库", "城市金库"],
  expand: "扩建", need: (s) => `${s}阶段起`, max: "城市金库已完全扩建。",
  notify: "宝箱快满时发邮件提醒我",
  mail: { subject: (t) => `${t}的宝箱快满了`, hello: (n) => `你好，${n}：`, body: (t, c, k) => `${t}的村库宝箱里已有${c}/${k}马克。装满后，居民会自己留着税金。为村庄花点钱，或扩建宝箱吧。`, cta: "前往村庄", sign: "来自Samenland的司库" },
};
const ja: ChestText = {
  title: "村の金櫃", intro: "金櫃に入るマルクには限りがあります。満杯になると住民は税を手元に残します――使うか、金櫃を広げましょう。",
  full: "金櫃は満杯です――新しい税の入る場所がありません。",
  levels: ["木の櫃", "鉄張りの櫃", "宝物庫", "町の金庫"],
  expand: "拡張", need: (s) => `${s}の段階から`, max: "町の金庫は最大まで拡張済みです。",
  notify: "金櫃が満杯に近づいたらメールで知らせる",
  mail: { subject: (t) => `${t}の金櫃がもうすぐ満杯です`, hello: (n) => `${n}さん、こんにちは。`, body: (t, c, k) => `${t}の金櫃には${k}マルク中${c}マルクが入っています。満杯になると住民は税を手元に残します。村のために使うか、金櫃を広げましょう。`, cta: "村へ行く", sign: "Samenlandの会計係より" },
};

export const CHEST: Record<Lang, ChestText> = { de, en, fr, es, ar, hi, zh, ja };
