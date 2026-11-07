# Restpunkte aus dem Audit – in Blöcken

Erledigt sind bereits: Kassenabrechnung entlastet, Rang-Aufgaben abgesichert, Ton beim Verlassen pausiert, längere Testzeit.

## Block 1 – Einwohner-Aufgaben absichern (klein, ca. 1 h)
- Die Aufgaben „10 / 50 / 150 Einwohner" zahlt die Kasse künftig nur aus, wenn der Server die Einwohnerzahl gerade selbst nachgezählt hat (wie schon bei den Rang-Aufgaben).
- Der Server-Rangbescheid speichert dafür zusätzlich die gezählten Bürger.
- Für Spieler ändert sich nichts Sichtbares; bereits abgeholte Belohnungen bleiben.

## Block 2 – Kleine Aufräumarbeiten (klein, ca. 30 min)
- Sperrgrund bei der Gemeindetruhe von „Alter" auf „Rang" umstellen, damit die Meldung im Baumenü stimmt.
- Kurze Prüfung, dass nirgends mehr Tage als Bedingung angezeigt werden.

## Block 3 – Versorgungs-Engpass sichtbar machen (mittel, ca. 2 h)
- Wenn der Ort wegen fehlender Nahrungs- oder Heilbauten nicht wächst, zeigt das Baumenü einen dezenten Hinweis am passenden Gebäude („Dein Ort braucht mehr Nahrung").
- In allen acht Sprachen, im Pergament-Stil, ohne neue Vektorgrafik.

## Block 4 – Spieloberfläche aufteilen, Schritt 1 (groß, ca. 4–6 h)
- Die riesige Hauptdatei wird in eigenständige Teile zerlegt: Kassen-Abgleich, Live-Updates der Karte, Kamera/Steuerung.
- Rein technisch: Verhalten und Aussehen bleiben identisch; Ziel sind weniger Fehler und schnellere künftige Änderungen.
- Danach vollständiger Testlauf und Sichtprüfung auf Desktop und Handy.

## Block 5 – Spieloberfläche aufteilen, Schritt 2 (groß, später)
- Große Fenster (Baumenü, Begegnungen, Fürstenhof, Post) in eigene Teile auslagern.

## Technische Details
- Block 1: `rank_certificates` um Spalte `citizens` (default 0) erweitern; `certifyRank` schreibt `citizensOf`-Zahl; `quest_guard` prüft `ten/fifty/hundred` gegen frisches Zertifikat (15 min); `claimQuest` zertifiziert vorher.
- Block 2: `chestBlock` in `economy.ts` Rückgabe `"age"` → `"rank"`, Aufrufer in `Game.tsx` und i18n anpassen; Test in `chest.test.ts`.
- Block 3: `careStage/careCeiling` aus `world.ts` im Baumenü auswerten; Texte in `i18n.ts`.
- Block 4: Hooks `useTreasurySync`, `useWorldRealtime`, `useMapControls` unter `src/components/hooks/`.

Empfohlene Reihenfolge: 1 → 2 → 3 → 4, Block 5 bei Bedarf.
