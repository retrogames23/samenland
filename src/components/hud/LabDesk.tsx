import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clock, worldHour, labJump, setLabJump } from "@/game/time";
import { labState, setLabWeather, setLabFeast, triggerLab, clearLabEvent, resetLab, type LabEvent } from "@/game/lab-ctl";
import type { WeatherKind } from "@/game/weather";
import type { FeastCode } from "@/game/feasts";
import type { Lang } from "@/game/i18n";

/** Admin control desk strings (admin-only tool: German and English, others fall back to English). */
const TXT = {
  de: {
    title: "Steuerungspult", note: "Nur auf der Testkarte. Wirkt nur in deinem Browser.", time: "Tageszeit", weather: "Wetter", feast: "Feiertag",
    events: "Ereignisse", reset: "Alle Test-Eingriffe aufheben", close: "Schließen", off: "Kalender", end: "beenden",
    hours: { 6: "Morgen", 12: "Mittag", 17: "Abend", 20: "Dämmerung", 0: "Mitternacht" } as Record<number, string>,
    wx: { clear: "Klar", drizzle: "Regen", snow: "Schnee", mist: "Nebel", storm: "Gewitter" } as Record<WeatherKind, string>,
    ev: { wedding: "Hochzeit", fire: "Brand", flood: "Flut", raid: "Räuber" } as Record<LabEvent, string>,
    fe: { christmas: "Weihnachten", epiphany: "Dreikönig", candlemas: "Lichtmess", shrovetide: "Fastnacht", ashwed: "Aschermittwoch", palm: "Palmsonntag", goodfriday: "Karfreitag", easter: "Ostern", ascension: "Himmelfahrt", pentecost: "Pfingsten", corpus: "Fronleichnam", midsummer: "Johannis", michaelmas: "Michaelis", allsaints: "Allerheiligen", martinmas: "Martini" } as Record<FeastCode, string>,
  },
  en: {
    title: "Control desk", note: "Test map only. Affects only your browser.", time: "Time of day", weather: "Weather", feast: "Feast",
    events: "Events", reset: "Clear all test overrides", close: "Close", off: "Calendar", end: "end",
    hours: { 6: "Morning", 12: "Noon", 17: "Evening", 20: "Dusk", 0: "Midnight" } as Record<number, string>,
    wx: { clear: "Clear", drizzle: "Rain", snow: "Snow", mist: "Mist", storm: "Storm" } as Record<WeatherKind, string>,
    ev: { wedding: "Wedding", fire: "Fire", flood: "Flood", raid: "Robbers" } as Record<LabEvent, string>,
    fe: { christmas: "Christmas", epiphany: "Epiphany", candlemas: "Candlemas", shrovetide: "Shrovetide", ashwed: "Ash Wednesday", palm: "Palm Sunday", goodfriday: "Good Friday", easter: "Easter", ascension: "Ascension", pentecost: "Pentecost", corpus: "Corpus Christi", midsummer: "Midsummer", michaelmas: "Michaelmas", allsaints: "All Saints", martinmas: "Martinmas" } as Record<FeastCode, string>,
  },
};

const chip = (on: boolean) => `rounded px-1.5 py-1 text-[11px] ${on ? "bg-accent text-foreground" : "bg-background/40 hover:bg-accent/50"}`;

export function LabDesk({ lang, onChange, onClose }: { lang: Lang; onChange: () => void; onClose: () => void }) {
  const t = lang === "de" ? TXT.de : TXT.en;
  const [, re] = useState(0);
  const st = labState();
  const done = () => { re((n) => n + 1); onChange(); };
  const toHour = (h: number) => {
    const d = (h - worldHour(clock()) + 24) % 24;
    const j = labJump() + d; setLabJump(j); localStorage.setItem("samenland-lab-jump", String(j)); done();
  };
  return (
    <div className="pointer-events-auto fixed inset-x-2 top-16 z-50 mx-auto max-h-[75vh] max-w-sm overflow-y-auto rounded-lg border border-border bg-card/95 p-3 text-sm shadow-lg backdrop-blur" role="dialog" aria-label={t.title}>
      <div className="mb-1 flex items-center justify-between"><b>🎛 {t.title}</b><button className="text-xs text-muted-foreground hit" onClick={onClose} aria-label={t.close}>✕</button></div>
      <div className="mb-2 text-[10px] text-muted-foreground">{t.note}</div>
      <div className="text-xs text-muted-foreground">{t.time}</div>
      <div className="mb-2 flex flex-wrap gap-1">{[6, 12, 17, 20, 0].map((h) => <button key={h} className={chip(false)} onClick={() => toHour(h)}>{t.hours[h]}</button>)}</div>
      <div className="text-xs text-muted-foreground">{t.weather}</div>
      <div className="mb-2 flex flex-wrap gap-1">
        <button className={chip(!st.weather)} onClick={() => { setLabWeather(null); done(); }}>{t.off}</button>
        {(["clear", "drizzle", "snow", "mist", "storm"] as WeatherKind[]).map((w) => <button key={w} className={chip(st.weather === w)} onClick={() => { setLabWeather(w); done(); }}>{t.wx[w]}</button>)}
      </div>
      <div className="text-xs text-muted-foreground">{t.events}</div>
      <div className="mb-2 grid grid-cols-2 gap-1">
        {(["wedding", "fire", "flood", "raid"] as LabEvent[]).map((e) => (
          <div key={e} className="flex gap-1">
            <button className={`${chip(!!st.ev[e])} flex-1`} onClick={() => { triggerLab(e, clock()); done(); }}>{t.ev[e]}</button>
            {st.ev[e] && <button className={chip(false)} onClick={() => { clearLabEvent(e); done(); }} aria-label={`${t.ev[e]} ${t.end}`}>✕</button>}
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">{t.feast}</div>
      <div className="mb-3 flex flex-wrap gap-1">
        <button className={chip(!st.feast)} onClick={() => { setLabFeast(null); done(); }}>{t.off}</button>
        {(Object.keys(t.fe) as FeastCode[]).map((f) => <button key={f} className={chip(st.feast === f)} onClick={() => { setLabFeast(f); done(); }}>{t.fe[f]}</button>)}
      </div>
      <Button size="sm" variant="secondary" className="w-full" onClick={() => { resetLab(); setLabJump(0); localStorage.setItem("samenland-lab-jump", "0"); done(); }}>{t.reset}</Button>
    </div>
  );
}
