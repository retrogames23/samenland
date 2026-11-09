import asyncio, json, os, sys
from datetime import datetime, timezone
from playwright.async_api import async_playwright
season,out,mode,iso=sys.argv[1:5]; keys=sys.argv[5] if len(sys.argv)>5 else ""
ORIG=open("/dev-server/src/assets/terrain/fertile.jpg","rb").read()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True,args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":1280,"height":900})
    pg=await ctx.new_page(); pg.on("pageerror",lambda e:print("E",str(e)[:300]))
    await pg.clock.install(time=datetime.fromisoformat(iso))
    if mode=="vorher":
      for n in ("fertile_acker.jpg","fertile_garten.jpg"):
        await ctx.route(lambda u,n=n: u.split("?")[0].endswith("/terrain/"+n) and "import" not in u, lambda r: r.fulfill(body=ORIG,content_type="image/jpeg"))
    if os.environ.get("PLOUGH"):
      async def rot(r):
        resp=await r.fetch(); body=await resp.text()
        body=body.replace("function fieldLook(acreId, now) {","function fieldLook(acreId, now) { return \"ploughed\";",1)
        await r.fulfill(response=resp, body=body)
      await ctx.route(lambda u: "/src/game/rotation.ts" in u, rot)
    m=json.load(open(os.path.expanduser("~/.cache/lovable-auth/session.json")))
    await pg.goto("http://localhost:8080")
    await pg.evaluate("([k,v,se])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-lab-jump','11');localStorage.setItem('samenland-lab-ctl',JSON.stringify({ev:{},season:se,weather:'clear'}))}",[m["storage_key"],json.dumps(m["session"]),season])
    await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(10000)
    await pg.mouse.click(640,450)
    for op in keys.split(","):
      if not op: continue
      _,tx,ty=op.split(":"); tx,ty=int(tx),int(ty)
      dx=-((tx-ty)-(306-420))*16*2.6; dy=-((tx+ty)-(306+420))*8*2.6
      while abs(dx)>1 or abs(dy)>1:
        sx=int(max(-380,min(380,dx))); sy=int(max(-380,min(380,dy))); dx-=sx; dy-=sy
        if sx==0 and sy==0: break
        await pg.mouse.move(640,450); await pg.mouse.down()
        for i in range(1,11): await pg.mouse.move(640+sx*i/10,450+sy*i/10); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await pg.wait_for_timeout(500)
    await pg.wait_for_timeout(15000); cv=pg.locator("canvas").first
    await cv.screenshot(path=out+"_2normal.png")
    await pg.keyboard.press("e"); await pg.wait_for_timeout(3500); await cv.screenshot(path=out+"_1nah.png")
    for _ in range(3): await pg.keyboard.press("q"); await pg.wait_for_timeout(1200)
    await pg.wait_for_timeout(6000); await cv.screenshot(path=out+"_3uebersicht.png")
    await b.close()
asyncio.run(main())
