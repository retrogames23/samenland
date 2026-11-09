import asyncio, json, os, sys
from playwright.async_api import async_playwright
season=sys.argv[1]; out=sys.argv[2]; keys=sys.argv[3] if len(sys.argv)>3 else ""; texf=sys.argv[4]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True, args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":1280,"height":900})
    pg=await ctx.new_page()
    data=open(texf,"rb").read()
    await ctx.route("**/forest.jpg", lambda r: r.fulfill(body=data, content_type="image/jpeg"))
    m=json.load(open(os.path.expanduser("~/.cache/lovable-auth/session.json"))); k=m["storage_key"]; s=json.dumps(m["session"])
    await pg.goto("http://localhost:8080")
    await pg.evaluate("([k,v,se])=>{localStorage.setItem(k,v);localStorage.setItem('samenland-realm','lab');localStorage.setItem('samenland-lab-jump','11');localStorage.setItem('samenland-lab-ctl',JSON.stringify({ev:{},season:se,weather:'clear'}))}",[k,s,season])
    await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(9000)
    await pg.mouse.click(640,450); 
    for op in keys.split(","):
      if not op: continue
      a=op.split(":")
      if a[0]=="goto":
        tx,ty=int(a[1]),int(a[2]); dx=-((tx-ty)-(306-420))*16*2.6; dy=-((tx+ty)-(306+420))*8*2.6
        while abs(dx)>1 or abs(dy)>1:
          sx=max(-380,min(380,dx)); sy=max(-380,min(380,dy)); a=["drag",str(int(sx)),str(int(sy))]; dx-=int(sx); dy-=int(sy)
          if abs(sx)<1 and abs(sy)<1: break
          ddx,ddy=int(a[1]),int(a[2]); await pg.mouse.move(640,450); await pg.mouse.down()
          for i in range(1,11): await pg.mouse.move(640+ddx*i/10,450+ddy*i/10); await pg.wait_for_timeout(30)
          await pg.mouse.up(); await pg.wait_for_timeout(500)
        continue
      if a[0]=="drag":
        dx,dy=int(a[1]),int(a[2]); await pg.mouse.move(640,450); await pg.mouse.down()
        for i in range(1,11): await pg.mouse.move(640+dx*i/10,450+dy*i/10); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await pg.wait_for_timeout(600)
      else: await pg.keyboard.press(a[1]); await pg.wait_for_timeout(900)
    await pg.wait_for_timeout(3000)
    cv=pg.locator("canvas").first
    await cv.screenshot(path=out+"_2normal.png")
    await pg.keyboard.press("e"); await pg.wait_for_timeout(3500); await cv.screenshot(path=out+"_1nah.png")
    for _ in range(3): await pg.keyboard.press("q"); await pg.wait_for_timeout(1200)
    await pg.wait_for_timeout(6000); await cv.screenshot(path=out+"_3uebersicht.png")
    await b.close()
asyncio.run(main())
