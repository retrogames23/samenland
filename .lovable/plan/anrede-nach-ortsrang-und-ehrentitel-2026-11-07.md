# Anrede nach Ortsrang und Ehrentitel

## Ziel
1. Ab Kleinstadt (Amtshaus) wirst du nicht mehr als Schulze angesprochen, sondern als Bürgermeister. Das gilt für Sprechblasen, Boten, Fürstenhof, Bittschriften, Chronik und Anzeigen.
2. Der höchste Titel aus „Amt & Würden“ steht auf deiner Bürgerkarte und kommt in Begrüßungen vor (Chronik-Schreiber, Fürstenaudienz).

Alles gibt es männlich, weiblich und neutral. Wo es keine glaubwürdige neutrale Form gibt, wird die männliche verwendet.

## Anrede je Stufe (Deutsch)

| Ortsrang | M | W | D |
|---|---|---|---|
| Siedlung bis Dorf | Schulze | Schulzin | Dorfoberhaupt |
| ab Kleinstadt | Bürgermeister | Bürgermeisterin | Stadtoberhaupt |

Die anderen sieben Sprachen bekommen dieselbe Abstufung, zum Beispiel: Englisch reeve/mayor und village head/town head, Französisch maire/mairesse und chef du village/chef de la ville, Spanisch alcalde/alcaldesa. Arabisch, Hindi, Chinesisch und Japanisch erhalten jeweils eine Dorf- und eine Stadtform. Wo eine Sprache nicht nach Geschlecht unterscheidet, gilt eine gemeinsame Form.

## Ehrentitel, ebenfalls in drei Formen
Die zwölf Titel (4 Chartawege × 3 Stufen) bekommen je eine M-, W- und D-Form, zum Beispiel:
- Ratsherr / Ratsfrau / Ratsmitglied der Gilde
- Zunftältester / Zunftälteste / Zunftältestes Mitglied
- Flurvogt / Flurvögtin / Flurvogt (Rückfall auf männlich)

Lateinische Ämter wie „Magister Artium“ oder „Rector Magnificus“ bleiben unverändert, so wie sie um 1500 hießen.

Sichtbar wird der Titel:
- auf der Bürgerkarte des Schulzen, unter dem Namen, z. B. „Bürgermeisterin · Ältermann des Kontors“
- in der Begrüßung durch den Chronik-Schreiber und den Herold
- im Menü „Amt & Würden“ in der passenden Form

## Was gleich bleibt
- Preise, Boni, Ränge und gespeicherte Daten. Es geht nur um Anzeige und Text.
- Bei Fremden und Besuchern richtet sich die Anrede nach deren eigenem Ort.

## Technische Details
- Neues Modul `src/game/lang/address.ts`:
  - `mayorWord(lang, gender, rank, case)` liefert das passende Wort.
  - `addressMayor(text, lang, gender, rank)` ersetzt den alten `neutralMayor` (de/en) und ersetzt die Standardwörter in allen 8 Sprachen. Die Wortformen kommen in einer Tabelle pro Sprache.
- Die Aufrufer in `Game.tsx` und `petitions.ts` übergeben zusätzlich `townRank` (in `Game.tsx` ist `myRank` schon vorhanden). Sprechblasen und Herold-Texte in `banter.ts`, `edicts.ts`, `court.ts`, `princely.ts` und `commons.ts` laufen über denselben Filter.
- `office.names` in `i18n.ts` wird zu `{ m, w, d? }` je Titel. `titleName(k)` wählt die Form nach `mayor_gender`.
- Auf der Bürgerkarte erscheint der Titel, wenn `titleOfSeed > 0`. Für andere Orte wird deren `townRank` aus einem Zwischenspeicher gelesen (wie beim Amtssitz).
- Tests in `src/game/lang/address.test.ts`:
  - Dorf/m → Schulze, Kleinstadt/w → Bürgermeisterin, Kleinstadt/d → Stadtoberhaupt
  - fehlende D-Form fällt auf die männliche zurück
  - der Ersetzungsfilter wirkt in allen 8 Sprachen
- Eine Regel in `src/game/lang/AGENTS.md`: Die Anrede leitet sich nur aus Geschlecht und Ortsrang ab und wird nie gespeichert.
