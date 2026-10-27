CREATE OR REPLACE FUNCTION public.encounter_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE price integer;
BEGIN
  price := CASE NEW.event || ':' || NEW.choice
    WHEN 'journeyman:host' THEN 30 WHEN 'journeyman:settle' THEN 80 WHEN 'journeyman:pass' THEN 0
    WHEN 'merchant:market' THEN 50 WHEN 'merchant:inn' THEN 20 WHEN 'merchant:pass' THEN 0
    WHEN 'boundary:common' THEN 0 WHEN 'boundary:award' THEN -20 WHEN 'boundary:tavern' THEN 10
    WHEN 'ruin:shrine' THEN 60 WHEN 'ruin:stones' THEN 0
    WHEN 'harvest:feast' THEN 40 WHEN 'harvest:store' THEN 0
    WHEN 'healer:invite' THEN 35 WHEN 'healer:pass' THEN 0
    WHEN 'minstrel:play' THEN 15 WHEN 'minstrel:pass' THEN 0
    WHEN 'widow:shelter' THEN 40 WHEN 'widow:alms' THEN 10 WHEN 'widow:pass' THEN 0
    WHEN 'monk:teach' THEN 25 WHEN 'monk:copy' THEN 45 WHEN 'monk:pass' THEN 0
    WHEN 'storm:repair' THEN 30 WHEN 'storm:together' THEN 0
    WHEN 'wolf:fence' THEN 35 WHEN 'wolf:hunter' THEN 20 WHEN 'wolf:wait' THEN 0
    WHEN 'wedding:gift' THEN 25 WHEN 'wedding:feast' THEN 60 WHEN 'wedding:congrat' THEN 0
    WHEN 'bees:hive' THEN 15 WHEN 'bees:leave' THEN 0
    WHEN 'surveyor:guide' THEN 0 WHEN 'surveyor:map' THEN 40
    WHEN 'pilgrims:lodge' THEN 30 WHEN 'pilgrims:water' THEN 0
    WHEN 'orphan:adopt' THEN 20 WHEN 'orphan:apprentice' THEN 0
    WHEN 'tinker:mend' THEN 15 WHEN 'tinker:scrap' THEN -15 WHEN 'tinker:pass' THEN 0
    WHEN 'well:dig' THEN 50 WHEN 'well:dowser' THEN 15
    WHEN 'fair:stall' THEN 40 WHEN 'fair:visit' THEN 10 WHEN 'fair:stay' THEN 0
    WHEN 'cow:show' THEN 10 WHEN 'cow:sell' THEN -30 WHEN 'cow:keep' THEN 0
    WHEN 'painter:portrait' THEN 45 WHEN 'painter:sign' THEN 15 WHEN 'painter:pass' THEN 0
    WHEN 'flood:dam' THEN 40 WHEN 'flood:meadow' THEN 0
    WHEN 'tithe:pay' THEN 25 WHEN 'tithe:bargain' THEN 10 WHEN 'tithe:plead' THEN 0
    WHEN 'maypole:pole' THEN 20 WHEN 'maypole:games' THEN 0
    ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown encounter'; END IF;
  NEW.cost := price; NEW.created_at := now();
  IF EXISTS (SELECT 1 FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND (e.created_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date) THEN
    RAISE EXCEPTION 'already decided today'; END IF;
  IF price > 0 AND public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;