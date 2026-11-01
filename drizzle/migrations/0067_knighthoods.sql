CREATE TABLE public.knighthoods (
  seed_id uuid PRIMARY KEY REFERENCES public.seeds(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.knighthoods TO anon, authenticated;
GRANT ALL ON public.knighthoods TO service_role;
ALTER TABLE public.knighthoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Knighthoods are public" ON public.knighthoods FOR SELECT TO anon, authenticated USING (true);

-- Dubbing: owner only, 12 fulfilled decrees, once per village
CREATE OR REPLACE FUNCTION public.princely_knight(_seed uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me public.seeds; n integer;
BEGIN
  SELECT * INTO me FROM seeds WHERE id=_seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('princely' || _seed::text));
  IF EXISTS (SELECT 1 FROM knighthoods WHERE seed_id=_seed) THEN RETURN 'already'; END IF;
  SELECT count(*) INTO n FROM princely_tasks WHERE seed_id=_seed AND done_at IS NOT NULL;
  IF n < 12 THEN RETURN 'not_yet'; END IF;
  INSERT INTO knighthoods(seed_id) VALUES (_seed);
  RETURN 'knighted';
END $$;
REVOKE EXECUTE ON FUNCTION public.princely_knight(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.princely_knight(uuid) TO authenticated;