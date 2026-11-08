CREATE OR REPLACE FUNCTION public.quest_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE order_list text[] := ARRAY['bless','build','sign','meet','ten','gift','hamlet','road','bless7','buy3','fifty','village','gifts5','roads2','hundred','town','buy6','merchant','metro'];
  rewards int[] := ARRAY[20,30,20,30,40,40,60,60,80,100,150,120,120,150,300,200,250,400,600];
  t_build text[] := ARRAY['build','ten','hamlet','road','buy3','fifty','village','roads2','hundred','town','buy6','merchant','metro'];
  -- mirrors TRACKS in src/game/quests.ts: the first encounter comes before the signpost
  t_social text[] := ARRAY['meet','sign','gift','gifts5'];
  trk text[]; j int; i int;
  nb int; np int; ng int; nr int; reach int; need_rank int; need_cit int; cur int; cit int; me public.seeds;
BEGIN
  i := array_position(order_list, NEW.quest);
  IF i IS NULL THEN RAISE EXCEPTION 'unknown quest'; END IF;
  trk := CASE WHEN NEW.quest = ANY(t_build) THEN t_build WHEN NEW.quest = ANY(t_social) THEN t_social ELSE ARRAY['bless','bless7'] END;
  j := array_position(trk, NEW.quest);
  IF j > 1 AND NOT EXISTS (SELECT 1 FROM quest_claims WHERE seed_id = NEW.seed_id AND quest = trk[j-1]) THEN
    RAISE EXCEPTION 'previous quest open';
  END IF;
  need_rank := CASE NEW.quest WHEN 'hamlet' THEN 1 WHEN 'village' THEN 2 WHEN 'town' THEN 3 WHEN 'merchant' THEN 4 WHEN 'metro' THEN 5 ELSE 0 END;
  need_cit := CASE NEW.quest WHEN 'ten' THEN 10 WHEN 'fifty' THEN 50 WHEN 'hundred' THEN 150 ELSE 0 END;
  IF need_rank > 0 OR need_cit > 0 THEN
    SELECT rank, citizens INTO cur, cit FROM rank_certificates WHERE seed_id = NEW.seed_id AND certified_at > now() - interval '15 minutes';
    IF cur IS NULL OR cur < need_rank OR cit < need_cit THEN RAISE EXCEPTION 'rank too low'; END IF;
  END IF;
  SELECT * INTO me FROM seeds WHERE id = NEW.seed_id;
  SELECT count(*) INTO reach FROM seeds o WHERE o.id <> me.id AND o.realm = me.realm AND sqrt(power(o.x - me.x, 2) + power(o.y - me.y, 2)) <= 80;
  SELECT count(*) INTO nb FROM blessings WHERE seed_id = NEW.seed_id;
  SELECT count(*) INTO np FROM purchases WHERE seed_id = NEW.seed_id;
  SELECT count(*) INTO ng FROM gifts WHERE from_seed = NEW.seed_id;
  SELECT count(DISTINCT CASE WHEN r.seed_id = NEW.seed_id THEN r.target_id ELSE r.seed_id END) INTO nr
    FROM first_roads r WHERE r.seed_id = NEW.seed_id OR r.target_id = NEW.seed_id;
  IF (NEW.quest = 'bless' AND nb < 1)
    OR (NEW.quest = 'build' AND np < 1)
    OR (NEW.quest = 'sign' AND reach > 0 AND NOT EXISTS (SELECT 1 FROM signposts WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'meet' AND NOT EXISTS (SELECT 1 FROM encounters WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'gift' AND ng < least(1, reach))
    OR (NEW.quest = 'road' AND nr < least(1, reach))
    OR (NEW.quest = 'bless7' AND nb < 3)
    OR (NEW.quest = 'buy3' AND np < 3)
    OR (NEW.quest = 'gifts5' AND ng < least(1, reach) * 3)
    OR (NEW.quest = 'roads2' AND nr < least(2, reach))
    OR (NEW.quest = 'buy6' AND (np < 6 OR NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item IN ('bigstore','stonemason','smokehouse'))))
    OR (NEW.quest = 'metro' AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item IN ('millrow','hammerworks','saltquay'))) THEN
    RAISE EXCEPTION 'quest not done';
  END IF;
  -- lonely towns skip neighbour quests without pay: no free money for work nobody did
  NEW.reward := CASE WHEN reach = 0 AND NEW.quest IN ('sign','gift','road','gifts5','roads2') THEN 0 ELSE rewards[i] END;
  NEW.created_at := now();
  RETURN NEW;
END $function$;