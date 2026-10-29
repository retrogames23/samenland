import { describe, expect, it } from "vitest";
import { giftReadKey, mergeGiftReads, parseGiftReads } from "./gift-read";

describe("gift read receipts", () => {
  it("retains the read letter after saving and reloading", () => {
    const read = mergeGiftReads([], ["kaehaus-thanks"]);
    expect(parseGiftReads(JSON.stringify(read))).toContain("kaehaus-thanks");
  });
  it("does not forget a read letter when more than 50 others are read", () => {
    expect(mergeGiftReads(["kaehaus-thanks"], Array.from({ length: 60 }, (_, i) => `letter-${i}`))).toContain("kaehaus-thanks");
  });
  it("merges account receipts with browser receipts without duplicates", () => {
    expect(mergeGiftReads(["a"], ["a", "b"])).toEqual(["a", "b"]);
  });
  it("isolates the browser fallback per account", () => {
    expect(giftReadKey("a")).not.toBe(giftReadKey("b"));
  });
  it("ignores invalid stored receipts", () => {
    expect(parseGiftReads('{"bad":true}')).toEqual([]);
    expect(parseGiftReads('["a",null,1,"a"]')).toEqual(["a"]);
  });
});