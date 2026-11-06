# Hochzeiten reparieren – alle Befunde aus dem Testbericht

## Was sich für dich ändert
- Hochzeit im Steuerungspult zeigt sofort das Pergament, und die Kamera fährt zum richtigen Ort.
- Die Kamera folgt dem Ablauf: Brauthaus → Kirchenportal → neues Heim.
- Ein Pfarrer tritt vor das Portal und traut das Paar.
- Die Trauung dauert spürbar, aber nicht ewig. Danach zieht die Gesellschaft mit dem Paar weiter und löst sich auf.
- Das Paar bleibt nach dem Fest noch eine Weile zu Hause und geht nicht direkt aufs Feld.
- Braut und Bräutigam gehen sauber nebeneinander, egal in welche Richtung.
- Glockengeläut, Glückwunsch-Sprüche in allen 8 Sprachen und eine Melodie, die um 1500 glaubwürdig ist, statt Mendelssohn.
- Auf der Testkarte stören „Samen setzen“ und die Begrüßung die Fest-Pergamente nicht mehr.

## Schritte
1. **Cache-Fehler**: In den Cache-Schlüssel von `townOf()` (people.ts) kommt der Test-Hochzeitsstempel, so wie in `disasters.ts`. Dann sieht die Chronik das Fest im selben Frame.
2. **Ort im Chronik-Eintrag**: `chronicle.ts` speichert am Hochzeitseintrag zusätzlich die Kirche und das neue Heim. Eine reine Funktion `weddingFocus(w, now)` gibt je nach Phase den Ort zurück (Brauthaus / Portal / Heim). `labTrigger` und Klicks in der Chronik nutzen sie.
3. **Pfarrer**: Bei einer laufenden Trauung wird ein Priester des Dorfs (fest per Seed) für das Trauungsfenster vor `front(church)` gestellt, mit Blick zum Paar. Gibt es keinen Priester, kommt ein Gast-Pfarrer aus der Kirche.
4. **Zeiten**: Trauung `SERVICE_SECS` von 20 auf ca. 4 Minuten, mit kleinen Bewegungen (Hände reichen, zueinander drehen). Gäste bleiben nur bis zum Ende der Trauung plus Auszug (statt 60 Minuten fest), danach folgen einige dem Paar zum Heim und gehen heim.
5. **Nach dem Fest**: Das Paar bleibt bis zum Ende des Tages zu Hause (Hof/Tür). Der normale Tagesplan setzt erst danach wieder ein.
6. **Nebeneinander gehen**: Statt `dx = 0.3` bekommt die Braut einen Versatz quer zur Laufrichtung des aktuellen Pfadstücks. Die Seite bleibt fest, und der Versatz wird nur gesetzt, wenn die Kachel begehbar ist.
7. **Ton und Stimmung**: Beim Eintreffen an der Kirche läutet die Glocke (vorhandenes Glocken-Audio). Neue Hochzeitssprüche für Gäste in `banter` kommen über den Übersetzungskatalog (de/en/fr/es/ar/hi/zh/ja). Der Jingle in `audio.ts` wird durch eine schlichte Melodie im Stil einer Schalmei oder eines Kirchenlieds ersetzt.
8. **Testkarte**: Ohne eigenes Dorf auf der Testkarte öffnet sich „Samen setzen“ für Admins nicht von selbst, und die Begrüßung bleibt aus. Pult-Ereignisse schließen offene Schubladen, bevor das Pergament kommt.

## Prüfung
- Tests: Cache enthält die Test-Hochzeit, `weddingFocus` liefert je Phase den richtigen Ort, ein Priester ist während der Trauung zugewiesen, Gäste sind nach Ende der Trauung plus Auszug weg, die Braut steht quer zur Laufrichtung.
- Browserlauf als Admin auf der Testkarte: Pult → Hochzeit, dann Screenshots von Pergament, Portal mit Pfarrer und Brautzug.

## Technische Details
Betroffene Dateien: `people.ts`, `weddings.ts`, `chronicle.ts`, `Game.tsx`, `audio.ts`, `banter`-Sprachdateien und `i18n.ts`, `wedding-crowd.test.ts` (wird erweitert). Alles bleibt deterministisch aus Seed und Zeit, ohne gespeicherten Zustand.
