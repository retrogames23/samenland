import type { Lang } from "../i18n";
import type { StiftBau } from "../stiftung";

/**
 * P4 Stiftungen (stiftung.ts, migration 0165). The effect is named in its real, small size — one extra ×0,85 while the
 * Bau is endowed — and every text says that it ends without a new Stiftung. Every lock comes with its amount or date.
 */
export type StiftText = {
  title: string;
  intro: string;
  bau: Record<StiftBau, string>;
  /** the real effect while endowed, with its end */
  effect: Record<StiftBau, string>;
  endowed: (days: number, until: string) => string;
  notEndowed: string;
  /** locks: always with the amount or the date */
  lockBau: (stage: string) => string;
  lockVorrang: (stage: string, rest: string) => string;
  lockPause: (from: string) => string;
  lockFull: (days: number, from: string) => string;
  lockTax: string;
  open: (price: string) => string;
  priceHint: string;
  paid: (paid: string, total: string) => string;
  amount: string;
  pay: (amount: string) => string;
  depositHint: string;
  ready: string;
  plan: (sw: number, ss: number, kw: number, ks: number, cost: string) => string;
  planStore: string;
  close: (cost: string | null) => string;
  confirm: (kw: number, ks: number, cost: string, days: number) => string;
  confirmYes: string;
  confirmNo: string;
  short: (w: number, s: number, rw: number, rs: number) => string;
  kontorVorrang: (stage: string, rest: string) => string;
  closeFull: (days: number, from: string) => string;
  pending: string;
  done: (days: number) => string;
  errors: {
    vorrang: string;
    soon: string;
    full: string;
    open: string;
    tax: string;
    bau: string;
    amount: string;
    money: string;
    material: string;
    price: string;
    step: string;
    fail: string;
  };
};

const de: StiftText = {
  title: "Stiftungen",
  intro:
    "Eine Stiftung gibt einem fertigen Bau 14 Tage Stiftungszeit. Mehr Stufen verlängern sie (höchstens 28 Tage Vorrat), sie verstärken die Wirkung nicht.",
  bau: { spital: "Spital", waage: "Ratswaage" },
  effect: {
    spital:
      "Solange gestiftet: Krankheitsrisiko zusätzlich ×0,85 (15 % weniger). Ohne neue Stiftung endet das mit der Stiftungszeit.",
    waage:
      "Solange gestiftet: Kontorpreise zusätzlich ×0,85 (15 % günstiger). Ohne neue Stiftung endet das mit der Stiftungszeit.",
  },
  endowed: (d, until) => `Gestiftet: noch ${d} ${d === 1 ? "Tag" : "Tage"} (bis ${until})`,
  notEndowed: "Zurzeit nicht gestiftet",
  lockBau: (stage) => `Stiftbar, sobald ${stage} steht`,
  lockVorrang: (stage, rest) => `Ruht: erst ${stage} bezahlen, noch ${rest}`,
  lockPause: (from) => `Nächste Stufe ab ${from}`,
  lockFull: (d, from) =>
    `Vorrat voll: noch ${d} ${d === 1 ? "Tag" : "Tage"} gestiftet. Nächste Stufe ab ${from}`,
  lockTax:
    "Noch keine Tagessteuer gebucht – der Preis einer Stufe ist das Vierfache der Tagessteuer",
  open: (price) => `Stufe öffnen (Preis ${price})`,
  priceHint: "Öffnen kostet nichts. Der Preis – 4 × letzte Tagessteuer – steht ab dem Öffnen fest.",
  paid: (paid, total) => `${paid} von ${total} eingezahlt`,
  amount: "Betrag",
  pay: (amount) => `${amount} einzahlen`,
  depositHint:
    "Du bestimmst jeden Betrag selbst. Einzahlungen sind endgültig; es wird nie automatisch abgebucht.",
  ready: "Voll bezahlt. Stiften braucht 30 Holz und 20 Stein.",
  plan: (sw, ss, kw, ks, cost) =>
    `Aus dem Lager: ${sw} 🪵, ${ss} 🪨 · vom Kontor: ${kw} 🪵, ${ks} 🪨 für ${cost}`,
  planStore: "Das ganze Material kommt aus dem Lager (über der Rücklage 40 🪵 / 30 🪨).",
  close: (cost) => (cost ? `Stiften … (${cost} an das Kontor)` : "Stiften …"),
  confirm: (kw, ks, cost, d) =>
    `Jetzt stiften? Das Kontor liefert ${kw} 🪵 und ${ks} 🪨 für ${cost}, sofort aus der Kasse bezahlt. Danach ist der Bau ${d} Tage gestiftet.`,
  confirmYes: "Jetzt stiften",
  confirmNo: "Abbrechen",
  short: (w, s, rw, rs) =>
    `Es fehlen ${[w ? `${w} Holz` : "", s ? `${s} Stein` : ""].filter(Boolean).join(" und ")}` +
    (rw || rs
      ? `; ${[rw ? `${rw} Holz` : "", rs ? `${rs} Stein` : ""].filter(Boolean).join(" und ")} im Kontingent sind für die Baustelle reserviert`
      : " im Kontingent – es wächst täglich um 4 Holz und 3 Stein"),
  kontorVorrang: (stage, rest) =>
    `Der Kontoranteil ruht: erst ${stage} bezahlen, noch ${rest}. Mit genug Material im Lager geht es sofort.`,
  closeFull: (d, from) =>
    `Vorrat voll: noch ${d} ${d === 1 ? "Tag" : "Tage"} gestiftet. Stiften ab ${from}`,
  pending: "Abrechnung läuft – bitte gleich noch einmal versuchen",
  done: (d) => `Gestiftet! Der Bau ist jetzt ${d} Tage gestiftet.`,
  errors: {
    vorrang: "Ruht: erst den offenen Gemeindebau voll bezahlen.",
    soon: "An diesem Bau wurde in den letzten 7 Tagen schon eine Stufe geöffnet.",
    full: "Vorrat voll: erst bei höchstens 14 Tagen Stiftungszeit geht die nächste Stufe.",
    open: "An diesem Bau ist schon eine Stufe offen.",
    tax: "Noch keine Tagessteuer gebucht.",
    bau: "Dieser Bau steht noch nicht.",
    amount: "Der Betrag passt nicht: mindestens 1 Mark, höchstens der offene Rest.",
    money: "Dafür reicht die Kasse nicht.",
    material: "Das Material reicht nicht – es wurde nichts gebucht.",
    price: "Der Kontorpreis hat sich geändert – bitte neu bestätigen.",
    step: "Diese Einzahlung ist schon gebucht.",
    fail: "Das hat nicht geklappt.",
  },
};

