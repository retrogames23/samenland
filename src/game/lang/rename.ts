import type { Lang } from "@/game/i18n";

export type RenameText = { title: string; body: (n: string) => string; save: string; later: string; taken: string; bad: string };

const de: RenameText = { title: "Ein Name, zwei Dörfer", body: (n) => `Ein älteres Dorf im Reich trägt bereits den Namen „${n}“. Wollt Ihr Eurem Dorf einen eigenen Namen geben?`, save: "Umbenennen", later: "Behalten", taken: "Diesen Namen trägt schon ein anderes Dorf.", bad: "Der Name braucht 2 bis 32 Zeichen." };
const en: RenameText = { title: "One name, two villages", body: (n) => `An older village in the realm already bears the name “${n}”. Would you like to give your village a name of its own?`, save: "Rename", later: "Keep it", taken: "Another village already bears this name.", bad: "The name needs 2 to 32 characters." };
const fr: RenameText = { title: "Un nom, deux villages", body: (n) => `Un village plus ancien du royaume porte déjà le nom « ${n} ». Voulez-vous donner à votre village un nom bien à lui ?`, save: "Renommer", later: "Garder", taken: "Un autre village porte déjà ce nom.", bad: "Le nom doit compter de 2 à 32 caractères." };
const es: RenameText = { title: "Un nombre, dos aldeas", body: (n) => `Una aldea más antigua del reino ya lleva el nombre «${n}». ¿Queréis dar a vuestra aldea un nombre propio?`, save: "Renombrar", later: "Conservar", taken: "Otra aldea ya lleva este nombre.", bad: "El nombre necesita de 2 a 32 caracteres." };
const ar: RenameText = { title: "اسم واحد وقريتان", body: (n) => `تحمل قرية أقدم في المملكة اسم «${n}» بالفعل. هل تريد أن تمنح قريتك اسمًا خاصًا بها؟`, save: "إعادة التسمية", later: "الإبقاء عليه", taken: "تحمل قرية أخرى هذا الاسم بالفعل.", bad: "يجب أن يتكوّن الاسم من 2 إلى 32 حرفًا." };
const hi: RenameText = { title: "एक नाम, दो गाँव", body: (n) => `राज्य का एक पुराना गाँव पहले से “${n}” नाम रखता है। क्या आप अपने गाँव को अपना अलग नाम देना चाहेंगे?`, save: "नाम बदलें", later: "यही रखें", taken: "यह नाम पहले से किसी दूसरे गाँव का है।", bad: "नाम 2 से 32 अक्षरों का होना चाहिए।" };
const zh: RenameText = { title: "一名两村", body: (n) => `王国中一座更早的村庄已名为“${n}”。要为你的村庄另取一个名字吗？`, save: "改名", later: "保留", taken: "已有其他村庄使用此名。", bad: "名称需 2 至 32 个字符。" };
const ja: RenameText = { title: "同じ名の村がふたつ", body: (n) => `王国にはすでに「${n}」という古い村があります。あなたの村に独自の名を付けますか？`, save: "改名する", later: "このままにする", taken: "その名はすでに別の村が使っています。", bad: "名前は2〜32文字にしてください。" };

export const RENAME: Record<Lang, RenameText> = { de, en, fr, es, ar, hi, zh, ja };
