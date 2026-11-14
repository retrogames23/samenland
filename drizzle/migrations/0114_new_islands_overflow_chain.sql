ALTER TABLE public.seeds DROP CONSTRAINT seeds_realm_check;
ALTER TABLE public.seeds ADD CONSTRAINT seeds_realm_check CHECK (realm IN ('us-west','us-west-2','us-east','us-east-2','europe','europe-2','europe-3','asia','asia-2','lab'));
CREATE OR REPLACE FUNCTION public.realm_full_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.realm IN ('europe','europe-2','us-west','us-east','asia') AND NOT public.has_role(auth.uid(), 'admin')
     AND (SELECT count(*) FROM public.seeds WHERE realm = NEW.realm) >= 60 THEN
    RAISE EXCEPTION 'realm_full' USING ERRCODE = 'P0001', HINT = 'This map is full; found on the next map of its time zone';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS seeds_europe_full ON public.seeds;
DROP TRIGGER IF EXISTS seeds_realm_full ON public.seeds;
CREATE TRIGGER seeds_realm_full BEFORE INSERT ON public.seeds FOR EACH ROW EXECUTE FUNCTION public.realm_full_guard();
COMMENT ON FUNCTION public.realm_full_guard() IS 'Mirrors REALM_FULL/REALM_NEXT (time.ts): no new villages on a map with a successor from 60 on, admins exempt.';
COMMENT ON FUNCTION public.europe_full_guard() IS 'DEPRECATED: replaced by realm_full_guard';
CREATE OR REPLACE FUNCTION public.market_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r text; tz text;
BEGIN
  SELECT realm INTO r FROM seeds WHERE id = NEW.seed_id AND (NEW.small OR created_at < now() - interval '1 day');
  IF NOT FOUND THEN RAISE EXCEPTION 'village too young'; END IF;
  tz := CASE regexp_replace(r, '-[0-9]+$', '') WHEN 'us-west' THEN 'America/Los_Angeles' WHEN 'us-east' THEN 'America/New_York' WHEN 'asia' THEN 'Asia/Tokyo' ELSE 'Europe/Berlin' END;
  NEW.day := (now() AT TIME ZONE 'utc')::date;
  NEW.reward := CASE WHEN NEW.small THEN 6 WHEN extract(dow FROM now() AT TIME ZONE tz) = 6 THEN 20 ELSE 15 END;
  NEW.created_at := now();
  RETURN NEW;
END $function$;
CREATE OR REPLACE FUNCTION public.realm_day_start(_seed uuid)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (date_trunc('day', now() AT TIME ZONE z) AT TIME ZONE z)
  FROM (SELECT CASE regexp_replace((SELECT realm FROM public.seeds WHERE id = _seed), '-[0-9]+$', '')
    WHEN 'us-west' THEN 'America/Los_Angeles' WHEN 'us-east' THEN 'America/New_York' WHEN 'asia' THEN 'Asia/Tokyo' ELSE 'Europe/Berlin' END AS z) t
