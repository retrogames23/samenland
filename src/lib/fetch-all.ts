// The data API returns at most 1000 rows per request: page through, and send long id lists in chunks.
type Q<T> = { range: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: unknown }> };
export async function allPages<T>(q: () => Q<T>, size = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await q().range(from, from + size - 1);
    if (error) throw new Error(`paged read failed after ${out.length} rows`);
    out.push(...(data ?? []));
    if (!data || data.length < size) return out;
  }
}
export async function allIn<T>(ids: string[], q: (chunk: string[]) => Q<T>, chunk = 150, size = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += chunk) { const c = ids.slice(i, i + chunk); out.push(...(await allPages(() => q(c), size))); }
  return out;
}
