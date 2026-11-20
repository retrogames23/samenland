import type { Lang } from "../i18n";
import type { VorhabenKey } from "../vorhaben";

type Item = { title: string; intro: string; benefit: string; call: string };
type Text = { head: string; items: Record<VorhabenKey, Item>; open: (h: number) => string; wait: (d: number) => string; paid: (t: string) => string; voluntary: string; noRoad: string; paved: (n: number, m: number) => string };
/** Gemeindevorhaben texts, all eight languages. */
export const VORHABEN_T: Record<Lang, Text> = {
  de: { head: "Gemeindevorhaben", open: (h) => `Läuft – noch ${h} Std.`, wait: (d) => `Wieder möglich in ${d} ${d === 1 ? "Tag" : "Tagen"}`, paid: (t) => `${t}: beschlossen und bezahlt.`, voluntary: "Freiwillig – kein Unterhalt, nichts verfällt. Der Preis wächst mit der Tagessteuer des Dorfes.", noRoad: "Keine fertige Handelsstraße mehr ungepflastert.", paved: (n, m) => `${n} von ${m} Straßen gepflastert`,
    items: {
      bauhuette: { title: "Bauhütte anwerben", intro: "Fremde Zimmerleute und Maurer arbeiten drei Tage lang für das Dorf.", benefit: "Laufende Bauten und Prachtbau-Stufen werden 12 Std. früher fertig; Wiederaufbau nach Brand oder Hochwasser geht 3 Tage lang doppelt so schnell.", call: "Bauhütte anwerben" },
      armen: { title: "Armenspeisung", intro: "Auf dem Platz wird zwei Tage lang Suppe und Brot an alle ausgegeben.", benefit: "48 Std. lang erkranken nur halb so viele Haushalte – so fallen weniger Steuern aus.", call: "Speisung ausrichten" },
      fest: { title: "Bürgerfest", intro: "Die ganze Stadt versammelt sich vor dem Amtssitz, auf dem Platz stehen Buden unter der Stadtfahne.", benefit: "Einen Tag lang Festfreude: niemand erkrankt, alle Steuern gehen ein.", call: "Bürgerfest ausrichten" },
      pflaster: { title: "Wegeausbau", intro: "Eine fertige Handelsstraße wird mit Feldsteinen gepflastert.", benefit: "Dauerhaft sichtbar: Die Straße liegt als Kopfsteinpflaster in der Landschaft. Rein baulich, ohne Steuer- oder Wachstumswirkung.", call: "Straße pflastern" },
    } },
  en: { head: "Community works", open: (h) => `Running – ${h} h left`, wait: (d) => `Possible again in ${d} ${d === 1 ? "day" : "days"}`, paid: (t) => `${t}: decided and paid.`, voluntary: "Voluntary – no upkeep, nothing expires. The price grows with the village's daily tax.", noRoad: "No finished trade road left unpaved.", paved: (n, m) => `${n} of ${m} roads paved`,
    items: {
      bauhuette: { title: "Hire a builders' lodge", intro: "Travelling carpenters and masons work for the village for three days.", benefit: "Running builds and monument steps finish 12 h earlier; rebuilding after fire or flood runs twice as fast for 3 days.", call: "Hire the lodge" },
      armen: { title: "Poor relief", intro: "For two days soup and bread are handed out to everyone on the square.", benefit: "For 48 h only half as many households fall sick – so less tax is lost.", call: "Hold the relief" },
      fest: { title: "Town festival", intro: "The whole town gathers before the seat; stalls stand on the square under the town flag.", benefit: "One day of festive joy: nobody falls sick, every tax comes in.", call: "Hold the festival" },
      pflaster: { title: "Road paving", intro: "A finished trade road is paved with fieldstones.", benefit: "Permanently visible: the road lies as cobbles in the landscape. Purely structural, no tax or growth effect.", call: "Pave a road" },
    } },
  fr: { head: "Ouvrages communaux", open: (h) => `En cours – encore ${h} h`, wait: (d) => `De nouveau possible dans ${d} ${d === 1 ? "jour" : "jours"}`, paid: (t) => `${t} : décidé et payé.`, voluntary: "Facultatif – sans entretien, rien ne se perd. Le prix suit l'impôt journalier du village.", noRoad: "Plus aucune route commerciale achevée à paver.", paved: (n, m) => `${n} routes pavées sur ${m}`,
    items: {
      bauhuette: { title: "Engager une loge de bâtisseurs", intro: "Des charpentiers et maçons itinérants travaillent trois jours pour le village.", benefit: "Les chantiers en cours et les étapes de monument finissent 12 h plus tôt ; la reconstruction après incendie ou crue va deux fois plus vite pendant 3 jours.", call: "Engager la loge" },
      armen: { title: "Soupe des pauvres", intro: "Pendant deux jours, soupe et pain sont distribués à tous sur la place.", benefit: "Pendant 48 h, deux fois moins de foyers tombent malades – moins d'impôts perdus.", call: "Organiser la soupe" },
      fest: { title: "Fête des bourgeois", intro: "Toute la ville se rassemble devant le siège ; des étals se dressent sous la bannière de la ville.", benefit: "Un jour de liesse : personne ne tombe malade, tous les impôts rentrent.", call: "Organiser la fête" },
      pflaster: { title: "Pavage des routes", intro: "Une route commerciale achevée est pavée de pierres des champs.", benefit: "Visible pour toujours : la route devient un pavé dans le paysage. Purement architectural, sans effet sur impôts ni croissance.", call: "Paver une route" },
    } },
  es: { head: "Obras comunales", open: (h) => `En curso – quedan ${h} h`, wait: (d) => `De nuevo posible en ${d} ${d === 1 ? "día" : "días"}`, paid: (t) => `${t}: decidido y pagado.`, voluntary: "Voluntario – sin mantenimiento, nada caduca. El precio crece con el impuesto diario.", noRoad: "No queda ninguna ruta comercial terminada sin empedrar.", paved: (n, m) => `${n} de ${m} caminos empedrados`,
    items: {
      bauhuette: { title: "Contratar una logia de obreros", intro: "Carpinteros y canteros ambulantes trabajan tres días para la aldea.", benefit: "Las obras en curso y las etapas de monumento terminan 12 h antes; la reconstrucción tras incendio o inundación va el doble de rápido durante 3 días.", call: "Contratar la logia" },
      armen: { title: "Sopa de pobres", intro: "Durante dos días se reparte sopa y pan a todos en la plaza.", benefit: "Durante 48 h enferma solo la mitad de los hogares – se pierden menos impuestos.", call: "Repartir la sopa" },
      fest: { title: "Fiesta ciudadana", intro: "Toda la ciudad se reúne ante la sede; hay puestos en la plaza bajo la bandera.", benefit: "Un día de alegría: nadie enferma, entran todos los impuestos.", call: "Celebrar la fiesta" },
      pflaster: { title: "Empedrado de caminos", intro: "Una ruta comercial terminada se empiedra con cantos.", benefit: "Visible para siempre: el camino queda empedrado en el paisaje. Solo obra, sin efecto en impuestos ni crecimiento.", call: "Empedrar un camino" },
    } },
  ar: { head: "أشغال البلدة", open: (h) => `جارٍ – بقي ${h} ساعة`, wait: (d) => `ممكن مجددًا بعد ${d} ${d === 1 ? "يوم" : "أيام"}`, paid: (t) => `${t}: تقرّر ودُفع.`, voluntary: "اختياري – بلا صيانة ولا شيء يضيع. يزداد السعر مع الضريبة اليومية للقرية.", noRoad: "لم يبقَ طريق تجاري منجز بلا رصف.", paved: (n, m) => `رُصف ${n} من ${m} طرق`,
    items: {
      bauhuette: { title: "استئجار ورشة بنّائين", intro: "يعمل نجارون وبنّاؤون جوّالون للقرية ثلاثة أيام.", benefit: "تنتهي الأبنية الجارية ومراحل الصروح أبكر بـ12 ساعة، ويسير الإعمار بعد الحريق أو الفيضان بضعف السرعة 3 أيام.", call: "استأجر الورشة" },
      armen: { title: "إطعام الفقراء", intro: "يوزَّع الحساء والخبز على الجميع في الساحة يومين.", benefit: "مدة 48 ساعة يمرض نصف عدد البيوت فقط – فيضيع قليل من الضرائب.", call: "أقم الإطعام" },
      fest: { title: "عيد المدينة", intro: "تجتمع المدينة كلها أمام دار الحكم، وتقوم الأكشاك تحت راية المدينة.", benefit: "يوم فرح: لا يمرض أحد وتُجبى الضرائب كلها.", call: "أقم العيد" },
      pflaster: { title: "رصف الطرق", intro: "يُرصف طريق تجاري منجز بحجارة الحقول.", benefit: "ظاهر دائمًا: يبقى الطريق مرصوفًا في المشهد. بناء فقط، بلا أثر على الضرائب أو النمو.", call: "ارصف طريقًا" },
    } },
  hi: { head: "सामुदायिक कार्य", open: (h) => `जारी – ${h} घंटे बाकी`, wait: (d) => `${d} दिन बाद फिर संभव`, paid: (t) => `${t}: तय और भुगतान हुआ।`, voluntary: "स्वैच्छिक – कोई रखरखाव नहीं, कुछ समाप्त नहीं होता। कीमत गाँव के दैनिक कर के साथ बढ़ती है।", noRoad: "कोई पूरी व्यापार-सड़क बिना पक्की नहीं बची।", paved: (n, m) => `${m} में से ${n} सड़कें पक्की`,
    items: {
      bauhuette: { title: "कारीगर-मंडली बुलाएँ", intro: "घुमंतू बढ़ई और राजमिस्त्री तीन दिन गाँव के लिए काम करते हैं।", benefit: "चल रहे निर्माण और स्मारक-चरण 12 घंटे पहले पूरे होते हैं; आग या बाढ़ के बाद पुनर्निर्माण 3 दिन दुगनी गति से।", call: "मंडली बुलाएँ" },
      armen: { title: "गरीबों का भोजन", intro: "दो दिन चौक पर सबको शोरबा और रोटी बाँटी जाती है।", benefit: "48 घंटे आधे ही घर बीमार पड़ते हैं – कम कर छूटता है।", call: "भोजन कराएँ" },
      fest: { title: "नगर उत्सव", intro: "पूरा नगर आसन के सामने जुटता है; चौक पर नगर-ध्वज तले दुकानें।", benefit: "एक दिन का उल्लास: कोई बीमार नहीं, सारा कर आता है।", call: "उत्सव मनाएँ" },
      pflaster: { title: "सड़क पक्की करना", intro: "एक पूरी व्यापार-सड़क खेत-पत्थरों से पक्की की जाती है।", benefit: "स्थायी रूप से दिखता है: सड़क पत्थरों की बनती है। केवल निर्माण, कर या विकास पर असर नहीं।", call: "सड़क पक्की करें" },
    } },
  zh: { head: "公共工程", open: (h) => `进行中——还剩${h}小时`, wait: (d) => `${d}天后可再次进行`, paid: (t) => `${t}：已决定并付款。`, voluntary: "自愿——无维护费，不会过期。价格随村庄每日税收增长。", noRoad: "已没有未铺石的完工商路。", paved: (n, m) => `已铺石${n}/${m}条路`,
    items: {
      bauhuette: { title: "雇用工匠团", intro: "流动的木匠和石匠为村庄工作三天。", benefit: "进行中的建筑和纪念建筑阶段提前12小时完成；火灾或洪水后的重建在3天内速度加倍。", call: "雇用工匠团" },
      armen: { title: "济贫施粥", intro: "两天内在广场向所有人发放汤和面包。", benefit: "48小时内患病的家庭减半——少损失税收。", call: "举办施粥" },
      fest: { title: "市民节", intro: "全城聚集在官邸前，广场上市旗下摆起摊位。", benefit: "一天的节庆：无人患病，税收全额到账。", call: "举办市民节" },
      pflaster: { title: "修路铺石", intro: "一条完工的商路用田石铺成石板路。", benefit: "永久可见：道路成为石板路。纯建筑，不影响税收或增长。", call: "铺一条路" },
    } },
  ja: { head: "共同事業", open: (h) => `実施中 – 残り${h}時間`, wait: (d) => `${d}日後に再び可能`, paid: (t) => `${t}：決定し支払いました。`, voluntary: "任意 – 維持費なし、期限切れなし。価格は村の日々の税に応じて上がります。", noRoad: "舗装していない完成済みの交易路はもうありません。", paved: (n, m) => `${m}本中${n}本を舗装済み`,
    items: {
      bauhuette: { title: "職人組合を雇う", intro: "旅の大工と石工が3日間村のために働きます。", benefit: "進行中の建設と記念建造物の段階が12時間早く完成し、火事や洪水からの再建が3日間2倍の速さで進みます。", call: "組合を雇う" },
      armen: { title: "施粥", intro: "2日間、広場で皆にスープとパンが配られます。", benefit: "48時間、病気になる世帯が半分に – 失われる税が減ります。", call: "施粥を行う" },
      fest: { title: "市民祭", intro: "町じゅうが役所の前に集まり、広場には町旗の下に屋台が並びます。", benefit: "1日の祝祭：誰も病気にならず、税がすべて入ります。", call: "市民祭を開く" },
      pflaster: { title: "道の舗装", intro: "完成した交易路を野石で舗装します。", benefit: "ずっと見える：道が石畳になります。建築のみで、税や成長への効果はありません。", call: "道を舗装する" },
    } },
};
