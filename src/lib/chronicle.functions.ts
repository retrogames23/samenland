import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type In = { lang: "de" | "en" | "zh" | "ja"; town: string; days: number; facts: string[] };

/** A short, warm greeting from the village scribe, written from the derived chronicle facts. */
export const scribeGreeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: In) => ({
    lang: (["de", "en", "zh", "ja"] as const).includes(d.lang) ? d.lang : "de",
    town: String(d.town).slice(0, 60),
    days: Math.max(0, Math.min(400, Math.round(Number(d.days) || 0))),
    facts: (Array.isArray(d.facts) ? d.facts : []).slice(0, 20).map((f) => String(f).slice(0, 200)),
  }) as In)
  .handler(async ({ data }) => {
    const key = process.env["OPENROUTER_API_KEY"];
    if (!key) return { text: null as string | null };
    const de = data.lang === "de";
    const instructions = de
      ? "Du bist der Dorfschreiber eines gemütlichen spätmittelalterlichen Dorfes (Hansezeit, keine Industrie). Schreibe 2–3 kurze, warme Sätze als Begrüßung an den heimkehrenden Dorfschulzen, in leicht altertümlichem Ton (Ihr/Euch). Greife 1–2 der Fakten auf, erfinde keine neuen Bauten oder Zahlen. Kein Titel, keine Aufzählung."
      : "You are the scribe of a cozy late-medieval village (Hanseatic era, no industry). Write 2–3 short, warm sentences welcoming the returning village reeve, in a gently old-fashioned tone. Mention 1–2 of the facts, never invent buildings or numbers. No title, no list." + (data.lang === "zh" ? " Write in Simplified Chinese." : data.lang === "ja" ? " Write in Japanese." : "");
    const input = `${de ? "Dorf" : "Village"}: ${data.town}\n${de ? "Tage fort" : "Days away"}: ${data.days}\n${de ? "Fakten" : "Facts"}:\n- ${data.facts.join("\n- ")}`;
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://samenland.lovable.app",
          "X-Title": "Samenland",
        },
        body: JSON.stringify({
          model: "openai/gpt-6-luna",
          messages: [{ role: "system", content: instructions }, { role: "user", content: input }],
          reasoning: { effort: "low" },
          max_tokens: 400,
        }),
      });
      if (!res.ok) { console.error("scribe", res.status, await res.text().catch(() => "")); return { text: null }; }
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = j.choices?.[0]?.message?.content?.trim();
      return { text: text || null };
    } catch (e) {
      console.error("scribe", e);
      return { text: null };
    }
  });
