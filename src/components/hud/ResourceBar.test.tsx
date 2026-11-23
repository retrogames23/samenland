// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MaterialLine, ResourceBar } from "./ResourceBar";
import { kontorQuote, materialNeed, type ResourceOverview } from "@/game/resources";

afterEach(cleanup);
const taler = (n: number) => `${n} Mark`;
const live: ResourceOverview = {
  active: true,
  from: "2026-11-23T00:00:00Z",
  next: "2026-11-24T00:00:00Z",
  wood: { stock: 64, rate: 5, cap: 300 },
  stone: { stock: 31, rate: 0.5, cap: 100 },
};

describe("ResourceBar: shows exactly the server's stock", () => {
  it("renders the booked wood and stone with storage and daily production", () => {
    const { container } = render(<ResourceBar res={live} lang="de" timeZone="Europe/Berlin" />);
    const chips = [...container.querySelectorAll("[data-resources] > span")];
    expect(chips.map((c) => c.textContent)).toEqual(["64", "31"]);
    expect(chips[0]!.getAttribute("title")).toContain(
      "Holz: 64 / 300 (Lager) · +5/Tag · Nächste Lieferung 01:00",
    );
    expect(chips[1]!.getAttribute("title")).toContain("Stein: 31 / 100 (Lager) · +0,5/Tag");
  });
  it("shows nothing before the cut-over or without an answer from the server", () => {
    expect(render(<ResourceBar res={null} lang="de" timeZone="UTC" />).container.innerHTML).toBe(
      "",
    );
    expect(
      render(
        <ResourceBar
          res={{ active: false, from: "2100-01-04T00:00:00Z" }}
          lang="en"
          timeZone="UTC"
        />,
      ).container.innerHTML,
    ).toBe("");
  });
});

describe("MaterialLine: the material a building uses and the Kontor surcharge", () => {
  it("lists the material and, only when the stock is short, the visible Zukauf", () => {
    const enough = render(
      <MaterialLine
        q={kontorQuote(materialNeed(550), { wood: 64, stone: 31 })}
        lang="de"
        taler={taler}
      />,
    );
    expect(enough.container.textContent).toBe("Baustoff: 28 Holz · 18 Stein");
    cleanup();
    const short = render(
      <MaterialLine
        q={kontorQuote(materialNeed(1200), { wood: 64, stone: 31 })}
        lang="de"
        taler={taler}
      />,
    );
    expect(short.container.textContent).toBe(
      "Baustoff: 60 Holz · 40 SteinFehlt: 9 Stein – Zukauf im Kontor für 54 Mark",
    );
  });
  it("shows nothing for items without material", () => {
    expect(render(<MaterialLine q={null} lang="de" taler={taler} />).container.innerHTML).toBe("");
  });
});
