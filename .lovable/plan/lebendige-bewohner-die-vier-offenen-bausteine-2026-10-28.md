# Lebendige Bewohner – die vier offenen Bausteine

Alle Bausteine bleiben deterministisch: Sie werden aus Person, Haus, Datum und Weltuhr berechnet und nie gespeichert. Jeder Spieler sieht dasselbe Dorf, und das Wachstum läuft auch ohne Zuschauer weiter.

## 1. Sonntagsruhe
- Sonntags (nach der Weltuhr der Karte) ruhen Feld-, Bau- und Werkstattarbeit. Bäcker, Wirt und Hirten arbeiten weiter.
- Um 10 Uhr läuten die Glocken. Die Bewohner gehen zur Kirche oder, wo es keine gibt, zum Dorfplatz. Sie bleiben etwa eine Stunde und gehen dann zurück.
- Am Nachmittag gehen sie spazieren, Nachbarn sitzen beisammen, Familien besuchen ihre Verwandten.
- Das Bauwachstum selbst läuft unverändert weiter, damit die Zwei-Jahres-Taktung stimmt. Nur die sichtbaren Arbeiter haben frei.

## 2. Sichtbarer Hochzeitszug
- Am Hochzeitstag gehen die Brautleute von ihren beiden Elternhäusern los, die Verwandten folgen ihnen.
- Der Zug geht über die Kirche (oder den Platz) zum neuen Haus. Am Ende stehen Gäste vor dem Haus, und das Wirtshaus ist abends voll.
- Den Hochzeitsschmuck (Kranz, Schleier, Blumen) male ich als eigene Bilder im bestehenden Malstil.
- Mit „Hinschauen“ im Pergament fährt die Kamera direkt zum Zug.

## 3. Wesenszüge und Gedanken
- Jeder Bewohner bekommt 1–2 feste Wesenszüge aus etwa 12, zum Beispiel Frühaufsteher, Geschichtenerzähler, Wetterfühlig, Naturfreund oder Gesellig.
- Die Wesenszüge wirken leicht auf den Alltag: Frühaufsteher stehen früher auf, Gesellige reden öfter, Naturfreunde gehen am Sonntag weiter spazieren.
- Wenn man jemanden anklickt, zeigt der Steckbrief einen Gedanken. Er hängt ab von Tätigkeit, Wetter, Jahreszeit, Familie (Hochzeit, Neugeborenes) und Wochentag.
- Alle Texte gibt es auf Deutsch und Englisch.

## 4. Krankheit und Pflege
- Ist die Gesundheit im Dorf niedrig, liegen einzelne Bewohner einige Tage krank daheim. Ihre Zahl richtet sich nach dem bestehenden Vitalitätsmodell.
- Ein Angehöriger aus demselben Haus bleibt zur Pflege daheim. Hochzeitsfreude und Familienbande schützen weiter wie bisher.
- Der Steckbrief zeigt „krank – gepflegt von Anna (Tochter)“. Nachts brennt im Krankenzimmer ein Licht.

## Reihenfolge
1. Wesenszüge (sie sind die Grundlage für die anderen Bausteine)
2. Sonntagsruhe
3. Krankheit und Pflege
4. Hochzeitszug mit den neuen Bildern

## Technische Details
- Neues reines Modul `src/game/traits.ts`: Wesenszüge per Hash aus der Personen-ID, Gedanken als Codes. Die Texte stehen in `i18n.ts`.
- `time.ts`: Helfer `isSunday(now)` über `clock()` und die Zeitzone der Karte.
- `people.ts`: Tagesablauf mit Sonntagszweig und Verschiebungen durch Wesenszüge. Kranke und Pfleger werden aus Gesundheit, Tag und Haus abgeleitet. Der Hochzeitszug wird als Pfad aus `weddings.ts` berechnet (Elternhäuser → Kirche → neues Haus) und läuft über `motion.ts`.
- `folk-sprites.ts`: neue Hochzeitsbilder; `night.ts`: Licht im Krankenzimmer.
- Tests: Sonntag hängt von der Kartenzeit ab, Wesenszüge sind stabil, Kranke haben immer einen Pfleger aus dem eigenen Haus, und der Zug endet am neuen Haus.
