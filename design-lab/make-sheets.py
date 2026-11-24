import os, glob
from PIL import Image

SRC = r"C:\Users\xiao\.dsh\mcp\playwright-mcp"
DST = r"D:\背单词\design-lab\shots"
os.makedirs(DST, exist_ok=True)

for f in glob.glob(os.path.join(SRC, "fin-*.png")):
    with open(f, "rb") as r, open(os.path.join(DST, os.path.basename(f)), "wb") as w:
        w.write(r.read())


def font(size, bold=False):
    for p in ([r"C:\Windows\Fonts\msyhbd.ttc"] if bold else []) + [r"C:\Windows\Fonts\msyh.ttc"]:
        if os.path.exists(p):
            try:
                from PIL import ImageFont
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    from PIL import ImageFont
    return ImageFont.load_default()

PAD = 22
CAP = 40

def sheet(name, files, labels, title):
    imgs = [Image.open(f).convert("RGB") for f in files]
    w = sum(i.width for i in imgs) + PAD * (len(imgs) + 1)
    h = max(i.height for i in imgs) + PAD * 2 + CAP + 30
    canvas = Image.new("RGB", (w, h), (20, 20, 20))
    from PIL import ImageDraw
    d = ImageDraw.Draw(canvas)
    d.text((PAD, 12), title, fill=(240, 240, 235), font=font(19, True))
    x = PAD
    for img, lab in zip(imgs, labels):
        d.text((x, 42), lab, fill=(148, 148, 142), font=font(13, True))
        canvas.paste(img, (x, 42 + CAP))
        x += img.width + PAD
    out = os.path.join(DST, name)
    canvas.save(out)
    print("wrote", name, canvas.size)

labels = ["A · 铅字 Foundry", "B · 仪表 Instrument", "C · 词表报 Broadsheet"]
vs = ["a", "b", "c"]
p = lambda v, s, t, w=390: os.path.join(SRC, f"fin-{v}-{s}-{t}-{w}.png")

sheet("sheet-start-light.png", [p(v, "start", "light") for v in vs], labels, "390 × 844 · 开始页 · 浅色")
sheet("sheet-study-light.png", [p(v, "study", "light") for v in vs], labels, "390 × 844 · 学习中 · 浅色")
sheet("sheet-quiz-light.png", [p(v, "quiz", "light") for v in vs], labels, "390 × 844 · 自测（关中文）· 浅色")
sheet("sheet-study-dark.png", [p(v, "study", "dark") for v in vs], labels, "390 × 844 · 学习中 · 深色")
sheet("sheet-study-768.png", [p(v, "study", "light", 768) for v in vs], labels, "768 × 900 · 学习中 · 浅色")
