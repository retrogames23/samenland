# Schritt 2: Allmende & Selbstverwaltung

Ziel: Das Dorf soll sich wie eine Gemeinde anfühlen, die sich selbst verwaltet. Die Bewohner bringen eigene Anliegen zur gemeinsamen Nutzung von Wald, Backofen und Steg vor. Kundige Leute geben Rat. Der Fürst ist ein ferner Landesherr, mit dem man auf Augenhöhe verhandelt. Es gelten die bekannten Regeln: alle 8 Sprachen, keine Ereignisse ohne sichtbare Spur auf der Karte, und Preise, Belohnungen und bestehende Aufgaben bleiben unverändert.

Wir gehen in vier Blöcken vor. Jeder Block lässt sich einzeln bauen, testen und freigeben.

---

## Block A: Gemeindeversammlung (Allmende-Fragen)

Neue Art von Anliegen: Eine echte Bewohnerin oder ein echter Bewohner (mit Name, Beruf und Haus, per Klick auffindbar) bittet die Gemeinde um eine Entscheidung. Für diese Anliegen gibt es nicht wie bei Begegnungen „Taler gegen Bonus“, sondern zwei oder drei gleichwertige Wege. Jeder Weg hat seinen eigenen kleinen Vor- und Nachteil.

Erste drei Fragen:
- **Hutewald:** Dürfen die Schweine diese Woche unter die alten Eichen?
  - Ja: Die Schweine stehen sichtbar am Waldrand, es gibt etwas mehr Nahrung, der Wald verjüngt sich langsamer.
  - Nein: Die Eicheln bleiben für das Wild, die Jägerhütte jagt besser.
- **Backhausrecht:** Bekommt die Nachbarschaft einen festen Backtag im Gemeindebackofen?
  - Ja: An diesem Wochentag raucht der Ofen, Frauen tragen Brotkörbe, es gibt mehr Gesundheit.
  - Nein: Jeder bäckt daheim, ohne Aufwand.
- **Steg am Mühlenbach:** Wird der Steg in Gemeinschaftsarbeit gebaut?
  - Gemeinschaftsarbeit: Bewohner arbeiten einen Tag lang sichtbar am Bach, der Steg bleibt kostenlos stehen.
  - Zimmermann beauftragen: Kostet Taler, geht schneller.

Wie es abläuft:
- Etwa einmal pro Woche ist eine Allmende-Frage fällig, abgestimmt auf die bisherigen Begegnungen. Der Kalender ist für alle Mitspieler gleich, und es ist immer nur ein Anliegen gleichzeitig offen.
- Die Frage erscheint nur in Dörfern, auf die sie passt: Hutewald nur mit Eichenwald in der Nähe, Steg nur am Bach.
- Die Entscheidung landet in der Chronik („Die Gemeinde beschloss …“).

## Block B: Weise Frau und Rat

- Die Kräuterfrau oder Hebamme wird zur Ratgeberin der Gemeinde. Bei jeder Allmende-Frage gibt sie, oder eine andere passende Person wie Müller, Jäger oder Dorfältester, einen kurzen Rat in eigener Stimme. Der Rat hängt vom Dorf ab, etwa: „Der Herbst war nass, die Eicheln faulen schnell – lasst die Schweine ruhig hinein.“
- Beim Anklicken zeigt die Kräuterfrau einen eigenen Titel und eigene Sprüche: Geburten, Heilkräuter, alte Bauernregeln. Ihr Weg führt sie sichtbar zu Kranken und Wöchnerinnen; dafür nutzen wir die vorhandenen Pflegerollen.
- Keine neue Kasse und keine neuen Preise. Ihre Rolle ist Stimme und Ansehen.

## Block C: Wandergesellen bringen Kniffe

- Kommt ein Wandergeselle auf der Walz ins Dorf, überbringt er einen Zunftgruß aus seinem Herkunftsort. Dazu bringt er einen handwerklichen Kniff mit, passend zu seinem Handwerk.
- Der Kniff ist eine kleine, sichtbare Verbesserung auf Zeit. Beispiele:
  - Ein Zimmergeselle: Ein laufender Bau geht schneller voran.
  - Ein Bäckergeselle: Am nächsten Backtag duftet es nach Gewürzbrot, das bringt etwas mehr Freude.
