import { useEffect, useMemo, useRef, useState } from "react";
import { drawLabFigure, labCatalog, iso, type LabCat } from "@/game/render";
import { clock, worldHour } from "@/game/time";
import type { WeatherKind } from "@/game/weather";
import NightMaskLab from "./NightMaskLab";
import GroundLab from "./GroundLab";

const CATS: { k: LabCat | "all"; label: string }[] = [
  { k: "all", label: "Alle" }, { k: "mayor", label: "Schulzen" }, { k: "court", label: "Hofstaat" },
  { k: "folk", label: "Männer" }, { k: "robe", label: "Frauen & Gewänder" }, { k: "kids", label: "Kinder" }, { k: "animal", label: "Tiere & Jagd" }, { k: "feast", label: "Feste" }, { k: "road", label: "Straße & Werkstatt" },
];
const MASKS = "masks" as const, GROUND = "ground" as const;
const WEATHERS: { k: WeatherKind | null; label: string }[] = [{ k: null, label: "Trocken" }, { k: "drizzle", label: "Regen" }, { k: "storm", label: "Sturm" }, { k: "snow", label: "Schnee" }];
const SPEEDS = [0, 0.25, 0.5, 1, 2];
const CYCLE = 4 * Math.PI; // two full leg cycles on the scrubber
// treadmill: the game's distance-driven gait (people.ts STRIDE = 0.34 tiles per 2π) and adult pace (~0.22 tiles/s)
const STRIDE = 0.34 / (2 * Math.PI), PACE = 0.22;
/** Screen directions → tile headings (iso: tile +x = screen south-east). */
const DIRS: { k: string; label: string; d: [number, number] }[] = [
  { k: "r", label: "→", d: [Math.SQRT1_2, -Math.SQRT1_2] }, { k: "l", label: "←", d: [-Math.SQRT1_2, Math.SQRT1_2] },
  { k: "ne", label: "↗", d: [0, -1] }, { k: "sw", label: "↙", d: [0, 1] }, { k: "nw", label: "↖", d: [-1, 0] }, { k: "se", label: "↘", d: [1, 0] },
  { k: "u", label: "↑", d: [-Math.SQRT1_2, -Math.SQRT1_2] }, { k: "d", label: "↓", d: [Math.SQRT1_2, Math.SQRT1_2] },
];
const RAMPS = [0, 0.5, 1.5, 4];

