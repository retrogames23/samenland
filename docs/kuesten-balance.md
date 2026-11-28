# Küsten-Balance: Küstendehnung flächentreu (Zwischenfix, 28.11.2026)

## Befund am Code

Geprüft: `landShape`, `townDist`, `spokeDirs`, `foodCatchment`, `foodCapacity`, `tradeCapOf`, `dwellingSlots`,
`occupiedHomes`. Gemessen an allen Standorten eines festen Rasters der echten Karte (Schritt 23 Kacheln), je ein
Einzeldorf mit gleichen Käufen und gleichem effektiven Alter (`src/game/coast-balance.test.ts`).

| Hypothese | Ergebnis |
|---|---|
| Küstendehnung `landShape.k` | **bestätigt, Hauptursache.** `k = 1 + (0,9 − f) × 3,6` überschätzt den Ausgleich an stark küstennahen Standorten (k ≥ 1,6; 57 Standorte des Rasters, daneben 96 leicht küstennahe): im Median 12–17 % mehr Bauland als ein Binnendorf gleichen Radius, einzelne Standorte über 30 %. Folge: Bürger im Median +4 bis +11 %, im oberen Zehntel +8 bis +16 %, Spitzenstandorte bis +20 %. Leicht küstennahe Standorte (k < 1,6) liegen im Median gleichauf, einzelne darunter (Bauland bis −14 %). Im Mittel über alle Küstenstandorte gibt es keinen Vorteil – der Fehler ist die Streuung nach oben an bestimmten Standorten. |
| Speichen (`spokeDirs`), Ringstraßen | **teilweise bestätigt, Nebenursache.** Auch bei gleichem Bauland stehen auf gefächerten Küstenformen etwas mehr Häuser (Rest von rund 10 % im oberen Zehntel bei 28 Tagen effAge). Nicht geändert: Speichen umzulegen würde jedes Küstendorf neu anordnen. |
| Nahrungsgebiet `foodCatchment` zählt Wasser als Land | **nicht bestätigt.** Das Nahrungsgebiet ist für jeden Charakter derselbe gedachte Kreis π r² im Dorfraum; die Nahrungskapazität ist bei gleichem effAge und gleichen Käufen für Küste und Binnenland identisch (Tabelle). Sie ist kein Küstenvorteil. Mit der flächentreuen Dehnung entspricht der Kreis zudem dem tatsächlich nutzbaren Land. Nicht geändert. |
| Handelsdeckel `CEIL_GATEWAY` | **gering.** +0,05 auf den Deckel 0,40 wirkt nur oberhalb von 35 % Handelsanteil und hebt das effAge dann um höchstens rund 3,6 %. Gewollter Handelsvorteil, nicht geändert. Satzung (+0,10) und Markthalle (+0,05) stehen jedem Charakter offen. |
| Agrarbonus der Kornkammer | **es gibt keinen wachstumswirksamen.** Im Code hat die Kornkammer nur `GRAIN_WINTER` (Speisekammer-Anzeige), den Kornspeicher als Bauform und später die Erntedankhalle. Das Tor zur Welt hat Handelsdeckel, Knotenbonus ×1,5, Seewege und die vierte Familie ab Radius 30. Ein neuer Agrarbonus wäre eine neue Spielregel mit eigener Zahl und ist deshalb **nicht Teil dieses Fixes** (offene Entscheidung, siehe unten). |

Die sechs Altenland-Städte selbst konnte ich nicht nachrechnen (Koordinaten und Käufe liegen in der Datenbank). Ihre
Werte passen zum Befund: Die Simulation erreicht an Spitzen-Küstenstandorten bei 11 Tagen effAge rund 250 Bürger, im
Binnenland im Median rund 175.

## Änderung

`src/game/world.ts`, `landShape`: Für Dörfer, die **ab dem 30.11.2026 00:00 UTC (2026-11-30T00:00:00Z, 01:00 Uhr MEZ)** gegründet werden
(`COAST_AREA_SINCE`), ist die Dehnung flächentreu: das kleinste k, bei dem die Dorfform so viel bebaubares Land
enthält wie ein voller Kreis im Binnenland, gemittelt über die Radien 8, 12, 16 und 24; höchstens 2,8. Küste ist damit
beim Bauland weder Bonus noch Malus. Charaktere, Handelsboni, Nahrungsregeln, Wachstum und Stiftungen sind unberührt.
Keine Migration, keine Datenbankänderung.

