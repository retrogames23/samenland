export const giftReadKey = (userId: string) => `samenland-gifts-seen:${userId}`;

export function parseGiftReads(value: string | null): string[] {
  try {
    const rows: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(rows) ? [...new Set(rows.filter((id): id is string => typeof id === "string"))] : [];
  } catch { return []; }
}

export function mergeGiftReads(...lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}