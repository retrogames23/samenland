ALTER TABLE public.seeds ADD COLUMN IF NOT EXISTS mayor_age smallint;
ALTER TABLE public.seeds ADD COLUMN IF NOT EXISTS mayor_traits text[];

CREATE OR REPLACE FUNCTION public.update_mayor(_seed uuid, _owner text, _gender text, _age integer, _traits text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok text[] := ARRAY['early','owl','sociable','homebody','storyteller','weather','nature','diligent','cheerful','worrier','pious','curious'];
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM seeds WHERE id = _seed AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not your village' USING ERRCODE = '42501';
  END IF;
  _owner := btrim(coalesce(_owner, ''));
  IF char_length(_owner) < 1 OR char_length(_owner) > 40 THEN RAISE EXCEPTION 'bad name'; END IF;
  IF _gender IS NOT NULL AND _gender NOT IN ('m','w','d') THEN RAISE EXCEPTION 'bad gender'; END IF;
  IF _age IS NULL OR _age < 20 OR _age > 70 THEN RAISE EXCEPTION 'bad age'; END IF;
  IF _traits IS NULL OR cardinality(_traits) > 2 OR NOT (_traits <@ ok)
     OR (cardinality(_traits) = 2 AND (_traits[1] = _traits[2]
       OR (_traits @> ARRAY['early','owl']) OR (_traits @> ARRAY['sociable','homebody']) OR (_traits @> ARRAY['cheerful','worrier']))) THEN
    RAISE EXCEPTION 'bad traits';
  END IF;
  UPDATE seeds SET owner = _owner, mayor_gender = _gender, mayor_age = _age, mayor_traits = _traits WHERE id = _seed;
END $$;
REVOKE ALL ON FUNCTION public.update_mayor(uuid, text, text, integer, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_mayor(uuid, text, text, integer, text[]) TO authenticated;