/** Dev overlay (key P in dev or with ?figs): scrollable gallery of every figure and animal, click one to inspect it with free zoom/pan. */
export default function FigureLab({ onClose }: { onClose: () => void }) {
  const all = useMemo(() => labCatalog().map((e, i) => ({ ...e, i })), []);
  const [cat, setCat] = useState<LabCat | "all" | typeof MASKS | typeof GROUND>("all"), [q, setQ] = useState("");
  const [boxes, setBoxes] = useState(false), [lines, setLines] = useState(true);
  const [speed, setSpeed] = useState(1), [card, setCard] = useState(130), [sel, setSel] = useState<number | null>(null);
  const [phase, setPhase] = useState(0), [weather, setWeather] = useState<WeatherKind | null>(null);
  const [tread, setTread] = useState(false), [dirK, setDirK] = useState("r"), [run, setRun] = useState(true), [ramp, setRamp] = useState(1.5);
  const [info, setInfo] = useState("");
  const list = all.filter((e) => (cat === "all" || e.cat === cat) && e.label.toLowerCase().includes(q.toLowerCase()));
  // one row per figure, its situations side by side (catalog order keeps them together)
  const rows: { row: string; items: typeof list }[] = [];
  for (const e of list) { const r = rows[rows.length - 1]; if (r && r.row === e.row) r.items.push(e); else rows.push({ row: e.row, items: [e] }); }

  // shared animation clock: lab phase advances by speed; animals see a daytime realm clock so nobody sleeps by default
  const st = useRef({ ph: 0, last: 0, v: 0, info: 0, speed, boxes, lines, sel, card, weather, tread, dirK, run, ramp });
  st.current = { ...st.current, speed, boxes, lines, sel, card, weather, tread, dirK, run, ramp };
  const noon = useMemo(() => { const n = clock(); return n - (worldHour(n) - 12) * 3.6e6; }, []);
  const cards = useRef(new Map<number, HTMLCanvasElement>());
  const big = useRef<HTMLCanvasElement>(null);
  const view = useRef({ z: 0, x: 0, y: 0 }); // z = 0 → fit on next frame

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      const s = st.current, dt = s.last ? t - s.last : 0; s.last = t;
      const tm = s.tread && s.sel != null, dir = (DIRS.find((x) => x.k === s.dirK) ?? DIRS[0]!).d;
      if (tm && s.speed === 0) { /* paused: speed and phase frozen; scrubber/frame buttons move ph (and the ground with it) */ }
      else if (tm) {
        // one motion basis: speed ramps, distance integrates it, gait phase = distance / STRIDE exactly as in people.ts
        const vt = s.run ? PACE * s.speed : 0, a = s.ramp > 0 ? (PACE * Math.max(s.speed, 0.25)) / s.ramp : Infinity, sec = dt / 1000;
        s.v = s.v < vt ? Math.min(vt, s.v + a * sec) : Math.max(vt, s.v - a * sec);
        s.ph += (s.v * sec) / STRIDE;
      } else { s.v = 0; s.ph += (dt / 520) * Math.PI * 2 * s.speed; }
      const now = tm ? noon + t * (s.speed || 0) : noon + s.ph * 520 / (Math.PI * 2);
      const walk = tm ? s.v > 1e-4 : undefined;
      const o = { boxes: s.boxes, lines: s.lines, weather: s.weather, dir: tm ? dir : undefined, walk }, d = window.devicePixelRatio || 1;
      if (tm && t - s.info > 200) { s.info = t; const dist = s.ph * STRIDE; setInfo(`v ${s.v.toFixed(3)} Fl./s · Weg ${dist.toFixed(2)} Fl. · Phase ${(((s.ph % 6.2832) + 6.2832) % 6.2832).toFixed(2)} · ${walk ? "geht" : "steht"}`); }
      const paint = (cv: HTMLCanvasElement, f: (c: CanvasRenderingContext2D, W: number, H: number) => void) => {
        const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
        if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
        const c = cv.getContext("2d")!; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(d, 0, 0, d, 0, 0); f(c, W, H);
      };
      if (s.sel != null && big.current) {
        const e = all[s.sel]; if (!e) { raf = requestAnimationFrame(loop); return; }
        paint(big.current, (c, W, H) => {
          const v = view.current; if (!v.z) { v.z = Math.min((H * 0.7) / e.h, (W * 0.8) / e.w); v.x = W / 2; v.y = H * 0.85; }
          c.strokeStyle = "rgba(60,40,20,0.12)"; c.lineWidth = 1; // world grid, one line per world unit
          if (v.z > 14) { const s0x = v.x % v.z, s0y = v.y % v.z;
            for (let x = s0x; x < W; x += v.z) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
            for (let y = s0y; y < H; y += v.z) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } }
          if (tm) { // treadmill ground: iso tile grid shifted by the walked distance along the heading (same basis as the gait)
            const dist = s.ph * STRIDE, ox = dir[0] * dist, oy = dir[1] * dist, N = 14;
            const P = (tx: number, ty: number) => { const p = iso(tx - ox, ty - oy); return [v.x + p[0] * v.z, v.y + p[1] * v.z] as const; };
            const bx = Math.floor(ox), by = Math.floor(oy);
            c.strokeStyle = "rgba(90,70,40,0.35)"; c.lineWidth = 1;
            for (let k = -N; k <= N; k++) {
              let a = P(bx + k + 0.5, by - N), b = P(bx + k + 0.5, by + N); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
              a = P(bx - N, by + k + 0.5); b = P(bx + N, by + k + 0.5); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
            }
            c.fillStyle = "rgba(90,70,40,0.55)"; // quarter-tile pebbles: fine reference for a planted sole
            for (let j = -N * 4; j <= N * 4; j++) for (let i = -N * 4; i <= N * 4; i++) {
              const tx = bx + i / 4, ty = by + j / 4; if (((i * 7 + j * 13) & 7) !== 0) continue;
              const q = P(tx, ty); if (q[0] < 0 || q[0] > W || q[1] < 0 || q[1] > H) continue; c.fillRect(q[0] - 1.5, q[1] - 1, 3, 2);
            }
          }
          drawLabFigure(c, e.i, v.x, v.y, v.z, s.ph, now, o);
        });
      } else for (const [i, cv] of cards.current) {
        const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const e = all[i]; if (!e) continue;
        paint(cv, (c, W, H) => drawLabFigure(c, i, W / 2, H * 0.9, Math.min((H * 0.78) / e.h, (W * 0.85) / e.w), s.ph, now, o));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [all, noon]);

  const open = (i: number | null) => { view.current.z = 0; setSel(i); };
  const step = (d: number) => { if (sel == null) return; const row = list.filter((e) => e.row === all[sel]?.row), k = row.findIndex((e) => e.i === sel); const n = row[(k + d + row.length) % row.length]; if (n) open(n.i); };
  const setSpeedP = (v: number) => { setSpeed(v); if (v === 0) setPhase(((st.current.ph % CYCLE) + CYCLE) % CYCLE); };
  const scrub = (v: number) => { setPhase(v); st.current.ph = v; };
  /** Single frame: advance the walked distance by 1/16 gait cycle (paused), so ground and phase move together. */
  const frame = (n: number) => { const v = st.current.ph + n * (Math.PI / 8); st.current.ph = v; setPhase(((v % CYCLE) + CYCLE) % CYCLE); };

  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.tagName === "INPUT" && ev.key !== "Escape") return;
      if (ev.key === "Escape") { ev.stopPropagation(); if (sel != null) open(null); else onClose(); }
      else if (sel != null && ev.key === "ArrowRight") step(1);
      else if (sel != null && ev.key === "ArrowLeft") step(-1);
      else if (ev.key === " ") { ev.preventDefault(); setSpeedP(speed ? 0 : 1); }
    };
    window.addEventListener("keydown", k, true); return () => window.removeEventListener("keydown", k, true);
  });

  // detail view: wheel zooms at the cursor, drag pans, two fingers pinch
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const zoomAt = (px: number, py: number, f: number) => {
    const v = view.current, nz = Math.max(2, Math.min(160, v.z * f)), k = nz / v.z;
    v.x = px - (px - v.x) * k; v.y = py - (py - v.y) * k; v.z = nz;
  };
  const local = (e: { clientX: number; clientY: number }) => { const r = big.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  const btn = "rounded-md border border-border bg-card px-2 py-1 text-xs text-card-foreground hover:border-primary";
  const on = "bg-primary text-primary-foreground border-primary hover:bg-primary";
  const cur = sel != null ? all[sel] : null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-card text-card-foreground" dir="ltr">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 text-card-foreground py-2 text-xs">
        <b className="me-2 text-sm">Figurenkabinett</b>
        {sel == null && CATS.map((c) => (
          <button key={c.k} className={`${btn} ${cat === c.k ? on : ""}`} onClick={() => setCat(c.k)}>{c.label}</button>
        ))}
        {sel == null && <button className={`${btn} ${cat === MASKS ? on : ""}`} onClick={() => setCat(MASKS)}>Nachtmasken</button>}
        {sel == null && <button className={`${btn} ${cat === GROUND ? on : ""}`} onClick={() => setCat(GROUND)}>Boden</button>}
        {sel == null && <input className="w-36 rounded-md border border-border bg-card px-2 py-1 text-card-foreground" placeholder="Suchen…" value={q} onChange={(e) => setQ(e.target.value)} />}
        {sel != null && <>
          <button className={btn} onClick={() => open(null)}>← Übersicht</button>
          <button className={btn} onClick={() => step(-1)}>‹</button>
          <b className="min-w-28 text-center text-sm">{cur?.label}</b>
          <button className={btn} onClick={() => step(1)}>›</button>
          <button className={btn} onClick={() => { const r = big.current!.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / 1.4); }}>−</button>
          <button className={btn} onClick={() => { const r = big.current!.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1.4); }}>+</button>
          <button className={btn} onClick={() => { view.current.z = 0; }}>Einpassen</button>
          <label className="flex items-center gap-1"><input type="checkbox" checked={tread} onChange={(e) => { setTread(e.target.checked); st.current.v = 0; }} /> Laufband</label>
          {tread && <>
            {DIRS.map((x) => <button key={x.k} className={`${btn} ${dirK === x.k ? on : ""}`} onClick={() => setDirK(x.k)} aria-label={`Richtung ${x.k}`}>{x.label}</button>)}
            <button className={`${btn} ${run ? on : ""}`} onClick={() => setRun(!run)}>{run ? "Anhalten" : "Losgehen"}</button>
            <span>Anlauf</span>{RAMPS.map((r) => <button key={r} className={`${btn} ${ramp === r ? on : ""}`} onClick={() => setRamp(r)}>{r ? `${r}s` : "sofort"}</button>)}
          </>}
        </>}
        <span className="ms-auto flex flex-wrap items-center gap-2">
          {WEATHERS.map((w) => <button key={w.label} className={`${btn} ${weather === w.k ? on : ""}`} onClick={() => setWeather(w.k)}>{w.label}</button>)}
          {SPEEDS.map((v) => <button key={v} className={`${btn} ${speed === v ? on : ""}`} onClick={() => setSpeedP(v)}>{v === 0 ? "❚❚" : `${v}×`}</button>)}
          {speed === 0 && <><button className={btn} onClick={() => frame(-1)} aria-label="Bild zurück">◀</button><button className={btn} onClick={() => frame(1)} aria-label="Bild vor">▶</button></>}
          {speed === 0 && <input type="range" min={0} max={CYCLE} step={0.01} value={phase} onChange={(e) => scrub(+e.target.value)} className="w-32" aria-label="Bild für Bild" />}
          <label className="flex items-center gap-1"><input type="checkbox" checked={lines} onChange={(e) => setLines(e.target.checked)} /> Linien</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={boxes} onChange={(e) => setBoxes(e.target.checked)} /> Boxen</label>
          {sel == null && <label className="flex items-center gap-1">Größe <input type="range" min={110} max={420} value={card} onChange={(e) => setCard(+e.target.value)} className="w-24" /></label>}
          <button className={btn} onClick={onClose} aria-label="Schließen">✕</button>
        </span>
      </header>

      {cat === GROUND && sel == null ? <GroundLab /> : cat === MASKS && sel == null ? <NightMaskLab /> : sel == null ? (
        <div className="flex-1 overflow-y-auto p-3">
          {rows.map((r) => (
            <section key={r.row} className="mb-4">
              <h3 className="mb-1 font-display text-sm">{r.row}</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {r.items.map((e) => (
                  <button key={e.i} onClick={() => open(e.i)} className="flex shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-start hover:border-primary hover:shadow-md" style={{ width: card }}>
                    <canvas ref={(el) => { if (el) cards.current.set(e.i, el); else cards.current.delete(e.i); }} className={`w-full ${e.night ? "bg-foreground/85" : "bg-card"}`} style={{ height: card * 1.2 }} />
                    <span className="truncate px-2 py-1 text-xs">{e.sit}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!rows.length && <p className="text-sm text-card-foreground">Keine Figur gefunden.</p>}
        </div>
      ) : (
        <div className="relative flex-1">
          <canvas
            ref={big} className={`h-full w-full cursor-grab touch-none ${cur?.night ? "bg-foreground/85" : "bg-card"} active:cursor-grabbing`}
            onWheel={(e) => { const p = local(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015)); }}
            onDoubleClick={() => { view.current.z = 0; }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pts.current.set(e.pointerId, local(e)); }}
            onPointerUp={(e) => pts.current.delete(e.pointerId)} onPointerCancel={(e) => pts.current.delete(e.pointerId)}
            onPointerMove={(e) => {
              const m = pts.current, prev = m.get(e.pointerId); if (!prev) return;
              const p = local(e), v = view.current;
              if (m.size === 1) { v.x += p.x - prev.x; v.y += p.y - prev.y; }
              else { const other = [...m].find(([k]) => k !== e.pointerId)![1];
                const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(p.x - other.x, p.y - other.y);
                if (d0 > 0) zoomAt((p.x + other.x) / 2, (p.y + other.y) / 2, d1 / d0); }
              m.set(e.pointerId, p);
            }}
          />
          <p className="pointer-events-none absolute bottom-2 start-3 rounded bg-card/90 px-2 py-1 text-[11px] text-card-foreground">
            Mausrad / zwei Finger: zoomen · Ziehen: verschieben · Doppelklick: einpassen · ← →: nächste Situation · Leertaste: Pause · Esc: zurück
            {lines && " · rot Hüfte, grün Saum, gestrichelt Boden"}
            {tread && info && <><br />Laufband (nur Dorfbewohner): {info}</>}
          </p>
        </div>
      )}
    </div>
  );
}
