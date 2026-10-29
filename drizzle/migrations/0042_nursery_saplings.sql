CREATE OR REPLACE FUNCTION public.encounter_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE price integer; age_h double precision; gap_h double precision; last_at timestamptz;
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
    WHEN 'nursery:cherry' THEN 40 WHEN 'nursery:quince' THEN 35 WHEN 'nursery:pass' THEN 0
    WHEN 'maypole:pole' THEN 20 WHEN 'maypole:games' THEN 0
    ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown encounter'; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT extract(epoch FROM now() - s.created_at) / 3600 INTO age_h FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF age_h IS NULL OR age_h < 0.05 THEN RAISE EXCEPTION 'too young'; END IF;
  gap_h := CASE WHEN age_h < 48 THEN 2.5 WHEN age_h < 336 THEN 4 ELSE 6 END;
  SELECT max(e.created_at) INTO last_at FROM public.encounters e WHERE e.seed_id = NEW.seed_id;
  IF last_at IS NOT NULL AND now() - last_at < make_interval(secs => gap_h * 3600 - 120) THEN
    RAISE EXCEPTION 'too soon'; END IF;
  IF price > 0 AND public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;

-- rare saplings: one planting per nurseryman decision (mirrors saplingsOwed in src/game/encounters.ts)
CREATE OR REPLACE FUNCTION public.sapling_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE bought integer; planted integer;
BEGIN
  IF NEW.kind NOT IN ('cherry', 'quince') THEN RETURN NEW; END IF;
  NEW.created_at := now();
  SELECT count(*) INTO bought FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event = 'nursery' AND e.choice = NEW.kind;
  SELECT count(*) INTO planted FROM public.plantings p WHERE p.seed_id = NEW.seed_id AND p.kind = NEW.kind;
  IF planted >= bought THEN RAISE EXCEPTION 'no sapling'; END IF;
  IF EXISTS (SELECT 1 FROM public.plantings p WHERE p.x = NEW.x AND p.y = NEW.y) THEN RAISE EXCEPTION 'occupied'; END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS sapling_guard ON public.plantings;
CREATE TRIGGER sapling_guard BEFORE INSERT ON public.plantings FOR EACH ROW EXECUTE FUNCTION public.sapling_guard();