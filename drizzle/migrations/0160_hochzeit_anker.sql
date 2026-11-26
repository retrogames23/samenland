-- Paket A2 – Anker-Fortsetzung (anchor continuation) for wedding receipts. Builds on 0159; changes no money function.
--
-- Finding (O1 release review, T15): later purchases of Gesellenherberge or Holzfällerlager and a later Handwerks-
-- Freibrief shorten monument build times in hindsight (world.ts buildWith checks no purchase date). Under the unified
-- rule (from wedding_switch_since) that moves weddings that are already booked. Decision A2: booked receipts are the
-- history and are never recomputed; the calendar continues from the last booked receipt.
--
--  1) wedding_receipts.next_at: the instant of the next wedding as the trusted server computed it when booking this
--     one. The anchor is simply the receipt with the highest index — one row carries the wedding and its anchor, so
--     both are stored together or not at all, and there is no second record that could contradict it. NULL only for
--     receipts booked before this migration (version 1; the legacy rule is stable and still compared in full).
--  2) wedding_receipts_guard (replaced) additionally, under a per-village transaction lock:
--       - refuses every receipt of a quarantined village,
--       - requires next_at on every version-2 receipt,
--       - requires the previous index to exist (the first receipt of a village is index 0; lab: its first receipt
--         from the switch) and, where the previous receipt has an anchor, occurred_at = previous next_at.
--     Version boundary, UPDATE refusal and the future check of 0159 stay unchanged and come first.
--  3) wedding_quarantine: villages whose receipts cannot be reconstructed or continued reliably (append-only record;
--     the settlement never repairs, re-books or invents a wedding). An active record blocks every receipt insert.
--     Released only by hand with a note (wedding_quarantine_release); never deleted while the village exists.
--  4) wedding_receipts_book(_seed, _rows): the one booking call of the trusted server. One transaction, per-village
--     lock; rows must form a chain; a row already stored identically is a no-op (repeat), a differing one is refused
--     (a parallel settlement was first). Nothing is half-written.
--  5) wedding_anchor_inventory(): read-only classification of every owned village for the release.
-- The money functions (village_wedding_list, village_balance_walk, village_weddings, encounter_guard) are unchanged.

-- 0) the per-village lock key shared by the guard, the booking call and the quarantine record
CREATE OR REPLACE FUNCTION public.wedding_lock_key(_seed uuid)
 RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT hashtextextended('wedding_receipts:' || _seed::text, 0) $$;
REVOKE ALL ON FUNCTION public.wedding_lock_key(uuid) FROM PUBLIC, anon, authenticated, service_role;

-- 1) the anchor
ALTER TABLE public.wedding_receipts ADD COLUMN IF NOT EXISTS next_at timestamptz;
ALTER TABLE public.wedding_receipts DROP CONSTRAINT IF EXISTS wedding_receipts_next_after;
ALTER TABLE public.wedding_receipts ADD CONSTRAINT wedding_receipts_next_after CHECK (next_at IS NULL OR next_at > occurred_at);

