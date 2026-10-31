import { useRef, useState } from "react";

/** Touch joystick for stroll mode: writes a unit-ish screen direction into `out` while held. Local-only steering. */
export function WalkStick({ out, label }: { out: { current: { dx: number; dy: number } }; label: string }) {
  const R = 44;
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<[number, number]>([0, 0]);
  const move = (e: React.PointerEvent) => {
    const b = base.current?.getBoundingClientRect(); if (!b) return;
    let x = e.clientX - (b.left + b.width / 2), y = e.clientY - (b.top + b.height / 2);
    const d = Math.hypot(x, y); if (d > R) { x *= R / d; y *= R / d; }
    setKnob([x, y]);
    const m = Math.min(1, d / R), dead = m < 0.18;
    out.current = dead ? { dx: 0, dy: 0 } : { dx: (x / R), dy: (y / R) };
  };
  const end = () => { setKnob([0, 0]); out.current = { dx: 0, dy: 0 }; };
  return (
    <div
      ref={base}
      role="application"
      aria-label={label}
      className="pointer-events-auto relative h-28 w-28 touch-none select-none rounded-full border-2 border-wood/70 bg-card/55 shadow-[var(--shadow-panel)] backdrop-blur-[1px]"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e); }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="absolute inset-3 rounded-full border border-dashed border-wood/40" />
      <div
        className="absolute left-1/2 top-1/2 h-11 w-11 rounded-full border-2 border-wood bg-card shadow-md"
        style={{ transform: `translate(calc(-50% + ${knob[0]}px), calc(-50% + ${knob[1]}px))` }}
      />
    </div>
  );
}
