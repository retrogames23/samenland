// The data API returns at most 1000 rows per request. Reads page by keyset (rows strictly after the last
// one read, in a unique order), so rows inserted meanwhile never shift pages; long id lists go in chunks.
// A page error or `data === null` aborts the whole read — a partial result is never returned as complete.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Res = PromiseLike<{ data: any[] | null; error: unknown }>;
export type Builder = { gt: (c: string, v: string) => Builder; or: (f: string) => Builder; order: (c: string) => Builder; limit: (n: number) => Res };
/** "id" (or any unique column) pages by that column; "chrono" pages by (created_at, id). */
export type Key = string;
const quote = (v: unknown) => `"${String(v).replace(/"/g, '\\"')}"`;
export async function allPages<T>(q: () => any, key: Key = "id", size = 1000, label = "rows"): Promise<T[]> {
  const out: T[] = [];
  for (let last: any = null; ;) {
    let b = q() as Builder;
    if (key === "chrono") {
      if (last) b = b.or(`created_at.gt.${quote(last.created_at)},and(created_at.eq.${quote(last.created_at)},id.gt.${quote(last.id)})`);
      b = b.order("created_at").order("id");
    } else {
      if (last) b = b.gt(key, String(last[key]));
      b = b.order(key);
    }
    const { data, error } = await b.limit(size);
    if (error) throw new Error(`${label}: read failed after ${out.length} rows`);
    if (data == null) throw new Error(`${label}: no data after ${out.length} rows`);
    out.push(...(data as T[]));
    if (data.length < size) return out;
    last = data[data.length - 1];
  }
}
export async function allIn<T>(ids: string[], q: (chunk: string[]) => any, key: Key = "id", chunk = 150, size = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += chunk) { const c = ids.slice(i, i + chunk); out.push(...(await allPages<T>(() => q(c), key, size))); }
  return out;
}
/** Same rows read through two columns (e.g. from/to), merged once per unique key. */
export async function allEither<T extends Record<string, any>>(ids: string[], cols: [string, string], q: (col: string, chunk: string[]) => any, key = "id"): Promise<T[]> {
  const [a, b] = await Promise.all(cols.map((col) => allIn<T>(ids, (c) => q(col, c), key)));
  return [...new Map([...a!, ...b!].map((r) => [r[key], r])).values()];
}
