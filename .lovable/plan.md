# Taverne: Gruppenchat, Direktnachrichten, Blockieren

## Was der Spieler sieht
- Neuer Knopf **„Taverne"** in der linken Leiste (über „Anleitung"), mit kleinem Punkt bei ungelesenen Nachrichten.
- Öffnet ein Pergament-/Holz-Fenster im IRC-Stil: links eine Kanal-Liste, rechts der Verlauf als Zeilen
  `[02:31] <Jaroslav · Roggenfeld> Guten Abend!` in Schreibschrift-Optik, unten eine Eingabezeile.
- **#Taverne**: ein gemeinsamer Raum pro Karte (Europa, US-West, …), damit man mit den Nachbarn spricht.
- **Direktnachrichten**: Klick auf einen Namen im Chat, in der Dörfer-Liste oder beim Dorfschulzen → „Brief schreiben". Gespräche erscheinen in der Kanal-Liste unter „Briefe".
- **Blockieren/Entblocken**: Klick auf einen Namen → „Blockieren". Dessen Nachrichten verschwinden bei dir aus der Taverne, und er kann dir keine Briefe mehr schicken. Eine Liste „Blockiert" in den Einstellungen des Chats erlaubt das Entblocken.
- Schreiben nur mit eigenem Dorf (Absender = Dorfschulze + Dorfname). Ohne Login nur lesen.
- Neue Nachrichten erscheinen sofort (Live-Aktualisierung). Max. 300 Zeichen, kleine Bremse gegen Spam (1 Nachricht / 2 s).
- Alle Texte deutsch/englisch.

## Technische Details
- Migration:
  - `chat_messages` (id, realm, sender_id, sender_seed, recipient_id NULL = Taverne, body, created_at). RLS: Taverne lesbar für alle Angemeldeten; DM nur für Sender/Empfänger; Einfügen nur als sich selbst mit eigenem Samen. Guard-Trigger: Länge 1–300, Rate-Limit, DM verboten, wenn Empfänger den Sender blockiert hat.
  - `chat_blocks` (blocker_id, blocked_id, unique). RLS: nur eigene Zeilen sehen/anlegen/löschen.
  - GRANTs für authenticated/service_role, Realtime für `chat_messages`.
- Client: `src/components/Tavern.tsx` (Kanäle, Verlauf der letzten 200, Eingabe, Namensmenü), Realtime-Abo in useEffect mit eindeutigem Kanalnamen; blockierte Absender werden clientseitig ausgefiltert.
- Game.tsx: Leisten-Knopf, Ungelesen-Zähler (letzte Ansicht in localStorage), „Brief schreiben" in Dorf-/Personeninspektion.
- i18n.ts: `tavern`-Block de/en.
- Tests: Guard-Logik (Länge, Block) per SQL-Prüfung; Unit-Test für Filter/Ungelesen-Zählung.
- AGENTS.md: Regel, dass Chat die einzige frei beschreibbare Spielertext-Tabelle ist und Blockieren in der Datenbank erzwungen wird.
