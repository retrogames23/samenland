import { describe, it, expect } from "vitest";
import { inChannel, unread, type ChatMsg } from "./chat";
const m = (id: string, from: string, to: string | null, realm = "europe", at = "2026-10-29T01:00:00Z"): ChatMsg => ({ id, realm, sender_id: from, sender_seed: "s", recipient_id: to, body: "hi", created_at: at });
const msgs = [m("1", "a", null), m("2", "b", null), m("3", "b", "me"), m("4", "c", "me"), m("5", "x", null, "asia")];
describe("tavern chat", () => {
  it("tavern shows only this map's room messages", () => expect(inChannel(msgs, "tavern", "me", "europe", new Set()).map((x) => x.id)).toEqual(["1", "2"]));
  it("blocked senders vanish from tavern and letters", () => {
    expect(inChannel(msgs, "tavern", "me", "europe", new Set(["b"])).map((x) => x.id)).toEqual(["1"]);
    expect(inChannel(msgs, { peer: "b" }, "me", "europe", new Set(["b"]))).toEqual([]);
  });
  it("letters are only between the two", () => expect(inChannel(msgs, { peer: "c" }, "me", "europe", new Set()).map((x) => x.id)).toEqual(["4"]));
  it("unread counts newer foreign messages", () => {
    expect(unread(msgs, "tavern", "me", "europe", new Set(), 0)).toBe(2);
    expect(unread(msgs, "tavern", "me", "europe", new Set(), Date.parse("2026-10-29T02:00:00Z"))).toBe(0);
  });
});
