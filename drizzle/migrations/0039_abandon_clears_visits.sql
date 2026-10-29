CREATE OR REPLACE FUNCTION public.abandon_village(_seed uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM seeds WHERE id = _seed AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not your village';
  END IF;
  DELETE FROM village_visits WHERE visitor_seed = _seed OR visited_seed = _seed;
  DELETE FROM letters WHERE from_seed = _seed OR to_seed = _seed;
  DELETE FROM market_sales WHERE seed_id = _seed;
  DELETE FROM quest_claims WHERE seed_id = _seed;
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
END $function$;