$function$;
-- wonder sites of Störwerder, Hallighörn, Boddenholm, Moorgeest (mirror of wonders())
INSERT INTO public.wonder_sites(key, kind, x, y)
SELECT k, split_part(k, ':', 1), split_part(k, ':', 2)::int, split_part(k, ':', 3)::int FROM (VALUES
('wreck:277:179'),('wreck:342:168'),('caravan:409:165'),('caravan:565:132'),('wreck:633:180'),('wreck:726:175'),('wreck:185:264'),('caravan:198:264'),('wreck:322:218'),('oak:464:208'),('ruin:505:279'),('oak:607:271'),('wreck:707:241'),('wreck:822:263'),('wreck:67:376'),('wreck:102:374'),('oak:271:321'),('oak:332:377'),('oak:440:314'),('spring:544:314'),('caravan:623:336'),('caravan:738:358'),('wreck:851:342'),('caravan:884:326'),('caravan:41:425'),('caravan:129:401'),('caravan:234:437'),('wreck:362:447'),('oak:428:402'),('caravan:540:393'),('caravan:652:463'),('oak:734:439'),('caravan:813:456'),('wreck:943:466'),('oak:88:526'),('oak:117:512'),('caravan:251:525'),('spring:309:555'),('oak:419:542'),('caravan:493:500'),('oak:624:559'),('caravan:727:494'),('caravan:799:511'),('oak:882:503'),('oak:66:607'),('wreck:184:622'),('oak:214:601'),('oak:374:661'),('wreck:447:584'),('caravan:510:599'),('wreck:637:596'),('oak:678:614'),('wreck:815:604'),('oak:919:663'),('wreck:216:695'),('wreck:358:686'),('caravan:445:681'),('caravan:488:758'),('oak:585:761'),('oak:742:706'),('oak:802:752'),('oak:891:735'),('oak:368:781'),('oak:440:818'),('oak:555:854'),('oak:640:805'),('caravan:717:837'),('oak:801:803'),('wreck:458:909'),('wreck:538:898'),('wreck:623:916'),('wreck:753:897'),('wreck:281:159'),('wreck:442:120'),('wreck:546:158'),('wreck:599:183'),('wreck:724:173'),('caravan:243:280'),('wreck:366:221'),('wreck:414:254'),('caravan:562:237'),('oak:611:273'),('wreck:678:212'),('wreck:837:227'),('oak:274:334'),('oak:510:295'),('caravan:644:333'),('caravan:723:360'),('wreck:838:354'),('caravan:907:340'),('caravan:271:430'),('oak:317:429'),('caravan:632:403'),('caravan:812:406'),('wreck:943:418'),('oak:154:505'),('caravan:248:543'),('oak:301:536'),('oak:395:525'),('wreck:611:489'),('caravan:736:530'),('caravan:802:531'),('wreck:168:634'),('oak:228:661'),('oak:329:599'),('oak:431:658'),('caravan:524:607'),('caravan:613:592'),('caravan:753:600'),('caravan:780:631'),('oak:887:607'),('wreck:203:713'),('wreck:304:686'),('caravan:390:692'),('caravan:498:697'),('wreck:735:760'),('caravan:799:753'),('oak:930:704'),('wreck:240:816'),('oak:294:848'),('wreck:585:826'),('caravan:681:821'),('oak:820:780'),('oak:298:880'),('caravan:526:880'),('wreck:635:939'),('wreck:693:874'),('oak:346:42'),('wreck:438:21'),('oak:528:67'),('oak:589:86'),('wreck:333:116'),('ruin:398:104'),('caravan:545:135'),('wreck:632:148'),('wreck:731:145'),('wreck:789:159'),('wreck:916:171'),('oak:167:275'),('caravan:218:276'),('oak:356:248'),('oak:421:277'),('caravan:552:200'),('oak:711:274'),('wreck:795:200'),('wreck:884:243'),('oak:83:349'),('wreck:107:331'),('oak:246:375'),('oak:592:366'),('caravan:735:302'),('cave:835:367'),('oak:877:337'),('caravan:65:390'),('ruin:150:394'),('caravan:273:417'),('wreck:353:432'),('caravan:551:407'),('caravan:644:426'),('oak:760:437'),('ruin:797:400'),('oak:89:521'),('caravan:202:538'),('wreck:352:506'),('caravan:468:562'),('caravan:561:565'),('wreck:598:566'),('caravan:741:489'),('caravan:847:493'),('oak:870:503'),('wreck:158:629'),('oak:318:605'),('wreck:444:607'),('oak:536:627'),('caravan:619:663'),('caravan:696:620'),('wreck:809:622'),('caravan:181:707'),('wreck:233:741'),('wreck:349:692'),('caravan:397:705'),('caravan:541:706'),('oak:615:718'),('wreck:750:721'),('caravan:775:735'),('wreck:272:785'),('oak:424:820'),('wreck:502:801'),('wreck:624:789'),('wreck:694:847'),('wreck:348:876'),('wreck:425:896'),('wreck:660:893'),('wreck:685:885'),('oak:184:134'),('caravan:239:160'),('wreck:364:138'),('wreck:396:122'),('wreck:557:124'),('wreck:637:136'),('wreck:682:183'),('wreck:778:168'),('oak:182:277'),('caravan:233:216'),('wreck:397:201'),('spring:498:240'),('spring:682:218'),('wreck:180:362'),('ruin:689:362'),('wreck:823:301'),('wreck:895:347'),('caravan:169:393'),('ruin:217:449'),('oak:486:399'),('oak:659:430'),('caravan:777:391'),('wreck:908:463'),('wreck:88:500'),('caravan:267:494'),('oak:507:544'),('oak:629:527'),('oak:678:563'),('ruin:838:562'),('wreck:143:652'),('oak:335:651'),('caravan:566:628'),('caravan:634:586'),('ruin:836:587'),('oak:888:592'),('wreck:182:731'),('wreck:227:695'),('oak:343:753'),('caravan:413:699'),('oak:542:728'),('wreck:780:754'),('wreck:205:780'),('caravan:733:806'),('wreck:418:874'),('caravan:490:938'),('wreck:595:940'),('caravan:758:888')
) v(k)
ON CONFLICT (key) DO NOTHING;