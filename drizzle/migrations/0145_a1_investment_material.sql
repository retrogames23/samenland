-- Wirtschaftsumbau A1: monument steps, guild ranks and titles use wood and stone at the half rate —
-- wood price/40, stone price/60 only from 500 Mark (round half up). Chests stay material-free.
-- Only purchase_material changes: same list as 0143 plus the A1 items, same Kontor (resource_kontor, kontor_max),
-- same booking (purchase_material_book). Prices, ranks and every other guard rule stay as they are. Existing purchase
-- rows are never touched (BEFORE INSERT only), and like all material rules this applies only where resources run
-- (resources_since: the lab map now, public maps not before a later migration).
CREATE OR REPLACE FUNCTION public.purchase_material()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE rlm text; c0 timestamptz; nw integer; ns integer; mw integer; ms integer; kontor integer; a1 boolean;
BEGIN
  NEW.material := NULL;
  a1 := NEW.item IN ('belfry1','belfry2','belfry3','belfry4','theater1','theater2','theater3',
      'cathedral1','cathedral2','cathedral3','cathedral4','cathedral5','university1','university2','university3','university4',
      'exchange1','exchange2','exchange3','exchange4','orangery1','orangery2','orangery3','opera1','opera2','opera3','opera4',
      'harvest1','harvest2','harvest3','guildtower1','guildtower2','guildtower3','lighthouse1','lighthouse2','lighthouse3',
      'rank2','rank3','title1','title2','title3');
  IF NOT a1 AND NEW.item NOT IN ('herbs','backhaus','herberge','beginen','badestube','hunter','fisher','woodcamp','granary','healer',
      'school','markethall','guildhall','library','dairy','fireorder','firehouse','guard','bigstore','stonemason',
      'smokehouse','millrow','hammerworks','saltquay','backhaus2','backhaus3','herberge2','herberge3','granary2','granary3',
      'steingrube') THEN
    RETURN NEW; END IF;
  SELECT s.realm, s.created_at INTO rlm, c0 FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF now() < greatest(public.resources_since(rlm), c0) THEN RETURN NEW; END IF;
  PERFORM public.resource_refresh(NEW.seed_id);
  IF NEW.item = 'steingrube' THEN nw := 20; ns := 0;
  ELSIF a1 THEN
    nw := round(NEW.cost::numeric / 40);
    ns := CASE WHEN NEW.cost >= 500 THEN round(NEW.cost::numeric / 60) ELSE 0 END;
  ELSE
    nw := round(NEW.cost::numeric / 20);
    ns := CASE WHEN NEW.cost >= 500 THEN round(NEW.cost::numeric / 30) ELSE 0 END;
  END IF;
  mw := greatest(0, nw - public.resource_stock(NEW.seed_id, 'wood'));
  ms := greatest(0, ns - public.resource_stock(NEW.seed_id, 'stone'));
  kontor := public.resource_kontor(NEW.seed_id, mw, ms);
  IF kontor > coalesce(NEW.kontor_max, 0) THEN RAISE EXCEPTION 'material short'; END IF;
  NEW.material := jsonb_build_object('wood', jsonb_build_array(nw, mw), 'stone', jsonb_build_array(ns, ms), 'kontor', kontor);
  IF kontor > 0 THEN
    NEW.cost := NEW.cost + kontor;
    IF public.village_balance(NEW.seed_id) < NEW.cost THEN RAISE EXCEPTION 'not enough money'; END IF;
  END IF;
  RETURN NEW;
END $function$;
