import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/hud/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/game/i18n";

type A = Dict["account"];

function Shell({ title, close, closeLabel, children }: { title: string; close: () => void; closeLabel: string; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [close]);
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
        <Panel inner="p-4">
          <div className="relative mb-3">
            <h2 className="pe-6 text-base font-semibold text-wood">{title}</h2>
            <button type="button" aria-label={closeLabel} onClick={close} className="hit absolute end-0 top-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          {children}
        </Panel>
      </div>
    </div>
  );
}

/** Request a reset link (inside the sign-in dialog). */
export function ForgotForm({ a, initialEmail, emailLabel, back }: { a: A; initialEmail: string; emailLabel: string; back: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "busy" | "sent" | "fail">("idle");
  const send = async () => {
    setState("busy");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setState(error ? "fail" : "sent");
  };
  return (
    <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
      <div className="text-sm font-semibold">{a.resetTitle}</div>
      <Input type="email" required placeholder={emailLabel} value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" size="sm" className="w-full" disabled={state === "busy"}>{a.sendLink}</Button>
      {state === "sent" && <p className="text-xs text-primary">{a.resetSent}</p>}
      {state === "fail" && <p className="text-xs text-destructive">{a.fail}</p>}
      <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={back}>{a.back}</button>
    </form>
  );
}

function PwFields({ a, onDone, needCurrent }: { a: A; onDone: () => void; needCurrent: boolean }) {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (pw.length < 6) return setErr(a.short);
    if (pw !== pw2) return setErr(a.mismatch);
    setBusy(true); setErr(null);
    const attrs = needCurrent ? { password: pw, current_password: cur } : { password: pw };
    const { error } = await supabase.auth.updateUser(attrs as { password: string });
    setBusy(false);
    if (error) return setErr(error.message || a.fail);
    toast.success(a.pwChanged);
    onDone();
  };
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
      {needCurrent && <Input type="password" required autoComplete="current-password" placeholder={a.currentPw} value={cur} onChange={(e) => setCur(e.target.value)} />}
      <Input type="password" required minLength={6} autoComplete="new-password" placeholder={a.newPw} value={pw} onChange={(e) => setPw(e.target.value)} />
      <Input type="password" required minLength={6} autoComplete="new-password" placeholder={a.repeatPw} value={pw2} onChange={(e) => setPw2(e.target.value)} />
      <Button type="submit" size="sm" className="w-full" disabled={busy}>{a.save}</Button>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </form>
  );
}

/** After clicking the reset link: choose a new password (no current password needed). */
export function RecoveryDialog({ a, closeLabel, close }: { a: A; closeLabel: string; close: () => void }) {
  return <Shell title={a.newTitle} close={close} closeLabel={closeLabel}><PwFields a={a} needCurrent={false} onDone={close} /></Shell>;
}

/** Signed-in password change; OAuth-only accounts may set a first password. */
export function ChangePasswordDialog({ a, closeLabel, close }: { a: A; closeLabel: string; close: () => void }) {
  const [hasPw, setHasPw] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setHasPw(!!data.user?.identities?.some((i) => i.provider === "email")));
  }, []);
  return (
    <Shell title={a.changePw} close={close} closeLabel={closeLabel}>
      {hasPw === false && <p className="mb-2 text-xs text-muted-foreground">{a.oauthHint}</p>}
      {hasPw !== null && <PwFields a={a} needCurrent={hasPw} onDone={close} />}
    </Shell>
  );
}

export function ChangeEmailDialog({ a, closeLabel, close }: { a: A; closeLabel: string; close: () => void }) {
  const [current, setCurrent] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCurrent(data.user?.email ?? "")); }, []);
  const send = async () => {
    setState("busy"); setErr(null);
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: window.location.origin });
    if (error) { setState("idle"); setErr(error.message || a.fail); } else setState("sent");
  };
  return (
    <Shell title={a.changeMail} close={close} closeLabel={closeLabel}>
      <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <div className="text-xs text-muted-foreground">{a.currentMail}: <span dir="ltr" className="font-medium text-foreground">{current}</span></div>
        <Input type="email" required placeholder={a.newMail} value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" size="sm" className="w-full" disabled={state !== "idle"}>{a.sendConfirm}</Button>
        {state === "sent" && <p className="text-xs text-primary">{a.mailSent}</p>}
        {err && <p className="text-xs text-destructive">{err}</p>}
      </form>
    </Shell>
  );
}
