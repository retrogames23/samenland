-- M1 Paket 2b (Phase 1.4g): Ratsbuch backend. Requests for the six growth visitors (journeyman, orphan, widow, monk,
-- ruin, surveyor) come once per village and UTC day, at most 4 open, none while 6 growth boons are active; they are
-- created lazily and idempotently by ratsbuch_refresh (no cron). An accepted request is an ordinary encounters row with
-- request_id: same price, same boonHours, but outside the visitor gap and lottery. encounter_guard additionally enforces,
-- from ratsbuch_since() on: the shared limit of 6 active growth boons (active_boons, 0140) for every growth answer,
-- growth answers of the six visitors only via the Ratsbuch (24 h grace for windows opened before the cut-over), and
-- open, own, matching requests. ratsbuch_since() lies in the far future (2100-01-04): nothing changes until Paket 4 sets
-- the real date. Prices, gap, windows and all other checks are copied unchanged from 0139; existing rows stay untouched.
CREATE OR REPLACE FUNCTION public.ratsbuch_since()
 RETURNS timestamptz LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT '2100-01-04 00:00:00+00'::timestamptz $function$;

CREATE TABLE IF NOT EXISTS public.ratsbuch_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  day date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('journeyman','orphan','widow','monk','ruin','surveyor')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  UNIQUE (seed_id, day)
);
CREATE INDEX IF NOT EXISTS ratsbuch_requests_open ON public.ratsbuch_requests (seed_id) WHERE status = 'open';
ALTER TABLE public.ratsbuch_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their requests" ON public.ratsbuch_requests;
CREATE POLICY "Owners read their requests" ON public.ratsbuch_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = ratsbuch_requests.seed_id AND s.user_id = auth.uid()));
REVOKE ALL ON public.ratsbuch_requests FROM anon, authenticated;
GRANT SELECT ON public.ratsbuch_requests TO authenticated;
GRANT ALL ON public.ratsbuch_requests TO service_role;

-- the last UTC day ratsbuch_refresh has processed per village: a day skipped because the book was full stays skipped
CREATE TABLE IF NOT EXISTS public.ratsbuch_state (
  seed_id uuid PRIMARY KEY REFERENCES public.seeds(id) ON DELETE CASCADE,
  through_day date NOT NULL
);
ALTER TABLE public.ratsbuch_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ratsbuch_state FROM anon, authenticated;
GRANT ALL ON public.ratsbuch_state TO service_role;

ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.ratsbuch_requests(id);
CREATE UNIQUE INDEX IF NOT EXISTS encounters_request_id_key ON public.encounters (request_id) WHERE request_id IS NOT NULL;

-- which of the six visitors asks on a day: weighted like EVENT_WEIGHT (12/10/7/7/3/3), the surveyor only from 7 days on
CREATE OR REPLACE FUNCTION public.ratsbuch_kind(_seed uuid, _day date, _age_h double precision)
 RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public'
AS $function$
DECLARE r double precision; total integer;
BEGIN
  total := CASE WHEN _age_h >= 168 THEN 42 ELSE 39 END;
  r := ('x' || substr(md5(_seed::text || ':ratsbuch:' || _day::text), 1, 8))::bit(32)::bigint / 4294967296.0 * total;
  r := r - 12; IF r < 0 THEN RETURN 'journeyman'; END IF;
  r := r - 10; IF r < 0 THEN RETURN 'orphan'; END IF;
  r := r - 7; IF r < 0 THEN RETURN 'widow'; END IF;
  r := r - 7; IF r < 0 THEN RETURN 'monk'; END IF;
  r := r - 3; IF r < 0 OR total = 39 THEN RETURN 'ruin'; END IF;
  RETURN 'surveyor';
END $function$;
REVOKE ALL ON FUNCTION public.ratsbuch_kind(uuid, date, double precision) FROM PUBLIC, anon, authenticated;

