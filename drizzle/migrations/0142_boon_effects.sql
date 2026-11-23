-- M1 Paket 2a (Phase 1.4g): the growth effect of every encounter answer, mirrored from src/game/encounters.ts ENCOUNTERS
-- (fx.growth, fx.h), and the number of growth boons active for a village at a moment. A boon is active from its
-- booking time (encounters.created_at) for exactly `hours` — the same window boonHours counts. Nothing reads these
-- yet; the Ratsbuch guard (Paket 2b) uses active_boons for the shared limit of six. Existing rows stay untouched.
CREATE TABLE IF NOT EXISTS public.boon_effects (
  event text NOT NULL,
  choice text NOT NULL,
  growth numeric NOT NULL CHECK (growth > 0),
  hours integer NOT NULL CHECK (hours > 0),
  PRIMARY KEY (event, choice)
);
ALTER TABLE public.boon_effects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Boon effects are public rules" ON public.boon_effects;
CREATE POLICY "Boon effects are public rules" ON public.boon_effects FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.boon_effects TO anon, authenticated;
INSERT INTO public.boon_effects (event, choice, growth, hours) VALUES
  ('journeyman', 'host', 0.15, 72),
  ('journeyman', 'settle', 0.08, 168),
  ('ruin', 'shrine', 0.1, 120),
  ('widow', 'shelter', 0.06, 168),
  ('monk', 'copy', 0.08, 120),
  ('wedding', 'feast', 0.1, 120),
  ('surveyor', 'map', 0.05, 168),
  ('orphan', 'adopt', 0.05, 168),
  ('lichtstube', 'reigen', 0.05, 120),
  ('stoerer', 'dulden', 0.03, 96),
  ('gast', 'frei', 0.04, 96)
ON CONFLICT (event, choice) DO UPDATE SET growth = EXCLUDED.growth, hours = EXCLUDED.hours;

CREATE OR REPLACE FUNCTION public.active_boons(_seed uuid, _at timestamptz)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT count(*)::integer FROM public.encounters e
  JOIN public.boon_effects b ON b.event = e.event AND b.choice = e.choice
  WHERE e.seed_id = _seed AND e.created_at <= _at AND _at < e.created_at + make_interval(hours => b.hours)
$function$;
REVOKE ALL ON FUNCTION public.active_boons(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.active_boons(uuid, timestamptz) TO service_role;