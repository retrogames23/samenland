import type { Lang } from "../i18n";

type Text = { lens: string; lensOn: string; look: string; title: (n: string) => string; onlyFarm: string; empty: string; out: string; close: string; nobodyLives: string };

export const STUBE: Record<Lang, Text> = {
  de: { lens: "Schaukasten", lensOn: "Schaukasten an: Tippe auf eine Hütte oder ein Bauernhaus.", look: "In die Stube schauen", title: (n) => `Stube der Familie ${n}`, onlyFarm: "Bisher lässt sich nur in Hütten und Bauernhäuser hineinschauen.", empty: "Gerade ist niemand zu Hause.", out: "Unterwegs", close: "Schließen", nobodyLives: "Hier wohnt niemand." },
  en: { lens: "Showcase", lensOn: "Showcase on: tap a hut or a farmhouse.", look: "Peek into the parlour", title: (n) => `The ${n} family's parlour`, onlyFarm: "For now you can only look into huts and farmhouses.", empty: "Nobody is home right now.", out: "Out and about", close: "Close", nobodyLives: "Nobody lives here." },
  fr: { lens: "Vitrine", lensOn: "Vitrine active : touche une cabane ou une ferme.", look: "Regarder dans la salle", title: (n) => `La salle de la famille ${n}`, onlyFarm: "Pour l’instant, on ne peut regarder que dans les cabanes et les fermes.", empty: "Personne n’est à la maison.", out: "Dehors", close: "Fermer", nobodyLives: "Personne n’habite ici." },
  es: { lens: "Vitrina", lensOn: "Vitrina activa: toca una choza o una granja.", look: "Asomarse a la sala", title: (n) => `La sala de la familia ${n}`, onlyFarm: "Por ahora solo se puede mirar dentro de las chozas y las granjas.", empty: "Ahora no hay nadie en casa.", out: "Fuera", close: "Cerrar", nobodyLives: "Aquí no vive nadie." },
  ar: { lens: "صندوق العرض", lensOn: "صندوق العرض مفعّل: اضغط على كوخ أو بيت مزرعة.", look: "ألقِ نظرة إلى الداخل", title: (n) => `بيت عائلة ${n}`, onlyFarm: "حاليًا يمكن النظر داخل الأكواخ وبيوت المزارع فقط.", empty: "لا أحد في البيت الآن.", out: "في الخارج", close: "إغلاق", nobodyLives: "لا أحد يسكن هنا." },
  hi: { lens: "झाँकी", lensOn: "झाँकी चालू: किसी झोपड़ी या फ़ार्महाउस पर टैप करें।", look: "घर के भीतर झाँकें", title: (n) => `${n} परिवार का घर`, onlyFarm: "अभी केवल झोपड़ी और फ़ार्महाउस के भीतर झाँका जा सकता है।", empty: "अभी घर पर कोई नहीं है।", out: "बाहर गए", close: "बंद करें", nobodyLives: "यहाँ कोई नहीं रहता।" },
  zh: { lens: "橱窗", lensOn: "橱窗已开启：点击一间小屋或农舍。", look: "看看屋里", title: (n) => `${n}家的堂屋`, onlyFarm: "目前只能看进小屋和农舍里面。", empty: "现在没有人在家。", out: "外出中", close: "关闭", nobodyLives: "这里无人居住。" },
  ja: { lens: "のぞき箱", lensOn: "のぞき箱オン：小屋か農家をタップしてください。", look: "家の中をのぞく", title: (n) => `${n}家の居間`, onlyFarm: "今のところ小屋と農家の中だけのぞけます。", empty: "今は誰も家にいません。", out: "外出中", close: "閉じる", nobodyLives: "ここには誰も住んでいません。" },
};