- Der Wirt erzählt davon. Die Chronik vermerkt Gast, Herkunftsort und Kniff.

## Block D: Der Fürst als ferner Landesherr

Die Erlasse des Herolds bekommen einen neuen Ton und neue Arten. Der Fürst befiehlt nicht mehr, sondern bestätigt, verleiht und bittet. Das Dorf antwortet als Freigemeinde:
- **Schutzbrief bestätigen:** Das Dorf legt seine alten Rechte vor, der Fürst siegelt sie. Danach hängt ein sichtbares Siegel an der Schulzenkate.
- **Marktrecht verleihen:** Das Dorf bittet um einen eigenen Markttag und bekommt eine Marktbude dafür.
- **Getreide für das Reichsbündnis:** Der Fürst erbittet Korn. Das Dorf kann voll liefern, um einen Teil nachverhandeln oder höflich ablehnen. Ablehnen kostet nichts, bringt aber weniger Gunst. Wer liefert, sieht einen Kornwagen abfahren.
- Die bisherigen Aufgaben und Belohnungen bleiben gültig, schon begonnene Folgen laufen weiter. Nur der Wortlaut wird überarbeitet, und neue Arten kommen in die Abfolge hinzu.

---

## Reihenfolge und Prüfung

1. Block A (das Kernstück, mit Datenbank-Schutz und Tests)
2. Block B (vor allem Texte und Stimmen, baut auf A auf)
3. Block D (Erlasse; berührt den Herold und die Gunst beim Fürsten)
4. Block C (baut auf den Wandergesellen und der Chronik auf)

Nach jedem Block: Tests für die neuen Regeln (Zeitplan der Fragen, Voraussetzungen, Wirkung der Antworten), eine Kontrolle aller 8 Sprachen und ein Blick auf die Karte, ob das Ereignis dort sichtbar ist.

---

## Technische Details

- **Allmende:** Neues Modul `src/game/commons.ts`.
  - Ein rein abgeleiteter Kalender aus Dorf und UTC-Woche bestimmt, welche Frage fällig ist.
  - Voraussetzungen wie Eichenwald oder Bach im Umkreis werden aus dem Gelände abgelesen.
  - Gespeichert wird nur die Antwort. Dafür entweder das vorhandene `decisions`-System mit neuen Ereignisschlüsseln wiederverwenden oder eine eigene Tabelle `commons_votes` anlegen. Ein DB-Guard begrenzt auf eine Antwort pro Frage und prüft den Preis der Zimmermann-Variante.
- **Wirkungen:**
  - Schweine, Backtag und Steg werden in `townOf`/`render` aus Antwort und Uhr abgeleitet, wie Maibaum und Kühe.
  - Boni laufen über die bestehenden Boon- und Larder-Pfade. Spiegelt die Datenbank einen Bonus (Wohlstand/Taler), werden `village_balance` bzw. der Guard gemeinsam angepasst.
- **Rat:** Funktion `adviceOf(question, seed, now)`, die einen Textcode und die sprechende Person zurückgibt. Die Texte kommen in eine neue Datei `src/game/lang/commons.ts` mit allen 8 Sprachen.
- **Kniffe:** Abgeleitet aus `wander.ts`, aus der Ankunft eines Gesellen und seinem Handwerk. Dauer und Wirkung sind reine Funktionen, nichts wird gespeichert. Der Bau-Kniff greift als zeitlich begrenzter Faktor in `workClock`/`specialDone`, damit Fertig-Zeiten überall übereinstimmen.
- **Erlasse:** Neue Arten kommen hinten an `PRINCELY_KINDS` an, damit bestehende Schritte gültig bleiben. Sie werden in `princely_task_def`/`princely_task_met` gespiegelt. Für „verhandeln/ablehnen“ wird die Antwort als Teilerfüllung mit reduzierter Belohnung gespeichert. Die Texte stehen in `src/game/lang/princely.ts`.
- Neue Regeln kommen als Einträge in `src/game/AGENTS.md`.
