import type { Lang } from "../i18n";

type Text = { title: string; body: string; note: string; ok: string };

/** One-time notice about ongoing mechanics/balancing rework. */
export const REWORK: Record<Lang, Text> = {
  de: { title: "Umbau im Gange", body: "Gerade finden größere Umbauten an der Spielmechanik und am Balancing statt. Werte wie Wohlstand, Geld und Bevölkerung können sich dadurch teilweise drastisch verändern.", note: "Gekaufte Gebäude bleiben erhalten. Danke für deine Geduld!", ok: "Verstanden" },
  en: { title: "Rework in progress", body: "Major changes to the game mechanics and balancing are under way. Values such as prosperity, money and population may change, sometimes drastically.", note: "Buildings you bought stay yours. Thank you for your patience!", ok: "Understood" },
  fr: { title: "Travaux en cours", body: "D'importantes refontes des mécaniques de jeu et de l'équilibrage sont en cours. Des valeurs comme la prospérité, l'argent et la population peuvent changer, parfois fortement.", note: "Les bâtiments achetés restent acquis. Merci de ta patience !", ok: "Compris" },
  es: { title: "Reformas en curso", body: "Se están realizando grandes cambios en la mecánica del juego y el equilibrio. Valores como la prosperidad, el dinero y la población pueden cambiar, a veces drásticamente.", note: "Los edificios comprados se conservan. ¡Gracias por tu paciencia!", ok: "Entendido" },
  ar: { title: "أعمال تطوير جارية", body: "تجري حاليًا تعديلات كبيرة على آليات اللعبة وتوازنها. قد تتغير قيم مثل الرخاء والمال وعدد السكان، وأحيانًا بشكل كبير.", note: "المباني التي اشتريتها تبقى لك. شكرًا لصبرك!", ok: "فهمت" },
  hi: { title: "बदलाव जारी हैं", body: "इस समय खेल की प्रणाली और संतुलन में बड़े बदलाव हो रहे हैं। इसलिए समृद्धि, धन और जनसंख्या जैसे मान कभी-कभी काफ़ी बदल सकते हैं।", note: "खरीदी गई इमारतें बनी रहेंगी। धैर्य के लिए धन्यवाद!", ok: "समझ गया" },
  zh: { title: "改版进行中", body: "游戏机制和平衡正在进行较大调整。繁荣度、金钱和人口等数值可能会发生变化，有时变化幅度很大。", note: "已购买的建筑会保留。感谢你的耐心！", ok: "知道了" },
  ja: { title: "改修中", body: "現在、ゲームの仕組みとバランスを大きく見直しています。そのため繁栄度・お金・人口などの値が大きく変わることがあります。", note: "購入した建物はそのまま残ります。ご理解ありがとうございます！", ok: "了解" },
};
