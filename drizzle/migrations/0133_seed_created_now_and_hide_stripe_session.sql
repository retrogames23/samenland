CREATE OR REPLACE FUNCTION public.seed_owner_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NOT public.has_role(NEW.user_id, 'admin')
     AND EXISTS (SELECT 1 FROM seeds WHERE user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'one seed per player' USING ERRCODE = '23505';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.created_at := now();
    NEW.renamed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

REVOKE SELECT ON public.supporter_rewards FROM anon, authenticated;
GRANT SELECT (id, seed_id, reward, environment, created_at) ON public.supporter_rewards TO anon, authenticated;