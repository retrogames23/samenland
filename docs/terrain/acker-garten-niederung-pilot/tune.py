import numpy as np
from PIL import Image
from scipy import ndimage
def L(p): return np.asarray(Image.open(p).convert("RGB")).astype(float)
def wrapblur(a,s): return ndimage.gaussian_filter(a,(s,s,0),mode="wrap")
def flat(a,s,k): lo=wrapblur(a,s); return a-(lo-lo.mean((0,1)))*k
def sharpen(a,amt): return a+(a-wrapblur(a,1.2))*amt
def target(a,mean): return a*(np.array(mean)/a.mean((0,1)))
def save(a,p): Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(p,quality=92)
a=L("var/fertile_acker.jpg"); a=target(a,[80,61,40]); a=a.mean(2,keepdims=True)*0.15+a*0.85; save(sharpen(a,0.6),"var/fertile_acker.jpg")
g=L("var/fertile_garten.jpg"); g=sharpen(g,2.2); g=target(g,[56,40,28]); save(g,"var/fertile_garten.jpg")
n=L("var/fertile_niederung.jpg"); n=flat(n,24,0.55); n=sharpen(n,1.2); n=target(n,[60,58,32]); save(n,"var/fertile_niederung.jpg")
