# Pilot 3 – Kamera-Sprungpunkt, Insel/Zunge, Winterraute

Stand 2026-11-09. Keine Änderung an Spielgrafik, Gelände, Texturen, Sprites, Renderlogik oder Mechanik. Wald-Gras-Übergang **nicht** umgesetzt.

## 1. Kamera-Sprungpunkt (Testwerkzeug)
- Ort: `src/components/Game.tsx` (ein `useEffect` direkt nach `target`).
- Schnittstelle: `window.__labCam(kachelX, kachelY, zoom?)` → `true` bei Erfolg, `false` wenn nicht die Testkarte `lab` geladen ist.
- Nur auf `lab` wirksam; keine Bedienelemente, keine Änderung an Steuerung oder Kameralogik des normalen Spiels. Setzt nur Kameramitte (`iso(x,y)`) und Zoom.
- Aktivieren: als Admin Testkarte `lab` laden, dann in Konsole/Playwright `window.__labCam(300, 411, 4.5)`.
- Deaktivieren: nichts nötig – auf anderen Karten ist der Aufruf wirkungslos; beim Verlassen des Spiels wird die Funktion entfernt. Zum vollständigen Ausbau den einen `useEffect` löschen.
- Hinweis: Direkt nach dem Laden kann der Aufruf `false` liefern (Karte noch nicht geladen); das Skript wiederholt bis `true`.

## 2. Koordinaten (aus `terrain()` in world.ts, Scan 265–345 × 395–470)
| Situation | Kacheln | Kamera |
|---|---|---|
| Kleine Waldinsel | (321,424),(322,424) – 2 Kacheln, ringsum Gras | 321.5 : 424 |
| Schmale Waldzunge | (300,411), 1 Kachel breit, Wald N/S, Gras O/W | 300 : 411 |
Weitere Einzelinseln: (298,421), (319,423), (295,433).

## 3. Aufnahmen
12 Bilder (Sommer/Herbst/Winter × Normal 2,4 / Nah 4,5), alle mit `sprung=True` und Bake-Nachweis (≥3 fallbackfreie Frames, Methode aus ERGAENZUNG.md). Zwei erste Versuche (Herbst/Winter Insel normal) lieferten `sprung=False` und wurden verworfen und wiederholt.

**Befund Insel:** eindeutig gefunden, aber **ohne jeden Waldboden** – drei Bäume stehen auf Gras. Das bestätigt den Befund §4.1 der Ergänzung (Glättung löscht kleine Inseln) und ist der stärkste Beleg für den gesicherten Waldkern.
**Befund Zunge:** Waldfläche mit Bäumen klar sichtbar; die 1-Kachel-breite Zunge selbst ist im Boden kaum ausgeprägt – auch hier rundet die Glättung ab.
**Winter:** Inseln/Zungen nur über Bäume lesbar, grauer Konturstrich an größeren Waldflächen wie bereits dokumentiert.

## 4. Helle Winterraute – eigenes Arbeitspaket (nicht behoben)
Ursache: **Mauszeiger-Markierung**, render.ts Zeile 4179–4181 (`hover`, `rgba(255,240,200,0.14)` über genau einer Kachel). Die früheren Skripte ließen die Maus nach Klick/Mausrad-Zoom über der Karte stehen. Auf Schnee fällt der helle Ton am meisten auf. Kein Chunk-Fallback (der wäre grün `#7a8a50` und 16 Kacheln groß), keine saisonale Farbabweichung. Neue Aufnahmen bewegen die Maus nicht → keine Raute.
Offene Frage für ein eigenes Paket: Soll die Markierung im Winter weniger hell sein? Keine Änderung vorgenommen.

## 5. Voraussetzungen Pilot 3 (unverändert, nicht umgesetzt)
Waldkern bis Rautenabstand 0,85 · Baumfüße per Test im Waldpfad · deterministischer weltgebundener Saum · organische Formen statt Weichzeichnung · keine Partikel auf Wasser/Sand · andere Schichten unberührt · Partikelgröße im Boden-Labor · Winter ohne ungewollten grauen Strich.

## 6. Geänderte Dateien
- `src/components/Game.tsx` – Test-Schnittstelle `__labCam` (nur `lab`).
- `docs/terrain/wald-gras-uebergang/KAMERATEST.md` (neu), `scripts_aufnahme_kameratest.py` (neu), `aufnahmeprotokoll_kameratest.tsv` (neu), `kontaktbogen_kameratest.jpg` (neu).

## 7. GitHub
Das Repository-Remote ist nur Lovable-intern sichtbar; Ankunft bei GitHub und eine Commit-ID kann ich nicht nachweisen. Änderungen werden automatisch gespeichert.
