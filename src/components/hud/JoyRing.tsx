import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Lang } from "@/game/i18n";

/**
 * Wedding-joy ring in the HUD: opens at once on mouse hover and on tap (touch devices never show `title`).
 * Text names only real effects: festJoy sets sickChance to 0 (sickness.ts); the +10 health only lifts the HUD bar.
 */
export function JoyRing({
  title,
  text,
  lang,
  className = "",
}: {
  title: string;
  text: string;
  lang: Lang;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const hover = (on: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setOpen(on);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          className={`hit pointer-events-auto relative shrink-0 self-center rounded px-0.5 text-sm leading-none hover:bg-muted ${className}`}
        >
          <span aria-hidden>💍</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        className="w-64 max-w-[calc(100vw-2rem)] p-3 text-sm"
        dir={lang === "ar" ? "rtl" : "ltr"}
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="font-semibold text-wood">💍 {title}</div>
        <p className="mt-1 text-muted-foreground">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
