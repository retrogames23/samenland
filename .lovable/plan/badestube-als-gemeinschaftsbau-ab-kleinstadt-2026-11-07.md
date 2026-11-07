# Badestube als Gemeinschaftsbau ab Kleinstadt

## Was der Spieler bekommt
- Neues kaufbares Gebäude **Badestube** in der Gruppe der Gemeinschaftsbauten (neben Backhaus, Herberge, Beginenhof), freigeschaltet erst ab **Kleinstadt** (nur Ortsstufe, nie Alter).
- Vorschlag Preis/Bonus: **700 Mark**, **+10 Gesundheit, +5 Wohlstand** (zwischen Herberge und Beginenhof). Gerne anpassen.
- Platzierung bevorzugt nahe Bach/Fluss/Küste, sonst normal am Ortsrand der Straße.
- Gemaltes Gebäude im bestehenden Stil (2:1-Isometrie, Licht von links oben): Fachwerkbau mit Schindeldach, Holzstapel, Zuber vor der Tür, animierter Dampf aus dem Dachschlot, Nachtlicht in den Fenstern.
- Leben vor Ort: eine **Baderin / ein Bader** (Leinenschürze) arbeitet dort; an **Samstagen** (Badetag vor dem Kirchgang) gehen sichtbar Bürger hin und zurück. Ein Holzträger bringt Brennholz.
- Schnack-Sprüche der Bürger über heißes Wasser, Schröpfen und Stadtgerüchte.
- Ausbaustufen, Kasse und Gemeindetruhe bleiben unverändert.

## Offene Fragen (vor Umsetzung kurz bestätigen)
- Preis 700 Mark und Bonus +10 Gesundheit / +5 Wohlstand ok?
- Bader als neue gemalte Figur: Laufbild nur, wenn der Lauf-Test besteht; sonst steht er arbeitend an der Tür (kein Laufbild ohne bestandenen Test, gemäß Projektregel).

## Technische Details
- `world.ts`: neuer Kind `badestube`, `SPECIAL_KIND.bad = "badestube"`, Platz via `specialSites` mit Wassernähe-Präferenz; 1×1 Kachel.
- `economy.ts`: Preis, `BAD_HEALTH`/`BAD_WEALTH`, Rang-Gate Kleinstadt; Eintrag in Wohlstand/Gesundheit (`prosperity.ts`) inkl. Mirror in der Datenbank.
- Migration: Kaufprüfung (Preis + Stufe Kleinstadt, Server zählt selbst) und `village_civic_wealth`-Bonus nachziehen.
- `building-sprites.ts`: neues Sprite + ausgerichtete Nachtlicht-Ebene (`night/badestube.webp`), Dampf über bestehende Rauch-Animation.
- `people.ts`: Job `bather` (1), Samstags-Routine in `wander.ts` über die Realm-Uhr.
- `i18n.ts` + `lang/*`: Name, Zweck, Bonustext und Sprüche in allen 8 Sprachen.
- Tests: Rang-Gate (vor Kleinstadt nicht kaufbar), Preis 700, Bonuswerte; Lauf-Test für eine neue Figur.
- Memory `game/buildings` und `game/chest` um Badestube ergänzen.