const en: StiftText = {
  title: "Endowments",
  intro:
    "An endowment gives a finished building 14 days of endowed time. More stages extend it (28 days in store at most); they never strengthen the effect.",
  bau: { spital: "Hospital", waage: "Town scales" },
  effect: {
    spital:
      "While endowed: sickness risk another ×0.85 (15 % less). Without a new endowment this ends with the endowed time.",
    waage:
      "While endowed: Kontor prices another ×0.85 (15 % cheaper). Without a new endowment this ends with the endowed time.",
  },
  endowed: (d, until) => `Endowed: ${d} more ${d === 1 ? "day" : "days"} (until ${until})`,
  notEndowed: "Not endowed at the moment",
  lockBau: (stage) => `Can be endowed once the ${stage} stands`,
  lockVorrang: (stage, rest) => `On hold: pay for the ${stage} first, ${rest} to go`,
  lockPause: (from) => `Next stage from ${from}`,
  lockFull: (d, from) =>
    `Store full: endowed for ${d} more ${d === 1 ? "day" : "days"}. Next stage from ${from}`,
  lockTax: "No daily tax booked yet – a stage costs four times the daily tax",
  open: (price) => `Open a stage (price ${price})`,
  priceHint: "Opening is free. The price – 4 × the last daily tax – is fixed from the opening on.",
  paid: (paid, total) => `${paid} of ${total} paid in`,
  amount: "Amount",
  pay: (amount) => `Pay in ${amount}`,
  depositHint:
    "You choose every amount yourself. Deposits are final; nothing is ever debited automatically.",
  ready: "Fully paid. Endowing takes 30 wood and 20 stone.",
  plan: (sw, ss, kw, ks, cost) =>
    `From the store: ${sw} 🪵, ${ss} 🪨 · from the Kontor: ${kw} 🪵, ${ks} 🪨 for ${cost}`,
  planStore: "All material comes from the store (above the kept 40 🪵 / 30 🪨).",
  close: (cost) => (cost ? `Endow … (${cost} to the Kontor)` : "Endow …"),
  confirm: (kw, ks, cost, d) =>
    `Endow now? The Kontor delivers ${kw} 🪵 and ${ks} 🪨 for ${cost}, paid from the chest at once. The building is then endowed for ${d} days.`,
  confirmYes: "Endow now",
  confirmNo: "Cancel",
  short: (w, s, rw, rs) =>
    `${[w ? `${w} wood` : "", s ? `${s} stone` : ""].filter(Boolean).join(" and ")} missing` +
    (rw || rs
      ? `; ${[rw ? `${rw} wood` : "", rs ? `${rs} stone` : ""].filter(Boolean).join(" and ")} of the quota are reserved for the building site`
      : " in the quota – it grows by 4 wood and 3 stone a day"),
  kontorVorrang: (stage, rest) =>
    `The Kontor part is on hold: pay for the ${stage} first, ${rest} to go. With enough material in the store it works at once.`,
  closeFull: (d, from) =>
    `Store full: endowed for ${d} more ${d === 1 ? "day" : "days"}. Endow from ${from}`,
  pending: "Settlement in progress – please try again in a moment",
  done: (d) => `Endowed! The building is now endowed for ${d} days.`,
  errors: {
    vorrang: "On hold: pay for the open civic building in full first.",
    soon: "A stage was already opened at this building within the last 7 days.",
    full: "Store full: the next stage needs at most 14 days of endowed time left.",
    open: "A stage is already open at this building.",
    tax: "No daily tax booked yet.",
    bau: "This building does not stand yet.",
    amount: "The amount does not fit: at least 1 mark, at most the open rest.",
    money: "The chest does not cover that.",
    material: "Not enough material – nothing was booked.",
    price: "The Kontor price has changed – please confirm again.",
    step: "This deposit is already booked.",
    fail: "That did not work.",
  },
};

