import type { Lang } from "../i18n";

type Text = { label: string; placeholder: string; save: string; saved: string; unnamed: string; lines: (n: string) => string[]; sleepy: (n: string) => string };

export const DOG: Record<Lang, Text> = {
  de: { label: "Name deines Dorfhundes", placeholder: "z. B. Krümel", save: "Speichern", saved: "Gespeichert!", unnamed: "Der Dorfhund",
    lines: (n) => [`${n} wedelt wie verrückt.`, `Wuff! ${n} bringt dir einen Stock.`, `${n} schnüffelt an deinen Stiefeln.`, `${n} legt den Kopf schief.`, `${n} dreht sich dreimal im Kreis.`, `${n} will gekrault werden.`],
    sleepy: (n) => `${n} schnarcht leise auf dem Schaffell.` },
  en: { label: "Your village dog's name", placeholder: "e.g. Biscuit", save: "Save", saved: "Saved!", unnamed: "The village dog",
    lines: (n) => [`${n} wags like mad.`, `Woof! ${n} brings you a stick.`, `${n} sniffs your boots.`, `${n} tilts its head.`, `${n} spins around three times.`, `${n} wants a scratch.`],
    sleepy: (n) => `${n} snores softly on the sheepskin.` },
  fr: { label: "Nom de ton chien", placeholder: "ex. Biscotte", save: "Enregistrer", saved: "Enregistré !", unnamed: "Le chien du village",
    lines: (n) => [`${n} remue la queue comme un fou.`, `Ouaf ! ${n} t'apporte un bâton.`, `${n} renifle tes bottes.`, `${n} penche la tête.`],
    sleepy: (n) => `${n} ronfle doucement sur la peau de mouton.` },
  es: { label: "Nombre de tu perro", placeholder: "p. ej. Galleta", save: "Guardar", saved: "¡Guardado!", unnamed: "El perro del pueblo",
    lines: (n) => [`${n} mueve la cola sin parar.`, `¡Guau! ${n} te trae un palo.`, `${n} olfatea tus botas.`, `${n} ladea la cabeza.`],
    sleepy: (n) => `${n} ronca bajito sobre la piel de oveja.` },
  ar: { label: "اسم كلب قريتك", placeholder: "مثلًا: كعكة", save: "حفظ", saved: "تم الحفظ!", unnamed: "كلب القرية",
    lines: (n) => [`${n} يهز ذيله بجنون.`, `هاو! ${n} يحضر لك عصا.`, `${n} يشمّ حذاءك.`, `${n} يميل رأسه.`],
    sleepy: (n) => `${n} يشخر بهدوء على جلد الخروف.` },
  hi: { label: "गाँव के कुत्ते का नाम", placeholder: "जैसे बिस्कुट", save: "सहेजें", saved: "सहेजा गया!", unnamed: "गाँव का कुत्ता",
    lines: (n) => [`${n} ज़ोर-ज़ोर से पूँछ हिलाता है।`, `भौं! ${n} आपके लिए छड़ी लाया।`, `${n} आपके जूते सूँघता है।`, `${n} सिर टेढ़ा करता है।`],
    sleepy: (n) => `${n} भेड़ की खाल पर धीरे से खर्राटे लेता है।` },
  zh: { label: "村犬的名字", placeholder: "例如：饼干", save: "保存", saved: "已保存！", unnamed: "村犬",
    lines: (n) => [`${n}拼命摇尾巴。`, `汪！${n}给你叼来一根树枝。`, `${n}闻了闻你的靴子。`, `${n}歪着头看你。`],
    sleepy: (n) => `${n}在羊皮上轻轻打鼾。` },
  ja: { label: "村の犬の名前", placeholder: "例：ビスケット", save: "保存", saved: "保存しました！", unnamed: "村の犬",
    lines: (n) => [`${n}がしっぽをぶんぶん振っている。`, `ワン！${n}が枝を持ってきた。`, `${n}がブーツのにおいを嗅いでいる。`, `${n}が首をかしげた。`],
    sleepy: (n) => `${n}は羊の毛皮の上ですやすや眠っている。` },
};
