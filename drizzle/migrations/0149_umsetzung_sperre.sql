-- Gebäudeumsetzung: the village row lock must come BEFORE the move's money check.
--
-- 0118 created two BEFORE INSERT row triggers on building_moves: building_moves_lock (tax_spend_lock: seeds row
-- FOR UPDATE) and building_moves_guard (building_move_guard: price, cooldown, distance, village_balance check).
-- PostgreSQL fires triggers of the same kind in name order, and "building_moves_guard" < "building_moves_lock", so the
-- guard read the balance before the lock was held: a move racing with another spend of the same village (purchase,
-- encounter, gift, twin work, another move) could pass on a balance the other spend was about to reduce, then wait on
-- the lock and be inserted unchecked — both commit, together more than the chest held.
--
-- Fix: rename the lock trigger to a_tax_spend_lock, the name it carries on purchases, encounters, gifts and twin_works,
-- so it fires first here too. Trigger names are per table, so the name collides with nothing. Only this one trigger is
-- renamed; function, timing, events and every other trigger stay as they are. Idempotent, no data change.
--
-- Numbered 0149 on purpose: 0147/0148 are taken by the open PR #56 (Gemeindebauten). This migration does not depend on
-- them and they do not depend on it.
DO $do$
DECLARE first_name text; first_fn text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.building_moves'::regclass AND tgname = 'building_moves_lock' AND NOT tgisinternal) THEN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.building_moves'::regclass AND tgname = 'a_tax_spend_lock') THEN
      RAISE EXCEPTION 'building_moves has both building_moves_lock and a_tax_spend_lock';
    END IF;
    ALTER TRIGGER building_moves_lock ON public.building_moves RENAME TO a_tax_spend_lock;
  END IF;
  -- check: among the BEFORE INSERT row triggers of building_moves the village lock now fires first
  SELECT t.tgname, p.proname INTO first_name, first_fn
    FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
   WHERE t.tgrelid = 'public.building_moves'::regclass AND NOT t.tgisinternal
     AND (t.tgtype & 1) = 1      -- ROW
     AND (t.tgtype & 2) = 2      -- BEFORE
     AND (t.tgtype & 4) = 4      -- INSERT
   ORDER BY t.tgname COLLATE "C" LIMIT 1;
  IF first_name IS DISTINCT FROM 'a_tax_spend_lock' OR first_fn IS DISTINCT FROM 'tax_spend_lock' THEN
    RAISE EXCEPTION 'building_moves: village lock is not the first BEFORE INSERT trigger (% / %)', first_name, first_fn;
  END IF;
END $do$;
