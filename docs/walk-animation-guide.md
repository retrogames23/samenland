# Walk animations — how to avoid the mistakes we made

Every person and animal walks with a real step cycle. These are the faults that shipped before and the rule that prevents each.

| Fault seen | Cause | Rule |
|---|---|---|
| Legs don't match torso (hip break, wrong proportions) | One shared leg sheet pasted under differently painted torsos | Each figure gets its own whole-body sheet; the leg composite is fallback only |
| "Dancing on the spot", no real walking | AI generated four near-identical poses | Contact frames (0, 2) must spread the feet clearly wider than passing frames (1, 3) |
| Figure morphs/flickers between frames | Each frame painted as a new person | Head, torso and clothing identical in every frame; only legs, feet and arm swing change |
| Side jitter / moonwalk | Torso centroid drifts; facing flips | Torso centred in every frame; facing comes from motion.ts, never from the sheet |
| Floating or sinking feet, double bob | Uneven ground line; sheet bobs on top of `walkBob` | Lowest pixel on one shared ground line; equal height; vertical bob only from `walkBob` |
| Static shoe under robe, three feet | Painted feet left under a cut hem | Robes use `drawRobeWalk`; never keep painted feet below the hem |
| Clothes change with the task | Separate work/carry sprites per job | One identity per figure; tools and loads are props on that figure |

## Sheet format
- 4 frames side by side: contact L, passing, contact R, passing (`<name>-walk4.webp`).
- Width divisible by 4, alpha background, same height, shared ground line, torso-centred.
- Standing uses its own standing image (closed feet), not a walk frame, for dignified figures.
- Animals: same 4-frame rule; diagonal leg pairs alternate (trot), body silhouette constant.

## Production process
1. Start from the approved standing sprite; keep its torso pixels.
2. Draw/animate only the lower body (preferably by hand or a rigged tool — image generators cannot keep a gait consistent).
3. Normalise to the sheet format.
4. Run `python3 scripts/check-walk-sheets.py <file>` — must print no errors.
5. Run `bunx vitest run src/game/walk.test.ts`.
6. Check it in the Figure Lab (key P / `?figs`) on every card the figure appears on, at real speed.
7. Only then register it in `WALKS`/`WALK4` (folk-sprites.ts) and remove it from `KNOWN_BAD`.
