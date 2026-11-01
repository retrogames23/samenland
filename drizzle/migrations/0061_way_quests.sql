CREATE OR REPLACE FUNCTION public.quest_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE order_list text[] := ARRAY['bless','build','sign','meet','ten','gift','hamlet','road','bless7','buy3','village','gifts5','fifty','roads2','town','buy6','hundred','merchant','metro'];
  rewards int[] := ARRAY[20,30,20,30,40,40,60,60,80,100,120,120,150,150,200,250,300,400,600]; i int;
  nb int; np int; ng int; nr int;
BEGIN
  i := array_position(order_list, NEW.quest);
  IF i IS NULL THEN RAISE EXCEPTION 'unknown quest'; END IF;
  IF i > 1 AND NOT EXISTS (SELECT 1 FROM quest_claims WHERE seed_id = NEW.seed_id AND quest = order_list[i-1]) THEN
    RAISE EXCEPTION 'previous quest open';
  END IF;
  SELECT count(*) INTO nb FROM blessings WHERE seed_id = NEW.seed_id;
  SELECT count(*) INTO np FROM purchases WHERE seed_id = NEW.seed_id;
  SELECT count(*) INTO ng FROM gifts WHERE from_seed = NEW.seed_id;
  SELECT count(*) INTO nr FROM first_roads WHERE seed_id = NEW.seed_id;
  IF (NEW.quest = 'bless' AND nb < 1)
    OR (NEW.quest = 'build' AND np < 1)
    OR (NEW.quest = 'sign' AND NOT EXISTS (SELECT 1 FROM signposts WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'meet' AND NOT EXISTS (SELECT 1 FROM encounters WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'gift' AND ng < 1)
    OR (NEW.quest = 'road' AND nr < 1)
    OR (NEW.quest = 'bless7' AND nb < 7)
    OR (NEW.quest = 'buy3' AND np < 3)
    OR (NEW.quest = 'gifts5' AND ng < 5)
    OR (NEW.quest = 'roads2' AND nr < 2)
    OR (NEW.quest = 'buy6' AND (np < 6 OR NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item IN ('bigstore','stonemason','smokehouse'))))
    OR (NEW.quest = 'metro' AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item IN ('millrow','hammerworks','saltquay'))) THEN
    RAISE EXCEPTION 'quest not done';
  END IF;
  NEW.reward := rewards[i];
  NEW.created_at := now();
  RETURN NEW;
END $function$;