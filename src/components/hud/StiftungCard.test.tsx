// @vitest-environment jsdom
// P4 Stiftungen, Kriterium 8 (Sichtbarkeit): every state of the card shows exactly one reason, with its amount or date.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { StiftungCard } from "./StiftungCard";
import type { StiftBauView, StiftOverview } from "@/components/hooks/useStiftung";

afterEach(cleanup);
const taler = (n: number) => `${n.toLocaleString("de-DE")} Mark`;
const NOW = "2027-06-01T09:30:00.000Z";
const at = (days: number) => new Date(Date.parse(NOW) + days * 864e5).toISOString();
const bau = (o: Partial<StiftBauView> = {}): StiftBauView => ({
  built: true, until: null, endowed: false, lock: null, lock_from: null, stage: null, plan: null, ...o,
});
const ov = (o: Partial<StiftOverview> = {}): StiftOverview => ({
  active: true, from: at(-100), now: NOW, tax: 500, price: 2000, vorrang: null,
  quota: { wood: 120, stone: 90 }, reserved: { wood: 0, stone: 0 }, free: { wood: 120, stone: 90 }, stock: { wood: 100, stone: 100 },
  spital: bau(), waage: bau({ built: false, lock: "bau" }), ...o,
});
const stageName = (i: string) => ({ spital1: "Krankensaal", spital2: "Kapelle", waage1: "Waagehaus" })[i] ?? i;
const show = (stift: StiftOverview, extra: { cash?: number; pending?: boolean } = {}) => {
  const fn = { onOpen: vi.fn(), onDeposit: vi.fn(), onClose: vi.fn() };
  const r = render(<StiftungCard lang="de" stift={stift} stageName={stageName} taler={taler} cash={extra.cash ?? 5000} pending={extra.pending ?? false} {...fn} />);
  const items = [...r.container.querySelectorAll("li")].map((li) => li.textContent ?? "");
  return { ...r, ...fn, spital: items[0]!, waage: items[1]! };
};
const paid = { nr: 3, price: 2000, paid: 2000, opened_at: at(-1), funded_at: at(-1), deposits: 2 };
const plan = (o: Partial<NonNullable<StiftBauView["plan"]>> = {}) => ({ store: { wood: 0, stone: 12 }, kontor: { wood: 30, stone: 8 }, short: { wood: 0, stone: 0 }, cost: 143, full: false, ...o });

