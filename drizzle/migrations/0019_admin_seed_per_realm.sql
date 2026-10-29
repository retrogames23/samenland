ALTER TABLE public.seeds DROP CONSTRAINT IF EXISTS seeds_user_id_key;
DROP INDEX IF EXISTS public.seeds_user_id_key;
CREATE UNIQUE INDEX seeds_user_realm_key ON public.seeds (user_id, realm);
CREATE OR REPLACE FUNCTION public.seed_owner_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NOT public.has_role(NEW.user_id, 'admin')
     AND EXISTS (SELECT 1 FROM seeds WHERE user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'one seed per player' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS seed_owner_guard ON public.seeds;
CREATE TRIGGER seed_owner_guard BEFORE INSERT ON public.seeds FOR EACH ROW EXECUTE FUNCTION public.seed_owner_guard();