CREATE OR REPLACE FUNCTION public.abandon_village(_seed uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM seeds WHERE id = _seed AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not your village';
  END IF;
  DELETE FROM blessings WHERE seed_id = _seed;
  DELETE FROM charters WHERE seed_id = _seed;
  DELETE FROM encounters WHERE seed_id = _seed;
  DELETE FROM first_roads WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;
  DELETE FROM plantings WHERE seed_id = _seed;
  DELETE FROM purchases WHERE seed_id = _seed;
  DELETE FROM signposts WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM twin_votes WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM seeds WHERE id = _seed;
END $$;
REVOKE ALL ON FUNCTION public.abandon_village(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.abandon_village(uuid) TO authenticated;