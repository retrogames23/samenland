CREATE OR REPLACE FUNCTION public.europe_full_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.realm = 'europe' AND NOT public.has_role(auth.uid(), 'admin')
     AND (SELECT count(*) FROM public.seeds WHERE realm = 'europe') >= 60 THEN
    RAISE EXCEPTION 'realm_full' USING ERRCODE = 'P0001', HINT = 'Altenland is full; found on europe-2';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS seeds_europe_full ON public.seeds;
CREATE TRIGGER seeds_europe_full BEFORE INSERT ON public.seeds
FOR EACH ROW EXECUTE FUNCTION public.europe_full_guard();
COMMENT ON FUNCTION public.europe_full_guard() IS 'Mirrors EUROPE_FULL (time.ts): no new villages on Altenland from 60 on, admins exempt.';