Der Stichtag ist von Stephan am 28.11.2026 bestätigt. Merge und Publish müssen vor dem Stichtag liegen; sonst ändert ein
dazwischen gegründetes Küstendorf beim Publish einmal seine Form.

**Bestehende Dörfer behalten ihre Form.** Grund: Jedes Haus, jede Ringstraße und jedes Feld liegt im gedehnten
Dorfraum. Ein neues k würde ein stehendes Küstendorf neu anordnen – gemessen an zehn Standorten bleiben nur 46–90 %
der Häuser auf ihrer Kachel, die stärksten Küstendörfer verlören 13–20 % ihrer Bürger. Das wäre ein Eingriff in
bestehende Spielstände und ist eine Entscheidung von Stephan, nicht Teil eines Zwischenfixes. Der Schalter ist eine
Konstante: `COAST_AREA_SINCE = 0` würde die Regel auf alle Dörfer anwenden.

Folge: **Gebbingen, Haselfeld und Halingen behalten ihren heutigen Vorsprung.** Der Fix verhindert, dass neue
Küstendörfer ihn wieder bekommen.

## Simulation (reproduzierbar: `COAST_REPORT=datei vitest run src/game/coast-balance.test.ts`)

„alt“ = gegründet vor dem Stichtag, „neu“ = ab dem Stichtag. Gleiche Käufe (alle Nahrungs- und Gesundheitsbauten), gleiches
effAge, Einzeldörfer ohne Nachbarn. Vergleiche gelten innerhalb einer Regel; zwischen „alt“ und „neu“ weichen auch
Binnendörfer leicht ab, weil für Neugründungen der gestaffelte Anliegerbau gilt.

| effAge | Regel | Gruppe | n | Alter (Tage) | k | Bauland p50 | Häuser p50 | Nahrungskapazität p50 | Haushalte p50 | Bürger p10 / p50 / p90 / max |
|---|---|---|---|---|---|---|---|---|---|---|
| 5 Tage | alt | Kornkammer Binnenland | 240 | 14 | 1.00 | 177 | 21 | 86 | 21 | 57 / 70 / 84 / 113 |
| 5 Tage | alt | Tor zur Welt, starke Küste | 57 | 14 | 2.14 | 216 | 22 | 86 | 22 | 45 / 72 / 100 / 121 |
| 5 Tage | alt | leichte Küste | 96 | 14 | 1.24 | 184 | 21 | 86 | 21 | 51 / 66 / 86 / 110 |
| 5 Tage | neu | Kornkammer Binnenland | 240 | 14 | 1.00 | 177 | 22 | 86 | 22 | 53 / 68 / 87 / 104 |
| 5 Tage | neu | Tor zur Welt, starke Küste | 57 | 14 | 1.84 | 190 | 23 | 86 | 23 | 48 / 71 / 93 / 98 |
| 5 Tage | neu | leichte Küste | 96 | 14 | 1.32 | 191 | 21 | 86 | 21 | 48 / 66 / 88 / 99 |
| 11 Tage | alt | Kornkammer Binnenland | 240 | 31 | 1.00 | 325 | 65 | 128 | 65 | 157 / 179 / 201 / 230 |
| 11 Tage | alt | Tor zur Welt, starke Küste | 57 | 31 | 2.14 | 379 | 69 | 128 | 69 | 150 / 187 / 225 / 254 |
| 11 Tage | alt | leichte Küste | 96 | 31 | 1.24 | 325 | 66 | 128 | 66 | 128 / 179 / 205 / 246 |
| 11 Tage | neu | Kornkammer Binnenland | 240 | 31 | 1.00 | 325 | 62 | 128 | 62 | 146 / 172 / 194 / 218 |
| 11 Tage | neu | Tor zur Welt, starke Küste | 57 | 31 | 1.84 | 333 | 60 | 128 | 60 | 135 / 165 / 203 / 222 |
| 11 Tage | neu | leichte Küste | 96 | 31 | 1.32 | 339 | 66 | 128 | 66 | 133 / 181 / 205 / 236 |
| 16 Tage | alt | Kornkammer Binnenland | 240 | 46 | 1.00 | 421 | 78 | 158 | 78 | 187 / 212 / 240 / 272 |
| 16 Tage | alt | Tor zur Welt, starke Küste | 57 | 46 | 2.14 | 490 | 83 | 158 | 83 | 176 / 225 / 260 / 288 |
| 16 Tage | alt | leichte Küste | 96 | 46 | 1.24 | 422 | 77 | 158 | 77 | 158 / 212 / 243 / 270 |
| 16 Tage | neu | Kornkammer Binnenland | 240 | 46 | 1.00 | 421 | 78 | 158 | 78 | 185 / 213 / 241 / 263 |
| 16 Tage | neu | Tor zur Welt, starke Küste | 57 | 46 | 1.84 | 432 | 76 | 158 | 76 | 168 / 207 / 255 / 282 |
| 16 Tage | neu | leichte Küste | 96 | 46 | 1.32 | 436 | 81 | 158 | 81 | 171 / 220 / 250 / 280 |
| 28 Tage | alt | Kornkammer Binnenland | 240 | 80 | 1.00 | 641 | 99 | 220 | 99 | 240 / 271 / 300 / 336 |
| 28 Tage | alt | Tor zur Welt, starke Küste | 57 | 80 | 2.14 | 715 | 111 | 220 | 111 | 243 / 301 / 347 / 404 |
| 28 Tage | alt | leichte Küste | 96 | 80 | 1.24 | 613 | 97 | 220 | 97 | 204 / 267 / 304 / 351 |
| 28 Tage | neu | Kornkammer Binnenland | 240 | 80 | 1.00 | 641 | 98 | 220 | 98 | 238 / 269 / 297 / 321 |
| 28 Tage | neu | Tor zur Welt, starke Küste | 57 | 80 | 1.84 | 635 | 102 | 220 | 102 | 214 / 270 / 328 / 358 |
| 28 Tage | neu | leichte Küste | 96 | 80 | 1.32 | 640 | 100 | 220 | 100 | 226 / 273 / 308 / 365 |

