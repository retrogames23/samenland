#!/bin/sh
# Copy a checkout to $2 and add call counters (globalThis.__C) to the functions the monument benchmark reports.
# Offline only; the instrumented copy is never committed. Usage: monument-bench-instrument.sh <checkout> <dest>
set -e
rm -rf "$2"; mkdir -p "$2"
cp -r "$1/src" "$1/scripts" "$1/tsconfig.json" "$1/package.json" "$2/"
ln -s "$(cd "$1" && pwd)/node_modules" "$2/node_modules" 2>/dev/null || ln -s /home/user/samenland/node_modules "$2/node_modules"
W="$2/src/game/world.ts"; T="$2/src/game/time.ts"
P='const __C = ((globalThis as any).__C ??= { monumentChain: 0, chainMs: 0, specialDone: 0, guildtowerDone: 0, workClock: 0, effAge: 0 });'
sed -i "1i $P" "$W" "$T"
sed -i 's/^export function monumentChain(/function __monumentChain(/' "$W"
cat >> "$W" <<'EOT'
let __d = 0;
export function monumentChain(s: Seed, key: MonumentKey, until = Infinity) {
  __C.monumentChain++; const __t = __d++ === 0 ? performance.now() : -1;
  try { return __monumentChain(s, key, until); } finally { __d--; if (__t >= 0) __C.chainMs += performance.now() - __t; }
}
EOT
for f in specialDone guildtowerDone effAge; do sed -i "s/^\(export function $f(.*{\)\$/\1 __C.$f++;/" "$W"; done
sed -i 's/^\(export function workClock(.*{\)$/\1 __C.workClock++;/' "$T"
grep -c "__C\." "$W" "$T"
