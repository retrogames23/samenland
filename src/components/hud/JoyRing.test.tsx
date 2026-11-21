// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { JoyRing } from "./JoyRing";
import { DICT, LANGS } from "@/game/i18n";

beforeAll(() => {
  // Radix popper needs these in jsdom
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  // jsdom has no PointerEvent: give mouse events a pointerType so the hover branch can be exercised
  globalThis.PointerEvent ??= class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? "";
    }
  } as unknown as typeof PointerEvent;
});
afterEach(cleanup);

describe("wedding-joy ring", () => {
  const t = DICT.de.fest;
  it("opens on tap and shows heading and explanation", () => {
    render(<JoyRing title={t.joy} text={t.joyText} lang="de" />);
    expect(screen.queryByText(t.joyText)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: t.joy }));
    expect(screen.getByText(t.joyText)).toBeTruthy();
  });
  it("opens at once on mouse hover and closes on leave", () => {
    render(<JoyRing title={t.joy} text={t.joyText} lang="de" />);
    const b = screen.getByRole("button", { name: t.joy });
    fireEvent.pointerOver(b, { pointerType: "mouse" });
    expect(screen.getByText(t.joyText)).toBeTruthy();
    fireEvent.pointerOut(b, { pointerType: "mouse" });
    expect(screen.queryByText(t.joyText)).toBeNull();
  });
  it("a touch pointer entering does not open it (tap toggles instead)", () => {
    render(<JoyRing title={t.joy} text={t.joyText} lang="de" />);
    fireEvent.pointerOver(screen.getByRole("button", { name: t.joy }), { pointerType: "touch" });
    expect(screen.queryByText(t.joyText)).toBeNull();
  });
});

describe("wedding-joy texts promise only real effects", () => {
  // real: festJoy → sickChance 0 (sickness.ts); the health bonus only lifts the HUD bar (softened, so no number)
  it("no prosperity, no numbers, in all eight languages", () => {
    const wealth = /Wohlstand|prosperity|prospérité|prosperidad|ازدهار|समृद्धि|繁荣|繁栄/;
    for (const l of LANGS) {
      const { joy, joyText } = DICT[l].fest;
      expect(joy, l).toBeTruthy();
      expect(joyText, l).toBeTruthy();
      expect(`${joy} ${joyText}`, l).not.toMatch(wealth);
      expect(`${joy} ${joyText}`, l).not.toMatch(/\d/);
    }
  });
});
