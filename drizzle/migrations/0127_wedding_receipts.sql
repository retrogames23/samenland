-- Wedding receipts, SHADOW STAGE ONLY (stage 1 + 2 of the migration plan).
-- Nothing in this migration changes a balance: village_balance*, village_balance_walk and encounter_guard
-- are NOT touched and keep reading village_wedding_list. The table is filled by the trusted server
-- (src/lib/treasury.server.ts settleWeddings) from src/game/weddings.ts, and wedding_receipt_diff()
-- lets us prove, per village, that those receipts equal what SQL computes today.
-- Switching the walk and the guard to the receipts is a separate, later migration.

CREATE TABLE public.wedding_receipts (
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  wedding_index integer NOT NULL CHECK (wedding_index >= 0),
  occurred_at timestamptz NOT NULL,
  dowry integer NOT NULL CHECK (dowry >= 0),
  is_grand boolean NOT NULL,
  is_town boolean NOT NULL,
  version integer NOT NULL DEFAULT 1,
  PRIMARY KEY (seed_id, wedding_index),
  -- indices run in calendar order, so one instant can never carry two receipts
  UNIQUE (seed_id, occurred_at)
);

-- Same access pattern as tax_receipts: the owner may read, nobody but the server may write.
GRANT SELECT ON public.wedding_receipts TO authenticated;
GRANT ALL ON public.wedding_receipts TO service_role;
ALTER TABLE public.wedding_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads wedding receipts" ON public.wedding_receipts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));

COMMENT ON TABLE public.wedding_receipts IS
  'Server-derived wedding records frozen from src/game/weddings.ts (index = WedDate.k). Economic record, not growth state. Shadow stage: no balance reads this yet.';

-- Read-only shadow check: every row returned is a difference between the receipts and the SQL calendar
-- the live balance uses today (four-item food list, as village_balance_walk calls it).
--   receipt_at IS NULL  -> receipt not written yet (normal right after a wedding; settle and re-run)
--   sql_at IS NULL      -> receipt exists that SQL does not know: a real divergence, investigate
-- Zero rows after settling means the TypeScript calendar and the SQL calendar agree for this village.
CREATE OR REPLACE FUNCTION public.wedding_receipt_diff(_seed uuid)
 RETURNS TABLE(idx integer, receipt_at timestamptz, sql_at timestamptz, receipt_dowry integer, sql_dowry integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH n AS (SELECT now() AS at),
  sqll AS (
    SELECT (row_number() OVER (ORDER BY l.t) - 1)::integer AS idx, l.t, l.dowry
      FROM n, public.village_wedding_list(_seed, n.at, ARRAY['fisher','hunter','granary','dairy']) l
  ),
  rec AS (
    SELECT r.wedding_index AS idx, r.occurred_at, r.dowry
      FROM n, public.wedding_receipts r WHERE r.seed_id = _seed AND r.occurred_at <= n.at
  )
  SELECT coalesce(s.idx, r.idx), r.occurred_at, s.t, r.dowry, s.dowry
    FROM sqll s FULL JOIN rec r ON r.idx = s.idx
   WHERE r.idx IS NULL OR s.idx IS NULL OR r.occurred_at <> s.t OR r.dowry <> s.dowry
   ORDER BY 1
$$;
REVOKE ALL ON FUNCTION public.wedding_receipt_diff(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wedding_receipt_diff(uuid) TO service_role;
