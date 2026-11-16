CREATE OR REPLACE FUNCTION public.realm_full_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.realm IN ('europe','europe-2','us-west','us-east','asia') AND NOT public.has_role(auth.uid(), 'admin')
     AND (SELECT count(*) FROM public.seeds WHERE realm = NEW.realm) >= 60 THEN
    -- verified personal exceptions for Europa I, identified by the authenticated account only
    IF NEW.realm = 'europe' AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND lower(u.email) IN ('victoria.halper@gmail.com', 'johanna.mellentin@gmail.com')
        AND u.email_confirmed_at IS NOT NULL
    ) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'realm_full' USING ERRCODE = 'P0001', HINT = 'This map is full; found on the next map of its time zone';
  END IF;
  RETURN NEW;
END $$;
COMMENT ON FUNCTION public.realm_full_guard() IS 'Mirrors REALM_FULL/REALM_NEXT (time.ts): no new villages on a map with a successor from 60 on; admins and the two verified FORCE_EUROPE accounts (europe only) exempt. Rollback: re-apply the 0114 body.';