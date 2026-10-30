import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BUGS, type BugKind } from "@/game/lang/bugs";
import type { Lang } from "@/game/i18n";
import { toast } from "sonner";
import { X } from "lucide-react";

const MAX_SHOTS = 5, MAX_BYTES = 8 * 1024 * 1024;

export function BugReport({ lang, userId, context, onClose }: { lang: Lang; userId: string; context: Record<string, unknown>; onClose: () => void }) {
  const t = BUGS[lang];
  const [kind, setKind] = useState<BugKind>("bug");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const add = (list: FileList | null) => {
    const picked = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (picked.some((f) => f.size > MAX_BYTES)) toast.error(t.tooBig);
    setFiles((cur) => [...cur, ...picked.filter((f) => f.size <= MAX_BYTES)].slice(0, MAX_SHOTS));
  };

  const send = async () => {
    if (body.trim().length < 3 || busy) return;
    setBusy(true);
    try {
      const shots: string[] = [];
      for (const f of files) {
        const ext = (f.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "png";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("bug-shots").upload(path, f, { contentType: f.type });
        if (error) throw error;
        shots.push(path);
      }
      const { error } = await supabase.from("bug_reports").insert({ user_id: userId, kind, body: body.trim().slice(0, 4000), shots, context: context as never });
      if (error) throw error;
      toast.success(t.thanks);
      onClose();
    } catch (e) {
      console.error("bug report", e);
      toast.error(t.failed);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t.intro}</p>
      <div className="flex gap-1">
        {(Object.keys(t.kinds) as BugKind[]).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`flex-1 rounded border px-2 py-1 text-xs ${kind === k ? "border-primary bg-accent text-foreground" : "border-border/60 hover:bg-accent/50"}`}>{t.kinds[k]}</button>
        ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={5} placeholder={t.placeholder}
        className="w-full rounded border border-border bg-background/60 p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      <div className="text-xs text-muted-foreground">{t.shots(files.length)}</div>
      <div className="flex flex-wrap gap-1.5">
        {files.map((f, i) => (
          <div key={i} className="relative h-14 w-14 overflow-hidden rounded border border-border">
            <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
            <button type="button" aria-label="×" onClick={() => setFiles((c) => c.filter((_, j) => j !== i))} className="absolute end-0 top-0 rounded-bl bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
          </div>
        ))}
        {files.length < MAX_SHOTS && (
          <label className="grid h-14 cursor-pointer place-items-center rounded border border-dashed border-border px-2 text-[11px] text-muted-foreground hover:bg-accent/50">
            {t.add}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <Button size="sm" className="w-full" disabled={busy || body.trim().length < 3} onClick={send}>{busy ? t.sending : t.send}</Button>
    </div>
  );
}
