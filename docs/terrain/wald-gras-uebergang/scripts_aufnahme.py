import asyncio, json, os, sys, time
from datetime import datetime, timezone
from playwright.async_api import async_playwright
sys.path.insert(0,"/tmp/p3")
OUT="/tmp/p3/shots"; os.makedirs(OUT,exist_ok=True)
A=json.load(open(os.path.expanduser("~/.cache/lovable-auth/session.json")))
NOON=datetime(2026,11,9,11,0,0,tzinfo=timezone.utc)
S={"1_saum_gerade":(420,650),"2_rand_unregelmaessig":(690,290),"3_insel_klein":(1030,310),"4_zunge_schmal":(680,600),"5_dreifach_wasser":(470,450)}
async def hud(pg):
    t=await pg.evaluate("()=>document.querySelector('.font-mono')?.textContent||''")
    try: return int(t.split("chunks ")[1].split(" ")[0]), t
    except: return -1,t
async def settle(pg,mx=45):
    last,st,t0=-2,0,time.time()
    while time.time()-t0<mx:
        n,t=await hud(pg)
        st = st+1 if n==last else 0; last=n
        if st>=8: return t
        await pg.wait_for_timeout(500)
    return (await hud(pg))[1]
async def one(p,season,name,log):
    b=await p.chromium.launch(headless=True,args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":1280,"height":900}); pg=await ctx.new_page()
    await pg.clock.install(time=NOON); await pg.goto("http://localhost:8080")
    await pg.evaluate("([k,v,se])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-lab-jump','0');localStorage.setItem('samenland-lab-ctl',JSON.stringify({ev:{},season:se,weather:'clear'}))}",[A["storage_key"],json.dumps(A["session"]),season])
    await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(9000); await pg.mouse.click(640,450)
    tx,ty=296,440; dx=-((tx-ty)-(306-420))*16*2.6; dy=-((tx+ty)-(306+420))*8*2.6
    while abs(dx)>1 or abs(dy)>1:
        sx=int(max(-380,min(380,dx))); sy=int(max(-380,min(380,dy))); dx-=sx; dy-=sy
        if not sx and not sy: break
        await pg.mouse.move(640,450); await pg.mouse.down()
        for i in range(1,11): await pg.mouse.move(640+sx*i/10,450+sy*i/10); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await pg.wait_for_timeout(400)
    for _ in range(3): await pg.keyboard.press("q"); await pg.wait_for_timeout(800)
    cv=pg.locator("canvas").first
    async def shot(z):
        h=await settle(pg); await pg.wait_for_timeout(1500)
        await cv.screenshot(path=f"{OUT}/{season}_{name}_{z}.png")
        log.write(f"{season}\t{name}\t{z}\t12:00 Berlin\tklar\t{h.strip()}\n"); log.flush()
    if name=="1_saum_gerade": await shot("3uebersicht")
    px,py=S[name]; await pg.mouse.move(px,py)
    for _ in range(9): await pg.mouse.wheel(0,-80); await pg.wait_for_timeout(150)
    await pg.wait_for_timeout(1500); await pg.mouse.move(640,450)
    await shot("2normal")
    await pg.mouse.move(640,450)
    for _ in range(5): await pg.mouse.wheel(0,-80); await pg.wait_for_timeout(150)
    await pg.wait_for_timeout(1500); await shot("1nah")
    await b.close()
async def main():
    season=sys.argv[1]
    with open(f"/tmp/p3/log_{season}.tsv","a") as log:
        async with async_playwright() as p:
            for n in S: await one(p,season,n,log)
asyncio.run(main())
