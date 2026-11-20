import type { Lang } from "../i18n";

type Text = { title: string; intro: string; benefit: string; call: string; open: (h: number) => string; wait: (d: number) => string; locked: string; voluntary: string; paidMsg: string };
/** Freimarkt (extra market day) texts, all eight languages. */
export const FREIMARKT: Record<Lang, Text> = {
  de: { title: "Freimarkt ausrufen", intro: "Der Schulze ruft einen außerordentlichen Markttag aus: 24 Stunden lang stehen Marktbuden auf dem Platz.",
    benefit: "Zimmerleute und Fuhrleute kommen mit: Solange der Markt steht, gehen Wiederaufbauten nach Brand oder Hochwasser doppelt so schnell. Keine zusätzlichen Einnahmen, kein Wachstumsbonus.",
    call: "Freimarkt ausrufen", open: (h) => `Der Markt steht – noch ${h} Std.`, wait: (d) => `Nächster Freimarkt in ${d} ${d === 1 ? "Tag" : "Tagen"} möglich`, locked: "Ab Dorf", voluntary: "Freiwillig, höchstens einmal pro Woche – nichts verfällt.", paidMsg: "Der Freimarkt ist ausgerufen! Die Buden werden aufgeschlagen." },
  en: { title: "Call a free market", intro: "The headman proclaims an extra market day: for 24 hours stalls stand on the square.",
    benefit: "Carpenters and carters come along: while the market stands, rebuilding after fire or flood goes twice as fast. No extra income, no growth bonus.",
    call: "Call the free market", open: (h) => `The market stands – ${h} h left`, wait: (d) => `Next free market possible in ${d} ${d === 1 ? "day" : "days"}`, locked: "From village", voluntary: "Voluntary, at most once a week – nothing expires.", paidMsg: "The free market is proclaimed! The stalls are going up." },
  fr: { title: "Proclamer une foire franche", intro: "Le bourgmestre proclame un jour de marché extraordinaire : pendant 24 heures, des étals se dressent sur la place.",
    benefit: "Charpentiers et charretiers accourent : tant que dure le marché, la reconstruction après incendie ou crue va deux fois plus vite. Aucun revenu en plus, aucun bonus de croissance.",
    call: "Proclamer la foire", open: (h) => `Le marché se tient – encore ${h} h`, wait: (d) => `Prochaine foire possible dans ${d} ${d === 1 ? "jour" : "jours"}`, locked: "Dès le village", voluntary: "Facultatif, au plus une fois par semaine – rien ne se perd.", paidMsg: "La foire franche est proclamée ! On monte les étals." },
  es: { title: "Convocar un mercado franco", intro: "El regidor proclama un día de mercado extraordinario: durante 24 horas hay puestos en la plaza.",
    benefit: "Llegan carpinteros y carreteros: mientras dura el mercado, la reconstrucción tras incendio o inundación va el doble de rápido. Sin ingresos extra ni bono de crecimiento.",
    call: "Convocar el mercado", open: (h) => `El mercado sigue – quedan ${h} h`, wait: (d) => `Próximo mercado posible en ${d} ${d === 1 ? "día" : "días"}`, locked: "Desde aldea", voluntary: "Voluntario, como mucho una vez por semana – nada caduca.", paidMsg: "¡Mercado franco proclamado! Se levantan los puestos." },
  ar: { title: "إعلان سوق حرة", intro: "يعلن شيخ البلدة يوم سوق استثنائيًا: تقوم الأكشاك في الساحة مدة 24 ساعة.",
    benefit: "يأتي النجارون والحمّالون: ما دامت السوق قائمة يسير إعمار ما خرّبه الحريق أو الفيضان بضعف السرعة. لا دخل إضافي ولا زيادة في النمو.",
    call: "أعلن السوق الحرة", open: (h) => `السوق قائمة – بقي ${h} ساعة`, wait: (d) => `السوق التالية ممكنة بعد ${d} ${d === 1 ? "يوم" : "أيام"}`, locked: "ابتداءً من القرية", voluntary: "اختيارية، مرة في الأسبوع على الأكثر – لا شيء يضيع.", paidMsg: "أُعلنت السوق الحرة! تُنصب الأكشاك الآن." },
  hi: { title: "मुक्त हाट की घोषणा", intro: "प्रधान एक विशेष हाट-दिवस घोषित करते हैं: 24 घंटे चौक पर दुकानें लगी रहती हैं।",
    benefit: "बढ़ई और गाड़ीवान साथ आते हैं: हाट रहने तक आग या बाढ़ के बाद पुनर्निर्माण दुगनी गति से होता है। कोई अतिरिक्त आय या विकास-बोनस नहीं।",
    call: "मुक्त हाट घोषित करें", open: (h) => `हाट लगा है – ${h} घंटे बाकी`, wait: (d) => `अगला मुक्त हाट ${d} दिन बाद संभव`, locked: "गाँव से", voluntary: "स्वैच्छिक, सप्ताह में अधिकतम एक बार – कुछ भी समाप्त नहीं होता।", paidMsg: "मुक्त हाट घोषित! दुकानें सज रही हैं।" },
  zh: { title: "宣布自由集市", intro: "村长宣布一个额外的集市日：广场上的摊位将摆放24小时。",
    benefit: "木匠和车夫随之而来：集市期间，火灾或洪水后的重建速度加倍。不增加收入，也没有增长加成。",
    call: "宣布自由集市", open: (h) => `集市进行中——还剩${h}小时`, wait: (d) => `${d}天后可再办自由集市`, locked: "村庄起", voluntary: "自愿，每周最多一次——不会过期。", paidMsg: "自由集市已宣布！摊位正在搭起。" },
  ja: { title: "自由市を開く", intro: "村長が臨時の市の日を告げます。24時間、広場に屋台が並びます。",
    benefit: "大工と荷車引きもやって来ます。市が立っている間、火事や洪水からの再建が2倍の速さで進みます。追加の収入や成長ボーナスはありません。",
    call: "自由市を開く", open: (h) => `市が開かれています – 残り${h}時間`, wait: (d) => `次の自由市は${d}日後から`, locked: "村から", voluntary: "任意、週に1回まで – 期限切れはありません。", paidMsg: "自由市を告げました！屋台が組み立てられています。" },
};
