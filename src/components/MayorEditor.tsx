import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DICT, type Lang } from "@/game/i18n";
import { MAYOR } from "@/game/lang/mayor";
import { TRAITS, traitClash, type Trait } from "@/game/traits";
import { mayorSheetUrl } from "@/game/folk-sprites";
import { hash, type Seed } from "@/game/world";

type Props = { seed: Seed; lang: Lang; age: number; traits: Trait[]; onClose: () => void; onSaved: (patch: Partial<Seed>) => void };

/** Owner-only form for the player's own mayor: name, office/gender, age 20–70 and up to two traits. */
export function MayorEditor({ seed, lang, age: age0, traits: tr0, onClose, onSaved }: Props) {
  const t = MAYOR[lang], d = DICT[lang];
  const [name, setName] = useState(seed.owner ?? "");
  const [gender, setGender] = useState<"m" | "w" | "d">((seed.mayor_gender as "m" | "w" | "d") ?? "d");
  const [age, setAge] = useState(age0);
  const [traits, setTraits] = useState<Trait[]>(tr0);
  const [busy, setBusy] = useState(false);
  const sex = gender === "w" ? "f" : gender === "m" ? "m" : hash(seed.x, seed.y, 880) < 0.5 ? "f" : "m";
  const toggle = (k: Trait) => setTraits((c) => c.includes(k) ? c.filter((x) => x !== k) : c.length >= 2 ? [c[1]!, k] : [...c, k]);
  const blocked = (k: Trait) => !traits.includes(k) && traits.some((x) => traitClash(x, k));
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("update_mayor", { _seed: seed.id, _owner: name.trim(), _gender: gender, _age: age, _traits: traits });
    setBusy(false);
    if (error) { toast.error(t.failed); return; }
    onSaved({ owner: name.trim(), mayor_gender: gender, mayor_age: age, mayor_traits: traits });
    toast.success(t.saved);
    onClose();
  };
  return (
    <div className="mt-2 space-y-2 rounded-md border border-border bg-background/60 p-2 text-sm">
      <div className="flex items-center gap-3">
        <div aria-hidden className="h-20 w-14 shrink-0 bg-no-repeat" style={{ backgroundImage: `url(${mayorSheetUrl(sex, age)})`, backgroundSize: "600% 100%", backgroundPosition: "0 0" }} />
        <div className="font-['Caveat'] text-lg leading-tight">{t.title}</div>
      </div>
      <label className="block text-xs text-muted-foreground">{t.name}
        <Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className="mt-0.5 h-8" />
      </label>
      <div className="text-xs text-muted-foreground">{t.role}</div>
      <div className="flex gap-1">
        {(["m", "w", "d"] as const).map((g) => (
          <Button key={g} type="button" size="sm" variant={gender === g ? "default" : "outline"} className="h-7 flex-1 px-1 text-xs" onClick={() => setGender(g)}>{t[g]}</Button>
        ))}
      </div>
      <label className="block text-xs text-muted-foreground">{t.age}: <span className="text-foreground">{t.years(age)}</span>
        <input type="range" min={20} max={70} value={age} onChange={(e) => setAge(Number(e.target.value))} className="mt-1 w-full accent-primary" />
      </label>
      <div className="text-xs text-muted-foreground">{t.traits}</div>
      <div className="flex flex-wrap gap-1">
        {TRAITS.map((k) => (
          <Button key={k} type="button" size="sm" variant={traits.includes(k) ? "default" : "outline"} disabled={blocked(k)} className="h-7 px-2 text-xs" onClick={() => toggle(k)}>{d.person.traits[k]}</Button>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground">{t.traitsHint}</div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onClose}>{t.cancel}</Button>
        <Button type="button" size="sm" className="flex-1" disabled={busy || !name.trim() || !traits.length} onClick={save}>{busy ? t.saving : t.save}</Button>
      </div>
    </div>
  );
}
