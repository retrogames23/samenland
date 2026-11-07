CREATE OR REPLACE FUNCTION public.encounter_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE price integer; age_h double precision; gap_h double precision; last_at timestamptz; wed_at timestamptz; last_commons timestamptz; w0 timestamptz; w1 timestamptz;
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
    WHEN 'hutewald:mast' THEN 0 WHEN 'hutewald:wild' THEN 0
    WHEN 'backtag:bake' THEN 10 WHEN 'backtag:home' THEN 0
    WHEN 'steg:together' THEN 0 WHEN 'steg:carpenter' THEN 40
    -- village life around 1500 (src/game/commons.ts, same weekly slot as the commons)
    WHEN 'zaun:buss' THEN 0 WHEN 'zaun:holz' THEN 10 WHEN 'zaun:pfand' THEN 0
    WHEN 'flur:schau' THEN 0 WHEN 'flur:hilfe' THEN 8
    WHEN 'plaggen:mass' THEN 0 WHEN 'plaggen:laub' THEN 0
    WHEN 'schelte:widerruf' THEN 0 WHEN 'schelte:spende' THEN 0
    WHEN 'scharwerk:aufgebot' THEN 0 WHEN 'scharwerk:dingen' THEN 25
    WHEN 'pfingsten:preis' THEN 12 WHEN 'pfingsten:reigen' THEN 0
    WHEN 'lichtstube:reigen' THEN 0 WHEN 'lichtstube:andacht' THEN 0
    WHEN 'besthaupt:loesen' THEN 20 WHEN 'besthaupt:bitte' THEN 0 WHEN 'besthaupt:geben' THEN 0
    WHEN 'schwarm:teilen' THEN 0 WHEN 'schwarm:korb' THEN 0 WHEN 'schwarm:pfarrer' THEN 0
    WHEN 'funken:kalt' THEN 0 WHEN 'funken:helfer' THEN 0 WHEN 'funken:lehm' THEN 8
    WHEN 'rotte:kuhle' THEN 0 WHEN 'rotte:unten' THEN 0 WHEN 'rotte:bier' THEN 6
    WHEN 'wolfspur:treib' THEN 0 WHEN 'wolfspur:stall' THEN 0 WHEN 'wolfspur:fallen' THEN 10
    WHEN 'frevel:pflanz' THEN 0 WHEN 'frevel:pfand' THEN 0 WHEN 'frevel:warn' THEN 0
    WHEN 'miete:arbeit' THEN 0 WHEN 'miete:korn' THEN 10 WHEN 'miete:stein' THEN 0
    -- town life from Kleinstadt (src/game/commons.ts CITY); negative = income for the town chest
    WHEN 'brot:busse' THEN -10 WHEN 'brot:spital' THEN 0
    WHEN 'stoerer:zunft' THEN 0 WHEN 'stoerer:dulden' THEN -10
    WHEN 'bier:zoll' THEN 0 WHEN 'bier:frei' THEN -10
    WHEN 'torschluss:zu' THEN 0 WHEN 'torschluss:nachzoll' THEN -8
    WHEN 'wache:pflicht' THEN 0 WHEN 'wache:loskauf' THEN -15
    WHEN 'kaper:geleit' THEN 60 WHEN 'kaper:selbst' THEN 0
    WHEN 'gast:streng' THEN 0 WHEN 'gast:frei' THEN 0
    WHEN 'hansetag:gefolge' THEN 80 WHEN 'hansetag:vollmacht' THEN 15
    WHEN 'strand:berge' THEN 0 WHEN 'strand:fischer' THEN 0
    WHEN 'seuche:absondern' THEN 30 WHEN 'seuche:offen' THEN 0
    -- historical news 1500/1501 (src/game/encounters.ts HISTORY)
    WHEN 'werber:fodder' THEN 30 WHEN 'werber:quarter' THEN 0
    WHEN 'weser:carts' THEN 0 WHEN 'weser:ransom' THEN 40
    WHEN 'sund:buy' THEN 45 WHEN 'sund:shelter' THEN 15 WHEN 'sund:pass' THEN 0
    WHEN 'ablass:give' THEN 25 WHEN 'ablass:sermon' THEN 0
    ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown encounter'; END IF;
  IF NEW.event = 'backtag' AND NEW.choice = 'bake' AND EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = NEW.seed_id AND p.item = 'backhaus') THEN price := 0; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT extract(epoch FROM now() - s.created_at) / 3600 INTO age_h FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF age_h IS NULL OR age_h < 0.05 THEN RAISE EXCEPTION 'too young'; END IF;
  IF NEW.event = 'wedding' THEN
    SELECT w.last_at INTO wed_at FROM public.village_weddings(NEW.seed_id, now()) w;
    IF wed_at IS NULL OR now() - wed_at >= interval '3 hours' THEN RAISE EXCEPTION 'no wedding'; END IF;
    IF EXISTS (SELECT 1 FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event = 'wedding' AND e.created_at >= wed_at) THEN
      RAISE EXCEPTION 'already decided'; END IF;
  ELSE
    gap_h := CASE WHEN age_h < 48 THEN 2.5 WHEN age_h < 336 THEN 4 ELSE 6 END;
    SELECT max(e.created_at) INTO last_at FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event <> 'wedding';
    IF last_at IS NOT NULL AND now() - last_at < make_interval(secs => gap_h * 3600 - 120) THEN
      RAISE EXCEPTION 'too soon'; END IF;
    IF NEW.event IN ('hutewald','backtag','steg','zaun','flur','plaggen','schelte','scharwerk','pfingsten','lichtstube','besthaupt','schwarm','funken','rotte','wolfspur','frevel','miete','brot','stoerer','bier','torschluss','wache','kaper','gast','hansetag','strand','seuche') THEN
      IF age_h < 72 THEN RAISE EXCEPTION 'too young'; END IF;
      SELECT max(e.created_at) INTO last_commons FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event IN ('hutewald','backtag','steg','zaun','flur','plaggen','schelte','scharwerk','pfingsten','lichtstube','besthaupt','schwarm','funken','rotte','wolfspur','frevel','miete','brot','stoerer','bier','torschluss','wache','kaper','gast','hansetag','strand','seuche');
      IF last_commons IS NOT NULL AND now() - last_commons < interval '7 days' THEN RAISE EXCEPTION 'too soon'; END IF;
      IF NEW.event = 'steg' AND EXISTS (SELECT 1 FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event = 'steg') THEN
        RAISE EXCEPTION 'already decided'; END IF;
    END IF;
    IF NEW.event IN ('werber','weser','sund','ablass') THEN
      w0 := CASE NEW.event WHEN 'werber' THEN '2026-11-06' WHEN 'weser' THEN '2027-05-25' WHEN 'sund' THEN '2027-08-01' ELSE '2027-11-15' END::timestamptz;
      w1 := CASE NEW.event WHEN 'werber' THEN '2027-03-01' WHEN 'weser' THEN '2027-10-01' WHEN 'sund' THEN '2027-11-01' ELSE '2028-02-01' END::timestamptz;
      IF now() < w0 - interval '10 minutes' OR now() >= w1 + interval '10 minutes' THEN RAISE EXCEPTION 'not now'; END IF;
      IF age_h < 24 THEN RAISE EXCEPTION 'too young'; END IF;
      IF EXISTS (SELECT 1 FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event = NEW.event) THEN RAISE EXCEPTION 'already decided'; END IF;
    END IF;
  END IF;
  IF price > 0 AND public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;