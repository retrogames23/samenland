import type { Lang } from "../i18n";
import type { CivicStage } from "../civic";

type Text = {
  title: string;
  intro: string;
  /** name and the real effect of each stage */
  stages: Record<CivicStage, [string, string]>;
  voluntary: string;
  oneSite: string;
  budget: (max: string) => string;
  /** the Kontor budget is a limit only — Kontor purchases are paid one by one from the chest, never in advance */
  budgetHint: string;
  rate: string;
  price: (p: string) => string;
  kontor: (spent: string, limit: string) => string;
  open: (name: string) => string;
  pay: (amount: string) => string;
  paid: (paid: string, total: string) => string;
  material: (w: number, nw: number, s: number, ns: number) => string;
  quota: (w: number, s: number) => string;
  building: (days: number) => string;
  ready: string;
  busy: string;
  locked: string;
  /** lock of a later stage while its previous stage does not stand yet */
  after: (name: string) => string;
  /** raising the Kontor limit later (DB civic_raise_budget): only upwards, from the next booked day on */
  raise: (amount: string) => string;
  raiseHint: string;
  errors: {
    rank: string;
    after: string;
    busy: string;
    money: string;
    fail: string;
    budget: string;
    done: string;
  };
};

/** Gemeindebauten (civic.ts, P2 + P3a) — build-menu texts, all eight languages. Effects as the code applies them. */
export const CIVIC_T: Record<Lang, Text> = {
  de: {
    title: "Gemeindebauten",
    intro:
      "Große Bauten der Gemeinde, freiwillig und in Raten bezahlt. Immer nur eine Baustelle zur Zeit.",
    stages: {
      spital2: [
        "Spital: Kapelle",
        "Senkt das Krankheitsrisiko zusätzlich auf 90 % – zusammen mit dem Krankensaal auf 76,5 %.",
      ],
      spital3: [
        "Spital: Wirtschaftshof",
        "Liefert täglich 1 Holz mehr und jeden zweiten Tag 1 Stein mehr (+0,5 Stein je Tag).",
      ],
      waage2: ["Ratswaage: Tretradkran", "Das Lager fasst 100 Holz und 100 Stein mehr."],
      spital1: ["Spital: Krankensaal", "Senkt das Krankheitsrisiko im Dorf auf 85 %."],
      waage1: [
        "Ratswaage: Waagehaus",
        "Alle Kontorpreise für Holz und Stein werden 15 % günstiger.",
      ],
    },
    voluntary: "Freiwillig – eingezahltes Geld bleibt im Bau. Die Raten zahlen nur den Baupreis.",
    oneSite: "Nur eine Gemeindebaustelle zur Zeit.",
    budget: (max) => `Materialbudget fürs Kontor (höchstens ${max})`,
    budgetHint:
      "Nur eine Obergrenze: Kontorkäufe werden einzeln aus der Truhe bezahlt, nie im Voraus, und das Limit lässt sich später nur erhöhen, nie senken. 0 = nur eigenes Lager und Kontingent ohne Kontor.",
    rate: "Rate in Mark",
    price: (p) => `Baupreis: ${p}`,
    kontor: (s, l) => `Kontor: ${s} von ${l} Limit verbraucht`,
    open: (n) => `${n} beginnen`,
    pay: (a) => `${a} einzahlen`,
    paid: (p, t) => `Eingezahlt: ${p} von ${t}`,
    material: (w, nw, s, ns) =>
      `Material: Holz ${w}/${nw}, Stein ${s}/${ns} – täglich aus dem Lager über 40 Holz / 30 Stein, dann aus dem Kontingent`,
    quota: (w, s) => `Kontingent: ${w} Holz, ${s} Stein (4 und 3 je Tag, bis 30 Tage)`,
    building: (d) => `Im Bau – noch ${d} Tage`,
    ready: "Steht und wirkt",
    busy: "Erst wenn die laufende Baustelle fertig ist",
    locked: "Ab Dorf",
    after: (n) => `Erst wenn ${n} steht`,
    raise: (a) => `Limit auf ${a} erhöhen`,
    raiseHint:
      "Erhöhen geht nur nach oben, höchstens bis zum vollen Kontorpreis. Bis heute gebuchte Tage bleiben, das neue Limit gilt ab dem nächsten Tag; bezahlt wird weiterhin nur, was das Kontor tatsächlich liefert.",
    errors: {
      rank: "Erst ab Dorf.",
      after: "Erst muss die vorige Stufe stehen.",
      busy: "Es läuft schon eine Gemeindebaustelle.",
      money: "Nicht genug Geld in der Truhe.",
      fail: "Das hat nicht geklappt.",
      budget: "Das Limit kann nur steigen, höchstens bis zum vollen Kontorpreis.",
      done: "Das Material ist schon vollständig.",
    },
  },
  en: {
    title: "Municipal works",
    intro:
      "Large works of the community, voluntary and paid in instalments. Only one site at a time.",
    stages: {
      spital2: [
        "Hospital: chapel",
        "Lowers the sickness risk further to 90 % – together with the sick hall to 76.5 %.",
      ],
      spital3: [
        "Hospital: farmyard",
        "Yields 1 more wood every day and 1 more stone every second day (+0.5 stone a day).",
      ],
      waage2: [
        "Town scales: treadwheel crane",
        "The store holds 100 more wood and 100 more stone.",
      ],
      spital1: ["Hospital: sick hall", "Lowers the village's sickness risk to 85 %."],
      waage1: [
        "Town scales: weigh house",
        "Every Kontor price for wood and stone becomes 15 % cheaper.",
      ],
    },
    voluntary:
      "Voluntary – money paid in stays in the works. Instalments pay the building price only.",
    oneSite: "Only one municipal site at a time.",
    budget: (max) => `Material budget for the Kontor (at most ${max})`,
    budgetHint:
      "A limit only: Kontor purchases are paid one by one from the chest, never in advance, and the limit can later only be raised, never lowered. 0 = own store only, no Kontor.",
    rate: "Instalment in Mark",
    price: (p) => `Building price: ${p}`,
    kontor: (s, l) => `Kontor: ${s} of ${l} limit used`,
    open: (n) => `Start ${n}`,
    pay: (a) => `Pay in ${a}`,
    paid: (p, t) => `Paid in: ${p} of ${t}`,
    material: (w, nw, s, ns) =>
      `Material: wood ${w}/${nw}, stone ${s}/${ns} – daily from the store above 40 wood / 30 stone, then from the quota`,
    quota: (w, s) => `Quota: ${w} wood, ${s} stone (4 and 3 a day, up to 30 days)`,
    building: (d) => `Under construction – ${d} days left`,
    ready: "Standing and in effect",
    busy: "Only once the current site is finished",
    locked: "From village",
    after: (n) => `Only once ${n} stands`,
    raise: (a) => `Raise limit to ${a}`,
    raiseHint:
      "Only upwards, at most to the full Kontor price. Days booked up to today stay as they are; the new limit applies from the next day, and only what the Kontor actually delivers is paid.",
    errors: {
      rank: "Only from village.",
      after: "The previous stage must stand first.",
      busy: "A municipal site is already running.",
      money: "Not enough money in the chest.",
      fail: "That did not work.",
      budget: "The limit can only go up, at most to the full Kontor price.",
      done: "The material is already complete.",
    },
  },
  fr: {
    title: "Ouvrages communaux",
    intro:
      "Grands ouvrages de la commune, volontaires et payés par versements. Un seul chantier à la fois.",
    stages: {
      spital2: [
        "Hôpital : chapelle",
        "Réduit encore le risque de maladie à 90 % – avec la salle des malades, à 76,5 %.",
      ],
      spital3: [
        "Hôpital : ferme",
        "Fournit chaque jour 1 bois de plus et un jour sur deux 1 pierre de plus (+0,5 pierre par jour).",
      ],
      waage2: [
        "Balance de la ville : grue à roue",
        "L’entrepôt contient 100 bois et 100 pierres de plus.",
      ],
      spital1: ["Hôpital : salle des malades", "Ramène le risque de maladie du village à 85 %."],
      waage1: [
        "Balance publique : maison du poids",
        "Tous les prix du comptoir pour le bois et la pierre baissent de 15 %.",
      ],
    },
    voluntary:
      "Volontaire – l’argent versé reste dans l’ouvrage. Les versements ne paient que le prix de construction.",
    oneSite: "Un seul chantier communal à la fois.",
    budget: (max) => `Budget matériaux pour le comptoir (au plus ${max})`,
    budgetHint:
      "Une simple limite : les achats au comptoir sont payés un par un depuis le coffre, jamais d’avance, et la limite peut ensuite seulement être relevée, jamais baissée. 0 = réserve propre seulement, sans comptoir.",
    rate: "Versement en marks",
    price: (p) => `Prix de construction : ${p}`,
    kontor: (s, l) => `Comptoir : ${s} utilisés sur une limite de ${l}`,
    open: (n) => `Commencer ${n}`,
    pay: (a) => `Verser ${a}`,
    paid: (p, t) => `Versé : ${p} sur ${t}`,
    material: (w, nw, s, ns) =>
      `Matériaux : bois ${w}/${nw}, pierre ${s}/${ns} – chaque jour de la réserve au-delà de 40 bois / 30 pierres, puis du contingent`,
    quota: (w, s) => `Contingent : ${w} bois, ${s} pierres (4 et 3 par jour, jusqu'à 30 jours)`,
    building: (d) => `En chantier – encore ${d} jours`,
    ready: "Achevé et actif",
    busy: "Seulement quand le chantier en cours est fini",
    locked: "Dès le village",
    after: (n) => `Seulement après : ${n}`,
    raise: (a) => `Relever la limite à ${a}`,
    raiseHint:
      "Seulement à la hausse, au plus jusqu’au prix complet du comptoir. Les jours déjà comptés restent tels quels ; la nouvelle limite vaut dès le jour suivant, et seul ce que le comptoir livre vraiment est payé.",
    errors: {
      rank: "Seulement dès le village.",
      after: "L’étape précédente doit d’abord être achevée.",
      busy: "Un chantier communal est déjà en cours.",
      money: "Pas assez d'argent dans le coffre.",
      fail: "Cela n'a pas marché.",
      budget: "La limite ne peut que monter, au plus jusqu’au prix complet du comptoir.",
      done: "Les matériaux sont déjà complets.",
    },
  },
  es: {
    title: "Obras municipales",
    intro: "Grandes obras del municipio, voluntarias y pagadas a plazos. Solo una obra a la vez.",
    stages: {
      spital2: [
        "Hospital: capilla",
        "Reduce aún más el riesgo de enfermedad al 90 % – junto con la sala de enfermos, al 76,5 %.",
      ],
      spital3: [
        "Hospital: granja",
        "Da cada día 1 de madera más y cada dos días 1 de piedra más (+0,5 de piedra al día).",
      ],
      waage2: [
        "Báscula municipal: grúa de rueda",
        "El almacén guarda 100 de madera y 100 de piedra más.",
      ],
      spital1: ["Hospital: sala de enfermos", "Reduce el riesgo de enfermedad del pueblo al 85 %."],
      waage1: [
        "Báscula pública: casa del peso",
        "Todos los precios del depósito para madera y piedra bajan un 15 %.",
      ],
    },
    voluntary:
      "Voluntario – el dinero aportado queda en la obra. Los plazos pagan solo el precio de construcción.",
    oneSite: "Solo una obra municipal a la vez.",
    budget: (max) => `Presupuesto de materiales para el depósito (como mucho ${max})`,
    budgetHint:
      "Solo un límite: las compras en el depósito se pagan una a una desde el arca, nunca por adelantado, y el límite después solo se puede subir, nunca bajar. 0 = solo el almacén propio, sin depósito.",
    rate: "Plazo en marcos",
    price: (p) => `Precio de construcción: ${p}`,
    kontor: (s, l) => `Depósito: ${s} usados de un límite de ${l}`,
    open: (n) => `Empezar ${n}`,
    pay: (a) => `Aportar ${a}`,
    paid: (p, t) => `Aportado: ${p} de ${t}`,
    material: (w, nw, s, ns) =>
      `Material: madera ${w}/${nw}, piedra ${s}/${ns} – cada día del almacén por encima de 40 madera / 30 piedra, luego del cupo`,
    quota: (w, s) => `Cupo: ${w} madera, ${s} piedra (4 y 3 al día, hasta 30 días)`,
    building: (d) => `En obras – faltan ${d} días`,
    ready: "En pie y activa",
    busy: "Solo cuando termine la obra en curso",
    locked: "Desde pueblo",
    after: (n) => `Solo después de: ${n}`,
    raise: (a) => `Subir el límite a ${a}`,
    raiseHint:
      "Solo hacia arriba, como mucho hasta el precio completo del depósito. Los días ya contados quedan como están; el nuevo límite rige desde el día siguiente y solo se paga lo que el depósito entrega de verdad.",
    errors: {
      rank: "Solo desde pueblo.",
      after: "Primero debe estar terminada la etapa anterior.",
      busy: "Ya hay una obra municipal en curso.",
      money: "No hay bastante dinero en el arca.",
      fail: "No ha funcionado.",
      budget: "El límite solo puede subir, como mucho hasta el precio completo del depósito.",
      done: "El material ya está completo.",
    },
  },
  ar: {
    title: "مباني البلدية",
    intro: "مبانٍ كبيرة للجماعة، طوعية وتُدفع على أقساط. ورشة واحدة فقط في كل مرة.",
    stages: {
      spital2: [
        "المارستان: الكنيسة الصغيرة",
        "يخفّض خطر المرض أكثر إلى 90 % – ومع قاعة المرضى إلى 76.5 %.",
      ],
      spital3: [
        "المارستان: المزرعة",
        "يعطي كل يوم 1 خشب إضافي وكل يومين 1 حجر إضافي (+0.5 حجر يوميًا).",
      ],
      waage2: ["ميزان المدينة: الرافعة ذات الدولاب", "يتّسع المخزن لـ100 خشب و100 حجر إضافية."],
      spital1: ["المارستان: قاعة المرضى", "يخفّض خطر المرض في القرية إلى 85 %."],
      waage1: ["ميزان المدينة: دار الوزن", "تنخفض كل أسعار المخزن للخشب والحجر بنسبة 15 %."],
    },
    voluntary: "طوعي – المال المدفوع يبقى في البناء. الأقساط تدفع ثمن البناء فقط.",
    oneSite: "ورشة بلدية واحدة فقط في كل مرة.",
    budget: (max) => `ميزانية المواد للمخزن (بحد أقصى ${max})`,
    budgetHint:
      "حدّ أعلى فقط: مشتريات المخزن تُدفع واحدة تلو الأخرى من الخزينة، لا مقدّمًا أبدًا، ويمكن لاحقًا رفع الحد فقط، لا خفضه. 0 = المخزون الخاص فقط دون المخزن.",
    rate: "القسط بالمارك",
    price: (p) => `ثمن البناء: ${p}`,
    kontor: (s, l) => `المخزن: استُخدم ${s} من حدّ ${l}`,
    open: (n) => `ابدأ ${n}`,
    pay: (a) => `ادفع ${a}`,
    paid: (p, t) => `المدفوع: ${p} من ${t}`,
    material: (w, nw, s, ns) =>
      `المواد: خشب ${w}/${nw}، حجر ${s}/${ns} – يوميًا من المخزون فوق 40 خشبًا / 30 حجرًا، ثم من الحصة`,
    quota: (w, s) => `الحصة: ${w} خشب، ${s} حجر (4 و3 يوميًا، حتى 30 يومًا)`,
    building: (d) => `قيد البناء – بقي ${d} يومًا`,
    ready: "قائم وفعّال",
    busy: "فقط بعد انتهاء الورشة الحالية",
    locked: "من القرية",
    after: (n) => `فقط بعد: ${n}`,
    raise: (a) => `رفع الحد إلى ${a}`,
    raiseHint:
      "الرفع فقط، وبحد أقصى سعر المخزن الكامل. الأيام المحسوبة حتى اليوم تبقى كما هي، والحد الجديد يسري من اليوم التالي، ولا يُدفع إلا ما يسلّمه المخزن فعلًا.",
    errors: {
      rank: "فقط من مرتبة القرية.",
      after: "يجب أن تكتمل المرحلة السابقة أولًا.",
      busy: "هناك ورشة بلدية جارية بالفعل.",
      money: "لا يكفي المال في الخزينة.",
      fail: "لم ينجح ذلك.",
      budget: "يمكن رفع الحد فقط، وبحد أقصى سعر المخزن الكامل.",
      done: "المواد مكتملة بالفعل.",
    },
  },
  hi: {
    title: "नगर-निर्माण",
    intro:
      "समुदाय के बड़े निर्माण, स्वैच्छिक और किस्तों में भुगतान। एक समय में केवल एक निर्माण-स्थल।",
    stages: {
      spital2: [
        "अस्पताल: प्रार्थनालय",
        "बीमारी का जोखिम और घटाकर 90 % करता है – रोगी-कक्ष के साथ मिलकर 76.5 %।",
      ],
      spital3: [
        "अस्पताल: खेत-आँगन",
        "हर दिन 1 लकड़ी और हर दूसरे दिन 1 पत्थर अधिक देता है (+0.5 पत्थर प्रतिदिन)।",
      ],
      waage2: ["नगर-तराज़ू: पहिया-क्रेन", "भंडार में 100 लकड़ी और 100 पत्थर अधिक समाते हैं।"],
      spital1: ["अस्पताल: रोगी-कक्ष", "गाँव में बीमारी का जोखिम घटाकर 85 % करता है।"],
      waage1: ["नगर-तराज़ू: तौल-घर", "लकड़ी और पत्थर के सभी कोठी-दाम 15 % सस्ते हो जाते हैं।"],
    },
    voluntary:
      "स्वैच्छिक – जमा पैसा निर्माण में ही रहता है। किस्तें केवल निर्माण-मूल्य चुकाती हैं।",
    oneSite: "एक समय में केवल एक नगर-निर्माण स्थल।",
    budget: (max) => `कोठी के लिए सामग्री-बजट (अधिकतम ${max})`,
    budgetHint:
      "केवल एक सीमा: कोठी की खरीद एक-एक करके खज़ाने से चुकाई जाती है, कभी पहले से नहीं, और सीमा बाद में केवल बढ़ाई जा सकती है, घटाई नहीं। 0 = केवल अपना भंडार, कोठी नहीं।",
    rate: "किस्त (मार्क में)",
    price: (p) => `निर्माण-मूल्य: ${p}`,
    kontor: (s, l) => `कोठी: ${l} की सीमा में से ${s} खर्च`,
    open: (n) => `${n} शुरू करें`,
    pay: (a) => `${a} जमा करें`,
    paid: (p, t) => `जमा: ${t} में से ${p}`,
    material: (w, nw, s, ns) =>
      `सामग्री: लकड़ी ${w}/${nw}, पत्थर ${s}/${ns} – रोज़ 40 लकड़ी / 30 पत्थर से ऊपर के भंडार से, फिर कोटा से`,
    quota: (w, s) => `कोटा: ${w} लकड़ी, ${s} पत्थर (रोज़ 4 और 3, अधिकतम 30 दिन)`,
    building: (d) => `निर्माणाधीन – ${d} दिन बाकी`,
    ready: "खड़ा है और प्रभावी है",
    busy: "चालू निर्माण पूरा होने के बाद ही",
    locked: "गाँव से",
    after: (n) => `केवल इसके बाद: ${n}`,
    raise: (a) => `सीमा ${a} तक बढ़ाएँ`,
    raiseHint:
      "केवल ऊपर की ओर, अधिकतम कोठी के पूरे दाम तक। आज तक गिने गए दिन वैसे ही रहते हैं; नई सीमा अगले दिन से लागू होती है, और केवल वही चुकाया जाता है जो कोठी सच में देती है।",
    errors: {
      rank: "केवल गाँव स्तर से।",
      after: "पहले पिछला चरण पूरा होना चाहिए।",
      busy: "एक नगर-निर्माण पहले से चल रहा है।",
      money: "खज़ाने में पर्याप्त पैसा नहीं।",
      fail: "यह नहीं हुआ।",
      budget: "सीमा केवल बढ़ सकती है, अधिकतम कोठी के पूरे दाम तक।",
      done: "सामग्री पहले ही पूरी है।",
    },
  },
  zh: {
    title: "公共工程",
    intro: "村社的大型工程，自愿建造、分期付款。同一时间只能有一处工地。",
    stages: {
      spital2: ["济贫院：礼拜堂", "将患病风险再降至 90 %——与病房合计降至 76.5 %。"],
      spital3: ["济贫院：农庄", "每天多产 1 木材，每两天多产 1 石料（每天 +0.5 石料）。"],
      waage2: ["公秤：踏轮起重机", "仓库可多存 100 木材和 100 石料。"],
      spital1: ["济贫院：病房", "将村中的患病风险降至 85 %。"],
      waage1: ["公秤：过磅房", "商栈的木材和石料价格全部便宜 15 %。"],
    },
    voluntary: "自愿——已付的钱留在工程中。分期款只支付建造价。",
    oneSite: "同一时间只能有一处公共工地。",
    budget: (max) => `商栈材料预算（最多 ${max}）`,
    budgetHint:
      "只是上限：商栈采购逐笔从金库支付，绝不预付，开工后上限只能提高，不能降低。0 = 只用自有库存，不经商栈。",
    rate: "每期金额（马克）",
    price: (p) => `建造价：${p}`,
    kontor: (s, l) => `商栈：已用 ${s} / 上限 ${l}`,
    open: (n) => `开始建造${n}`,
    pay: (a) => `存入 ${a}`,
    paid: (p, t) => `已付：${p} / ${t}`,
    material: (w, nw, s, ns) =>
      `材料：木材 ${w}/${nw}，石料 ${s}/${ns}——每天先取库存中超出 40 木材 / 30 石料的部分，再取配额`,
    quota: (w, s) => `配额：木材 ${w}，石料 ${s}（每天 4 和 3，最多累积 30 天）`,
    building: (d) => `建造中——还需 ${d} 天`,
    ready: "已建成并生效",
    busy: "需等当前工地完工",
    locked: "村庄起",
    after: (n) => `须先建成：${n}`,
    raise: (a) => `把上限提高到 ${a}`,
    raiseHint:
      "只能提高，最多到商栈全价。截至今天已结算的日子保持不变；新上限从次日起生效，只为商栈实际供应的材料付款。",
    errors: {
      rank: "村庄等级起才可建。",
      after: "须先建成上一阶段。",
      busy: "已有一处公共工地在建。",
      money: "金库里的钱不够。",
      fail: "没有成功。",
      budget: "上限只能提高，最多到商栈全价。",
      done: "材料已经齐全。",
    },
  },
  ja: {
    title: "公共建築",
    intro: "共同体の大きな建物。任意で、分割で支払います。工事現場は一度に一つだけ。",
    stages: {
      spital2: [
        "施療院：礼拝堂",
        "病気のリスクをさらに 90 % に下げます。病室と合わせて 76.5 % です。",
      ],
      spital3: [
        "施療院：農場",
        "毎日木材が 1 つ、2 日ごとに石材が 1 つ多く取れます（1 日あたり石材 +0.5）。",
      ],
      waage2: ["公設秤：踏み車クレーン", "倉庫に木材 100 と石材 100 を余分に保管できます。"],
      spital1: ["施療院：病室", "村の病気のリスクを 85 % に下げます。"],
      waage1: ["公設秤：計量所", "商館での木材と石材の価格がすべて 15 % 安くなります。"],
    },
    voluntary: "任意です。払い込んだお金は建物に残ります。分割払いは建設費だけに充てられます。",
    oneSite: "公共建築の現場は一度に一つだけです。",
    budget: (max) => `商館用の資材予算（最大 ${max}）`,
    budgetHint:
      "上限にすぎません。商館での購入は金庫から一回ずつ支払われ、前払いはなく、上限は後から引き上げのみ可能で、下げられません。0 = 自分の蓄えのみ、商館なし。",
    rate: "分割額（マルク）",
    price: (p) => `建設費：${p}`,
    kontor: (s, l) => `商館：上限 ${l} のうち ${s} 使用`,
    open: (n) => `${n}を始める`,
    pay: (a) => `${a}を払い込む`,
    paid: (p, t) => `払込済み：${p} / ${t}`,
    material: (w, nw, s, ns) =>
      `資材：木材 ${w}/${nw}、石材 ${s}/${ns}——毎日、木材 40・石材 30 を超える蓄えから、次に割当から`,
    quota: (w, s) => `割当：木材 ${w}、石材 ${s}（1日 4 と 3、最大 30 日分）`,
    building: (d) => `建設中——残り ${d} 日`,
    ready: "完成し効果あり",
    busy: "今の現場が終わってから",
    locked: "村から",
    after: (n) => `先に完成が必要：${n}`,
    raise: (a) => `上限を ${a} に引き上げる`,
    raiseHint:
      "引き上げのみ、最大で商館の全額まで。今日までに計上された日はそのまま残り、新しい上限は翌日から適用されます。支払うのは商館が実際に届けた分だけです。",
    errors: {
      rank: "村からです。",
      after: "先に前の段階を完成させてください。",
      busy: "すでに公共建築の現場があります。",
      money: "金庫のお金が足りません。",
      fail: "うまくいきませんでした。",
      budget: "上限は引き上げのみ、最大で商館の全額までです。",
      done: "資材はすでにそろっています。",
    },
  },
};
