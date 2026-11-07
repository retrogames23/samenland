import { describe, it, expect } from "vitest";
import { STANDS } from "./folk-sprites";

describe("closed-feet standing pictures", () => {
  it("mason stands in his own closed-feet picture, not a frozen stride", () => { expect(STANDS.mason).toBe("mason"); });
  it("porter stands in his painted closed-feet picture", () => { expect(STANDS.porter).toBe("porterStand"); });
});
