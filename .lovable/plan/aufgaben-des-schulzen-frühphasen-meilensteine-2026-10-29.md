# Aufgaben des Schulzen – Frühphasen-Meilensteine

## Ziel
Junge Dörfer bekommen eine Kette von 7 Aufgaben. Sie lehren die Spielmechaniken, geben kleine Taler-Belohnungen und füllen die ersten Tage mit Beschäftigung. Die nächste Aufgabe erscheint erst, wenn die vorige erledigt ist.

## Die Aufgabenkette
| # | Aufgabe | Erfüllt, wenn | Belohnung |
|---|---|---|---|
| 1 | Den ersten Segen sprechen | ein Dorfsegen wurde gesprochen | 20 Taler |
| 2 | Ein Werkhaus errichten | erstes Bonus-Gebäude gekauft (z. B. Kräuter- oder Jägerhütte) | 30 Taler |
| 3 | Einen Wegweiser aufstellen | eigener Wegweiser steht | 20 Taler |
| 4 | Die erste Begegnung meistern | eine Begegnung wurde beantwortet | 30 Taler |
| 5 | Zehn Seelen | Dorf hat 10 Einwohner | 40 Taler |
| 6 | Ein Gruß an die Nachbarn | ein Geschenk an ein anderes Dorf geschickt | 40 Taler |
| 7 | Vom Dorf zum Weiler | Dorf erreicht Stufe „Weiler“ | 60 Taler + Siegel in der Dorf-Rolle |

Summe: 240 Taler über die ersten Tage, ungefähr so viel wie ein bis zwei frühe Gebäude.

## So sieht es der Spieler
- Oben links unter der Taler-Leiste liegt ein kleines Pergament-Kärtchen „Aufgabe des Schulzen“. Darauf stehen die aktuelle Aufgabe, ein Fortschritt (z. B. 6/10 Einwohner) und ein Knopf „Zeig mir wie“, der das passende Menü öffnet oder die Karte hinbewegt.
- Ist eine Aufgabe erfüllt, erscheint ein Pergament-Overlay mit Illustration und einem Spruch des Schulzen (mit dessen Namen). Mit „Belohnung annehmen“ landen die Taler sofort in der Kasse.
- Das Kärtchen lässt sich einklappen. Nach Aufgabe 7 verschwindet es, und in der Chronik steht dann „Die Lehrjahre des Schulzen sind vorüber“.
- Alles ist zweisprachig (DE/EN).

## Regeln
- Die Kette gibt es nur einmal pro Dorf. Bei einem aufgegebenen und neu gegründeten Dorf beginnt sie von vorn, Belohnungen gelten aber nur für das neue Dorf.
- Belohnungen kann man nur abholen, wenn die Bedingung wirklich erfüllt ist. Das prüft die Datenbank, ein Abholen kann nicht doppelt passieren.
- Auch alte Dörfer, die die Ziele schon erreicht haben, können die Belohnungen nacheinander abholen.

## Technische Details
- `src/game/quests.ts` (neu, rein): `QUESTS` (Codes, Belohnung, Reihenfolge), `questState(seed, ctx, now)` → aktuelle Aufgabe, Fortschritt, erfüllt ja/nein. Die Bedingungen werden aus den vorhandenen Zeilen und Ableitungen berechnet (blessings, purchases, signposts, encounters, gifts, `townOf().people.length`, `stageOf`). Gibt nur Codes zurück, Texte stehen in i18n.ts.
- Migration: Tabelle `quest_claims(seed_id, quest, claimed_at, reward)` mit UNIQUE(seed_id, quest), GRANT plus RLS (Besitzer liest und schreibt). Ein Guard-Trigger prüft die Reihenfolge (die vorige Aufgabe ist abgeholt), die Belohnung aus einer festen Tabelle und die serverseitig prüfbaren Bedingungen (Segen, Kauf, Wegweiser, Begegnung, Geschenk vorhanden). Einwohnerzahl und Stufe werden deterministisch abgeleitet und deshalb nur clientseitig geprüft, die Belohnung ist dabei fest gedeckelt. `abandon_village` löscht die Claims mit.
- `economy.ts`: `treasury()` addiert die Summe der Claims (neuer optionaler Parameter), alle Aufrufer werden angepasst.
- `Game.tsx`: Claims laden, Kärtchen und Belohnungs-Overlay einbauen (bestehende Parchment-Komponente). „Zeig mir wie“ öffnet die passenden Tabs. Für die Illustration wird ein neues Bild `quest.webp` in der gewohnten Pergament-Malweise erstellt.
- `chronicle.ts`: Ereignis „quest“ für abgeholte Aufgaben.
- Tests `quests.test.ts`: Reihenfolge, die Belohnungen 20/30/20/30/40/40/60 (Summe 240), Bedingung erfüllt bzw. nicht erfüllt pro Aufgabe, und `treasury()` enthält die Belohnungen.
