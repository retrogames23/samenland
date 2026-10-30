CREATE OR REPLACE FUNCTION public.village_weddings(_seed uuid, _at timestamptz)
RETURNS TABLE(n integer, dowry integer, last_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE created timestamptz; uid uuid; t timestamptz; h double precision; raw integer; st integer; f integer; hl integer;
  r double precision; p integer; w integer; days double precision; cut double precision; gap integer;
BEGIN
  n := 0; dowry := 0; last_at := NULL;
  SELECT date_trunc('milliseconds', s.created_at), s.user_id INTO created, uid FROM public.seeds s WHERE s.id = _seed;
  IF created IS NULL THEN RETURN NEXT; RETURN; END IF;
  t := created + interval '2 days';
  WHILE t <= _at LOOP
    h := greatest(0, extract(epoch FROM (t - created)) / 3600);
    raw := CASE WHEN h>=8760 THEN 5 WHEN h>=4380 THEN 4 WHEN h>=2160 THEN 3 WHEN h>=168 THEN 2 WHEN h>=24 THEN 1 ELSE 0 END;
    SELECT count(DISTINCT item) FILTER (WHERE item IN ('fisher','hunter','granary','dairy')),
           count(DISTINCT item) FILTER (WHERE item IN ('herbs','healer'))
      INTO f, hl FROM public.purchases WHERE seed_id = _seed AND created_at <= t;
    IF uid IS NULL THEN st := raw; ELSE
      st := 2;
      IF f >= 1 THEN st := 3; IF f >= 2 AND hl >= 1 THEN st := 4; IF f >= 3 AND hl >= 2 THEN st := 5; END IF; END IF; END IF;
      st := least(raw, st);
    END IF;
    r := 1.6 + 0.18*sqrt(h) + 3*ln(1 + h/60);
    p := floor(3 + 0.9*power(r, 1.6))::integer;
    IF st < 5 THEN p := least(p, CASE WHEN st = 4 THEN 260 WHEN st = 3 THEN 150 ELSE 84 END); END IF;
    w := public.village_civic_wealth(_seed, t);
    n := n + 1; dowry := dowry + floor(20 + w*0.6)::integer; last_at := t;
    days := least(20, greatest(2, 9*sqrt(40.0 / greatest(10, p))));
    cut := (1 - 0.25*least(1, greatest(0, (w - 40) / 40.0))) * (1 - 0.04*f);
    gap := greatest(1, floor(24*days*cut + 0.5)::integer);
    t := t + make_interval(hours => gap);
  END LOOP;
  RETURN NEXT;
END $$;

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer; rf integer; vv integer; dw integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO rf FROM public.referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO vv FROM public.village_visits WHERE visitor_seed = _seed;
  SELECT coalesce(w.dowry,0) INTO dw FROM public.village_weddings(_seed, now()) w;
  RETURN 150 + public.village_estate_tax(_seed, now()) + coalesce(dw,0) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw + gi + qr + mk + rf + vv - public.village_raids(_seed, created, now());
END $function$;

CREATE OR REPLACE FUNCTION public.encounter_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE price integer; age_h double precision; gap_h double precision; last_at timestamptz; wed_at timestamptz;
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
  IF NEW.event = 'wedding' THEN
    -- only during a real wedding (village_weddings calendar; 3 h window), answered once
    SELECT w.last_at INTO wed_at FROM public.village_weddings(NEW.seed_id, now()) w;
    IF wed_at IS NULL OR now() - wed_at >= interval '3 hours' THEN RAISE EXCEPTION 'no wedding'; END IF;
    IF EXISTS (SELECT 1 FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event = 'wedding' AND e.created_at >= wed_at) THEN
      RAISE EXCEPTION 'already decided'; END IF;
  ELSE
    gap_h := CASE WHEN age_h < 48 THEN 2.5 WHEN age_h < 336 THEN 4 ELSE 6 END;
    SELECT max(e.created_at) INTO last_at FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event <> 'wedding';
    IF last_at IS NOT NULL AND now() - last_at < make_interval(secs => gap_h * 3600 - 120) THEN
      RAISE EXCEPTION 'too soon'; END IF;
  END IF;
  IF price > 0 AND public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;

COMMENT ON FUNCTION public.village_dowry(timestamptz, timestamptz) IS 'DEPRECATED: replaced by village_weddings';