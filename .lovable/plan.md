# Phase C – Server-synchronisierte Realm-Uhr

Hinweis: Der hochgeladene Auftrag endet bei Punkt 6 mitten im Satz ("Implementiere mindestens die"). Umgesetzt wird die Testliste aus B.4 (9 Fälle).

## 1. `src/game/time.ts`
- Ankerpaar `T_ref`, `P_ref`, dazu `lastDeliveredClock`, Modus `normal | hold | slew` mit `T_start`, `P_end`, `T_est`.
- `initTimeSync(serverTime)`: `T_ref = serverTime`, `P_ref = performance.now()`, Modus normal.
- `getSyncedTime()`: Kandidat je Modus nach B.4
  - normal: `T_est + (P − P_end)`
  - hold (0 < Δ ≤ 3000): `max(T_start, target)`
  - slew (Δ > 3000): `max(T_start + 0,5·(P − P_end), target)`
  - Rückgabe `lastDeliveredClock = max(lastDeliveredClock, candidate)`; kein Hard-Reset. Ohne Init: `Date.now()`-Fallback.
- `syncServerTime(fetcher)`: `syncInFlight`-Sperre, RTT messen, RTT > 800 ms verwerfen, `T_est = T_server + RTT/2`, Modus nach Δ wählen. Fetcher als Parameter (testbar, kein Import der Serverfunktion in time.ts).
- `clock(real?)`: Mit explizitem Argument unverändertes Verhalten; ohne Argument `getSyncedTime()` statt `Date.now()`. Lab-Formel (`LAB_SPEED`, `labJump`) unverändert, nutzt denselben Eingang.

## 2. `src/game/time.functions.ts` (neu)
- `getServerTime = createServerFn({ method: "GET" }).handler(() => ({ serverTime: Date.now() }))`, ohne Datenbank.

## 3. Initialisierung
- `src/routes/index.tsx`: `loader: () => getServerTime()`, Komponente `IndexPage` liest Loaderdaten und rendert `<Game serverTime={…} />`. Kein Import von index.tsx in Game.
- `Game.tsx`: optionales Prop `serverTime`; Mount-Effekt: `initTimeSync`, sofortiger `syncServerTime`, `setInterval` 10 min, Aufräumen beim Unmount. Bestehender `onVis`-Handler (Z. 770) ruft zusätzlich `syncServerTime` bei Sichtbarkeit – kein neuer Listener.

## 4. `render.ts`
- Z. 3940: `heraldVisit(heraldRows, sd.id, now)` mit dem `now`-Parameter von `draw()`.

## 5. Game.tsx `Date.now()`-Prüfung
- Spielzeit → `clock()`: 1702 (heraldDue), 1747 (Auftragsannahme), 1794 (daysSince Wunder), 3103 (24-h-Grenze Dorfalter), 3325 (Ankunft Herold).
- Unverändert (technisch): 860, 1580, 1839, 2079, 2368.

## 6. Tests `src/game/realm-clock.test.ts`
Mit gemocktem `performance.now()` und Fetcher:
1. Initialer Anker
2. RTT/2-Korrektur
3. RTT > 800 ms verworfen
4. Positive Abweichung: sofort übernommen
5. Hold ≤ 3 s, danach v = 1,0
6. Slew −120 s: Werte aus B.4-Tabelle (0/60/120/180/240 s)
7. Übergang Slew → Normal nach 2Δ
8. 1.000 Aufrufe monoton über Hold/Slew/Syncs
9. `syncInFlight` + Lab-Isolierung, `clock(x)` mit Argument unverändert

Danach: gezielte Tests, Typecheck, Build. Grenzen: keine Formeländerungen, keine DB/Migration, keine Veröffentlichung.
