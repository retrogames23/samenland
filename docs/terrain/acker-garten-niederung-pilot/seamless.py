import numpy as np,sys
from PIL import Image
from scipy import ndimage
def mk(src,dst):
  a=np.asarray(Image.open(src).convert("RGB").resize((816,816),Image.LANCZOS)).astype(float)
  n=816; s=np.roll(a,(n//2,n//2),(0,1))
  w=np.minimum(np.arange(n),n-1-np.arange(n))/(n/2); w=np.clip(w*1.6,0,1)
  m=np.minimum.outer(w,w)[...,None]
  o=a*m+s*(1-m)
  Image.fromarray(np.clip(o,0,255).astype(np.uint8)).save(dst,quality=92)
for k in ["acker","garten","niederung"]: mk(f"var/{k}_raw.jpg",f"var/fertile_{k}.jpg")
def tile(p,n,o):
  im=Image.open(p); W=im.width; c=Image.new("RGB",(W*n,W*n))
  for i in range(n):
    for j in range(n): c.paste(im,(i*W,j*W))
  c.resize((min(W*n,2040),)*2).save(o,quality=85)
for k,p in [("original","fertile_original.jpg")]+[(k,f"var/fertile_{k}.jpg") for k in ["acker","garten","niederung"]]:
  tile(p,3,f"var/kachel_3x3_{k}.jpg"); tile(p,5,f"var/kachel_5x5_{k}.jpg")
