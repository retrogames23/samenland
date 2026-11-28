-- Masterplan Wirtschaftsumbau v7.0, Paket M – die eine noch fehlende lesende Abfrage.
-- NUR LESEND (READ ONLY, endet mit ROLLBACK). Führt nichts aus, ändert nichts.
-- Liest die Einträge von 0159–0163 und 0168 aus drizzle.__drizzle_migrations und vergleicht sie mit den Dateien in
-- `main` (SHA-256 der Migrationsdatei = hash; `when` im Migrationsjournal = created_at).
-- 0164–0167 sind durch den P4-Installationsbericht belegt und stehen hier absichtlich nicht.
-- Ergebnis je Migration: live_id (leer = kein Eintrag gefunden), hash_gleich, zeit_gleich. Ergebnis bitte unverändert
-- mit Datenbankname und Zeit ablegen. Bei abweichendem Ergebnis nichts reparieren und nichts einspielen.
BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS datenbank, (SELECT d.oid FROM pg_database d WHERE d.datname = current_database()) AS datenbank_oid,
       current_setting('server_version') AS version, now() AS zeit,
       (SELECT count(*) FROM drizzle.__drizzle_migrations) AS journal_eintraege,
       (SELECT max(id) FROM drizzle.__drizzle_migrations) AS hoechste_id;

SELECT e.migration,
       m.id AS live_id,
       m.created_at AS live_created_at,
       m.hash AS live_hash,
       m.id IS NOT NULL AS eingespielt,
       coalesce(m.hash = e.hash, false) AS hash_gleich,
       coalesce(m.created_at = e.created_at, false) AS zeit_gleich
  FROM (VALUES
    ('0159_finanzintegritaet_schema_drift', 1795765179249, '18fd32a5ddb7dfd31c14a85bf1eb6eade44484c1977f7fd02cb4e33bb27bf572'),
    ('0160_hochzeit_anker',                 1795768676950, 'c3fb3fdf6b0edbfa89b02e69715d156786afca204351a0379284432977b48e9c'),
    ('0161_hochzeit_belegschutz',           1795768678640, 'a0a903599bec1cc3d2ab7a168664e5c854e798e34d6e9a7449a4629e41130174'),
    ('0162_hochzeit_vollstaendigkeit',      1795768680345, '89314dc921979f8182c2e6981dd5abb475b10823737cb362188d496eeb8256e0'),
    ('0163_hochzeit_rechte_gates',          1795768682088, '89b9b3e23249620e902779873b19325d60adbed3272c46d8f387e57976997aff'),
    ('0168_restrict_role_lookup',           1795826174087, 'a835bc61612a59873459be3343953e8f4fe0c20761f9c18c6c89e4f4f3ced2d8')
  ) AS e(migration, created_at, hash)
  LEFT JOIN drizzle.__drizzle_migrations m ON m.hash = e.hash OR m.created_at = e.created_at
 ORDER BY e.created_at, m.id;

ROLLBACK;