const fr: StiftText = {
  title: "Dotations",
  intro:
    "Une dotation donne à un ouvrage achevé 14 jours de temps de dotation. D'autres paliers le prolongent (28 jours de réserve au plus) ; ils ne renforcent pas l'effet.",
  bau: { spital: "Hôpital", waage: "Balance publique" },
  effect: {
    spital:
      "Tant que l'ouvrage est doté : risque de maladie encore ×0,85 (15 % de moins). Sans nouvelle dotation, cela cesse avec le temps de dotation.",
    waage:
      "Tant que l'ouvrage est doté : prix du comptoir encore ×0,85 (15 % moins chers). Sans nouvelle dotation, cela cesse avec le temps de dotation.",
  },
  endowed: (d, until) => `Doté : encore ${d} ${d === 1 ? "jour" : "jours"} (jusqu'au ${until})`,
  notEndowed: "Pas doté pour l'instant",
  lockBau: (stage) => `Dotation possible dès que « ${stage} » est achevé`,
  lockVorrang: (stage, rest) => `En attente : payer d'abord « ${stage} », encore ${rest}`,
  lockPause: (from) => `Prochain palier à partir du ${from}`,
  lockFull: (d, from) =>
    `Réserve pleine : encore ${d} ${d === 1 ? "jour" : "jours"} de dotation. Prochain palier à partir du ${from}`,
  lockTax: "Aucun impôt journalier enregistré – un palier coûte quatre fois l'impôt journalier",
  open: (price) => `Ouvrir un palier (prix ${price})`,
  priceHint:
    "L'ouverture est gratuite. Le prix – 4 × le dernier impôt journalier – est fixé dès l'ouverture.",
  paid: (paid, total) => `${paid} versés sur ${total}`,
  amount: "Montant",
  pay: (amount) => `Verser ${amount}`,
  depositHint:
    "Tu choisis chaque montant. Les versements sont définitifs ; rien n'est jamais prélevé automatiquement.",
  ready: "Entièrement payé. Doter demande 30 bois et 20 pierres.",
  plan: (sw, ss, kw, ks, cost) =>
    `De l'entrepôt : ${sw} 🪵, ${ss} 🪨 · du comptoir : ${kw} 🪵, ${ks} 🪨 pour ${cost}`,
  planStore: "Tout le matériau vient de l'entrepôt (au-dessus de la réserve de 40 🪵 / 30 🪨).",
  close: (cost) => (cost ? `Doter … (${cost} au comptoir)` : "Doter …"),
  confirm: (kw, ks, cost, d) =>
    `Doter maintenant ? Le comptoir livre ${kw} 🪵 et ${ks} 🪨 pour ${cost}, payés aussitôt par la caisse. L'ouvrage est ensuite doté pour ${d} jours.`,
  confirmYes: "Doter maintenant",
  confirmNo: "Annuler",
  short: (w, s, rw, rs) =>
    `Il manque ${[w ? `${w} bois` : "", s ? `${s} pierres` : ""].filter(Boolean).join(" et ")}` +
    (rw || rs
      ? ` ; ${[rw ? `${rw} bois` : "", rs ? `${rs} pierres` : ""].filter(Boolean).join(" et ")} du contingent sont réservés au chantier`
      : " dans le contingent – il augmente de 4 bois et 3 pierres par jour"),
  kontorVorrang: (stage, rest) =>
    `La part du comptoir attend : payer d'abord « ${stage} », encore ${rest}. Avec assez de matériau en entrepôt, c'est possible tout de suite.`,
  closeFull: (d, from) =>
    `Réserve pleine : encore ${d} ${d === 1 ? "jour" : "jours"} de dotation. Doter à partir du ${from}`,
  pending: "Décompte en cours – réessaie dans un instant",
  done: (d) => `Doté ! L'ouvrage est maintenant doté pour ${d} jours.`,
  errors: {
    vorrang: "En attente : payer d'abord entièrement l'ouvrage communal ouvert.",
    soon: "Un palier a déjà été ouvert pour cet ouvrage au cours des 7 derniers jours.",
    full: "Réserve pleine : le palier suivant demande au plus 14 jours de dotation restants.",
    open: "Un palier est déjà ouvert pour cet ouvrage.",
    tax: "Aucun impôt journalier enregistré.",
    bau: "Cet ouvrage n'est pas encore achevé.",
    amount: "Le montant ne convient pas : au moins 1 marc, au plus le reste dû.",
    money: "La caisse ne suffit pas.",
    material: "Pas assez de matériau – rien n'a été enregistré.",
    price: "Le prix du comptoir a changé – confirme à nouveau.",
    step: "Ce versement est déjà enregistré.",
    fail: "Cela n'a pas fonctionné.",
  },
};

