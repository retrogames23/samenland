CREATE TABLE public.user_days (
  user_id uuid NOT NULL,
  day date NOT NULL,
  PRIMARY KEY (user_id, day)
);
GRANT ALL ON public.user_days TO service_role;
ALTER TABLE public.user_days ENABLE ROW LEVEL SECURITY;

INSERT INTO public.user_days (user_id, day)
SELECT DISTINCT user_id, (created_at AT TIME ZONE 'UTC')::date FROM (
  SELECT user_id, created_at FROM public.purchases
  UNION ALL SELECT user_id, created_at FROM public.encounters
  UNION ALL SELECT user_id, created_at FROM public.blessings
  UNION ALL SELECT user_id, created_at FROM public.quest_claims
  UNION ALL SELECT user_id, created_at FROM public.market_sales
  UNION ALL SELECT sender_id, created_at FROM public.chat_messages
  UNION ALL SELECT user_id, last_active_at FROM public.user_activity
) s WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_activity(_lang text DEFAULT 'de')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO user_activity (user_id, last_active_at, warning_sent_at, lang)
  VALUES (auth.uid(), now(), NULL, left(coalesce(_lang, 'de'), 5))
  ON CONFLICT (user_id) DO UPDATE SET last_active_at = now(), warning_sent_at = NULL, lang = excluded.lang;
  INSERT INTO user_days (user_id, day) VALUES (auth.uid(), (now() AT TIME ZONE 'UTC')::date) ON CONFLICT DO NOTHING;
END $$;

CREATE TABLE public.survey_answers (
  user_id uuid PRIMARY KEY,
  survey text NOT NULL DEFAULT '2026-11',
  status text NOT NULL CHECK (status IN ('answered','never')),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  wish text NOT NULL DEFAULT '' CHECK (char_length(wish) <= 2000),
  lang text NOT NULL DEFAULT 'de',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.survey_answers TO service_role;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;

-- open while the 72h window runs, the player has >= 5 active days and has not answered/declined
CREATE OR REPLACE FUNCTION public.survey_open() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
    AND now() BETWEEN timestamptz '2026-11-03 20:00+00' AND timestamptz '2026-11-06 20:00+00'
    AND (SELECT count(*) FROM user_days WHERE user_id = auth.uid()) >= 5
    AND NOT EXISTS (SELECT 1 FROM survey_answers WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.survey_submit(_status text, _answers jsonb, _wish text, _lang text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.survey_open() OR _status NOT IN ('answered','never') THEN RETURN false; END IF;
  INSERT INTO survey_answers (user_id, status, answers, wish, lang)
  VALUES (auth.uid(), _status, CASE WHEN _status = 'answered' THEN coalesce(_answers, '{}'::jsonb) ELSE '{}'::jsonb END,
          CASE WHEN _status = 'answered' THEN left(coalesce(_wish, ''), 2000) ELSE '' END, left(coalesce(_lang, 'de'), 5));
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.survey_open() FROM public, anon;
REVOKE ALL ON FUNCTION public.survey_submit(text, jsonb, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.survey_open() TO authenticated;
GRANT EXECUTE ON FUNCTION public.survey_submit(text, jsonb, text, text) TO authenticated;