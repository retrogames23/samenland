-- Europa IV (Weserau): allow the new realm and register its natural wonders (mirror of wonders() in src/game/wonders.ts).
-- The realm_full_guard change is in 0135. Keys already present (same kind at the same tile on another map) are skipped:
-- finds are counted per realm in wonder_finds, so a shared site row is fine (as in 0114).
ALTER TABLE public.seeds DROP CONSTRAINT seeds_realm_check;
ALTER TABLE public.seeds ADD CONSTRAINT seeds_realm_check CHECK (realm IN ('us-west','us-west-2','us-east','us-east-2','europe','europe-2','europe-3','europe-4','asia','asia-2','lab'));
-- wonder sites of Weserau (79)
INSERT INTO public.wonder_sites(key, kind, x, y)
SELECT k, split_part(k, ':', 1), split_part(k, ':', 2)::int, split_part(k, ':', 3)::int FROM (VALUES
('wreck:473:14'),('oak:528:67'),('oak:589:86'),('wreck:689:88'),('wreck:364:156'),('caravan:391:123'),('ruin:494:185'),('wreck:638:102'),('oak:709:179'),('wreck:808:138'),('oak:169:278'),('caravan:244:234'),('wreck:321:203'),('wreck:456:264'),('ruin:502:203'),('oak:607:271'),('oak:712:256'),('wreck:790:215'),('wreck:134:364'),('oak:246:375'),('oak:332:377'),('oak:410:337'),('wreck:521:346'),('wreck:625:365'),('ruin:689:362'),('wreck:822:357'),('wreck:884:305'),('ruin:176:413'),('ruin:216:421'),('oak:317:429'),('oak:428:402'),('wreck:493:419'),('ruin:618:413'),('oak:734:439'),('ruin:778:404'),('wreck:872:459'),('oak:89:560'),('oak:142:558'),('cave:211:534'),('oak:301:536'),('oak:395:525'),('caravan:486:549'),('oak:629:527'),('ruin:752:558'),('ruin:804:544'),('oak:870:503'),('wreck:124:636'),('oak:214:601'),('oak:335:651'),('oak:431:658'),('spring:542:641'),('ruin:665:620'),('oak:678:614'),('ruin:786:591'),('oak:887:607'),('wreck:161:678'),('wreck:209:707'),('oak:343:753'),('oak:425:753'),('spring:509:735'),('oak:585:761'),('oak:742:706'),('oak:802:752'),('oak:891:735'),('wreck:207:819'),('oak:294:848'),('oak:440:818'),('oak:555:854'),('oak:640:805'),('caravan:728:846'),('oak:792:782'),('caravan:873:774'),('wreck:242:894'),('caravan:333:936'),('oak:439:896'),('wreck:550:877'),('wreck:616:905'),('caravan:759:883'),('caravan:798:880')
) v(k)
ON CONFLICT (key) DO NOTHING;
