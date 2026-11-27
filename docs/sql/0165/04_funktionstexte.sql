-- P4 Stiftungen, Migration 0165 – 04 Funktionstexte. NUR LESEND. Gibt die vollständigen Live-Definitionen der vier
-- Funktionen zurück, die 0165 patcht (vor dem Einspielen), und zusätzlich aller stift_*-Funktionen (nach dem Einspielen).
-- Nur nötig, wenn ein Fingerabdruck aus 01/02 vom Repository abweicht oder 0165 mit "P4 0165: …" abbricht.
BEGIN TRANSACTION READ ONLY;

SELECT p.oid::regprocedure::text AS objekt, md5(pg_get_functiondef(p.oid)) AS md5, pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f'
   AND (p.proname IN ('purchase_guard', 'resource_kontor_at', 'quest_guard', 'princely_task_met') OR p.proname LIKE 'stift%')
 ORDER BY 1;

ROLLBACK;
