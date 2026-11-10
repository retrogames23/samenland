// Persistent idempotency for "building finished" letters (DB outbox build_mail_outbox).
// The 3 h window only decides what gets *enqueued*; the primary key on purchase_id makes enqueueing idempotent,
// build_mail_claim hands each row to exactly one worker, and only 'sent' rows are final.

export type OutboxRow = { purchase_id: string; seed_id: string; user_id: string; item: string; claim_token: string; attempts: number };
export type Due = { purchaseId: string; seedId: string; userId: string; item: string; doneAt: number };

export interface OutboxStore {
  enqueue(d: Due): Promise<boolean>;
  claim(limit: number): Promise<OutboxRow[]>;
  finish(purchaseId: string, token: string, ok: boolean, error?: string): Promise<boolean>;
}

/** Send result: true = delivered (or recipient suppressed, nothing to retry), throws on transient failure. */
export type Sender = (row: OutboxRow) => Promise<boolean>;

export async function runOutbox(store: OutboxStore, due: Due[], send: Sender, limit = 50) {
  let enqueued = 0, sent = 0, failed = 0;
  for (const d of due) if (await store.enqueue(d)) enqueued++;
  const rows = await store.claim(limit);
  for (const r of rows) {
    try {
      await send(r);
      if (await store.finish(r.purchase_id, r.claim_token, true)) sent++;
    } catch (e) {
      failed++;
      await store.finish(r.purchase_id, r.claim_token, false, e instanceof Error ? e.message : String(e));
    }
  }
  return { enqueued, claimed: rows.length, sent, failed };
}

type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;

/** Store backed by the DB functions (service role). */
export function rpcStore(rpc: Rpc): OutboxStore {
  const call = async <T>(fn: string, args: Record<string, unknown>) => {
    const { data, error } = await rpc(fn, args);
    if (error) throw new Error(`${fn}: ${error.message}`);
    return data as T;
  };
  return {
    enqueue: (d) => call<boolean>("build_mail_enqueue", { _purchase: d.purchaseId, _seed: d.seedId, _user: d.userId, _item: d.item, _done: new Date(d.doneAt).toISOString() }),
    claim: async (limit) => (await call<OutboxRow[] | null>("build_mail_claim", { _limit: limit })) ?? [],
    finish: (p, t, ok, error) => call<boolean>("build_mail_finish", { _purchase: p, _token: t, _ok: ok, _error: error ?? null }),
  };
}
