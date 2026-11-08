import { useMemo, useState } from "react";
import { nightPairs, type NightPair } from "@/game/building-sprites";

/** Figure-Lab card "Nachtmasken": each day painting with its light mask — day, mask on dark, overlay — for visual review.
 * Images keep the registry framing and mirroring; the automatic audit (night-masks.test.ts) only gives hints. */
const STYLES = ["alle", "grain", "workshop", "gateway"] as const;
export default function NightMaskLab() {
  const pairs = useMemo(() => nightPairs(), []);
  const [style, setStyle] = useState<(typeof STYLES)[number]>("alle"), [q, setQ] = useState("");
  const [light, setLight] = useState(1), [size, setSize] = useState(220), [compare, setCompare] = useState(false);
  const [sel, setSel] = useState<NightPair | null>(null), [zoom, setZoom] = useState(4);
  const list = pairs.filter((p) => (style === "alle" || p.style === style) && p.key.includes(q.toLowerCase()));
  const groups = compare ? Object.entries(list.reduce<Record<string, NightPair[]>>((g, p) => ((g[`${p.kind}-${p.slot}`] ??= []).push(p), g), {})) : [["", list] as const];
  const btn = "rounded-md border border-border bg-card px-2 py-1 text-xs text-card-foreground hover:border-primary";
  const on = "bg-primary text-primary-foreground border-primary hover:bg-primary";

  const Frame = ({ p, mode, w }: { p: NightPair; mode: "day" | "mask" | "over"; w: number }) => {
    const [, , cw, ch] = p.crop, h = (w * ch) / cw, flip = p.mirror ? { transform: "scaleX(-1)" } : undefined;
    return (
      <div className="relative shrink-0 overflow-hidden rounded bg-foreground/85" style={{ width: w, height: h }}>
        {mode !== "mask" && <img src={p.day} alt="" className="absolute inset-0 h-full w-full" style={{ ...flip, imageRendering: zoom > 2 && w > 600 ? "pixelated" : undefined, filter: mode === "over" ? "brightness(0.35) saturate(0.7)" : undefined }} />}
        {mode !== "day" && p.night && <img src={p.night} alt="" className="absolute inset-0 h-full w-full" style={{ ...flip, opacity: light, mixBlendMode: mode === "over" ? "screen" : undefined, imageRendering: w > 600 ? "pixelated" : undefined }} />}
        {mode !== "day" && !p.night && <span className="absolute inset-0 grid place-items-center text-[10px] text-card">bewusst ohne Licht</span>}
      </div>
    );
  };

  if (sel) return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <button className={btn} onClick={() => setSel(null)}>← Übersicht</button><b>{sel.key}</b>
        {[1, 2, 4, 6, 8].map((z) => <button key={z} className={`${btn} ${zoom === z ? on : ""}`} onClick={() => setZoom(z)}>{z}×</button>)}
        <label className="flex items-center gap-1">Licht <input type="range" min={0} max={1} step={0.05} value={light} onChange={(e) => setLight(+e.target.value)} className="w-24" /></label>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-3">
        <Frame p={sel} mode="over" w={sel.crop[2] * zoom} />
        <Frame p={sel} mode="mask" w={sel.crop[2] * zoom} />
        <Frame p={sel} mode="day" w={sel.crop[2] * zoom} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs">
        {STYLES.map((s) => <button key={s} className={`${btn} ${style === s ? on : ""}`} onClick={() => setStyle(s)}>{s === "alle" ? "Alle Baustile" : s}</button>)}
        <input className="w-36 rounded-md border border-border bg-card px-2 py-1" placeholder="Gebäude…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="flex items-center gap-1"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Baustile vergleichen</label>
        <label className="flex items-center gap-1">Licht <input type="range" min={0} max={1} step={0.05} value={light} onChange={(e) => setLight(+e.target.value)} className="w-24" /></label>
        <label className="flex items-center gap-1">Größe <input type="range" min={140} max={480} value={size} onChange={(e) => setSize(+e.target.value)} className="w-24" /></label>
        <span className="ms-auto">{list.length} Paare · {list.filter((p) => !p.night).length} ohne Licht</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {groups.map(([g, items]) => (
          <section key={g} className={compare ? "mb-4 flex gap-3 overflow-x-auto" : "grid gap-3"} style={compare ? undefined : { gridTemplateColumns: `repeat(auto-fill, minmax(${size * 3 + 24}px, 1fr))` }}>
            {items.map((p) => (
              <button key={p.key} onClick={() => setSel(p)} className="flex shrink-0 flex-col gap-1 rounded-lg border border-border p-2 text-start hover:border-primary">
                <span className="text-xs"><b>{p.key}</b> · {p.kind} · Variante {p.slot + 1} · {p.style} · {p.crop[2]}×{p.crop[3]}{p.mirror ? " · gespiegelt" : ""}</span>
                <div className="flex gap-1">
                  <Frame p={p} mode="day" w={compare ? size * 0.8 : size} /><Frame p={p} mode="mask" w={compare ? size * 0.8 : size} /><Frame p={p} mode="over" w={compare ? size * 0.8 : size} />
                </div>
              </button>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
