CREATE OR REPLACE FUNCTION public.claim_wonder(_seed uuid, _site text)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE me public.seeds; w public.wonder_sites; isfirst boolean; r integer;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  SELECT * INTO w FROM public.wonder_sites WHERE key = _site;
  IF w.key IS NULL THEN RAISE EXCEPTION 'unknown site'; END IF;
  IF (SELECT count(*) FROM public.wonder_finds WHERE seed_id = _seed AND created_at > now() - interval '1 day') >= 3 THEN RAISE EXCEPTION 'too many'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_site || coalesce(me.realm, '')));
  isfirst := NOT EXISTS (SELECT 1 FROM public.wonder_finds WHERE site = _site AND realm = coalesce(me.realm, 'europe') AND first);
  r := CASE WHEN isfirst THEN 100 ELSE 40 END;
  INSERT INTO public.wonder_finds(seed_id, site, realm, first, reward) VALUES (_seed, _site, coalesce(me.realm, 'europe'), isfirst, r) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN r;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_wonder(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_wonder(uuid, text) TO authenticated;