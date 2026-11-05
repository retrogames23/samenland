import type { Lang } from "../i18n";

/** Lines about the current weather (weather.ts); mixed into everyday chatter like season lines. */
export type WxTalk = "rain" | "snow" | "storm";
export const WEATHER_BANTER: Record<Lang, Record<WxTalk, string[]>> = {
  de: {
    rain: ["Bei dem Guss sitzt man am besten am Herdfeuer.", "Schietwetter – die Gugel hält wenigstens den Nacken trocken.", "Der Regen ist gut für die Saat, sagt mein Vater immer.", "Heute bleibt die Wäsche drinnen."],
    snow: ["Der Atem steht einem vor dem Mund.", "Schnee auf den Dächern – hoffentlich hält das Reet.", "Holt mehr Holz rein, es wird eine kalte Nacht."],
    storm: ["Hört Ihr den Donner? Rasch ins Trockene!", "Bei dem Wetter brennt sogar am Tag das Licht in der Schmiede.", "Der Wind treibt einem das Wasser waagerecht ins Gesicht."],
  },
  en: {
    rain: ["In this downpour the hearth is the best place.", "Foul weather – at least the hood keeps my neck dry.", "Rain is good for the seed, my father always says.", "The washing stays indoors today."],
    snow: ["You can see your breath.", "Snow on the roofs – I hope the thatch holds.", "Bring more wood in, it'll be a cold night."],
    storm: ["Hear the thunder? Get inside, quick!", "In this weather the smithy lights its lamps by day.", "The wind drives the rain straight into your face."],
  },
  fr: {
    rain: ["Par cette averse, le mieux est d'être près du feu.", "Sale temps – au moins la capuche me garde la nuque au sec.", "La pluie est bonne pour les semences, dit toujours mon père."],
    snow: ["On voit son souffle.", "De la neige sur les toits – pourvu que le chaume tienne."],
    storm: ["Vous entendez le tonnerre ? Vite, à l'abri !", "Par ce temps, la forge allume ses lampes en plein jour."],
  },
  es: {
    rain: ["Con este aguacero, lo mejor es estar junto al fuego.", "Qué tiempo – al menos la capucha me seca la nuca.", "La lluvia es buena para la siembra, dice siempre mi padre."],
    snow: ["Se ve el aliento.", "Nieve en los tejados – ojalá aguante la paja."],
    storm: ["¿Oís el trueno? ¡Rápido, a cubierto!", "Con este tiempo la herrería enciende sus luces de día."],
  },
  ar: {
    rain: ["في هذا الوابل لا أطيب من الجلوس عند الموقد.", "طقس كئيب – على الأقل يحفظ القلنسوة رقبتي جافة.", "المطر خير للبذار، هكذا يقول أبي دائماً."],
    snow: ["الأنفاس تتصاعد بخاراً أمام الوجوه.", "الثلج على السطوح – عسى أن يصمد القش."],
    storm: ["أتسمعون الرعد؟ إلى المأوى سريعاً!", "في هذا الطقس تُضاء مصابيح الحدادة نهاراً."],
  },
  hi: {
    rain: ["इस मूसलधार में चूल्हे के पास बैठना ही अच्छा है।", "बुरा मौसम – कम से कम टोपी गर्दन सूखी रखती है।", "बारिश बीज के लिए अच्छी है, पिताजी हमेशा कहते हैं।"],
    snow: ["साँस धुएँ-सी दिखती है।", "छतों पर बर्फ़ – उम्मीद है छप्पर टिका रहे।"],
    storm: ["गड़गड़ाहट सुनी? जल्दी अंदर चलो!", "ऐसे मौसम में लोहार दिन में भी दीया जलाता है।"],
  },
  zh: {
    rain: ["这么大的雨，还是坐在炉火旁最好。", "鬼天气——好在兜帽还能让脖子干着。", "我爹总说，雨水对种子有好处。"],
    snow: ["呼出的气都看得见。", "屋顶上积了雪——但愿茅草顶得住。"],
    storm: ["听见雷声了吗？快进屋！", "这种天气，铁匠铺白天也点着灯。"],
  },
  ja: {
    rain: ["こんな土砂降りの日は、炉端にいるのがいちばんだ。", "ひどい天気だ――頭巾のおかげで首だけは濡れずにすむ。", "雨は種にいい、と親父はいつも言う。"],
    snow: ["息が白く見えるね。", "屋根に雪だ――茅葺きがもつといいが。"],
    storm: ["雷が聞こえるか？早く中へ！", "こんな天気だと、鍛冶場は昼でも灯りをともす。"],
  },
};
