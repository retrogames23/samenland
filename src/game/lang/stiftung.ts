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
  bau: { spital: "Spital", waage: "Waage" },
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
  bau: { spital: "Hospital", waage: "Weigh house" },
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

// the six further languages follow with the texts commit; until then they read English
export const STIFT_T: Record<Lang, StiftText> = {
  de,
  en,
  fr: en,
  es: en,
  ar: en,
  hi: en,
  zh: en,
  ja: en,
};

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
