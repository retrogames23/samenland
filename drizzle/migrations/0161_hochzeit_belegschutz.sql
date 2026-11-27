-- 0161 Hochzeit H7 – Belegschutz (Variante 2). Baut auf 0160 auf. Ändert keine Geldregel und keinen Buchungsweg.
--
-- Einzelne Hochzeitsbelege sind unveränderliche Historie — auch für service_role.
--   UPDATE: weiterhin vom Wächter (0160) verweigert; DELETE eines einzelnen Belegs und TRUNCATE: neue Trigger, die auch
--   der Tabelleneigentümer nicht umgeht (außer er schaltet Trigger ausdrücklich ab — siehe Betriebsdoku).
--   Rechte: nur noch SELECT (authenticated über RLS, service_role); geschrieben wird ausschließlich über die
--   SECURITY-DEFINER-Buchungen wedding_receipts_book (0160) / wedding_settle (0162). Damit verliert auch ein alter
--   Serverstand seinen direkten Upsert-Weg (er lief vor dem Umschaltzeitpunkt nur als Schatten und schluckt den Fehler).
--   Entscheidung unverändert: Wird ein Dorf gelöscht (abandon_village, purge_user_data), gehen seine Belege per
--   FK ON DELETE CASCADE mit verloren. Das ist keine Einzel-Löschung und bleibt erlaubt; die Aufbewahrungsfrage ist
--   offen und wird hier nicht technisch entschieden.

-- 1) H7 ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wedding_receipt_keep()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' THEN RAISE EXCEPTION 'wedding receipts are kept'; END IF;
  -- die Dorf-Löschung (FK ON DELETE CASCADE) entfernt die Belege erst, wenn das Dorf schon weg ist: erlaubt
  IF EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = OLD.seed_id) THEN RAISE EXCEPTION 'wedding receipts are kept'; END IF;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.wedding_receipt_keep() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS wedding_receipts_keep ON public.wedding_receipts;
CREATE TRIGGER wedding_receipts_keep BEFORE DELETE ON public.wedding_receipts
  FOR EACH ROW EXECUTE FUNCTION public.wedding_receipt_keep();
DROP TRIGGER IF EXISTS wedding_receipts_no_truncate ON public.wedding_receipts;
CREATE TRIGGER wedding_receipts_no_truncate BEFORE TRUNCATE ON public.wedding_receipts
  FOR EACH STATEMENT EXECUTE FUNCTION public.wedding_receipt_keep();
REVOKE ALL ON TABLE public.wedding_receipts FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.wedding_receipts TO authenticated, service_role;
