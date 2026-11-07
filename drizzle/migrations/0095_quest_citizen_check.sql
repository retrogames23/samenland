ALTER TABLE public.rank_certificates ADD COLUMN IF NOT EXISTS citizens integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.quest_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE order_list text[] := ARRAY['bless','build','sign','meet','ten','gift','hamlet','road','bless7','buy3','fifty','village','gifts5','roads2','hundred','town','buy6','merchant','metro'];
  rewards int[] := ARRAY[20,30,20,30,40,40,60,60,80,100,150,120,120,150,300,200,250,400,600]; i int;
  nb int; np int; ng int; nr int; need_rank int; need_cit int; cur int; cit int;
BEGIN
  i := array_position(order_list, NEW.quest);
  IF i IS NULL THEN RAISE EXCEPTION 'unknown quest'; END IF;
  IF i > 1 AND NOT EXISTS (SELECT 1 FROM quest_claims WHERE seed_id = NEW.seed_id AND quest = order_list[i-1]) THEN
    RAISE EXCEPTION 'previous quest open';
  END IF;
  need_rank := CASE NEW.quest WHEN 'hamlet' THEN 1 WHEN 'village' THEN 2 WHEN 'town' THEN 3 WHEN 'merchant' THEN 4 WHEN 'metro' THEN 5 ELSE 0 END;
  need_cit := CASE NEW.quest WHEN 'ten' THEN 10 WHEN 'fifty' THEN 50 WHEN 'hundred' THEN 150 ELSE 0 END;
  IF need_rank > 0 OR need_cit > 0 THEN
    SELECT rank, citizens INTO cur, cit FROM rank_certificates WHERE seed_id = NEW.seed_id AND certified_at > now() - interval '15 minutes';
    IF cur IS NULL OR cur < need_rank OR cit < need_cit THEN RAISE EXCEPTION 'rank too low'; END IF;
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