-- lazy, idempotent refill up to _today: one request per UTC day, judged at that day's start (00:00 UTC), only while
-- fewer than 4 are open and fewer than 6 growth boons are active. Runs under the village lock (same row lock as
-- tax_spend_lock), so parallel calls never double a day; ten days at once equals ten daily calls.
CREATE OR REPLACE FUNCTION public.ratsbuch_refresh_at(_seed uuid, _today date)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; since timestamptz; thru date; d date; d0 timestamptz; open_n integer;
BEGIN
  SELECT s.created_at INTO c0 FROM public.seeds s WHERE s.id = _seed FOR UPDATE;
  IF c0 IS NULL THEN RETURN 0; END IF;
  SELECT count(*)::integer INTO open_n FROM public.ratsbuch_requests q WHERE q.seed_id = _seed AND q.status = 'open';
  since := public.ratsbuch_since();
  IF _today < (since AT TIME ZONE 'UTC')::date THEN RETURN open_n; END IF;
  SELECT st.through_day INTO thru FROM public.ratsbuch_state st WHERE st.seed_id = _seed;
  IF thru IS NOT NULL AND thru >= _today THEN RETURN open_n; END IF;
  d := greatest(thru + 1, (since AT TIME ZONE 'UTC')::date, (c0 AT TIME ZONE 'UTC')::date);
  WHILE d <= _today LOOP
    d0 := d::timestamp AT TIME ZONE 'UTC';
    IF open_n < 4 AND public.active_boons(_seed, d0) < 6 THEN
      INSERT INTO public.ratsbuch_requests (seed_id, day, kind, created_at)
        VALUES (_seed, d, public.ratsbuch_kind(_seed, d, extract(epoch FROM d0 - c0) / 3600), greatest(d0, c0))
        ON CONFLICT (seed_id, day) DO NOTHING;
      IF FOUND THEN open_n := open_n + 1; END IF;
    END IF;
    d := d + 1;
  END LOOP;
  INSERT INTO public.ratsbuch_state (seed_id, through_day) VALUES (_seed, _today)
    ON CONFLICT (seed_id) DO UPDATE SET through_day = greatest(public.ratsbuch_state.through_day, EXCLUDED.through_day);
  RETURN open_n;
END $function$;
CREATE OR REPLACE FUNCTION public.ratsbuch_refresh(_seed uuid)
 RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT public.ratsbuch_refresh_at(_seed, (now() AT TIME ZONE 'UTC')::date) $function$;

