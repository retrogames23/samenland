CREATE OR REPLACE FUNCTION public.rename_seed(p_seed uuid, p_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; n text := btrim(p_name);
BEGIN
  SELECT * INTO s FROM seeds WHERE id = p_seed;
  IF s IS NULL OR s.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not owner'; END IF;
  IF length(n) < 2 OR length(n) > 32 THEN RAISE EXCEPTION 'bad name'; END IF;
  IF NOT EXISTS (SELECT 1 FROM seeds o WHERE o.id <> s.id AND o.realm = s.realm
      AND lower(btrim(o.name)) = lower(btrim(s.name)) AND o.created_at < s.created_at) THEN
    RAISE EXCEPTION 'name not duplicated';
  END IF;
  IF EXISTS (SELECT 1 FROM seeds o WHERE o.id <> s.id AND o.realm = s.realm AND lower(btrim(o.name)) = lower(n)) THEN
    RAISE EXCEPTION 'name taken';
  END IF;
  UPDATE seeds SET name = n WHERE id = s.id;
END $$;
REVOKE ALL ON FUNCTION public.rename_seed(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rename_seed(uuid, text) TO authenticated;