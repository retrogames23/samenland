import type { Lang } from "../i18n";

type Text = {
  title: string; intro: string; voluntary: string; done: string; needBase: string; needPrevious: string; bought: string; available: string; pay: string;
  stage: (n: number) => string; baseReq: (name: string) => string;
  paidMsg: (building: string, step: string, effect: string, price: string, balance: string) => string;
  names: Record<"backhaus" | "herberge" | "granary", string>; steps: Record<string, [string, string]>;
};
/** Ausbaustufen texts (ausbau.ts), all eight languages. */
export const AUSBAU: Record<Lang, Text> = {
  de: { title: "Ausbau der Gemeindebauten", intro: "Bestehende Einrichtungen dauerhaft verbessern – einmalig bezahlt, ohne Unterhalt.", voluntary: "Freiwillig – jede Stufe nur einmal.", done: "Voll ausgebaut", needBase: "Voraussetzung fehlt: Erst das Grundgebäude fertigstellen", needPrevious: "Voraussetzung fehlt: Erst Stufe 2 ausbauen", bought: "Bereits gekauft", available: "Kaufbar", pay: "Ausbauen", stage: (n) => `Stufe ${n}`, baseReq: (n) => `Voraussetzung: ${n} fertiggestellt`,
    paidMsg: (b, s, e, p, c) => `${b} – ${s} ausgebaut. ${p} ausgegeben. Jetzt: ${e} Kassenbestand: ${c}.`,
    names: { backhaus: "Backhaus", herberge: "Gesellenherberge", granary: "Kornspeicher" },
    steps: { backhaus2: ["Zweiter Ofen", "Vorratskammer: 15 % weniger Getreide je Mahlzeit (statt 10 %)."], backhaus3: ["Backstube mit Mehlkammer", "Vorratskammer: 20 % weniger Getreide je Mahlzeit."],
      herberge2: ["Herbergsstube", "Gesellen auf der Walz kommen öfter: 60 % statt 50 % je Tag und Straße."], herberge3: ["Zunftherberge", "Gesellen kommen an 70 % der Tage."],
      granary2: ["Zweiter Schüttboden", "Vorratskammer: +60 Getreide Lagerplatz."], granary3: ["Speicher mit Windluke", "Vorratskammer: weitere +60 Getreide Lagerplatz."] } },
  en: { title: "Upgrade community buildings", intro: "Improve existing buildings for good – paid once, no upkeep.", voluntary: "Voluntary – each step only once.", done: "Fully upgraded", needBase: "Prerequisite missing: Complete the base building first", needPrevious: "Prerequisite missing: Upgrade stage 2 first", bought: "Already purchased", available: "Available", pay: "Upgrade", stage: (n) => `Stage ${n}`, baseReq: (n) => `Requires: ${n} completed`,
    paidMsg: (b, s, e, p, c) => `${b} – ${s} upgraded. ${p} spent. Now: ${e} Treasury balance: ${c}.`,
    names: { backhaus: "Bakehouse", herberge: "Journeymen's inn", granary: "Granary" },
    steps: { backhaus2: ["Second oven", "Larder: 15% less grain per meal (instead of 10%)."], backhaus3: ["Bakery with flour room", "Larder: 20% less grain per meal."],
      herberge2: ["Inn parlour", "Journeymen come more often: 60% instead of 50% per day and road."], herberge3: ["Guild inn", "Journeymen come on 70% of days."],
      granary2: ["Second grain loft", "Larder: +60 grain storage."], granary3: ["Loft with wind hatch", "Larder: another +60 grain storage."] } },
  fr: { title: "Agrandir les bâtiments communaux", intro: "Améliorer durablement les bâtiments existants – payé une fois, sans entretien.", voluntary: "Facultatif – chaque palier une seule fois.", done: "Entièrement agrandi", needBase: "Condition manquante : Terminez d'abord le bâtiment de base", needPrevious: "Condition manquante : Améliorez d'abord le niveau 2", bought: "Déjà acheté", available: "Disponible", pay: "Agrandir", stage: (n) => `Niveau ${n}`, baseReq: (n) => `Condition : ${n} terminé`,
    paidMsg: (b, s, e, p, c) => `${b} – ${s} agrandi. ${p} dépensés. Désormais : ${e} Solde du coffre : ${c}.`,
    names: { backhaus: "Four banal", herberge: "Auberge des compagnons", granary: "Grenier à grain" },
    steps: { backhaus2: ["Deuxième four", "Garde-manger : 15 % de grain en moins par repas (au lieu de 10 %)."], backhaus3: ["Fournil avec chambre à farine", "Garde-manger : 20 % de grain en moins par repas."],
      herberge2: ["Salle d'auberge", "Les compagnons viennent plus souvent : 60 % au lieu de 50 % par jour et route."], herberge3: ["Auberge de guilde", "Les compagnons viennent 70 % des jours."],
      granary2: ["Second plancher à grain", "Garde-manger : +60 de stockage de grain."], granary3: ["Grenier à lucarne", "Garde-manger : encore +60 de stockage de grain."] } },
  es: { title: "Ampliar edificios comunales", intro: "Mejorar para siempre los edificios existentes – un solo pago, sin mantenimiento.", voluntary: "Voluntario – cada nivel solo una vez.", done: "Totalmente ampliado", needBase: "Falta el requisito: Termina primero el edificio básico", needPrevious: "Falta el requisito: Amplía primero el nivel 2", bought: "Ya comprado", available: "Disponible", pay: "Ampliar", stage: (n) => `Nivel ${n}`, baseReq: (n) => `Requisito: ${n} terminado`,
    paidMsg: (b, s, e, p, c) => `${b} – ${s} ampliado. ${p} gastados. Ahora: ${e} Saldo de la caja: ${c}.`,
    names: { backhaus: "Horno comunal", herberge: "Posada de oficiales", granary: "Granero" },
    steps: { backhaus2: ["Segundo horno", "Despensa: 15 % menos grano por comida (en vez de 10 %)."], backhaus3: ["Tahona con cuarto de harina", "Despensa: 20 % menos grano por comida."],
      herberge2: ["Sala de posada", "Los oficiales vienen más a menudo: 60 % en vez de 50 % por día y camino."], herberge3: ["Posada gremial", "Los oficiales vienen el 70 % de los días."],
      granary2: ["Segundo piso de grano", "Despensa: +60 de almacén de grano."], granary3: ["Granero con tragaluz", "Despensa: otros +60 de almacén de grano."] } },
  ar: { title: "توسيع مباني الجماعة", intro: "تحسين دائم للمباني القائمة – دفعة واحدة بلا صيانة.", voluntary: "اختياري – كل درجة مرة واحدة.", done: "موسَّع بالكامل", needBase: "الشرط غير مكتمل: أكمل المبنى الأساسي أولًا", needPrevious: "الشرط غير مكتمل: وسِّع الدرجة الثانية أولًا", bought: "تم شراؤه بالفعل", available: "متاح", pay: "وسِّع", stage: (n) => `الدرجة ${n}`, baseReq: (n) => `الشرط: اكتمال ${n}`,
    paidMsg: (b, s, e, p, c) => `تم توسيع ${b} – ${s}. أُنفق ${p}. الآن: ${e} رصيد الصندوق: ${c}.`,
    names: { backhaus: "المخبز الجماعي", herberge: "نُزُل الحرفيين", granary: "مخزن الحبوب" },
    steps: { backhaus2: ["فرن ثانٍ", "بيت المؤونة: حبوب أقل بنسبة 15٪ لكل وجبة (بدل 10٪)."], backhaus3: ["مخبز بغرفة دقيق", "بيت المؤونة: حبوب أقل بنسبة 20٪ لكل وجبة."],
      herberge2: ["قاعة النُّزُل", "يأتي الحرفيون أكثر: 60٪ بدل 50٪ يوميًا لكل طريق."], herberge3: ["نُزُل النقابة", "يأتي الحرفيون في 70٪ من الأيام."],
      granary2: ["طابق حبوب ثانٍ", "بيت المؤونة: +60 سعة تخزين للحبوب."], granary3: ["مخزن بكوّة هواء", "بيت المؤونة: +60 أخرى سعة تخزين للحبوب."] } },
  hi: { title: "सामुदायिक भवनों का विस्तार", intro: "मौजूदा भवनों को स्थायी रूप से बेहतर करें – एक बार भुगतान, कोई रखरखाव नहीं।", voluntary: "स्वैच्छिक – हर चरण केवल एक बार।", done: "पूरा विस्तार हो गया", needBase: "शर्त अधूरी: पहले मूल भवन पूरा करें", needPrevious: "शर्त अधूरी: पहले चरण 2 का विस्तार करें", bought: "पहले से खरीदा गया", available: "खरीद के लिए उपलब्ध", pay: "विस्तार करें", stage: (n) => `चरण ${n}`, baseReq: (n) => `शर्त: ${n} पूरा हो`,
    paidMsg: (b, s, e, p, c) => `${b} – ${s} का विस्तार हुआ। ${p} खर्च हुए। अब: ${e} कोष शेष: ${c}।`,
    names: { backhaus: "सामुदायिक तंदूर", herberge: "कारीगर सराय", granary: "अन्न भंडार" },
    steps: { backhaus2: ["दूसरा तंदूर", "रसद-कोठार: हर भोजन में 15% कम अनाज (10% के बजाय)।"], backhaus3: ["आटा-कक्ष वाली बेकरी", "रसद-कोठार: हर भोजन में 20% कम अनाज।"],
      herberge2: ["सराय का कमरा", "कारीगर अधिक आते हैं: हर दिन और सड़क पर 50% के बजाय 60%।"], herberge3: ["संघ सराय", "कारीगर 70% दिनों में आते हैं।"],
      granary2: ["दूसरी अनाज मंज़िल", "रसद-कोठार: +60 अनाज भंडारण।"], granary3: ["हवा-झरोखे वाला भंडार", "रसद-कोठार: और +60 अनाज भंडारण।"] } },
  zh: { title: "扩建公共建筑", intro: "永久改进现有建筑——一次付清，无需维护。", voluntary: "自愿——每一级只能一次。", done: "已全部扩建", needBase: "缺少前提：请先完成基础建筑", needPrevious: "缺少前提：请先扩建第 2 级", bought: "已购买", available: "可购买", pay: "扩建", stage: (n) => `第 ${n} 级`, baseReq: (n) => `前提：${n}已完工`,
    paidMsg: (b, s, e, p, c) => `${b}——${s}已扩建。已支出${p}。现在：${e} 金库余额：${c}。`,
    names: { backhaus: "公共烤房", herberge: "工匠客栈", granary: "粮仓" },
    steps: { backhaus2: ["第二座烤炉", "储藏室：每餐少用 15% 粮食（原为 10%）。"], backhaus3: ["带面粉间的烤坊", "储藏室：每餐少用 20% 粮食。"],
      herberge2: ["客栈厅堂", "游历工匠来得更勤：每条路每天 60%（原为 50%）。"], herberge3: ["行会客栈", "游历工匠在 70% 的日子到来。"],
      granary2: ["第二层粮楼", "储藏室：粮食储量 +60。"], granary3: ["带风窗的粮仓", "储藏室：粮食储量再 +60。"] } },
  ja: { title: "共同施設の拡張", intro: "既存の施設を恒久的に改良——一度の支払いで維持費なし。", voluntary: "任意——各段階は一度だけ。", done: "拡張完了", needBase: "前提不足：まず基本建物を完成させてください", needPrevious: "前提不足：まず段階2を拡張してください", bought: "購入済み", available: "購入可能", pay: "拡張する", stage: (n) => `段階${n}`, baseReq: (n) => `前提：${n}の完成`,
    paidMsg: (b, s, e, p, c) => `${b}——${s}を拡張しました。${p}を支出。現在：${e} 金庫残高：${c}。`,
    names: { backhaus: "共同パン焼き小屋", herberge: "職人宿", granary: "穀物倉" },
    steps: { backhaus2: ["二つ目の窯", "食料庫：1食あたりの穀物15%減（従来10%）。"], backhaus3: ["粉部屋付きパン工房", "食料庫：1食あたりの穀物20%減。"],
      herberge2: ["宿の広間", "遍歴職人がより頻繁に：道ごと1日50%→60%。"], herberge3: ["ギルド宿", "遍歴職人が70%の日に来る。"],
      granary2: ["二層目の穀物床", "食料庫：穀物の貯蔵 +60。"], granary3: ["風窓付きの倉", "食料庫：さらに穀物の貯蔵 +60。"] } },
};
