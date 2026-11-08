import type { Lang } from "../i18n";

/** Chronicle farewell lines for the orphan boy: [found a family, finished the apprenticeship]. */
export const ORPHAN_FAREWELL: Record<Lang, readonly [string, string]> = {
  de: ["Eine durchreisende Familie hat den Waisenknaben liebevoll zu sich aufgenommen.", "Der Waisenknabe hat beim Schmied das Nötigste gelernt und zieht mit einem Empfehlungsbrief weiter."],
  en: ["A travelling family has lovingly taken the orphan boy in.", "The orphan boy learned the basics at the smithy and moves on with a letter of recommendation."],
  fr: ["Une famille de passage a recueilli avec tendresse le petit orphelin.", "L'orphelin a appris l'essentiel chez le forgeron et repart avec une lettre de recommandation."],
  es: ["Una familia de paso ha acogido con cariño al muchacho huérfano.", "El huérfano aprendió lo básico en la herrería y sigue su camino con una carta de recomendación."],
  ar: ["عائلة عابرة احتضنت الغلام اليتيم بمودة ورعاية.", "تعلّم الغلام اليتيم أصول الصنعة عند الحداد ومضى في سبيله برسالة توصية."],
  hi: ["एक राहगीर परिवार ने अनाथ बालक को प्यार से अपना लिया।", "अनाथ बालक ने लोहार से ज़रूरी हुनर सीखा और सिफ़ारिशी चिट्ठी लेकर आगे चल पड़ा।"],
  zh: ["一户过路的人家满怀慈爱地收养了这个孤儿男孩。", "孤儿在铁匠铺学会了基本手艺，带着一封推荐信继续上路。"],
  ja: ["通りがかりの一家が、身寄りのない少年を温かく引き取りました。", "少年は鍛冶屋で基本を学び、推薦状を手に旅立ちました。"],
};
