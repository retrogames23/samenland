import type { ReactNode } from "react";
import { X } from "lucide-react";

/** Illustrated parchment overlay for decisions (road, charter, encounters). */
export function Parchment({ image, title, later, onLater, wide, children }: {
  image?: string | undefined; title: string; later: string; onLater: () => void; wide?: boolean; children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-foreground/40 p-3 backdrop-blur-[1px]" onClick={onLater}>
      <div onClick={(e) => e.stopPropagation()} className={`parchment relative max-h-full w-full overflow-auto ${wide ? "max-w-2xl" : "max-w-xl"}`}>
        <button type="button" aria-label={later} onClick={onLater}
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-parchment/80 text-ink/60 shadow-sm hover:bg-parchment hover:text-ink">
          <X className="h-4 w-4" />
        </button>
        {image && (
          <img src={image} alt="" width={768} height={480} className="parchment-art mx-auto block aspect-[16/10] max-h-[28vh] w-full object-cover sm:max-h-[36vh]" />
        )}
        <div className="px-5 pb-5 pt-2 sm:px-8">
          <h2 className="text-center font-display text-4xl leading-none text-ink">{title}</h2>
          <div className="mx-auto my-2 h-px w-2/3 bg-ink/30" />
          {children}
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={onLater} className="font-display text-xl text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-ink">{later}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Wax seal reminder for a postponed decision. */
export function WaxSeal({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className="pointer-events-auto grid h-12 w-12 animate-pulse place-items-center rounded-full border-2 border-wax-edge bg-[radial-gradient(circle_at_35%_30%,var(--color-wax-shine),var(--color-wax)_60%,var(--color-wax-edge))] font-display text-2xl text-wood-foreground shadow-lg [animation-duration:3s]">
      ✦
    </button>
  );
}