const es: StiftText = {
  title: "Dotaciones",
  intro:
    "Una dotación da a una obra terminada 14 días de tiempo de dotación. Más tramos lo alargan (como mucho 28 días de reserva); no refuerzan el efecto.",
  bau: { spital: "Hospital", waage: "Báscula pública" },
  effect: {
    spital:
      "Mientras está dotada: riesgo de enfermedad otra vez ×0,85 (un 15 % menos). Sin nueva dotación, termina con el tiempo de dotación.",
    waage:
      "Mientras está dotada: precios del depósito otra vez ×0,85 (un 15 % más baratos). Sin nueva dotación, termina con el tiempo de dotación.",
  },
  endowed: (d, until) => `Dotada: ${d} ${d === 1 ? "día" : "días"} más (hasta el ${until})`,
  notEndowed: "Ahora sin dotación",
  lockBau: (stage) => `Se puede dotar cuando «${stage}» esté en pie`,
  lockVorrang: (stage, rest) => `En espera: paga primero «${stage}», faltan ${rest}`,
  lockPause: (from) => `Siguiente tramo a partir del ${from}`,
  lockFull: (d, from) =>
    `Reserva llena: ${d} ${d === 1 ? "día" : "días"} más de dotación. Siguiente tramo a partir del ${from}`,
  lockTax: "Aún no hay impuesto diario registrado: un tramo cuesta cuatro veces el impuesto diario",
  open: (price) => `Abrir un tramo (precio ${price})`,
  priceHint:
    "Abrir no cuesta nada. El precio – 4 × el último impuesto diario – queda fijado al abrir.",
  paid: (paid, total) => `${paid} de ${total} ingresados`,
  amount: "Importe",
  pay: (amount) => `Ingresar ${amount}`,
  depositHint:
    "Tú decides cada importe. Los ingresos son definitivos; nunca se cobra nada automáticamente.",
  ready: "Pagado por completo. Dotar requiere 30 de madera y 20 de piedra.",
  plan: (sw, ss, kw, ks, cost) =>
    `Del almacén: ${sw} 🪵, ${ss} 🪨 · del depósito: ${kw} 🪵, ${ks} 🪨 por ${cost}`,
  planStore: "Todo el material sale del almacén (por encima de la reserva de 40 🪵 / 30 🪨).",
  close: (cost) => (cost ? `Dotar … (${cost} al depósito)` : "Dotar …"),
  confirm: (kw, ks, cost, d) =>
    `¿Dotar ahora? El depósito entrega ${kw} 🪵 y ${ks} 🪨 por ${cost}, pagados al instante de la caja. Después la obra queda dotada ${d} días.`,
  confirmYes: "Dotar ahora",
  confirmNo: "Cancelar",
  short: (w, s, rw, rs) =>
    `Faltan ${[w ? `${w} de madera` : "", s ? `${s} de piedra` : ""].filter(Boolean).join(" y ")}` +
    (rw || rs
      ? `; ${[rw ? `${rw} de madera` : "", rs ? `${rs} de piedra` : ""].filter(Boolean).join(" y ")} del cupo están reservados para la obra`
      : " en el cupo: crece 4 de madera y 3 de piedra al día"),
  kontorVorrang: (stage, rest) =>
    `La parte del depósito espera: paga primero «${stage}», faltan ${rest}. Con material suficiente en el almacén se puede ya.`,
  closeFull: (d, from) =>
    `Reserva llena: ${d} ${d === 1 ? "día" : "días"} más de dotación. Dotar a partir del ${from}`,
  pending: "Liquidación en curso: inténtalo de nuevo en un momento",
  done: (d) => `¡Dotada! La obra queda ahora dotada ${d} días.`,
  errors: {
    vorrang: "En espera: paga primero por completo la obra municipal abierta.",
    soon: "En esta obra ya se abrió un tramo en los últimos 7 días.",
    full: "Reserva llena: el siguiente tramo requiere como mucho 14 días de dotación restantes.",
    open: "En esta obra ya hay un tramo abierto.",
    tax: "Aún no hay impuesto diario registrado.",
    bau: "Esta obra aún no está en pie.",
    amount: "El importe no vale: al menos 1 marco, como mucho el resto pendiente.",
    money: "La caja no alcanza.",
    material: "No hay material suficiente: no se registró nada.",
    price: "El precio del depósito ha cambiado: confirma de nuevo.",
    step: "Este ingreso ya está registrado.",
    fail: "No ha funcionado.",
  },
};

