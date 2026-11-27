# Migration 0159 – Finanzintegrität und Schema-Drift

Stand: Branch `claude/finanzintegritaet-0159` (von `main` `fbde951`). **Nicht eingespielt.** Die Live-Datenbank wurde
weder gelesen noch verändert.

## Was sich ändert

Wird ein Dorf gelöscht (Dorfaufgabe `abandon_village`, Kontolöschung `purge_user_data` oder jede andere Löschung der
`seeds`-Zeile), bleiben die Buchungen der **anderen** Dörfer erhalten. Bisher wurden sie mitgelöscht, und der Kassenstand
der anderen Spieler änderte sich rückwirkend.

| Tabelle | Wer bucht | Spalte | Löschregel | NOT NULL |
|---|---|---|---|---|
| `gifts` | Absender zahlt, Empfänger erhält | `from_seed`, `to_seed` | SET NULL (vorher CASCADE) | nein (vorher ja) |
| `referrals` | beide erhalten | `referrer_seed`, `referee_seed` | SET NULL (vorher CASCADE) | nein (vorher ja) |
| `village_visits` | nur der Besucher erhält | `visitor_seed` | CASCADE (vorher ohne Regel) | ja |
| | | `visited_seed` | SET NULL (vorher ohne Regel) | nein (vorher ja) |
| `twin_works` | jede Seite zahlt ihre eigene Zeile | `seed_id` | CASCADE (unverändert) | ja |
| | | `partner_id` | SET NULL (vorher CASCADE) | nein (vorher ja) |
| `princely_errands` | bucht nichts | `seed_id` → `seeds` | CASCADE (neu) | ja |
| | | `task_id` → `princely_tasks` | CASCADE (neu) | ja |

- Eine `gifts`- oder `referrals`-Zeile, deren beide Dörfer gelöscht sind, bucht für niemanden mehr. Der Trigger
  `finance_orphan_cleanup` entfernt sie; er feuert auch bei den SET-NULL-Aktionen der Fremdschlüssel.
- `abandon_village` und `purge_user_data` löschen keine Gegenbuchungen mehr. Sie werden aus der **Live-Definition**
  gepatcht (`CREATE OR REPLACE`), darum bleiben Eigentümer, Rechte, SECURITY DEFINER und `search_path` unverändert.
  Kein GRANT oder REVOKE an bestehenden Objekten.
- Die neue Trigger-Funktion `finance_orphan_cleanup` ist keiner API-Rolle gewährt (Trigger brauchen kein EXECUTE).
- `princely_errands` existiert live, aber in keiner Migration. 0159 legt sie an, wo sie fehlt (Spalten laut generierten
  Typen), entfernt Zeilen ohne Dorf und setzt die beiden Fremdschlüssel.
- Bereits verlorene Gegenbuchungen aus früheren Löschungen werden **nicht** rekonstruiert.

## Sicherungen in der Migration

- Als ein Skript in einer Transaktion ausführen. Jede Abweichung bricht ab, bevor etwas geändert ist.
- Der Preflight prüft je Fremdschlüssel: genau einer auf der Spalte, Name, einspaltig, referenzierte Tabelle und Spalte,
  gültig, nicht aufschiebbar, ON UPDATE, Löschregel (Ist oder Ziel). Dazu: Spaltentypen, eindeutige Schlüssel,
  CHECK-Constraints auf künftig leeren Spalten, Verweise von außen (`gift_reads`), hängende Verweise (mit `NOT EXISTS`,
  NULL-sicher), Zustand der beiden Funktionen.
- `princely_errands`: Zeilen ohne Dorf werden entfernt. Zeilen eines bestehenden Dorfes ohne Auftrag oder mit dem
  Auftrag eines anderen Dorfes lassen die Migration abbrechen (von Hand klären, nicht raten).
- Erneutes Ausführen ändert nichts.

## Client

Die Spalten können jetzt `null` sein. Angepasst: generierte Typen, `Gift`/`Referral`/`Visit`, die Weltmodell-Typen und
die Realtime-Behandlung einer Dorf-Löschung (`detachSeed` spiegelt die FK-Regeln). Ein Partnerwerk gilt wie bisher nur
als fertig, wenn beide Hälften vorhanden sind; die gezahlte Hälfte bleibt gebucht.

## Drizzle

`drizzle/schema.ts` ist in diesem Projekt absichtlich leer („auto-generated and intentionally left blank, do not edit“),
und alle 159 Snapshots haben leere `tables`. Journal-Eintrag und Snapshot für 0159 hat `drizzle-kit generate --custom`
selbst erzeugt; er liefert genau diese Form (leere `tables`, zufällige `id`, `prevId` = 0158).

Ein gefüllter Snapshot wurde **bewusst nicht verdrahtet**. Lokal mit drizzle-kit geprüft:
- gefüllte `schema.ts` gegen den leeren 0158-Snapshot → `drizzle-kit generate` erzeugt 50 `CREATE TABLE`;
- leere `schema.ts` gegen einen gefüllten Snapshot → 50 `DROP TABLE … CASCADE`.

Solange Lovable `schema.ts` leer hält bzw. neu erzeugt, wäre ein gefüllter Snapshot also eine Gefahr für die
Produktion. Das vollständige Drizzle-Modell des lokalen Stands nach 0159 (alle 50 Tabellen, `drizzle-kit pull`) liegt
als Referenz im Lieferpaket, nicht im Repo.

## Vor dem Einspielen

1. `docs/sql/0159_vorabpruefung.sql` lesend ausführen und die Ergebnisse prüfen.
2. 0158 muss eingespielt sein.
3. 0159 als ein Skript. Danach liefert `NOTIFY pgrst, 'reload schema';` den neuen Stand an PostgREST.
4. Server und Client dieses Branches zeitnah ausliefern. `null`-Seiten entstehen erst, wenn nach der Migration ein Dorf
   gelöscht wird. Wie der **alte** Client solche Zeilen darstellt, ist nicht getestet; die Kasse rechnet der Server.

## Offene Punkte

- Der Entwurf `0159_finanzintegritaet_schema_drift.sql`, auf den sich der Auftrag bezieht, lag nicht vor (nicht im Repo,
  in keinem Branch, nicht angehängt). Die Migration ist aus dem Auftrag und dem Ist-Schema neu geschrieben. Die
  FK-Richtungen oben folgen daraus, welche Seite tatsächlich bucht; bitte gegen die Vereinbarung prüfen.
- `princely_errand` (Funktion) und `build_mail` (Tabelle) fehlen weiter in den Migrationen. Ihre Live-Definitionen sind
  unbekannt (Abfrage 5 der Vorabprüfung holt die Funktion).
- Live-Policies, -Rechte und eventuelle weitere Constraints von `princely_errands` sind unbekannt; 0159 lässt sie
  unverändert.
- Der Branch `claude/hochzeitspaket` verwendet die Nummern 0159–0162 ebenfalls (nicht eingespielt, nicht gemergt). Wird
  0159 von hier zuerst gemergt, müssen jene Migrationen vor ihrem Merge neu nummeriert werden.
- In erhaltenen `gifts`- und `twin_works`-Zeilen bleibt `user_id` des gelöschten Kontos stehen (wie bisher bei allen
  nicht gelöschten Zeilen); `referrals.referee_user` ebenso.
- PostgREST wurde nicht getestet (in dieser Umgebung nicht ausführbar); alle Datenbanktests laufen direkt gegen PostgreSQL.
