import type { Lang } from "../i18n";
import type { VorhabenKey } from "../vorhaben";

type Item = { title: string; intro: string; benefit: string; call: string };
type Text = { head: string; items: Record<VorhabenKey, Item>; open: (h: number) => string; wait: (d: number) => string; paid: (t: string) => string; voluntary: string };
/** Gemeindevorhaben texts, all eight languages. */
export const VORHABEN_T: Record<Lang, Text> = {
  de: { head: "Gemeindevorhaben", open: (h) => `Läuft – noch ${h} Std.`, wait: (d) => `Wieder möglich in ${d} ${d === 1 ? "Tag" : "Tagen"}`, paid: (t) => `${t}: beschlossen und bezahlt.`, voluntary: "Freiwillig – kein Unterhalt. Der Preis wächst mit der Tagessteuer des Dorfes.",
    items: { bauhuette: { title: "Bauhütte anwerben", intro: "Fremde Zimmerleute und Maurer arbeiten zwei Tage lang für das Dorf.", benefit: "48 Std. lang geht jeder gekaufte Bau und jede Prachtbau-Stufe um die Hälfte schneller voran – auch Bauten, die in dieser Zeit begonnen werden.", call: "Bauhütte anwerben" } } },
  en: { head: "Community works", open: (h) => `Running – ${h} h left`, wait: (d) => `Possible again in ${d} ${d === 1 ? "day" : "days"}`, paid: (t) => `${t}: decided and paid.`, voluntary: "Voluntary – no upkeep. The price grows with the village's daily tax.",
    items: { bauhuette: { title: "Hire a builders' lodge", intro: "Travelling carpenters and masons work for the village for two days.", benefit: "For 48 h every bought building and monument step progresses half again as fast – including builds started during that time.", call: "Hire the lodge" } } },
  fr: { head: "Ouvrages communaux", open: (h) => `En cours – encore ${h} h`, wait: (d) => `De nouveau possible dans ${d} ${d === 1 ? "jour" : "jours"}`, paid: (t) => `${t} : décidé et payé.`, voluntary: "Facultatif – sans entretien. Le prix suit l'impôt journalier du village.",
    items: { bauhuette: { title: "Engager une loge de bâtisseurs", intro: "Des charpentiers et maçons itinérants travaillent deux jours pour le village.", benefit: "Pendant 48 h, chaque bâtiment acheté et chaque étape de monument avance 50 % plus vite – y compris les chantiers commencés entre-temps.", call: "Engager la loge" } } },
  es: { head: "Obras comunales", open: (h) => `En curso – quedan ${h} h`, wait: (d) => `De nuevo posible en ${d} ${d === 1 ? "día" : "días"}`, paid: (t) => `${t}: decidido y pagado.`, voluntary: "Voluntario – sin mantenimiento. El precio crece con el impuesto diario.",
    items: { bauhuette: { title: "Contratar una logia de constructores", intro: "Carpinteros y canteros ambulantes trabajan dos días para el pueblo.", benefit: "Durante 48 h cada edificio comprado y cada etapa de monumento avanza un 50 % más rápido, también las obras iniciadas en ese tiempo.", call: "Contratar la logia" } } },
  ar: { head: "أشغال البلدة", open: (h) => `جارٍ – بقي ${h} ساعة`, wait: (d) => `ممكن مجددًا بعد ${d} ${d === 1 ? "يوم" : "أيام"}`, paid: (t) => `${t}: تقرّر ودُفع.`, voluntary: "اختياري – بلا صيانة. يزداد السعر مع الضريبة اليومية للقرية.",
    items: { bauhuette: { title: "استئجار ورشة بنّائين", intro: "يعمل نجّارون وبنّاؤون جوّالون للقرية يومين.", benefit: "لمدة 48 ساعة يتقدّم كل مبنى مشترى وكل مرحلة من صرح أسرع بالنصف – ومنها الأبنية التي تبدأ خلال هذه المدة.", call: "استئجار الورشة" } } },
  hi: { head: "सामुदायिक कार्य", open: (h) => `जारी – ${h} घंटे बाकी`, wait: (d) => `${d} दिन बाद फिर संभव`, paid: (t) => `${t}: तय और भुगतान हुआ।`, voluntary: "स्वैच्छिक – कोई रखरखाव नहीं। कीमत गाँव के दैनिक कर के साथ बढ़ती है।",
    items: { bauhuette: { title: "निर्माण-मंडली बुलाएँ", intro: "घुमंतू बढ़ई और राजमिस्त्री दो दिन गाँव के लिए काम करते हैं।", benefit: "48 घंटे तक हर खरीदी गई इमारत और स्मारक का हर चरण डेढ़ गुना तेज़ बनता है – इस बीच शुरू हुए निर्माण भी।", call: "मंडली बुलाएँ" } } },
  zh: { head: "公共工程", open: (h) => `进行中——还剩${h}小时`, wait: (d) => `${d}天后可再次进行`, paid: (t) => `${t}：已决定并付款。`, voluntary: "自愿——无维护费。价格随村庄每日税收增长。",
    items: { bauhuette: { title: "雇用建筑工坊", intro: "游方木匠和石匠为村庄工作两天。", benefit: "48小时内，每座购买的建筑和每个宏伟建筑阶段的进度加快一半——期间新开工的也算。", call: "雇用工坊" } } },
  ja: { head: "共同事業", open: (h) => `実施中 – 残り${h}時間`, wait: (d) => `${d}日後に再び可能`, paid: (t) => `${t}：決定し支払いました。`, voluntary: "任意 – 維持費なし。価格は村の日々の税に応じて上がります。",
    items: { bauhuette: { title: "建築組合を雇う", intro: "旅の大工と石工が二日間、村のために働きます。", benefit: "48時間、購入した建物と記念建築の各段階が1.5倍の速さで進みます――期間中に始めた工事も含みます。", call: "組合を雇う" } } },
};