describe("Stiftungskarte: genau ein Zustand mit Grund, Betrag oder Datum", () => {
  it("Bau steht noch nicht / Öffnen mit Preis", () => {
    const v = show(ov());
    expect(v.waage).toContain("Stiftbar, sobald Waagehaus steht");
    expect(v.spital).toContain("Stufe öffnen (Preis 2.000 Mark)");
    expect(v.spital).toContain("Öffnen kostet nichts");
    expect(v.spital).toContain("Zurzeit nicht gestiftet");
    expect(v.spital).toContain("Krankheitsrisiko zusätzlich ×0,85");
    expect(v.spital).toContain("endet das mit der Stiftungszeit");
    fireEvent.click(v.getByText("Stufe öffnen (Preis 2.000 Mark)"));
    expect(v.onOpen).toHaveBeenCalledWith("spital");
  });
  it("Baustellen-Vorrang: «Ruht: erst den Krankensaal bezahlen, noch 3.400 Mark»", () => {
    const v = show(ov({ vorrang: { item: "spital2", rest: 3400 }, spital: bau({ lock: "vorrang" }) }));
    expect(v.spital).toContain("Ruht: erst Kapelle bezahlen, noch 3.400 Mark");
    expect(v.container.querySelectorAll("button").length).toBe(0);
  });
  it("Takt: «Nächste Stufe ab …» mit Datum", () => {
    const v = show(ov({ spital: bau({ lock: "pause", lock_from: "2027-06-08T10:00:00Z", endowed: true, until: at(13) }) }));
    expect(v.spital).toMatch(/Nächste Stufe ab Dienstag, 8\.6\./);
    expect(v.spital).toMatch(/Gestiftet: noch 13 Tage \(bis Montag, 14\.6\.\)/);
  });
  it("Vorrat voll: «noch 19 Tage gestiftet» mit Datum der nächsten Stufe", () => {
    const v = show(ov({ spital: bau({ lock: "full", lock_from: at(5), endowed: true, until: at(19) }) }));
    expect(v.spital).toMatch(/Vorrat voll: noch 19 Tage gestiftet\. Nächste Stufe ab Sonntag, 6\.6\./);
  });
  it("noch keine Tagessteuer", () => {
    expect(show(ov({ tax: null, price: 0, spital: bau({ lock: "tax" }) })).spital).toContain("Noch keine Tagessteuer gebucht");
  });
  it("offene Stufe: Betragsfeld, Grenzen (Rest, Kasse), Nummer der Einzahlung; nie automatisch", () => {
    const st = { nr: 1, price: 2000, paid: 600, opened_at: at(-1), funded_at: null, deposits: 2 };
    const v = show(ov({ spital: bau({ lock: "open", stage: st }) }), { cash: 900 });
    expect(v.spital).toContain("600 Mark von 2.000 Mark eingezahlt");
    expect(v.spital).toContain("es wird nie automatisch abgebucht");
    const input = v.getByLabelText("Betrag") as HTMLInputElement;
    const button = () => v.container.querySelector("li button") as HTMLButtonElement;
    expect(button().disabled).toBe(true);
    fireEvent.change(input, { target: { value: "901" } });        // above the chest
    expect(button().disabled).toBe(true);
    fireEvent.change(input, { target: { value: "350" } });
    expect(button().textContent).toBe("350 Mark einzahlen");
    fireEvent.click(button());
    expect(v.onDeposit).toHaveBeenCalledWith("spital", 3, 350);
    // above the rest
    const w = show(ov({ spital: bau({ lock: "open", stage: st }) }), { cash: 9000 });
    fireEvent.change(w.getAllByLabelText("Betrag")[w.getAllByLabelText("Betrag").length - 1]!, { target: { value: "1401" } });
    expect(([...w.container.querySelectorAll("li button")].pop() as HTMLButtonElement).disabled).toBe(true);
  });
  it("offene Stufe unter Vorrang: Einzahlen ruht mit Betrag", () => {
    const st = { nr: 1, price: 2000, paid: 600, opened_at: at(-1), funded_at: null, deposits: 2 };
    const v = show(ov({ vorrang: { item: "spital1", rest: 3400 }, spital: bau({ lock: "vorrang", stage: st }) }));
    expect(v.spital).toContain("Ruht: erst Krankensaal bezahlen, noch 3.400 Mark");
    expect(v.container.querySelector("li input")).toBeNull();
  });
  it("Stiften: Materialmenge und Kontorbetrag vor der Bestätigung; erst der zweite Klick stiftet, mit dem bestätigten Betrag", () => {
    const v = show(ov({ spital: bau({ lock: "open", stage: paid, plan: plan(), endowed: true, until: at(10) }) }));
    expect(v.spital).toContain("Aus dem Lager: 0 🪵, 12 🪨 · vom Kontor: 30 🪵, 8 🪨 für 143 Mark");
    fireEvent.click(v.getByText("Stiften … (143 Mark an das Kontor)"));
    expect(v.onClose).not.toHaveBeenCalled();
    expect(v.container.textContent).toContain("Das Kontor liefert 30 🪵 und 8 🪨 für 143 Mark, sofort aus der Kasse bezahlt. Danach ist der Bau 24 Tage gestiftet.");
    fireEvent.click(v.getByText("Jetzt stiften"));
    expect(v.onClose).toHaveBeenCalledWith("spital", 143);
    // cancel leaves everything as it was
    const w = show(ov({ spital: bau({ lock: "open", stage: paid, plan: plan() }) }));
    fireEvent.click(w.getAllByText("Stiften … (143 Mark an das Kontor)").pop()!);
    fireEvent.click(w.getByText("Abbrechen"));
    expect(w.onClose).not.toHaveBeenCalled();
  });
  it("Stiften ganz aus dem Lager: kein Kontorbetrag", () => {
    const v = show(ov({ spital: bau({ lock: "open", stage: paid, plan: plan({ store: { wood: 30, stone: 20 }, kontor: { wood: 0, stone: 0 }, cost: 0 }) }) }));
    expect(v.spital).toContain("Das ganze Material kommt aus dem Lager");
    fireEvent.click(v.getByText("Stiften …"));
    fireEvent.click(v.getByText("Jetzt stiften"));
    expect(v.onClose).toHaveBeenCalledWith("spital", 0);
  });
  it("Material fehlt: «Es fehlen 8 Stein; 60 Stein im Kontingent sind für die Baustelle reserviert»", () => {
    const v = show(ov({ reserved: { wood: 90, stone: 60 }, spital: bau({ lock: "open", stage: paid, plan: plan({ short: { wood: 0, stone: 8 } }) }) }));
    expect(v.spital).toContain("Es fehlen 8 Stein; 60 Stein im Kontingent sind für die Baustelle reserviert");
    expect(v.container.querySelectorAll("li button").length).toBe(0);
    const w = show(ov({ spital: bau({ lock: "open", stage: paid, plan: plan({ short: { wood: 5, stone: 8 } }) }) }));
    expect(w.spital).toContain("Es fehlen 5 Holz und 8 Stein im Kontingent – es wächst täglich um 4 Holz und 3 Stein");
  });
  it("Kontoranteil unter Vorrang, Vorrat voll und «Abrechnung läuft»", () => {
    const base = { lock: "open" as const, stage: paid };
    expect(show(ov({ vorrang: { item: "spital2", rest: 120 }, spital: bau({ ...base, plan: plan() }) })).spital).toContain("Der Kontoranteil ruht: erst Kapelle bezahlen, noch 120 Mark");
    expect(show(ov({ spital: bau({ ...base, plan: plan({ full: true }), endowed: true, until: at(16) }) })).spital).toMatch(/Vorrat voll: noch 16 Tage gestiftet\. Stiften ab Donnerstag, 3\.6\./);
    const p = show(ov({ spital: bau({ ...base, plan: plan() }) }), { pending: true });
    expect(p.spital).toContain("Abrechnung läuft");
    expect(p.container.querySelectorAll("li button").length).toBe(0);
  });
});