-- declining is free and frees the place; the next request still comes only with the next day
CREATE OR REPLACE FUNCTION public.ratsbuch_decline(_seed uuid, _request uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.ratsbuch_refresh(_seed);
  UPDATE public.ratsbuch_requests SET status = 'declined', closed_at = now()
    WHERE id = _request AND seed_id = _seed AND status = 'open';
  RETURN FOUND;
END $function$;
REVOKE ALL ON FUNCTION public.ratsbuch_refresh_at(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ratsbuch_refresh(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ratsbuch_decline(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ratsbuch_refresh_at(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.ratsbuch_refresh(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ratsbuch_decline(uuid, uuid) TO service_role;

-- an accepted request is closed in the same statement as its encounters row (rolled back together)
CREATE OR REPLACE FUNCTION public.ratsbuch_close()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.request_id IS NOT NULL THEN
    UPDATE public.ratsbuch_requests SET status = 'accepted', closed_at = NEW.created_at WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS ratsbuch_close ON public.encounters;
CREATE TRIGGER ratsbuch_close AFTER INSERT ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.ratsbuch_close();

CREATE OR REPLACE FUNCTION public.encounter_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE price integer; age_h double precision; gap_h double precision; last_at timestamptz; wed_at timestamptz; last_commons timestamptz; w0 timestamptz; w1 timestamptz; need_rank integer;
  since timestamptz; c0 timestamptz; boon boolean; req record;
BEGIN
  -- M1 Paket 1b: only the trusted server books answers (decideEncounter recomputes the open encounter)
  IF coalesce(auth.role(), '') <> 'service_role' THEN RAISE EXCEPTION 'server only'; END IF;
  price := CASE NEW.event || ':' || NEW.choice
    WHEN 'journeyman:host' THEN 30 WHEN 'journeyman:settle' THEN 80 WHEN 'journeyman:pass' THEN 0
    WHEN 'merchant:market' THEN 0 WHEN 'merchant:inn' THEN 0 WHEN 'merchant:pass' THEN 0
    WHEN 'boundary:common' THEN 0 WHEN 'boundary:award' THEN -20 WHEN 'boundary:tavern' THEN 0
    WHEN 'ruin:shrine' THEN 60 WHEN 'ruin:stones' THEN 0
    WHEN 'harvest:feast' THEN 0 WHEN 'harvest:store' THEN 0
    WHEN 'healer:invite' THEN 0 WHEN 'healer:pass' THEN 0
    WHEN 'minstrel:play' THEN 0 WHEN 'minstrel:pass' THEN 0
    WHEN 'widow:shelter' THEN 40 WHEN 'widow:alms' THEN 0 WHEN 'widow:pass' THEN 0
    WHEN 'monk:teach' THEN 0 WHEN 'monk:copy' THEN 45 WHEN 'monk:pass' THEN 0
    WHEN 'storm:repair' THEN 0 WHEN 'storm:together' THEN 0
    WHEN 'wolf:fence' THEN 0 WHEN 'wolf:hunter' THEN 0 WHEN 'wolf:wait' THEN 0
    WHEN 'wedding:gift' THEN 0 WHEN 'wedding:feast' THEN 60 WHEN 'wedding:congrat' THEN 0
    WHEN 'bees:hive' THEN 0 WHEN 'bees:leave' THEN 0
    WHEN 'surveyor:guide' THEN 0 WHEN 'surveyor:map' THEN 40
    WHEN 'pilgrims:lodge' THEN 0 WHEN 'pilgrims:water' THEN 0
    WHEN 'orphan:adopt' THEN 20 WHEN 'orphan:apprentice' THEN 0
    WHEN 'tinker:mend' THEN 0 WHEN 'tinker:scrap' THEN -15 WHEN 'tinker:pass' THEN 0
    WHEN 'well:dig' THEN 0 WHEN 'well:dowser' THEN 0
    WHEN 'fair:stall' THEN 0 WHEN 'fair:visit' THEN 0 WHEN 'fair:stay' THEN 0
    WHEN 'cow:show' THEN 0 WHEN 'cow:sell' THEN -30 WHEN 'cow:keep' THEN 0
    WHEN 'painter:portrait' THEN 0 WHEN 'painter:sign' THEN 0 WHEN 'painter:pass' THEN 0
    WHEN 'flood:dam' THEN 0 WHEN 'flood:meadow' THEN 0
    WHEN 'tithe:pay' THEN 0 WHEN 'tithe:bargain' THEN 0 WHEN 'tithe:plead' THEN 0
    WHEN 'nursery:cherry' THEN 0 WHEN 'nursery:quince' THEN 0 WHEN 'nursery:pass' THEN 0
    WHEN 'maypole:pole' THEN 0 WHEN 'maypole:games' THEN 0
    WHEN 'hutewald:mast' THEN 0 WHEN 'hutewald:wild' THEN 0
    WHEN 'backtag:bake' THEN 0 WHEN 'backtag:home' THEN 0
    WHEN 'steg:together' THEN 0 WHEN 'steg:carpenter' THEN 0
    WHEN 'zaun:buss' THEN 0 WHEN 'zaun:holz' THEN 0 WHEN 'zaun:pfand' THEN 0
    WHEN 'flur:schau' THEN 0 WHEN 'flur:hilfe' THEN 0
    WHEN 'plaggen:mass' THEN 0 WHEN 'plaggen:laub' THEN 0
    WHEN 'schelte:widerruf' THEN 0 WHEN 'schelte:spende' THEN 0
    WHEN 'scharwerk:aufgebot' THEN 0 WHEN 'scharwerk:dingen' THEN 0
    WHEN 'pfingsten:preis' THEN 0 WHEN 'pfingsten:reigen' THEN 0
    WHEN 'lichtstube:reigen' THEN 0 WHEN 'lichtstube:andacht' THEN 0
    WHEN 'besthaupt:loesen' THEN 0 WHEN 'besthaupt:bitte' THEN 0 WHEN 'besthaupt:geben' THEN 0
    WHEN 'schwarm:teilen' THEN 0 WHEN 'schwarm:korb' THEN 0 WHEN 'schwarm:pfarrer' THEN 0
    WHEN 'funken:kalt' THEN 0 WHEN 'funken:helfer' THEN 0 WHEN 'funken:lehm' THEN 0
    WHEN 'rotte:kuhle' THEN 0 WHEN 'rotte:unten' THEN 0 WHEN 'rotte:bier' THEN 0
    WHEN 'wolfspur:treib' THEN 0 WHEN 'wolfspur:stall' THEN 0 WHEN 'wolfspur:fallen' THEN 0
    WHEN 'frevel:pflanz' THEN 0 WHEN 'frevel:pfand' THEN 0 WHEN 'frevel:warn' THEN 0
    WHEN 'miete:arbeit' THEN 0 WHEN 'miete:korn' THEN 0 WHEN 'miete:stein' THEN 0
    WHEN 'brot:busse' THEN -10 WHEN 'brot:spital' THEN 0
    WHEN 'stoerer:zunft' THEN 0 WHEN 'stoerer:dulden' THEN -10
    WHEN 'bier:zoll' THEN 0 WHEN 'bier:frei' THEN -10
    WHEN 'torschluss:zu' THEN 0 WHEN 'torschluss:nachzoll' THEN -8
    WHEN 'wache:pflicht' THEN 0 WHEN 'wache:loskauf' THEN -15
    WHEN 'kaper:geleit' THEN 0 WHEN 'kaper:selbst' THEN 0
    WHEN 'gast:streng' THEN 0 WHEN 'gast:frei' THEN 0
    WHEN 'hansetag:gefolge' THEN 0 WHEN 'hansetag:vollmacht' THEN 0
    WHEN 'strand:berge' THEN 0 WHEN 'strand:fischer' THEN 0
    WHEN 'seuche:absondern' THEN 0 WHEN 'seuche:offen' THEN 0
    WHEN 'werber:fodder' THEN 0 WHEN 'werber:quarter' THEN 0
    WHEN 'weser:carts' THEN 0 WHEN 'weser:ransom' THEN 0
    WHEN 'sund:buy' THEN 0 WHEN 'sund:shelter' THEN 0 WHEN 'sund:pass' THEN 0
    WHEN 'ablass:give' THEN 0 WHEN 'ablass:sermon' THEN 0
    ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown encounter'; END IF;
  IF NEW.event = 'backtag' AND NEW.choice = 'bake' AND EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = NEW.seed_id AND p.item = 'backhaus') THEN price := 0; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT extract(epoch FROM now() - s.created_at) / 3600, s.created_at INTO age_h, c0 FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF age_h IS NULL OR age_h < 0.05 THEN RAISE EXCEPTION 'too young'; END IF;
  since := public.ratsbuch_since();
  -- growth answers (boon_effects, 0140) share the limit of six active boons from the cut-over on
  boon := EXISTS (SELECT 1 FROM public.boon_effects b WHERE b.event = NEW.event AND b.choice = NEW.choice);
  IF NEW.request_id IS NOT NULL THEN
    -- M1 Paket 2b: a Ratsbuch request answered — own, open, matching kind; outside the visitor gap and lottery
    IF now() < since THEN RAISE EXCEPTION 'not now'; END IF;
    PERFORM public.ratsbuch_refresh(NEW.seed_id);
    SELECT q.status, q.kind INTO req FROM public.ratsbuch_requests q WHERE q.id = NEW.request_id AND q.seed_id = NEW.seed_id;
    IF NOT FOUND OR req.kind <> NEW.event THEN RAISE EXCEPTION 'unknown request'; END IF;
    IF req.status <> 'open' THEN RAISE EXCEPTION 'already decided'; END IF;
    -- only the growth answer of that visitor, or the orphan's free apprenticeship; every other answer is a decline
    IF NOT boon AND NOT (NEW.event = 'orphan' AND NEW.choice = 'apprentice') THEN RAISE EXCEPTION 'unknown encounter'; END IF;
  ELSIF NEW.event = 'wedding' THEN
    SELECT w.last_at INTO wed_at FROM public.village_weddings(NEW.seed_id, now()) w;
    IF wed_at IS NULL OR now() - wed_at >= interval '3 hours' THEN RAISE EXCEPTION 'no wedding'; END IF;
    IF EXISTS (SELECT 1 FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event = 'wedding' AND e.created_at >= wed_at) THEN
      RAISE EXCEPTION 'already decided'; END IF;
  ELSE
    gap_h := CASE WHEN age_h < 48 THEN 2.5 WHEN age_h < 336 THEN 4 ELSE 6 END;
    -- Ratsbuch rows never move the visitor rhythm (pendingEncounter ignores them as well)
    SELECT max(e.created_at) INTO last_at FROM public.encounters e WHERE e.seed_id = NEW.seed_id AND e.event <> 'wedding' AND e.request_id IS NULL;
    IF last_at IS NOT NULL AND now() - last_at < make_interval(secs => gap_h * 3600 - 120) THEN
      RAISE EXCEPTION 'too soon'; END IF;
    -- from the cut-over, growth answers of the six visitors come only via the Ratsbuch; a window opened before it
    -- keeps its old draw for 24 h (pendingEncounter: RATSBUCH_SINCE, RATSBUCH_GRACE)
    IF boon AND NEW.event IN ('journeyman','orphan','widow','monk','ruin','surveyor') AND now() >= since
       AND NOT (coalesce(last_at, c0) < since AND now() < since + interval '24 hours') THEN
      RAISE EXCEPTION 'ratsbuch only'; END IF;
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
  -- town-life questions need the settlement rank commonsOptions asks for (src/game/encounter-verify.ts EVENT_RANK),
  -- proven by a fresh certificate of the trusted server, exactly like rank-gated purchases
  need_rank := CASE WHEN NEW.event IN ('brot','stoerer','bier','torschluss','wache') THEN 3
    WHEN NEW.event IN ('gast','seuche','kaper','strand') THEN 4 WHEN NEW.event = 'hansetag' THEN 5 ELSE 0 END;
  IF need_rank > 0 AND NOT EXISTS (SELECT 1 FROM public.rank_certificates rc WHERE rc.seed_id = NEW.seed_id AND rc.rank >= need_rank AND rc.certified_at > now() - interval '15 minutes') THEN
    RAISE EXCEPTION 'rank too low'; END IF;
  -- M1 Paket 2b: at most six growth boons at once. Counted at clock_timestamp(), i.e. after the village lock was
  -- granted: a parallel booking that committed meanwhile is counted even though it is younger than this transaction.
  IF boon AND now() >= since AND public.active_boons(NEW.seed_id, clock_timestamp()) >= 6 THEN RAISE EXCEPTION 'boons full'; END IF;
  IF price > 0 AND public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $function$;
