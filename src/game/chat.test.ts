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

import { mergeChat, relevant } from "./chat";
describe("chat buffers per channel", () => {
  const m = (id: number, realm: string, rec: string | null = null, snd = "x") => ({ id: `m${String(id).padStart(5, "0")}`, realm, sender_id: snd, sender_seed: "s", recipient_id: rec, body: "", created_at: new Date(1e12 + id * 1000).toISOString() });
  it("other maps' messages never enter the buffer", () => {
    expect(relevant(m(1, "asia"), "me", "europe")).toBe(false);
    expect(relevant(m(1, "asia", "other", "x"), "me", "europe")).toBe(false);
    expect(relevant(m(1, "asia", "me"), "me", "europe")).toBe(true);
  });
  it("a flood of room or foreign messages keeps my room history and my letters", () => {
    const mine = [m(1, "europe", "me"), m(2, "europe", "peer", "me")];
    let buf = mergeChat([], [...mine, ...Array.from({ length: 300 }, (_, i) => m(10 + i, "europe"))], "me", "europe");
    buf = mergeChat(buf, Array.from({ length: 2000 }, (_, i) => m(5000 + i, "asia")), "me", "europe");
    expect(buf.filter((x) => x.recipient_id === null).length).toBe(300);
    buf = mergeChat(buf, Array.from({ length: 500 }, (_, i) => m(9000 + i, "europe")), "me", "europe");
    expect(buf.filter((x) => x.recipient_id === null).length).toBe(300);
    expect(buf.filter((x) => x.recipient_id !== null).map((x) => x.id)).toEqual(mine.map((x) => x.id));
  });
});