const ar: StiftText = {
  title: "الأوقاف",
  intro:
    "الوقف يمنح مبنى مكتملًا 14 يومًا من مدة الوقف. المراحل الإضافية تطيلها (28 يومًا مخزونًا على الأكثر) ولا تقوّي الأثر.",
  bau: { spital: "المارستان", waage: "ميزان المدينة" },
  effect: {
    spital:
      "ما دام المبنى موقوفًا له: خطر المرض ×0.85 إضافية (أقل بـ 15 %). من دون وقف جديد ينتهي ذلك بانتهاء مدة الوقف.",
    waage:
      "ما دام المبنى موقوفًا له: أسعار المخزن ×0.85 إضافية (أرخص بـ 15 %). من دون وقف جديد ينتهي ذلك بانتهاء مدة الوقف.",
  },
  endowed: (d, until) => `موقوف له: بقي ${d} ${d === 1 ? "يوم" : "أيام"} (حتى ${until})`,
  notEndowed: "لا وقف حاليًا",
  lockBau: (stage) => `يمكن الوقف حالما يكتمل «${stage}»`,
  lockVorrang: (stage, rest) => `متوقف: ادفع أولًا «${stage}»، بقي ${rest}`,
  lockPause: (from) => `المرحلة التالية ابتداءً من ${from}`,
  lockFull: (d, from) =>
    `المخزون ممتلئ: بقي ${d} ${d === 1 ? "يوم" : "أيام"} من الوقف. المرحلة التالية ابتداءً من ${from}`,
  lockTax: "لم تُسجَّل ضريبة يومية بعد – ثمن المرحلة أربعة أضعاف الضريبة اليومية",
  open: (price) => `فتح مرحلة (الثمن ${price})`,
  priceHint: "الفتح مجاني. الثمن – 4 × آخر ضريبة يومية – يثبت منذ الفتح.",
  paid: (paid, total) => `دُفع ${paid} من ${total}`,
  amount: "المبلغ",
  pay: (amount) => `إيداع ${amount}`,
  depositHint: "أنت تحدد كل مبلغ. الإيداعات نهائية، ولا يُخصم شيء تلقائيًا أبدًا.",
  ready: "دُفع بالكامل. الوقف يحتاج 30 خشبًا و20 حجرًا.",
  plan: (sw, ss, kw, ks, cost) =>
    `من المستودع: ${sw} 🪵، ${ss} 🪨 · من المخزن: ${kw} 🪵، ${ks} 🪨 مقابل ${cost}`,
  planStore: "كل المواد تأتي من المستودع (فوق الاحتياطي 40 🪵 / 30 🪨).",
  close: (cost) => (cost ? `أوقِف … (${cost} للمخزن)` : "أوقِف …"),
  confirm: (kw, ks, cost, d) =>
    `الوقف الآن؟ يورّد المخزن ${kw} 🪵 و${ks} 🪨 مقابل ${cost} تُدفع فورًا من الخزينة. بعدها يبقى المبنى موقوفًا له ${d} يومًا.`,
  confirmYes: "أوقِف الآن",
  confirmNo: "إلغاء",
  short: (w, s, rw, rs) =>
    `ينقص ${[w ? `${w} خشب` : "", s ? `${s} حجر` : ""].filter(Boolean).join(" و")}` +
    (rw || rs
      ? `؛ ${[rw ? `${rw} خشب` : "", rs ? `${rs} حجر` : ""].filter(Boolean).join(" و")} من الحصة محجوزة للورشة`
      : " في الحصة – تزيد يوميًا 4 خشب و3 حجر"),
  kontorVorrang: (stage, rest) =>
    `حصة المخزن متوقفة: ادفع أولًا «${stage}»، بقي ${rest}. مع مواد كافية في المستودع يمكن ذلك فورًا.`,
  closeFull: (d, from) =>
    `المخزون ممتلئ: بقي ${d} ${d === 1 ? "يوم" : "أيام"} من الوقف. الوقف ابتداءً من ${from}`,
  pending: "التسوية جارية – حاول مجددًا بعد لحظة",
  done: (d) => `تم الوقف! المبنى موقوف له الآن ${d} يومًا.`,
  errors: {
    vorrang: "متوقف: ادفع أولًا مبنى البلدية المفتوح كاملًا.",
    soon: "فُتحت مرحلة لهذا المبنى خلال آخر 7 أيام.",
    full: "المخزون ممتلئ: المرحلة التالية تحتاج ألا يبقى أكثر من 14 يومًا من الوقف.",
    open: "توجد مرحلة مفتوحة لهذا المبنى.",
    tax: "لم تُسجَّل ضريبة يومية بعد.",
    bau: "هذا المبنى لم يكتمل بعد.",
    amount: "المبلغ غير مناسب: مارك واحد على الأقل، والباقي المستحق على الأكثر.",
    money: "الخزينة لا تكفي.",
    material: "المواد لا تكفي – لم يُسجَّل شيء.",
    price: "تغيّر سعر المخزن – أكّد من جديد.",
    step: "هذا الإيداع مسجَّل من قبل.",
    fail: "لم ينجح ذلك.",
  },
};

