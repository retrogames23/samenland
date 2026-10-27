import type { ReactNode } from "react";

/** Carved wooden frame with a parchment inset — the shared look of every HUD surface. */
export function Panel({ children, className = "", inner = "" }: { children: ReactNode; className?: string; inner?: string }) {
  return (
    <div className={`pointer-events-auto rounded-lg border-2 border-wood bg-wood p-1 shadow-[var(--shadow-panel)] ${className}`}>
      <div className={`rounded-md border border-brass/40 bg-card text-card-foreground ${inner}`}>{children}</div>
    </div>
  );
}

export function WoodButton({ active, label, onClick, children, className = "" }: { active?: boolean; label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`grid place-items-center rounded-md border transition-colors ${active ? "border-brass bg-wood-light text-brass" : "border-transparent text-wood-foreground hover:bg-wood-light"} ${className}`}
    >
      {children}
    </button>
  );
}
