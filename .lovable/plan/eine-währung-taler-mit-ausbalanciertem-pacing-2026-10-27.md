# Eine Währung: Taler – mit ausbalanciertem Pacing

## Ziel
Statt Gold/Silber/Kupfer gibt es nur noch **Taler**. Jeder Bewohner zahlt **1 Taler pro Tag**. Gleich zu Beginn kann man sich ein erstes Gebäude leisten, danach gibt es über die ganzen zwei Jahre immer wieder ein nächstes Sparziel.

## Einnahmen (berechnet mit der echten Wachstumskurve)

```text
Tag      Bewohner  Taler/Tag  gesammelt (inkl. 150 Start)
1        9         9          ~160
7        27        27         ~280
30       65        65         ~1.400
90       118       118        ~7.000
180      171       171        ~20.000
365      249       249        ~59.500
730      365       365        ~172.500
```

## Startguthaben und Preise
- **Start: 150 Taler** – reicht sofort für ein Einstiegsgebäude.
- Gebäude sind nach Epochen gestaffelt, sodass etwa alle 1–4 Wochen (später alle 1–2 Monate) ein neues Ziel erreichbar ist:

```text
Gebäude          Preis     erreichbar ca.
Fischerhütte     120       sofort (Startgeld)
Kornspeicher     300       ~Tag 5
Heilerhütte      900       ~Tag 3–4 Wochen
Schule           3.000     ~Tag 55
```
- Weitere Gebäude für spätere Epochen (5.000 bis ~60.000 Taler) folgen in einem eigenen Schritt (Epochen-Katalog), damit auch das zweite Jahr Ziele hat.

## Anzeige
- Oben eine einzige goldene Talermünze (geprägtes „T“, Metallglanz) mit der Zahl daneben, z. B. **„ 245 Taler · +27/Tag“**.
- Im Bau-Menü stehen Preise einheitlich als „120 Taler“.
- Texte auf Deutsch und Englisch („Taler“ / „Thaler“).

## Technische Details
- `economy.ts`: `START_COPPER` → `START_TALER = 150`, neue `ITEMS`-Preise, `coins()` entfernen; Steuerformel bleibt 1 pro Bewohner und Tag.
- Datenbank: Migration ersetzt `village_tax()`/`purchase_guard()` mit Start 150 und den neuen Preisen (Kauf wird weiterhin dort geprüft). Bereits getätigte Käufe behalten ihre gespeicherten Kosten.
- `i18n.ts`: `coin`-Kürzel durch `taler`-Begriff ersetzen; `Game.tsx`: Münzanzeige oben und Preise im Bau-Menü umbauen, neues Münz-Design über Design-Tokens.
- `economy.test.ts`: Tests für Start 150, 1 Taler pro Bewohner/Tag, Fischerhütte am ersten Tag bezahlbar, Schule nicht vor ~Tag 50.
