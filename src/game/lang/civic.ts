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
  budgetNone: string;
  budgetFull: string;
  open: (name: string) => string;
  pay: (amount: string) => string;
  paid: (paid: string, total: string) => string;
  material: (w: number, nw: number, s: number, ns: number) => string;
  quota: (w: number, s: number) => string;
  building: (days: number) => string;
  ready: string;
  busy: string;
  locked: string;
  errors: { rank: string; busy: string; money: string; fail: string };
};

/** Gemeindebauten Stufe 1 (civic.ts) — build-menu texts, all eight languages. Effects as the code applies them. */
export const CIVIC_T: Record<Lang, Text> = {
  de: {
    title: "Gemeindebauten",
    intro:
      "Große Bauten der Gemeinde, freiwillig und in Raten bezahlt. Immer nur eine Baustelle zur Zeit.",
    stages: {
      spital1: ["Spital: Krankensaal", "Senkt das Krankheitsrisiko im Dorf auf 85 %."],
      waage1: [
        "Ratswaage: Waagehaus",
        "Alle Kontorpreise für Holz und Stein werden 15 % günstiger.",
      ],
    },
    voluntary:
      "Freiwillig – eingezahltes Geld bleibt im Bau. Vom Kontor wird höchstens dein Materialbudget bezahlt.",
    oneSite: "Nur eine Gemeindebaustelle zur Zeit.",
    budget: (max) => `Materialbudget fürs Kontor (höchstens ${max})`,
    budgetNone: "Nur eigenes Lager",
    budgetFull: "Ganzer Bedarf",
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
    errors: {
      rank: "Erst ab Dorf.",
      busy: "Es läuft schon eine Gemeindebaustelle.",
      money: "Nicht genug Geld in der Truhe.",
      fail: "Das hat nicht geklappt.",
    },
  },
  en: {
    title: "Municipal works",
    intro:
      "Large works of the community, voluntary and paid in instalments. Only one site at a time.",
    stages: {
      spital1: ["Hospital: sick hall", "Lowers the village's sickness risk to 85 %."],
      waage1: [
        "Town scales: weigh house",
        "Every Kontor price for wood and stone becomes 15 % cheaper.",
      ],
    },
    voluntary:
      "Voluntary – money paid in stays in the works. The Kontor is paid at most from your material budget.",
    oneSite: "Only one municipal site at a time.",
    budget: (max) => `Material budget for the Kontor (at most ${max})`,
    budgetNone: "Own store only",
    budgetFull: "Whole need",
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
    errors: {
      rank: "Only from village.",
      busy: "A municipal site is already running.",
      money: "Not enough money in the chest.",
      fail: "That did not work.",
    },
  },
  fr: {
    title: "Ouvrages communaux",
    intro:
      "Grands ouvrages de la commune, volontaires et payés par versements. Un seul chantier à la fois.",
    stages: {
      spital1: ["Hôpital : salle des malades", "Ramène le risque de maladie du village à 85 %."],
      waage1: [
        "Balance publique : maison du poids",
        "Tous les prix du comptoir pour le bois et la pierre baissent de 15 %.",
      ],
    },
    voluntary:
      "Volontaire – l'argent versé reste dans l'ouvrage. Le comptoir n'est payé que sur votre budget matériaux.",
    oneSite: "Un seul chantier communal à la fois.",
    budget: (max) => `Budget matériaux pour le comptoir (au plus ${max})`,
    budgetNone: "Réserve propre seulement",
    budgetFull: "Besoin entier",
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
    errors: {
      rank: "Seulement dès le village.",
      busy: "Un chantier communal est déjà en cours.",
      money: "Pas assez d'argent dans le coffre.",
      fail: "Cela n'a pas marché.",
    },
  },
  es: {
    title: "Obras municipales",
    intro: "Grandes obras del municipio, voluntarias y pagadas a plazos. Solo una obra a la vez.",
    stages: {
      spital1: ["Hospital: sala de enfermos", "Reduce el riesgo de enfermedad del pueblo al 85 %."],
      waage1: [
        "Báscula pública: casa del peso",
        "Todos los precios del depósito para madera y piedra bajan un 15 %.",
      ],
    },
    voluntary:
      "Voluntario – el dinero aportado queda en la obra. Del depósito solo se paga hasta tu presupuesto de materiales.",
    oneSite: "Solo una obra municipal a la vez.",
    budget: (max) => `Presupuesto de materiales para el depósito (como mucho ${max})`,
    budgetNone: "Solo el almacén propio",
    budgetFull: "Todo lo necesario",
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
    errors: {
      rank: "Solo desde pueblo.",
      busy: "Ya hay una obra municipal en curso.",
      money: "No hay bastante dinero en el arca.",
      fail: "No ha funcionado.",
    },
  },
  ar: {
    title: "مباني البلدية",
    intro: "مبانٍ كبيرة للجماعة، طوعية وتُدفع على أقساط. ورشة واحدة فقط في كل مرة.",
    stages: {
      spital1: ["المارستان: قاعة المرضى", "يخفّض خطر المرض في القرية إلى 85 %."],
      waage1: ["ميزان المدينة: دار الوزن", "تنخفض كل أسعار المخزن للخشب والحجر بنسبة 15 %."],
    },
    voluntary:
      "طوعي – المال المدفوع يبقى في البناء. لا يُدفع للمخزن إلا من ميزانية المواد التي تحددها.",
    oneSite: "ورشة بلدية واحدة فقط في كل مرة.",
    budget: (max) => `ميزانية المواد للمخزن (بحد أقصى ${max})`,
    budgetNone: "المخزون الخاص فقط",
    budgetFull: "كامل الحاجة",
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
    errors: {
      rank: "فقط من مرتبة القرية.",
      busy: "هناك ورشة بلدية جارية بالفعل.",
      money: "لا يكفي المال في الخزينة.",
      fail: "لم ينجح ذلك.",
    },
  },
  hi: {
    title: "नगर-निर्माण",
    intro:
      "समुदाय के बड़े निर्माण, स्वैच्छिक और किस्तों में भुगतान। एक समय में केवल एक निर्माण-स्थल।",
    stages: {
      spital1: ["अस्पताल: रोगी-कक्ष", "गाँव में बीमारी का जोखिम घटाकर 85 % करता है।"],
      waage1: ["नगर-तराज़ू: तौल-घर", "लकड़ी और पत्थर के सभी कोठी-दाम 15 % सस्ते हो जाते हैं।"],
    },
    voluntary:
      "स्वैच्छिक – जमा पैसा निर्माण में ही रहता है। कोठी को अधिकतम आपके सामग्री-बजट से भुगतान होता है।",
    oneSite: "एक समय में केवल एक नगर-निर्माण स्थल।",
    budget: (max) => `कोठी के लिए सामग्री-बजट (अधिकतम ${max})`,
    budgetNone: "केवल अपना भंडार",
    budgetFull: "पूरी ज़रूरत",
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
    errors: {
      rank: "केवल गाँव स्तर से।",
      busy: "एक नगर-निर्माण पहले से चल रहा है।",
      money: "खज़ाने में पर्याप्त पैसा नहीं।",
      fail: "यह नहीं हुआ।",
    },
  },
  zh: {
    title: "公共工程",
    intro: "村社的大型工程，自愿建造、分期付款。同一时间只能有一处工地。",
    stages: {
      spital1: ["济贫院：病房", "将村中的患病风险降至 85 %。"],
      waage1: ["公秤：过磅房", "商栈的木材和石料价格全部便宜 15 %。"],
    },
    voluntary: "自愿——已付的钱留在工程中。商栈费用最多只从你的材料预算中支付。",
    oneSite: "同一时间只能有一处公共工地。",
    budget: (max) => `商栈材料预算（最多 ${max}）`,
    budgetNone: "只用自有库存",
    budgetFull: "全部所需",
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
    errors: {
      rank: "村庄等级起才可建。",
      busy: "已有一处公共工地在建。",
      money: "金库里的钱不够。",
      fail: "没有成功。",
    },
  },
  ja: {
    title: "公共建築",
    intro: "共同体の大きな建物。任意で、分割で支払います。工事現場は一度に一つだけ。",
    stages: {
      spital1: ["施療院：病室", "村の病気のリスクを 85 % に下げます。"],
      waage1: ["公設秤：計量所", "商館での木材と石材の価格がすべて 15 % 安くなります。"],
    },
    voluntary: "任意です。払い込んだお金は建物に残ります。商館への支払いは資材予算の範囲だけです。",
    oneSite: "公共建築の現場は一度に一つだけです。",
    budget: (max) => `商館用の資材予算（最大 ${max}）`,
    budgetNone: "自分の蓄えのみ",
    budgetFull: "必要量すべて",
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
    errors: {
      rank: "村からです。",
      busy: "すでに公共建築の現場があります。",
      money: "金庫のお金が足りません。",
      fail: "うまくいきませんでした。",
    },
  },
};
