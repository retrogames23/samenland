# Klangkonzept für Samenland

Ziel: Die Welt klingt so, wie sie aussieht – leise, natürlich, gemütlich. Was man sieht, hört man; was weit weg ist, verschwindet sanft.

## 1. Grundprinzip: Klang folgt der Kamera
- **Zoomstufe bestimmt die Klangebene:**
  - Ganz draußen (Kartenübersicht): Wind, Möwen an der Küste, ferne Brandung.
  - Mittlere Höhe: Wind wird leiser, Landschaft kommt dazu (Wald, Flüsse, Vögel).
  - Nah am Dorf: Dorfleben – Stimmengemurmel, Schritte, Werkzeuge, Tiere.
- **Was im Bild ist, ist hörbar.** Quellen am Bildrand leiser, links/rechts im Stereobild passend zur Position.
- **Weiche Überblendungen** (1–2 s), nie hartes Ein-/Ausschalten.

## 2. Umgebungsflächen (Dauerklänge)
| Quelle | Klang | Wann |
|---|---|---|
| Hohe Zoomstufe | Wind, böig | Stärke wechselt langsam |
| Wald/Bäume | Blätterrauschen | lauter mit Baumdichte im Bild |
| Bach/Fluss | Plätschern, Fließen | lauter nah am Wasser |
| Küste/Meer | Brandung, Möwen | Küste im Bild |
| Dorf | Stimmengemurmel | Anzahl Bewohner im Bild, nachts leiser |
| Felder | Grillen (Sommer), Feldlerche | je nach Jahreszeit |

## 3. Punktquellen (an Gebäuden/Objekten)
- Lagerfeuer: Prasseln, gelegentliches Knacken.
- Schmiede: Hammerschläge auf Amboss.
- Windmühle: Knarzen der Flügel; Wassermühle: Rad plätschert.
- Sägewerk: Sägen; Baustellen: Hämmern, Schaufeln.
- Holzfäller: Axthiebe, selten fallender Baum; Steinmetz: Meißeln.
- Kirche: Glocke zur vollen Stunde (echte Uhrzeit).
- Karren: Holzräder rumpeln, Ochse schnaubt; Boote: Wellenschlag.

## 4. Bewohner & Gespräche
- Keine echte Sprache, sondern gemütliches „Simlish“-Murmeln (kurze Silbenlaute), passend zur Sprechblase und zum Sprecher (Kind/Erwachsener/Alt).
- Nur die nächsten 2–3 Gespräche hörbar, Rest als Gemurmel.
- Schritte: leise, nur ganz nah, Untergrund (Gras/Weg).

## 5. Tag, Nacht & Jahreszeiten
- Morgen: Hahn, Vogelchor. Abend: Amsel. Nacht: Grillen, Eule, Feuer lauter, Dorf still.
- Winter: gedämpft, kein Blätterrauschen, kalter Wind. Herbst: raschelndes Laub. Frühling: mehr Vögel.

## 6. Interaktion (Klick-Reaktionen)
- Schaf anklicken: „Mäh!“ und Schaf hüpft kurz.
- Huhn: Gackern; Ochse: Muhen; Bewohner: kurzes „Hm?“ / Gruß.
- Gebäude anklicken: passender Kurzklang (Tür, Glocke, Hammer).
- Samen setzen: weiches Erde-Geräusch und kleines Glöckchen.
- Meilenstein/neue Wachstumsstufe: kurze warme Melodie (Laute/Flöte).

## 7. Musik (optional)
- Sehr sparsame, akustische Musikstücke (Gitarre, Flöte), die nur gelegentlich spielen, dazwischen lange Ruhe.

## 8. Bedienung
- Lautsprecher-Symbol neben dem Vollbild-Knopf: an/aus.
- Einstellungen: Gesamtlautstärke, Umgebung, Effekte, Musik.
- Ton startet erst nach erster Berührung (Browser-Pflicht), standardmäßig an mit leiser Lautstärke; Einstellung wird gemerkt.
- Tab im Hintergrund = stumm.

## 9. Umsetzung in Schritten
1. Grundgerüst + Lautsprecherknopf + Wind/Dorfgemurmel nach Zoom.
2. Landschaft: Blätter, Wasser, Meer, Feuer – an echte Positionen im Bild gebunden.
3. Klick-Reaktionen (Schaf „Mäh!“, Huhn, Bewohner).
4. Handwerk & Baustellen, Kirchenglocke, Tag/Nacht/Jahreszeit.
5. Optional Musik.

## Technische Details
- Web Audio API: ein `AudioContext`, Mixer-Busse (ambient/sfx/music) mit GainNodes, `StereoPannerNode` je Punktquelle.
- Neues Modul `src/game/audio.ts`; Render-Schleife übergibt pro ~200 ms eine Zusammenfassung des sichtbaren Bereichs (Zoom, Anzahl Bäume/Wasserkacheln/Bewohner, nächste Punktquellen) – keine Audio-Logik pro Frame.
- Dauerklänge als nahtlose Loops, Punktquellen aus kleinen Pools mit zufälliger Tonhöhe/Pause, max. ~12 gleichzeitige Stimmen.
- Klänge: lizenzfreie Aufnahmen (CC0) oder per KI erzeugt, als kleine komprimierte Dateien (Ziel < 2 MB gesamt), vorab geladen.
- Klänge sind rein lokal und abgeleitet – nichts wird gespeichert, passt zum deterministischen Weltmodell.
- Texte der Einstellungen in i18n.ts (de/en).
