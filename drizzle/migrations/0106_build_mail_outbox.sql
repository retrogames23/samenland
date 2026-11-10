-- Persistent, idempotent outbox for "building finished" letters.
-- One row per finished building / monument (keyed by the purchase row that completes it); service-role only.
CREATE TABLE public.build_mail_outbox (
  purchase_id uuid PRIMARY KEY,
  seed_id uuid NOT NULL,
  user_id uuid NOT NULL,
  item text NOT NULL,
  done_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  claimed_at timestamptz,
  claim_token uuid,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.build_mail_outbox TO service_role;
ALTER TABLE public.build_mail_outbox ENABLE ROW LEVEL SECURITY;
CREATE INDEX build_mail_outbox_open ON public.build_mail_outbox (status) WHERE status <> 'sent';

CREATE OR REPLACE FUNCTION public.build_mail_enqueue(_purchase uuid, _seed uuid, _user uuid, _item text, _done timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  INSERT INTO build_mail_outbox (purchase_id, seed_id, user_id, item, done_at)
  VALUES (_purchase, _seed, _user, _item, _done) ON CONFLICT (purchase_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END $$;

CREATE OR REPLACE FUNCTION public.build_mail_claim(_limit integer DEFAULT 50, _max_attempts integer DEFAULT 5, _lease_minutes integer DEFAULT 10)
RETURNS SETOF public.build_mail_outbox LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  UPDATE build_mail_outbox o SET status = 'sending', claimed_at = now(), claim_token = gen_random_uuid(), attempts = o.attempts + 1
  WHERE o.purchase_id IN (
    SELECT c.purchase_id FROM build_mail_outbox c
    WHERE c.status = 'pending'
       OR (c.status = 'failed' AND c.attempts < _max_attempts)
       OR (c.status = 'sending' AND c.claimed_at < now() - make_interval(mins => _lease_minutes) AND c.attempts < _max_attempts)
    ORDER BY c.created_at LIMIT _limit FOR UPDATE SKIP LOCKED)
  RETURNING o.*;
END $$;

CREATE OR REPLACE FUNCTION public.build_mail_finish(_purchase uuid, _token uuid, _ok boolean, _error text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  UPDATE build_mail_outbox SET
    status = CASE WHEN _ok THEN 'sent' ELSE 'failed' END,
    sent_at = CASE WHEN _ok THEN now() ELSE NULL END,
    last_error = CASE WHEN _ok THEN NULL ELSE left(_error, 500) END
  WHERE purchase_id = _purchase AND claim_token = _token AND status = 'sending';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END $$;

CREATE OR REPLACE FUNCTION public.build_mail_retry(_purchase uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  UPDATE build_mail_outbox SET status = 'pending', attempts = 0, claim_token = NULL WHERE purchase_id = _purchase AND status = 'failed';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END $$;

REVOKE ALL ON FUNCTION public.build_mail_enqueue(uuid, uuid, uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.build_mail_claim(integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.build_mail_finish(uuid, uuid, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.build_mail_retry(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.build_mail_enqueue(uuid, uuid, uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.build_mail_claim(integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.build_mail_finish(uuid, uuid, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.build_mail_retry(uuid) TO service_role;