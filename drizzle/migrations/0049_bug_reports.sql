CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'bug',
  body text NOT NULL,
  shots text[] NOT NULL DEFAULT '{}',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
GRANT INSERT ON public.bug_reports TO authenticated;
GRANT ALL ON public.bug_reports TO service_role;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bug reports insert" ON public.bug_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.bug_report_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.kind NOT IN ('bug','idea','other') THEN RAISE EXCEPTION 'bad kind'; END IF;
  IF length(btrim(NEW.body)) < 3 OR length(NEW.body) > 4000 THEN RAISE EXCEPTION 'bad body'; END IF;
  IF coalesce(array_length(NEW.shots,1),0) > 5 THEN RAISE EXCEPTION 'too many shots'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(NEW.shots) p WHERE p NOT LIKE NEW.user_id::text || '/%') THEN RAISE EXCEPTION 'bad shot path'; END IF;
  IF (SELECT count(*) FROM public.bug_reports WHERE user_id = NEW.user_id AND created_at > now() - interval '1 day') >= 10 THEN RAISE EXCEPTION 'rate limit'; END IF;
  NEW.created_at := now(); NEW.sent_at := NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER bug_report_guard BEFORE INSERT ON public.bug_reports FOR EACH ROW EXECUTE FUNCTION public.bug_report_guard();

CREATE POLICY "own bug shots upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bug-shots' AND (storage.foldername(name))[1] = auth.uid()::text);