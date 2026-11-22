import { describe, expect, it } from "vitest";
import { DICT, LANGS } from "./i18n";
import { REALMS, REALM_FULL, REALM_NEXT, isRealmFull, nextOpenRealm, openRealm, type Realm } from "./time";

describe("isRealmFull", () => {
  it("recognises the realm_full_guard refusal", () => {
    expect(isRealmFull({ code: "P0001", message: "realm_full" })).toBe(true);
    expect(isRealmFull({ code: "P0001", message: "realm_full: This map is full" })).toBe(true);
  });
  it("does not treat other errors as a full island", () => {
    expect(isRealmFull(null)).toBe(false);
    expect(isRealmFull(undefined)).toBe(false);
    expect(isRealmFull({ code: "23505", message: "duplicate key value violates unique constraint" })).toBe(false);
    expect(isRealmFull({ code: "P0001", message: "road under construction" })).toBe(false);
    expect(isRealmFull({ code: "P0001", message: "realm_full_other" })).toBe(false);
    expect(isRealmFull({ code: "P0001", message: "" })).toBe(false);
    expect(isRealmFull({ code: "42501", message: "realm_full" })).toBe(false);
    expect(isRealmFull({ message: "realm_full" })).toBe(false);
  });
});

describe("nextOpenRealm", () => {
  const full = (...rs: Realm[]) => (q: Realm) => (rs.includes(q) ? REALM_FULL : 0);
  it("skips the refused map even when its count lags behind", () => {
    expect(nextOpenRealm("europe-2", () => 0)).toBe("europe-3");
    expect(nextOpenRealm("europe", full())).toBe("europe-2");
  });
  it("follows the chain past further full maps via openRealm", () => {
    expect(nextOpenRealm("europe", full("europe", "europe-2"))).toBe("europe-3");
    expect(nextOpenRealm("europe", full("europe", "europe-2", "europe-3"))).toBe("europe-4");
    expect(nextOpenRealm("europe", full("europe", "europe-2"))).toBe(openRealm("europe-2", full("europe-2")));
  });
  it("is null where the chain ends", () => {
    expect(nextOpenRealm("europe-3", () => 0)).toBe("europe-4");
    expect(nextOpenRealm("europe-4", () => 0)).toBeNull();
    expect(nextOpenRealm("asia-2", () => REALM_FULL)).toBeNull();
  });
  it("never returns the refused map and always terminates", () => {
    for (const r of REALMS) { const n = nextOpenRealm(r, () => 999); expect(n).not.toBe(r); expect(n === null || REALMS.includes(n)).toBe(true); expect(!!REALM_NEXT[r]).toBe(n !== null); }
  });
});

describe("realmFull texts", () => {
  for (const l of LANGS) it(`${l} has all three messages`, () => {
    const t = DICT[l].realmFull;
    for (const k of ["moving", "none", "fail"] as const) { expect(t[k].length).toBeGreaterThan(10); expect(t[k]).not.toBe(DICT[l].plantFail); }
  });
  it("uses the agreed German wording", () => {
    expect(DICT.de.realmFull.moving).toBe("Diese Insel ist vollständig besiedelt. Wir suchen einen freien Platz auf einer anderen Insel für dich.");
  });
});
