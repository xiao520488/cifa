import os, glob
from PIL import Image, ImageDraw, ImageFont

SRC = r"C:\Users\xiao\.dsh\mcp\playwright-mcp"
DST = r"D:\背单词\design-lab\shots"
os.makedirs(DST, exist_ok=True)

for f in glob.glob(os.path.join(SRC, "r2-*.png")):
    with open(f, "rb") as r, open(os.path.join(DST, os.path.basename(f)), "wb") as w:
        w.write(r.read())


def font(size, bold=False):
    paths = ([r"C:\Windows\Fonts\msyhbd.ttc"] if bold else []) + [r"C:\Windows\Fonts\msyh.ttc"]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

PAD, CAP = 20, 38

def sheet(name, files, labels, title):
    imgs = [Image.open(f).convert("RGB") for f in files]
    w = sum(i.width for i in imgs) + PAD * (len(imgs) + 1)
    h = max(i.height for i in imgs) + PAD * 2 + CAP + 26
    canvas = Image.new("RGB", (w, h), (22, 22, 22))
    d = ImageDraw.Draw(canvas)
    d.text((PAD, 10), title, fill=(240, 240, 235), font=font(18, True))
    x = PAD
    for img, lab in zip(imgs, labels):
        d.text((x, 40), lab, fill=(150, 150, 144), font=font(13, True))
        canvas.paste(img, (x, 40 + CAP))
        x += img.width + PAD
    canvas.save(os.path.join(DST, name))
    print("wrote", name, canvas.size)

skins = [("paper", "paper 词典纸页"), ("foundry", "foundry 铅字"), ("instrument", "instrument 仪表"), ("broadsheet", "broadsheet 词表报")]
labels = [s[1] for s in skins]
p = lambda skin, state, theme="light", w=390: os.path.join(SRC, f"r2-{skin}-{state}-{theme}.png") if w == 390 else os.path.join(SRC, f"r2-{skin}-{state}-{w}.png")

sheet("v2-start-light.png", [p(s, "start") for s, _ in skins], labels, "390 · 开始页 · 浅色")
sheet("v2-study-light.png", [p(s, "study") for s, _ in skins], labels, "390 · 学习中 · 浅色")
sheet("v2-quiz-light.png", [p(s, "quiz") for s, _ in skins], labels, "390 · 自测 · 浅色")
sheet("v2-study-dark.png", [p(s, "study", "dark") for s, _ in skins], labels, "390 · 学习中 · 深色")
sheet("v2-me-light.png", [p(s, "me") for s, _ in skins], labels, "390 · 我的 · 浅色")
sheet("v2-study-768.png", [p(s, "study", "light", 768) for s, _ in skins], labels, "768 · 学习中 · 浅色")
