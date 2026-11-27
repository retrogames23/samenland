// P4 Stiftungen, Kriterium 8 (Sichtbarkeit): every lock reason appears with its amount or date, in eight languages.
// The effect is named in its real size (one ×0,85) together with its end, never a promise the rules do not keep.
import { describe, expect, it } from "vitest";
import { LANGS, type Lang } from "../i18n";
import { STIFT_T, stiftErrorText, type StiftText } from "./stiftung";
import { STIFT_BAUTEN, STIFT_DAYS, STIFT_FACTOR, STIFT_MAX_DAYS, STIFT_NEED, STIFT_OPEN_REST_DAYS, STIFT_PAUSE_DAYS, STIFT_TAX_DAYS } from "../stiftung";
import { CIVIC_KEEP, CIVIC_QUOTA } from "../civic";

const AMOUNT = "3.400 Ⓜ", DATE = "‹Dienstag 8.6.›", STAGE = "‹Krankensaal›";
const flat = (t: StiftText): Record<string, string> => {
  const out: Record<string, string> = {};
  const walk = (o: object, pre: string) => {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string") out[pre + k] = v;
      else if (typeof v === "function") out[pre + k] = String((v as (...a: unknown[]) => string)(7, 8, 9, 10, 11));
      else if (v && typeof v === "object") walk(v, pre + k + ".");
    }
  };
  walk(t, "");
  return out;
};