Kernzahlen, starke Küste gegen Binnenland: Bauland-Median alt +17 / +16 / +12 %, neu +2 / +3 / −1 % (11 / 16 / 28
Tage). Bürger im oberen Zehntel alt +12 / +8 / +16 %, neu +5 / +6 / +10 %. Nahrungskapazität in allen Zeilen gleich.

## Abschlussprüfung (28.11.2026)

- **Bestehende Dörfer unverändert:** vollständige Dorfanlage (jede Kachel mit Bauart, Haustyp, Baustelle) und
  Bürgerzahl für 18 Standorte × 4 Altersstufen, gegründet am 01.01.2026 und am 27.11.2026, auf unverändertem `main`
  (687e02d) und auf diesem Branch berechnet: 144 von 144 Anlagen identisch. Bei Gründung nach dem Stichtag weichen
  genau die 13 Küstenstandorte ab, die 5 Binnenstandorte bleiben identisch.
- **Neue Form stabil:** k hängt nur vom Standort ab (nicht von Dorf-ID, Gründungstag oder Aufrufreihenfolge);
  Bauland je Standort zwischen 100 und 103 % eines Binnenkreises.
- **Straßenfreischaltung (road-settle):** Die Suite läuft jetzt unter beiden Küstenformen
  (`road-settle.test.ts` alte Form, `road-settle-area.test.ts` neue Form), je 13 Tests. Unter der neuen Form schlug
  zunächst eine Prüfung fehl („Häuser durchlaufen eine Baustelle“, Öffnung bei 720 h). Ursache war die Stichprobe des
  Tests: eine Baustelle steht 0,6 Stunden, geprüft wurde alle 3,6 Stunden. Feinere Abtastung zeigt Baustellen unter
  beiden Formen (79 bzw. 86 von 484 Zeitpunkten). Die Prüfung tastet jetzt mit halber Bauzeit ab und kann eine
  vorhandene Baustelle nicht mehr verfehlen.
- **Sieben fehlgeschlagene Tests:** `civic.pg.test.ts` (5) und `resources.pg.test.ts` (2), am 28.11.2026 um 10:25 UTC
  auf unverändertem `main` (687e02d) zweimal und auf diesem Branch einmal ausgeführt: dieselben sieben Tests, dieselben
  Fehlermeldungen. Sie stammen nicht aus diesem PR und sind hier nicht korrigiert.

## Offen (Entscheidungen von Stephan)

1. Flächentreue Regel auch auf bestehende Küstendörfer anwenden (Neuanordnung, siehe oben)?
2. Wachstumswirksamer Agrarvorteil der Kornkammer (neue Regel).
3. Rest im oberen Zehntel bei großen Küstendörfern (Speichenbündelung) – nur mit Eingriff in die Straßenanlage lösbar.
4. Einzelne Küstenstandorte bleiben deutlich unter dem Binnenland (Landzungen, Fels), auch mit maximaler Dehnung.

Nicht durch Tests ersetzbar: Sichtprüfung eines neu gegründeten Küstendorfs im Spiel (Lovable).
