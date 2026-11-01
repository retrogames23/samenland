CREATE TABLE public.supporter_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  reward text NOT NULL,
  amount_cents integer NOT NULL,
  stripe_session_id text NOT NULL UNIQUE,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, reward, environment)
);
GRANT SELECT ON public.supporter_rewards TO anon, authenticated;
GRANT ALL ON public.supporter_rewards TO service_role;
ALTER TABLE public.supporter_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supporter rewards are public decorations" ON public.supporter_rewards FOR SELECT TO anon, authenticated USING (true);