const hi: StiftText = {
  title: "दान-निधियाँ",
  intro:
    "दान-निधि किसी बने हुए निर्माण को 14 दिन की दान-अवधि देती है। और चरण इसे बढ़ाते हैं (अधिकतम 28 दिन का भंडार), प्रभाव को मज़बूत नहीं करते।",
  bau: { spital: "अस्पताल", waage: "नगर-तराज़ू" },
  effect: {
    spital:
      "दान-अवधि में: बीमारी का जोखिम अतिरिक्त ×0.85 (15 % कम)। नई दान-निधि के बिना यह दान-अवधि के साथ समाप्त हो जाता है।",
    waage:
      "दान-अवधि में: कोठी के दाम अतिरिक्त ×0.85 (15 % सस्ते)। नई दान-निधि के बिना यह दान-अवधि के साथ समाप्त हो जाता है।",
  },
  endowed: (d, until) => `दान-अवधि: ${d} दिन शेष (${until} तक)`,
  notEndowed: "अभी कोई दान-निधि नहीं",
  lockBau: (stage) => `"${stage}" बनते ही दान-निधि संभव`,
  lockVorrang: (stage, rest) => `रुका है: पहले "${stage}" का भुगतान करें, ${rest} शेष`,
  lockPause: (from) => `अगला चरण ${from} से`,
  lockFull: (d, from) => `भंडार भरा है: दान-अवधि के ${d} दिन शेष। अगला चरण ${from} से`,
  lockTax: "अभी कोई दैनिक कर दर्ज नहीं – एक चरण का दाम दैनिक कर का चार गुना है",
  open: (price) => `चरण खोलें (दाम ${price})`,
  priceHint: "खोलना मुफ़्त है। दाम – 4 × पिछला दैनिक कर – खोलते ही तय हो जाता है।",
  paid: (paid, total) => `${total} में से ${paid} जमा`,
  amount: "राशि",
  pay: (amount) => `${amount} जमा करें`,
  depositHint: "हर राशि आप तय करते हैं। जमा अंतिम है; कभी कुछ अपने-आप नहीं कटता।",
  ready: "पूरा भुगतान हो गया। दान-निधि के लिए 30 लकड़ी और 20 पत्थर चाहिए।",
  plan: (sw, ss, kw, ks, cost) =>
    `भंडार से: ${sw} 🪵, ${ss} 🪨 · कोठी से: ${kw} 🪵, ${ks} 🪨, दाम ${cost}`,
  planStore: "सारी सामग्री भंडार से आती है (सुरक्षित 40 🪵 / 30 🪨 के ऊपर)।",
  close: (cost) => (cost ? `दान करें … (कोठी को ${cost})` : "दान करें …"),
  confirm: (kw, ks, cost, d) =>
    `अभी दान करें? कोठी ${kw} 🪵 और ${ks} 🪨 ${cost} में देती है, तुरंत कोष से भुगतान। इसके बाद निर्माण की दान-अवधि ${d} दिन होगी।`,
  confirmYes: "अभी दान करें",
  confirmNo: "रद्द करें",
  short: (w, s, rw, rs) =>
    `${[w ? `${w} लकड़ी` : "", s ? `${s} पत्थर` : ""].filter(Boolean).join(" और ")} कम है` +
    (rw || rs
      ? `; कोटे की ${[rw ? `${rw} लकड़ी` : "", rs ? `${rs} पत्थर` : ""].filter(Boolean).join(" और ")} निर्माण-स्थल के लिए सुरक्षित है`
      : " – कोटा रोज़ 4 लकड़ी और 3 पत्थर बढ़ता है"),
  kontorVorrang: (stage, rest) =>
    `कोठी का हिस्सा रुका है: पहले "${stage}" का भुगतान करें, ${rest} शेष। भंडार में पर्याप्त सामग्री हो तो अभी संभव है।`,
  closeFull: (d, from) => `भंडार भरा है: दान-अवधि के ${d} दिन शेष। दान ${from} से`,
  pending: "हिसाब चल रहा है – थोड़ी देर में फिर कोशिश करें",
  done: (d) => `दान हो गया! निर्माण की दान-अवधि अब ${d} दिन है।`,
  errors: {
    vorrang: "रुका है: पहले खुले नगर-निर्माण का पूरा भुगतान करें।",
    soon: "इस निर्माण पर पिछले 7 दिनों में एक चरण खोला जा चुका है।",
    full: "भंडार भरा है: अगले चरण के लिए दान-अवधि के अधिकतम 14 दिन शेष होने चाहिए।",
    open: "इस निर्माण पर एक चरण पहले से खुला है।",
    tax: "अभी कोई दैनिक कर दर्ज नहीं।",
    bau: "यह निर्माण अभी बना नहीं है।",
    amount: "राशि ठीक नहीं: कम से कम 1 मार्क, अधिकतम बाकी रकम।",
    money: "कोष में इतना नहीं है।",
    material: "सामग्री कम है – कुछ दर्ज नहीं हुआ।",
    price: "कोठी का दाम बदल गया – कृपया फिर पुष्टि करें।",
    step: "यह जमा पहले ही दर्ज है।",
    fail: "यह नहीं हो पाया।",
  },
};

