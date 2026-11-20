CREATE OR REPLACE FUNCTION public.purchase_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE price integer; need text; sx integer; sy integer; cpath text; prev text; created timestamptz; guildb text; nroads integer; mkey text; mstep integer; need_rank integer; vkey text; vn integer; vrank integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('purchase:' || NEW.seed_id::text));
  price := CASE NEW.item WHEN 'herbs' THEN 90 WHEN 'backhaus' THEN 260 WHEN 'herberge' THEN 420 WHEN 'beginen' THEN 900 WHEN 'badestube' THEN 700 WHEN 'hunter' THEN 100 WHEN 'fisher' THEN 140 WHEN 'woodcamp' THEN 240
    WHEN 'granary' THEN 300 WHEN 'healer' THEN 550 WHEN 'school' THEN 1200
    WHEN 'markethall' THEN 450 WHEN 'guildhall' THEN 450 WHEN 'library' THEN 380 WHEN 'dairy' THEN 350
    WHEN 'fireorder' THEN 400 WHEN 'firehouse' THEN 600 WHEN 'guard' THEN 750
    WHEN 'bigstore' THEN 380 WHEN 'stonemason' THEN 380 WHEN 'smokehouse' THEN 380
    WHEN 'millrow' THEN 700 WHEN 'hammerworks' THEN 700 WHEN 'saltquay' THEN 700
    WHEN 'belfry1' THEN 400 WHEN 'belfry2' THEN 500 WHEN 'belfry3' THEN 600 WHEN 'belfry4' THEN 700
    WHEN 'theater1' THEN 500 WHEN 'theater2' THEN 700 WHEN 'theater3' THEN 900
    WHEN 'cathedral1' THEN 800 WHEN 'cathedral2' THEN 1000 WHEN 'cathedral3' THEN 1200 WHEN 'cathedral4' THEN 1400 WHEN 'cathedral5' THEN 1600
    WHEN 'university1' THEN 700 WHEN 'university2' THEN 900 WHEN 'university3' THEN 1100 WHEN 'university4' THEN 1300
    WHEN 'exchange1' THEN 700 WHEN 'exchange2' THEN 900 WHEN 'exchange3' THEN 1100 WHEN 'exchange4' THEN 1300
    WHEN 'orangery1' THEN 500 WHEN 'orangery2' THEN 700 WHEN 'orangery3' THEN 900
    WHEN 'opera1' THEN 1200 WHEN 'opera2' THEN 1500 WHEN 'opera3' THEN 1800 WHEN 'opera4' THEN 2100
    WHEN 'harvest1' THEN 450 WHEN 'harvest2' THEN 600 WHEN 'harvest3' THEN 750
    WHEN 'guildtower1' THEN 450 WHEN 'guildtower2' THEN 600 WHEN 'guildtower3' THEN 750
    WHEN 'lighthouse1' THEN 450 WHEN 'lighthouse2' THEN 600 WHEN 'lighthouse3' THEN 750
    WHEN 'rank2' THEN 250 WHEN 'rank3' THEN 800
    WHEN 'title1' THEN 500 WHEN 'title2' THEN 1200 WHEN 'title3' THEN 2500 WHEN 'chest2' THEN 250 WHEN 'chest3' THEN 800 WHEN 'chest4' THEN 2000
    WHEN 'fountain1' THEN 4000 WHEN 'fountain2' THEN 8000 WHEN 'fountain3' THEN 12000 ELSE NULL END;
  -- Freimarkt: repeatable extra market day, numbered rows freimarkt1, 2, ... (unique index blocks double payment)
  IF NEW.item ~ '^freimarkt[1-9][0-9]*$' THEN
    price := 150;
    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF substring(NEW.item from 10)::integer <> 1 + (SELECT count(*) FROM purchases WHERE seed_id = NEW.seed_id AND item ~ '^freimarkt[0-9]+$') THEN RAISE EXCEPTION 'previous step open'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item ~ '^freimarkt[0-9]+$' AND created_at > now() - interval '7 days') THEN RAISE EXCEPTION 'market too soon'; END IF;
  END IF;
  -- Gemeindevorhaben (src/game/vorhaben.ts): numbered repeatable works, price by certified rank
  IF NEW.item ~ '^(bauhuette|armen|fest|pflaster)[1-9][0-9]*$' THEN
    vkey := substring(NEW.item from '^([a-z]+)');
    vn := substring(NEW.item from '([0-9]+)$')::integer;
    SELECT max(rc.rank) INTO vrank FROM public.rank_certificates rc WHERE rc.seed_id = NEW.seed_id AND rc.certified_at > now() - interval '15 minutes';
    vrank := least(5, greatest(0, coalesce(vrank, 0)));
    price := CASE vkey WHEN 'bauhuette' THEN (ARRAY[0,60,120,250,450,700])[vrank + 1]
      WHEN 'armen' THEN (ARRAY[0,40,80,160,300,450])[vrank + 1]
      WHEN 'fest' THEN (ARRAY[0,0,0,500,900,1400])[vrank + 1]
      ELSE (ARRAY[0,0,300,300,300,300])[vrank + 1] END;
    IF price = 0 THEN RAISE EXCEPTION 'rank too low'; END IF;
    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF vn <> 1 + (SELECT count(*) FROM purchases WHERE seed_id = NEW.seed_id AND item ~ ('^' || vkey || '[0-9]+$')) THEN RAISE EXCEPTION 'previous step open'; END IF;
    IF vkey <> 'pflaster' AND EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item ~ ('^' || vkey || '[0-9]+$')
      AND created_at > now() - (CASE vkey WHEN 'bauhuette' THEN interval '3 days' WHEN 'armen' THEN interval '7 days' ELSE interval '14 days' END)) THEN RAISE EXCEPTION 'too soon'; END IF;
    IF vkey = 'pflaster' THEN
      SELECT count(DISTINCT CASE WHEN r.seed_id = NEW.seed_id THEN r.target_id ELSE r.seed_id END) INTO nroads
        FROM public.first_roads r WHERE (r.seed_id = NEW.seed_id OR r.target_id = NEW.seed_id) AND public.road_done(r.seed_id, r.target_id) <= now();
      IF vn > nroads THEN RAISE EXCEPTION 'no road to pave'; END IF;
    END IF;
  END IF;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  need := CASE NEW.item WHEN 'markethall' THEN 'trade' WHEN 'guildhall' THEN 'craft' WHEN 'library' THEN 'culture' WHEN 'dairy' THEN 'farm' ELSE NULL END;
  mkey := substring(NEW.item from '^(belfry|theater|cathedral|university|exchange|orangery|opera|harvest|guildtower|lighthouse)[0-9]$');
  IF mkey IS NOT NULL THEN
    mstep := substring(NEW.item from '([0-9])$')::integer;
    IF mstep > 1 THEN prev := mkey || (mstep - 1)::text; END IF;
    IF mstep = 1 AND NEW.x IS NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF mstep > 1 AND NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF mkey IN ('harvest','guildtower','lighthouse') AND EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item ~ '^(harvest|guildtower|lighthouse)[0-9]$' AND item NOT LIKE mkey || '%') THEN RAISE EXCEPTION 'wrong way'; END IF;
  END IF;
  IF (mkey IS NOT NULL OR NEW.item LIKE 'rank%' OR NEW.item LIKE 'title%') AND EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'step already paid'; END IF;
  IF prev IS NOT NULL AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = prev) THEN RAISE EXCEPTION 'previous step open'; END IF;
  IF NEW.item IN ('fountain1','fountain2','fountain3') THEN
    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'step already paid'; END IF;
    IF NEW.item <> 'fountain1' AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = CASE NEW.item WHEN 'fountain2' THEN 'fountain1' ELSE 'fountain2' END) THEN RAISE EXCEPTION 'previous step open'; END IF;
  END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.x, s.y, s.created_at INTO sx, sy, created FROM public.seeds s WHERE s.id = NEW.seed_id;
  SELECT c.path INTO cpath FROM public.charters c WHERE c.seed_id = NEW.seed_id;
  IF NEW.item IN ('bigstore','millrow','stonemason','hammerworks','smokehouse','saltquay') THEN
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'already built'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id
      AND item IN ('bigstore','millrow','stonemason','hammerworks','smokehouse','saltquay')
      AND (CASE WHEN item IN ('bigstore','millrow') THEN 'g' WHEN item IN ('stonemason','hammerworks') THEN 'w' ELSE 'c' END)
       <> (CASE WHEN NEW.item IN ('bigstore','millrow') THEN 'g' WHEN NEW.item IN ('stonemason','hammerworks') THEN 'w' ELSE 'c' END)) THEN RAISE EXCEPTION 'wrong way'; END IF;
  END IF;
  IF NEW.item = 'fireorder' THEN
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'fireorder') THEN RAISE EXCEPTION 'already built'; END IF;
  END IF;
  IF NEW.item IN ('backhaus','herberge','beginen','badestube') THEN
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'already built'; END IF;
  END IF;
  IF need IS NOT NULL AND cpath IS DISTINCT FROM need THEN RAISE EXCEPTION 'wrong charter'; END IF;
  IF NEW.item IN ('rank2', 'rank3') THEN
    IF cpath IS NULL THEN RAISE EXCEPTION 'no charter'; END IF;
    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    guildb := CASE cpath WHEN 'trade' THEN 'markethall' WHEN 'craft' THEN 'guildhall' WHEN 'culture' THEN 'library' ELSE 'dairy' END;
    IF NEW.item = 'rank2' THEN
      IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = guildb) THEN RAISE EXCEPTION 'guild building missing'; END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'rank2') THEN RAISE EXCEPTION 'previous step open'; END IF;
      IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'belfry4') THEN RAISE EXCEPTION 'belfry missing'; END IF;
      SELECT count(DISTINCT CASE WHEN r.seed_id = NEW.seed_id THEN r.target_id ELSE r.seed_id END) INTO nroads
        FROM public.first_roads r WHERE (r.seed_id = NEW.seed_id OR r.target_id = NEW.seed_id) AND public.road_done(r.seed_id, r.target_id) <= now();
      IF nroads + least(2, coalesce((SELECT rc.ways FROM public.rank_certificates rc WHERE rc.seed_id = NEW.seed_id AND rc.certified_at > now() - interval '15 minutes'), 0)) < 2 THEN RAISE EXCEPTION 'roads missing'; END IF;
    END IF;
  END IF;
  IF NEW.item IN ('title1', 'title2', 'title3') THEN
    IF cpath IS NULL THEN RAISE EXCEPTION 'no charter'; END IF;
    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = CASE NEW.item WHEN 'title1' THEN 'rank2' ELSE 'rank3' END) THEN RAISE EXCEPTION 'rank missing'; END IF;
    IF NEW.item <> 'title1' AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = CASE NEW.item WHEN 'title2' THEN 'title1' ELSE 'title2' END) THEN RAISE EXCEPTION 'previous step open'; END IF;
  END IF;
  IF NEW.item IN ('chest2','chest3','chest4') THEN
    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = NEW.item) THEN RAISE EXCEPTION 'step already paid'; END IF;
    IF NEW.item <> 'chest2' AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = CASE NEW.item WHEN 'chest3' THEN 'chest2' ELSE 'chest3' END) THEN RAISE EXCEPTION 'previous step open'; END IF;
  END IF;
  need_rank := CASE NEW.item WHEN 'backhaus' THEN 1 WHEN 'herberge' THEN 1 WHEN 'woodcamp' THEN 1 WHEN 'granary' THEN 1 WHEN 'healer' THEN 1
    WHEN 'bigstore' THEN 1 WHEN 'stonemason' THEN 1 WHEN 'smokehouse' THEN 1 WHEN 'beginen' THEN 2
    WHEN 'school' THEN 3 WHEN 'badestube' THEN 2 WHEN 'fireorder' THEN 2 WHEN 'firehouse' THEN 3 WHEN 'millrow' THEN 3 WHEN 'hammerworks' THEN 3 WHEN 'saltquay' THEN 3 WHEN 'guard' THEN 4 WHEN 'title1' THEN 3 WHEN 'title2' THEN 4 WHEN 'title3' THEN 5
    WHEN 'rank2' THEN 2 WHEN 'rank3' THEN 4 WHEN 'chest2' THEN 2 WHEN 'chest3' THEN 3 WHEN 'chest4' THEN 4 WHEN 'fountain1' THEN 4 ELSE 0 END;
  IF NEW.item ~ '^freimarkt[1-9][0-9]*$' THEN need_rank := 2; END IF;
  IF vkey IS NOT NULL THEN need_rank := CASE vkey WHEN 'fest' THEN 3 WHEN 'pflaster' THEN 2 ELSE 1 END; END IF;
  IF mkey IS NOT NULL AND mstep = 1 THEN
    need_rank := CASE mkey WHEN 'cathedral' THEN 4 WHEN 'university' THEN 4 WHEN 'exchange' THEN 4 WHEN 'orangery' THEN 4 WHEN 'opera' THEN 5 ELSE 3 END;
  END IF;
  IF need_rank > 0 AND NOT EXISTS (SELECT 1 FROM public.rank_certificates rc WHERE rc.seed_id = NEW.seed_id AND rc.rank >= need_rank AND rc.certified_at > now() - interval '15 minutes') THEN RAISE EXCEPTION 'rank too low'; END IF;
  IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION 'bad position'; END IF;
  IF NEW.x IS NOT NULL AND sqrt(power(NEW.x - sx, 2) + power(NEW.y - sy, 2)) > 60 THEN RAISE EXCEPTION 'too far'; END IF;
  IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;