describe("Stiftungstexte in acht Sprachen", () => {
  it("es gibt genau die acht Sprachen, jede mit eigenem Text (keine Rückfall-Kopie)", () => {
    expect(Object.keys(STIFT_T).sort()).toEqual([...LANGS].sort());
    expect(LANGS.length).toBe(8);
    for (const a of LANGS) for (const b of LANGS) if (a < b) {
      expect(STIFT_T[a], `${a} = ${b}`).not.toBe(STIFT_T[b]);
      expect(STIFT_T[a].intro).not.toBe(STIFT_T[b].intro);
      expect(STIFT_T[a].lockVorrang(STAGE, AMOUNT)).not.toBe(STIFT_T[b].lockVorrang(STAGE, AMOUNT));
    }
  });
  it("jede Sprache hat dieselben Schlüssel, kein Text ist leer", () => {
    const keys = Object.keys(flat(STIFT_T.de)).sort();
    expect(keys.length).toBeGreaterThan(40);
    for (const l of LANGS) {
      const f = flat(STIFT_T[l]);
      expect(Object.keys(f).sort(), l).toEqual(keys);
      for (const [k, v] of Object.entries(f)) expect(v.trim().length, `${l}.${k}`).toBeGreaterThan(1);
      for (const b of STIFT_BAUTEN) { expect(STIFT_T[l].bau[b].length).toBeGreaterThan(1); expect(STIFT_T[l].effect[b].length).toBeGreaterThan(20); }
    }
  });
  it.each(LANGS)("%s: jeder Sperrgrund nennt seinen Betrag oder sein Datum", (l: Lang) => {
    const t = STIFT_T[l];
    // Baustellen-Vorrang: which building, how much is still to pay
    for (const s of [t.lockVorrang(STAGE, AMOUNT), t.kontorVorrang(STAGE, AMOUNT)]) { expect(s).toContain(STAGE); expect(s).toContain(AMOUNT); }
    // Takt: the date of the next stage
    expect(t.lockPause(DATE)).toContain(DATE);
    // Vorrat voll: the days left and the date
    for (const s of [t.lockFull(19, DATE), t.closeFull(19, DATE)]) { expect(s).toContain("19"); expect(s).toContain(DATE); }
    // Bau fehlt: which stage has to stand
    expect(t.lockBau(STAGE)).toContain(STAGE);
    // Material fehlt: how much is missing and how much the site has reserved
    const short = t.short(0, 8, 0, 60);
    expect(short).toContain("8"); expect(short).toContain("60");
    const both = t.short(5, 8, 90, 60);
    for (const n of ["5", "8", "90", "60"]) expect(both).toContain(n);
    const free = t.short(5, 0, 0, 0);
    expect(free).toContain("5"); expect(free).toContain(String(CIVIC_QUOTA.wood)); expect(free).toContain(String(CIVIC_QUOTA.stone));
    // Stiftungszeit: days and end date
    const e = t.endowed(13, DATE);
    expect(e).toContain("13"); expect(e).toContain(DATE);
    // price, payments and the close carry their amounts
    expect(t.open(AMOUNT)).toContain(AMOUNT);
    expect(t.pay(AMOUNT)).toContain(AMOUNT);
    const paid = t.paid("600 Ⓜ", "2.000 Ⓜ");
    expect(paid).toContain("600 Ⓜ"); expect(paid).toContain("2.000 Ⓜ");
    const plan = t.plan(3, 12, 27, 8, AMOUNT);
    for (const n of ["3", "12", "27", "8", AMOUNT]) expect(plan).toContain(n);
    const c = t.confirm(27, 8, AMOUNT, 24);
    for (const n of ["27", "8", AMOUNT, "24"]) expect(c).toContain(n);
    expect(t.close(AMOUNT)).toContain(AMOUNT);
    expect(t.close(null)).not.toContain("null");
    expect(t.done(24)).toContain("24");
    expect(t.pending.length).toBeGreaterThan(5);
  });
  it.each(LANGS)("%s: die Wirkung steht in ihrer wirklichen Größe da, mit ihrem Ende; die Regeln mit ihren Zahlen", (l: Lang) => {
    const t = STIFT_T[l];
    const num = (s: string) => s.replace(/,/g, ".");
    for (const b of STIFT_BAUTEN) {
      const eff = num(t.effect[b]);
      expect(eff).toContain(`×${STIFT_FACTOR}`);                         // exactly the one factor
      expect(eff).toContain(`${Math.round((1 - STIFT_FACTOR) * 100)} %`); // and what it means
      expect(eff).not.toMatch(/0\.72|27[.,]75|\b30 %/);                   // never a stacked or rounded-up promise
    }
    expect(t.intro).toContain(String(STIFT_DAYS));
    expect(t.intro).toContain(String(STIFT_MAX_DAYS));
    expect(t.ready).toContain(String(STIFT_NEED.wood)); expect(t.ready).toContain(String(STIFT_NEED.stone));
    expect(t.planStore).toContain(String(CIVIC_KEEP.wood)); expect(t.planStore).toContain(String(CIVIC_KEEP.stone));
    expect(t.priceHint).toContain(String(STIFT_TAX_DAYS));
    expect(t.errors.soon).toContain(String(STIFT_PAUSE_DAYS));
    expect(t.errors.full).toContain(String(STIFT_OPEN_REST_DAYS));
  });
  it("German wording of the brief: the examples of the state card", () => {
    const t = STIFT_T.de;
    expect(t.lockVorrang("den Krankensaal", "3.400 Mark")).toBe("Ruht: erst den Krankensaal bezahlen, noch 3.400 Mark");
    expect(t.lockPause("Dienstag")).toBe("Nächste Stufe ab Dienstag");
    expect(t.lockFull(19, "Sonntag")).toBe("Vorrat voll: noch 19 Tage gestiftet. Nächste Stufe ab Sonntag");
    expect(t.short(0, 8, 0, 60)).toBe("Es fehlen 8 Stein; 60 Stein im Kontingent sind für die Baustelle reserviert");
    expect(t.pending).toContain("Abrechnung läuft");
    expect(t.depositHint).toContain("nie automatisch");
  });
  it("every database refusal of the three actions has its text; a pending answer is never shown as poverty", () => {
    for (const l of LANGS) {
      const t = STIFT_T[l];
      const map: Record<string, keyof StiftText["errors"]> = { "civic site first": "vorrang", "too soon": "soon", "store full": "full", "stage open": "open", "no tax yet": "tax",
        "bau missing": "bau", "bad amount": "amount", "not enough money": "money", "material short": "material", "price changed": "price", "previous step open": "step", "already funded": "step" };
      for (const [msg, key] of Object.entries(map)) expect(stiftErrorText(t, msg)).toBe(t.errors[key]);
      expect(stiftErrorText(t, "something else")).toBe(t.errors.fail);
      expect(stiftErrorText(t, "wedding settlement pending")).toBe(t.errors.fail);   // Game.tsx shows the settlement text before asking here
      expect(new Set(Object.values(t.errors)).size).toBe(Object.keys(t.errors).length);
    }
  });
});