-- 3) quarantine (before the guard, which reads it)
CREATE TABLE IF NOT EXISTS public.wedding_quarantine (
  id bigserial PRIMARY KEY,
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('legacy_divergent', 'unanchored', 'chain_break', 'verify_failed')),
  indices integer[] NOT NULL DEFAULT '{}',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  release_note text,
  CONSTRAINT wedding_quarantine_release_noted CHECK ((released_at IS NULL) = (release_note IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS wedding_quarantine_active ON public.wedding_quarantine (seed_id) WHERE released_at IS NULL;
ALTER TABLE public.wedding_quarantine ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wedding_quarantine FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.wedding_quarantine TO service_role;
REVOKE ALL ON SEQUENCE public.wedding_quarantine_id_seq FROM PUBLIC, anon, authenticated, service_role;
COMMENT ON TABLE public.wedding_quarantine IS
  'Paket A2: villages whose wedding receipts cannot be reconstructed or continued reliably. Written only by wedding_quarantine_set; an active record (released_at IS NULL) blocks every wedding receipt. Released only by wedding_quarantine_release with a note; never deleted while the village exists.';

-- records cannot be rewritten; the only change is the one-time release; deleting only with the village (CASCADE)
CREATE OR REPLACE FUNCTION public.wedding_quarantine_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = OLD.seed_id) THEN RAISE EXCEPTION 'wedding quarantine records are kept'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.released_at IS NOT NULL OR NEW.released_at IS NULL
     OR (NEW.id, NEW.seed_id, NEW.reason, NEW.indices, NEW.details, NEW.detected_at)
        IS DISTINCT FROM (OLD.id, OLD.seed_id, OLD.reason, OLD.indices, OLD.details, OLD.detected_at) THEN
    RAISE EXCEPTION 'wedding quarantine records are immutable';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wedding_quarantine_guard() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS wedding_quarantine_guard ON public.wedding_quarantine;
CREATE TRIGGER wedding_quarantine_guard BEFORE UPDATE OR DELETE ON public.wedding_quarantine
  FOR EACH ROW EXECUTE FUNCTION public.wedding_quarantine_guard();

CREATE OR REPLACE FUNCTION public.wedding_quarantine_set(_seed uuid, _reason text, _indices integer[], _details jsonb)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE q bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(public.wedding_lock_key(_seed));
  SELECT id INTO q FROM public.wedding_quarantine WHERE seed_id = _seed AND released_at IS NULL;
  IF q IS NOT NULL THEN RETURN q; END IF; -- already quarantined: the first record stands
  INSERT INTO public.wedding_quarantine (seed_id, reason, indices, details)
    VALUES (_seed, _reason, coalesce(_indices, '{}'), coalesce(_details, '{}'::jsonb)) RETURNING id INTO q;
  RETURN q;
END $$;
REVOKE ALL ON FUNCTION public.wedding_quarantine_set(uuid, text, integer[], jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wedding_quarantine_set(uuid, text, integer[], jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.wedding_quarantine_release(_seed uuid, _note text)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE q bigint;
BEGIN
  IF _note IS NULL OR length(btrim(_note)) < 10 THEN RAISE EXCEPTION 'wedding quarantine release needs a note'; END IF;
  PERFORM pg_advisory_xact_lock(public.wedding_lock_key(_seed));
  UPDATE public.wedding_quarantine SET released_at = now(), release_note = _note
   WHERE seed_id = _seed AND released_at IS NULL RETURNING id INTO q;
  IF q IS NULL THEN RAISE EXCEPTION 'wedding quarantine not active'; END IF;
  RETURN q;
END $$;
REVOKE ALL ON FUNCTION public.wedding_quarantine_release(uuid, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wedding_quarantine_release(uuid, text) TO service_role;

-- 2) the receipt guard: 0159 checks unchanged and first, then the anchor chain under the village lock
CREATE OR REPLACE FUNCTION public.wedding_receipt_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE sw timestamptz; rlm text; p_at timestamptz; p_next timestamptz; p_found boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'wedding receipts are immutable'; END IF;
  IF NEW.occurred_at > now() + interval '5 minutes' THEN RAISE EXCEPTION 'wedding receipt in the future'; END IF;
  SELECT public.wedding_switch_since(s.realm), s.realm INTO sw, rlm FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF sw IS NULL THEN RAISE EXCEPTION 'wedding receipt for an unknown village'; END IF;
  IF NEW.occurred_at >= sw AND NEW.version IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'wedding receipt version 2 required from the switch';
  END IF;
  IF NEW.occurred_at < sw AND NEW.version IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'wedding receipt version 1 required before the switch';
  END IF;
  -- Paket A2: one writer per village at a time (also for a direct insert outside wedding_receipts_book)
  PERFORM pg_advisory_xact_lock(public.wedding_lock_key(NEW.seed_id));
  IF EXISTS (SELECT 1 FROM public.wedding_quarantine q WHERE q.seed_id = NEW.seed_id AND q.released_at IS NULL) THEN
    RAISE EXCEPTION 'wedding settlement quarantined';
  END IF;
  IF NEW.version = 2 AND NEW.next_at IS NULL THEN RAISE EXCEPTION 'wedding receipt anchor required'; END IF;
  SELECT r.occurred_at, r.next_at, true INTO p_at, p_next, p_found
    FROM public.wedding_receipts r WHERE r.seed_id = NEW.seed_id AND r.wedding_index = NEW.wedding_index - 1;
  IF p_found THEN
    IF p_next IS NOT NULL AND NEW.occurred_at IS DISTINCT FROM p_next THEN RAISE EXCEPTION 'wedding receipt breaks the anchor chain'; END IF;
    IF NEW.occurred_at <= p_at THEN RAISE EXCEPTION 'wedding receipt breaks the anchor chain'; END IF;
  ELSE
    -- the first receipt of a village: index 0, or (lab, which keeps no receipts before its switch) the first from the switch
    IF EXISTS (SELECT 1 FROM public.wedding_receipts r WHERE r.seed_id = NEW.seed_id AND r.wedding_index < NEW.wedding_index)
       OR (NEW.wedding_index <> 0 AND NOT (rlm = 'lab' AND NEW.occurred_at >= sw)) THEN
      RAISE EXCEPTION 'wedding receipt index gap';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wedding_receipt_guard() FROM PUBLIC, anon, authenticated;
-- the trigger itself (0159, BEFORE INSERT OR UPDATE FOR EACH ROW) is kept; CREATE OR REPLACE swaps its function

-- 4) the booking call
CREATE OR REPLACE FUNCTION public.wedding_receipts_book(_seed uuid, _rows jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r record; e record; ins integer := 0; same integer := 0; prev_idx integer; prev_next timestamptz;
BEGIN
  IF _rows IS NULL OR jsonb_typeof(_rows) <> 'array' OR jsonb_array_length(_rows) = 0 THEN
    RAISE EXCEPTION 'wedding booking needs rows';
  END IF;
  PERFORM pg_advisory_xact_lock(public.wedding_lock_key(_seed));
  IF EXISTS (SELECT 1 FROM public.wedding_quarantine q WHERE q.seed_id = _seed AND q.released_at IS NULL) THEN
    RAISE EXCEPTION 'wedding settlement quarantined';
  END IF;
  FOR r IN SELECT * FROM jsonb_to_recordset(_rows) AS x(wedding_index integer, occurred_at timestamptz, dowry integer,
             is_grand boolean, is_town boolean, version integer, next_at timestamptz) ORDER BY x.wedding_index LOOP
    IF r.wedding_index IS NULL OR r.occurred_at IS NULL OR r.dowry IS NULL OR r.is_grand IS NULL OR r.is_town IS NULL
       OR r.version IS NULL OR r.next_at IS NULL THEN
      RAISE EXCEPTION 'wedding booking row incomplete';
    END IF;
    IF prev_idx IS NOT NULL AND (r.wedding_index <> prev_idx + 1 OR r.occurred_at IS DISTINCT FROM prev_next) THEN
      RAISE EXCEPTION 'wedding booking rows do not form a chain';
    END IF;
    SELECT w.* INTO e FROM public.wedding_receipts w WHERE w.seed_id = _seed AND w.wedding_index = r.wedding_index;
    IF FOUND THEN
      -- a repeat of the same booking is a no-op; anything else was booked by someone else first and stays
      IF (e.occurred_at, e.dowry, e.is_grand, e.is_town, e.version) IS DISTINCT FROM (r.occurred_at, r.dowry, r.is_grand, r.is_town, r.version)
         OR (e.next_at IS DISTINCT FROM r.next_at AND NOT (e.next_at IS NULL AND e.version = 1)) THEN
        RAISE EXCEPTION 'wedding receipt conflict at index %', r.wedding_index;
      END IF;
      same := same + 1;
    ELSE
      INSERT INTO public.wedding_receipts (seed_id, wedding_index, occurred_at, dowry, is_grand, is_town, version, next_at)
        VALUES (_seed, r.wedding_index, r.occurred_at, r.dowry, r.is_grand, r.is_town, r.version, r.next_at);
      ins := ins + 1;
    END IF;
    prev_idx := r.wedding_index; prev_next := r.next_at;
  END LOOP;
  RETURN jsonb_build_object('inserted', ins, 'already', same);
END $$;
REVOKE ALL ON FUNCTION public.wedding_receipts_book(uuid, jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wedding_receipts_book(uuid, jsonb) TO service_role;

-- 5) classification for the release (service role only, read-only), one row per owned village:
--      ohne_belege         no receipt yet: the calendar starts at the founding (index 0, day 2)
--      alt_rekonstruierbar only receipts without anchor before the switch, all equal to the SQL legacy calendar
--      verankert           the highest receipt carries an anchor (next_at): the calendar continues from it
--      widerspruechlich    v2 receipts without anchor, a broken chain or legacy receipts that differ: not reconstructible
--      quarantaene         an active wedding_quarantine record
--    The TS settlement (planReceipts) checks the same and more (legacy fields, first unified instant).
CREATE OR REPLACE FUNCTION public.wedding_anchor_inventory()
 RETURNS TABLE(seed_id uuid, realm text, klasse text, belege integer, hoechster_index integer, anker_bei timestamptz,
               naechste timestamptz, v2_ohne_anker integer, kettenbrueche integer, alt_abweichend integer, quarantaene text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH v AS (
    SELECT s.id, s.realm, public.wedding_switch_since(s.realm) AS sw FROM public.seeds s WHERE s.user_id IS NOT NULL
  ), m AS (
    SELECT v.id, v.realm,
      (SELECT count(*)::integer FROM public.wedding_receipts r WHERE r.seed_id = v.id) AS belege,
      top.wedding_index AS hoechster_index, top.occurred_at AS anker_bei, top.next_at AS naechste,
      (SELECT count(*)::integer FROM public.wedding_receipts r WHERE r.seed_id = v.id AND r.occurred_at >= v.sw AND r.next_at IS NULL) AS v2_ohne_anker,
      (SELECT count(*)::integer FROM (
          SELECT r.wedding_index, r.occurred_at, lag(r.wedding_index) OVER w AS pi, lag(r.next_at) OVER w AS pn, row_number() OVER w AS rn
            FROM public.wedding_receipts r WHERE r.seed_id = v.id WINDOW w AS (ORDER BY r.wedding_index)) c
        WHERE (c.rn = 1 AND c.wedding_index <> 0 AND v.realm <> 'lab')
           OR (c.rn > 1 AND c.wedding_index <> c.pi + 1)
           OR (c.pn IS NOT NULL AND c.occurred_at <> c.pn)) AS kettenbrueche,
      (SELECT count(*)::integer FROM public.wedding_receipt_diff(v.id) d WHERE d.receipt_at IS NOT NULL) AS alt_abweichend,
      (SELECT q.reason FROM public.wedding_quarantine q WHERE q.seed_id = v.id AND q.released_at IS NULL) AS quarantaene
    FROM v LEFT JOIN LATERAL (
      SELECT r.wedding_index, r.occurred_at, r.next_at FROM public.wedding_receipts r WHERE r.seed_id = v.id
       ORDER BY r.wedding_index DESC LIMIT 1) top ON true
  )
  SELECT m.id, m.realm,
    CASE WHEN m.quarantaene IS NOT NULL THEN 'quarantaene'
         WHEN m.v2_ohne_anker + m.kettenbrueche + m.alt_abweichend > 0 THEN 'widerspruechlich'
         WHEN m.belege = 0 THEN 'ohne_belege'
         WHEN m.naechste IS NOT NULL THEN 'verankert'
         ELSE 'alt_rekonstruierbar' END,
    m.belege, m.hoechster_index, m.anker_bei, m.naechste, m.v2_ohne_anker, m.kettenbrueche, m.alt_abweichend, m.quarantaene
  FROM m ORDER BY m.id
$$;
REVOKE ALL ON FUNCTION public.wedding_anchor_inventory() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wedding_anchor_inventory() TO service_role;

COMMENT ON COLUMN public.wedding_receipts.next_at IS
  'Paket A2: instant of the next wedding as computed by the trusted server when this receipt was booked. The receipt with the highest index is the anchor the calendar continues from. NULL only for receipts booked before migration 0160.';
COMMENT ON TABLE public.wedding_receipts IS
  'Server-derived wedding records (index = WedDate.k). Version 1 = legacy rule (before wedding_switch_since, mirrored by village_wedding_list), 2 = unified rule (from it; the only money record). Booked receipts are history and never recomputed (Paket A2): next_at anchors the continuation. Version, anchor chain and quarantine enforced by wedding_receipts_guard; UPDATE refused; booked by wedding_receipts_book.';
