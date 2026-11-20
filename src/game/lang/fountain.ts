import type { Lang } from "../i18n";

type Text = {
  title: string; intro: string; benefit: string; voluntary: string; steps: [string, string, string];
  days: (n: number) => string; funded: (paid: number, total: number) => string; rest: (n: number) => string;
  pay: (name: string) => string; building: (days: number) => string; done: string; ready: string; locked: string; paidMsg: (name: string) => string;
};
/** Marktbrunnen mit Wasserkunst — municipal investment texts (all eight languages). */
export const FOUNTAIN: Record<Lang, Text> = {
  de: { title: "Ratsvorhaben: Marktbrunnen mit Wasserkunst", intro: "Ein steinerner Brunnen mitten am Markt. Jeder Bauabschnitt wird freiwillig aus der Gemeindetruhe gestiftet.",
    benefit: "Brandschutz im Marktkern: Brunnenkump halbiert die brennenden Dächer, Wasserkunst lässt die Eimerketten schneller löschen (Brände 25 % kürzer). Keine zusätzlichen Einnahmen.",
    voluntary: "Freiwillig – nichts wird automatisch abgebucht.", steps: ["Brunnenkump", "Wasserkunst", "Brunnensäule mit Wappentier"],
    days: (n) => `${n} Tage Bauzeit`, funded: (p, t) => `Gestiftet: ${p} von ${t} Mark`, rest: (n) => `Noch offen: ${n} Mark`,
    pay: (n) => `${n} stiften`, building: (d) => `Im Bau – noch ${d} Tage`, done: "Vollendet", ready: "Wirkt", locked: "Ab Handelsstadt", paidMsg: (n) => `${n} gestiftet – die Steinmetze beginnen.` },
  en: { title: "Council works: Market fountain with waterworks", intro: "A stone fountain in the middle of the market. Each stage is funded voluntarily from the village chest.",
    benefit: "Fire protection in the market core: the basin halves the burning roofs, the waterworks lets bucket chains put fires out faster (fires 25 % shorter). No extra income.",
    voluntary: "Voluntary – nothing is ever deducted automatically.", steps: ["Fountain basin", "Waterworks", "Fountain column with heraldic beast"],
    days: (n) => `${n} days to build`, funded: (p, t) => `Funded: ${p} of ${t} marks`, rest: (n) => `Still open: ${n} marks`,
    pay: (n) => `Fund ${n}`, building: (d) => `Under construction – ${d} days left`, done: "Completed", ready: "In effect", locked: "From trading town", paidMsg: (n) => `${n} funded – the masons begin.` },
  fr: { title: "Ouvrage du conseil : fontaine du marché", intro: "Une fontaine de pierre au milieu du marché. Chaque tranche est financée librement par le coffre du village.",
    benefit: "Protection incendie au cœur du marché : le bassin réduit de moitié les toits en feu, la machine hydraulique accélère les chaînes de seaux (incendies 25 % plus courts). Aucun revenu supplémentaire.",
    voluntary: "Volontaire – rien n'est prélevé automatiquement.", steps: ["Bassin", "Machine hydraulique", "Colonne aux armoiries"],
    days: (n) => `${n} jours de travaux`, funded: (p, t) => `Financé : ${p} sur ${t} marcs`, rest: (n) => `Reste : ${n} marcs`,
    pay: (n) => `Financer ${n}`, building: (d) => `En chantier – encore ${d} jours`, done: "Achevé", ready: "Actif", locked: "Dès la ville marchande", paidMsg: (n) => `${n} financé – les tailleurs de pierre commencent.` },
  es: { title: "Obra del concejo: fuente del mercado", intro: "Una fuente de piedra en medio del mercado. Cada fase se financia voluntariamente desde el arca del pueblo.",
    benefit: "Protección contra incendios en el centro del mercado: el pilón reduce a la mitad los tejados en llamas, la máquina hidráulica acelera las cadenas de cubos (incendios 25 % más cortos). Sin ingresos extra.",
    voluntary: "Voluntario – nunca se cobra nada automáticamente.", steps: ["Pilón", "Máquina hidráulica", "Columna con escudo"],
    days: (n) => `${n} días de obra`, funded: (p, t) => `Financiado: ${p} de ${t} marcos`, rest: (n) => `Pendiente: ${n} marcos`,
    pay: (n) => `Financiar ${n}`, building: (d) => `En obras – faltan ${d} días`, done: "Terminada", ready: "Activa", locked: "Desde ciudad comercial", paidMsg: (n) => `${n} financiado – empiezan los canteros.` },
  ar: { title: "مشروع المجلس: نافورة السوق", intro: "نافورة حجرية في وسط السوق. تُموَّل كل مرحلة طوعًا من خزينة القرية.",
    benefit: "حماية من الحرائق في قلب السوق: الحوض يقلّل الأسطح المحترقة إلى النصف، وآلة الماء تسرّع سلاسل الدلاء (الحرائق أقصر بنسبة 25 %). لا دخل إضافي.",
    voluntary: "طوعي – لا يُخصم شيء تلقائيًا.", steps: ["حوض النافورة", "آلة الماء", "عمود بشعار المدينة"],
    days: (n) => `${n} يومًا للبناء`, funded: (p, t) => `المموَّل: ${p} من ${t} مارك`, rest: (n) => `المتبقي: ${n} مارك`,
    pay: (n) => `تمويل ${n}`, building: (d) => `قيد البناء – بقي ${d} يومًا`, done: "اكتملت", ready: "فعّالة", locked: "من المدينة التجارية", paidMsg: (n) => `تم تمويل ${n} – بدأ البنّاؤون.` },
  hi: { title: "परिषद कार्य: बाज़ार का फव्वारा", intro: "बाज़ार के बीच पत्थर का फव्वारा। हर चरण गाँव के खज़ाने से स्वेच्छा से दिया जाता है।",
    benefit: "बाज़ार के केंद्र में आग से सुरक्षा: हौज़ जलती छतों को आधा करता है, जल-यंत्र बाल्टी-कतारों को तेज़ करता है (आग 25 % कम समय)। कोई अतिरिक्त आय नहीं।",
    voluntary: "स्वैच्छिक – कुछ भी अपने आप नहीं कटता।", steps: ["फव्वारे का हौज़", "जल-यंत्र", "कुल-चिह्न वाला स्तंभ"],
    days: (n) => `${n} दिन निर्माण`, funded: (p, t) => `दिया गया: ${t} में से ${p} मार्क`, rest: (n) => `बाकी: ${n} मार्क`,
    pay: (n) => `${n} के लिए दें`, building: (d) => `निर्माणाधीन – ${d} दिन बाकी`, done: "पूर्ण", ready: "प्रभावी", locked: "व्यापार नगर से", paidMsg: (n) => `${n} के लिए धन दिया – राजमिस्त्री शुरू करते हैं।` },
  zh: { title: "议会工程：市集喷泉与水车", intro: "市集中央的石砌喷泉。每个阶段都由村库自愿出资。",
    benefit: "市集核心防火：水池使着火的屋顶减半，水车让水桶队更快灭火（火灾时长缩短 25%）。不产生额外收入。",
    voluntary: "自愿——绝不会自动扣款。", steps: ["喷泉水池", "水车机关", "纹章石柱"],
    days: (n) => `工期 ${n} 天`, funded: (p, t) => `已出资：${p} / ${t} 马克`, rest: (n) => `尚余：${n} 马克`,
    pay: (n) => `资助「${n}」`, building: (d) => `建造中——还剩 ${d} 天`, done: "已完工", ready: "生效中", locked: "商业城市起", paidMsg: (n) => `已资助「${n}」——石匠开工了。` },
  ja: { title: "参事会事業：市場の噴水と水車仕掛け", intro: "市場の真ん中に石の噴水。各段階は村の金庫から任意で出資します。",
    benefit: "市場中心部の防火：水盤で燃える屋根が半分に、水車仕掛けでバケツリレーが速くなります（火事が25%短く）。追加収入はありません。",
    voluntary: "任意です――自動で引き落とされることはありません。", steps: ["噴水の水盤", "水車仕掛け", "紋章獣の柱"],
    days: (n) => `工期 ${n} 日`, funded: (p, t) => `出資済み：${t} マルク中 ${p}`, rest: (n) => `残り：${n} マルク`,
    pay: (n) => `「${n}」に出資`, building: (d) => `建設中――残り ${d} 日`, done: "完成", ready: "効果あり", locked: "商業都市から", paidMsg: (n) => `「${n}」に出資しました――石工が作業を始めます。` },
};