const zh: StiftText = {
  title: "捐助",
  intro:
    "一次捐助让一座已建成的工程获得 14 天捐助期。更多阶段只会延长它（最多储存 28 天），不会增强效果。",
  bau: { spital: "济贫院", waage: "公秤" },
  effect: {
    spital: "捐助期内：患病风险再 ×0.85（降低 15 %）。没有新的捐助，捐助期结束时效果随之结束。",
    waage: "捐助期内：商栈价格再 ×0.85（便宜 15 %）。没有新的捐助，捐助期结束时效果随之结束。",
  },
  endowed: (d, until) => `捐助期：还剩 ${d} 天（至${until}）`,
  notEndowed: "目前没有捐助",
  lockBau: (stage) => `“${stage}”建成后即可捐助`,
  lockVorrang: (stage, rest) => `暂停：请先付清“${stage}”，还差 ${rest}`,
  lockPause: (from) => `下一阶段自${from}起`,
  lockFull: (d, from) => `储存已满：捐助期还剩 ${d} 天。下一阶段自${from}起`,
  lockTax: "尚无已入账的日税——一个阶段的价格是日税的四倍",
  open: (price) => `开启一个阶段（价格 ${price}）`,
  priceHint: "开启不花钱。价格——上一次日税的 4 倍——自开启起固定。",
  paid: (paid, total) => `已存入 ${paid} / ${total}`,
  amount: "金额",
  pay: (amount) => `存入 ${amount}`,
  depositHint: "每笔金额由你决定。存入后不可退回；绝不会自动扣款。",
  ready: "已付清。捐助需要 30 木材和 20 石料。",
  plan: (sw, ss, kw, ks, cost) =>
    `取自仓库：${sw} 🪵、${ss} 🪨 · 购自商栈：${kw} 🪵、${ks} 🪨，共 ${cost}`,
  planStore: "全部材料取自仓库（保留 40 🪵 / 30 🪨 以上的部分）。",
  close: (cost) => (cost ? `捐助 …（付给商栈 ${cost}）` : "捐助 …"),
  confirm: (kw, ks, cost, d) =>
    `现在捐助？商栈提供 ${kw} 🪵 和 ${ks} 🪨，共 ${cost}，立即从金库支付。之后该工程的捐助期为 ${d} 天。`,
  confirmYes: "立即捐助",
  confirmNo: "取消",
  short: (w, s, rw, rs) =>
    `还缺${[w ? ` ${w} 木材` : "", s ? ` ${s} 石料` : ""].filter(Boolean).join("和")}` +
    (rw || rs
      ? `；配额中有${[rw ? ` ${rw} 木材` : "", rs ? ` ${rs} 石料` : ""].filter(Boolean).join("和")}已为工地保留`
      : "——配额每天增加 4 木材和 3 石料"),
  kontorVorrang: (stage, rest) =>
    `商栈部分暂停：请先付清“${stage}”，还差 ${rest}。仓库材料足够时可立即进行。`,
  closeFull: (d, from) => `储存已满：捐助期还剩 ${d} 天。自${from}起可捐助`,
  pending: "结算进行中——请稍后再试",
  done: (d) => `捐助完成！该工程的捐助期现为 ${d} 天。`,
  errors: {
    vorrang: "暂停：请先付清已开启的公共工程。",
    soon: "这座工程在过去 7 天内已开启过一个阶段。",
    full: "储存已满：捐助期最多剩 14 天时才能开启下一阶段。",
    open: "这座工程已有一个开启的阶段。",
    tax: "尚无已入账的日税。",
    bau: "这座工程尚未建成。",
    amount: "金额不符：至少 1 马克，至多为未付余额。",
    money: "金库不够支付。",
    material: "材料不足——未记入任何款项。",
    price: "商栈价格已变——请重新确认。",
    step: "这笔存入已入账。",
    fail: "未能完成。",
  },
};

const ja: StiftText = {
  title: "寄進",
  intro:
    "寄進は、完成した建物に 14 日間の寄進期間を与えます。段階を重ねると期間が延びるだけで（蓄えは最大 28 日）、効果は強まりません。",
  bau: { spital: "施療院", waage: "公設秤" },
  effect: {
    spital:
      "寄進期間中：病気のリスクがさらに ×0.85（15 % 減）。新たな寄進がなければ、寄進期間とともに終わります。",
    waage:
      "寄進期間中：商館の価格がさらに ×0.85（15 % 安）。新たな寄進がなければ、寄進期間とともに終わります。",
  },
  endowed: (d, until) => `寄進期間：残り ${d} 日（${until}まで）`,
  notEndowed: "現在、寄進はありません",
  lockBau: (stage) => `「${stage}」が完成すると寄進できます`,
  lockVorrang: (stage, rest) => `停止中：先に「${stage}」を支払ってください。残り ${rest}`,
  lockPause: (from) => `次の段階は${from}から`,
  lockFull: (d, from) => `蓄えが満杯：寄進期間は残り ${d} 日。次の段階は${from}から`,
  lockTax: "日税がまだ記帳されていません。段階の価格は日税の 4 倍です",
  open: (price) => `段階を開く（価格 ${price}）`,
  priceHint: "開くのは無料です。価格（直近の日税の 4 倍）は開いた時点で固定されます。",
  paid: (paid, total) => `${total} のうち ${paid} 払い込み済み`,
  amount: "金額",
  pay: (amount) => `${amount} 払い込む`,
  depositHint:
    "金額は毎回自分で決めます。払い込みは取り消せません。自動で引き落とされることは決してありません。",
  ready: "全額支払い済み。寄進には木材 30 と石材 20 が必要です。",
  plan: (sw, ss, kw, ks, cost) =>
    `倉庫から：${sw} 🪵、${ss} 🪨 · 商館から：${kw} 🪵、${ks} 🪨 を ${cost} で`,
  planStore: "材料はすべて倉庫から出します（備蓄 40 🪵 / 30 🪨 を超える分）。",
  close: (cost) => (cost ? `寄進する …（商館へ ${cost}）` : "寄進する …"),
  confirm: (kw, ks, cost, d) =>
    `いま寄進しますか？商館が ${kw} 🪵 と ${ks} 🪨 を ${cost} で納め、すぐに金庫から支払います。その後、建物の寄進期間は ${d} 日になります。`,
  confirmYes: "いま寄進する",
  confirmNo: "やめる",
  short: (w, s, rw, rs) =>
    `${[w ? `木材 ${w}` : "", s ? `石材 ${s}` : ""].filter(Boolean).join("と")}が足りません` +
    (rw || rs
      ? `。割当のうち${[rw ? `木材 ${rw}` : "", rs ? `石材 ${rs}` : ""].filter(Boolean).join("と")}は工事現場のために確保されています`
      : "。割当は毎日 木材 4・石材 3 ずつ増えます"),
  kontorVorrang: (stage, rest) =>
    `商館の分は停止中：先に「${stage}」を支払ってください。残り ${rest}。倉庫に材料が十分あれば、すぐに寄進できます。`,
  closeFull: (d, from) => `蓄えが満杯：寄進期間は残り ${d} 日。寄進は${from}から`,
  pending: "精算中です。少ししてからもう一度お試しください",
  done: (d) => `寄進しました！建物の寄進期間は ${d} 日になりました。`,
  errors: {
    vorrang: "停止中：先に、開いている公共建築を全額支払ってください。",
    soon: "この建物では過去 7 日以内に段階を開いています。",
    full: "蓄えが満杯：次の段階は、寄進期間の残りが 14 日以下になってからです。",
    open: "この建物にはすでに開いている段階があります。",
    tax: "日税がまだ記帳されていません。",
    bau: "この建物はまだ完成していません。",
    amount: "金額が合いません：最低 1 マルク、最高は未払いの残額です。",
    money: "金庫が足りません。",
    material: "材料が足りません。何も記帳されていません。",
    price: "商館の価格が変わりました。もう一度確認してください。",
    step: "この払い込みはすでに記帳されています。",
    fail: "うまくいきませんでした。",
  },
};

export const STIFT_T: Record<Lang, StiftText> = { de, en, fr, es, ar, hi, zh, ja };

/** The text for a database refusal of a Stiftung action (stift_open / stift_deposit / stift_close). */
export function stiftErrorText(t: StiftText, message: string): string {
  const m: [string, keyof StiftText["errors"]][] = [
    ["civic site first", "vorrang"],
    ["too soon", "soon"],
    ["store full", "full"],
    ["stage open", "open"],
    ["no tax yet", "tax"],
    ["bau missing", "bau"],
    ["bad amount", "amount"],
    ["not enough money", "money"],
    ["material short", "material"],
    ["price changed", "price"],
    ["previous step open", "step"],
    ["already funded", "step"],
  ];
  return t.errors[m.find(([k]) => message.includes(k))?.[1] ?? "fail"];
}
