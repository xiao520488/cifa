import os, glob
from PIL import Image, ImageDraw, ImageFont

SRC = r"C:\Users\xiao\.dsh\mcp\playwright-mcp"
DST = r"D:\背单词\design-lab\shots"

for f in glob.glob(os.path.join(SRC, "rev-*.png")):
    with open(f, "rb") as r, open(os.path.join(DST, os.path.basename(f)), "wb") as w:
        w.write(r.read())


def font(size, bold=False):
    for p in ([r"C:\Windows\Fonts\msyhbd.ttc"] if bold else []) + [r"C:\Windows\Fonts\msyh.ttc"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

PAD, CAP = 20, 36

def sheet(name, files, labels, title):
    imgs = [Image.open(f).convert("RGB") for f in files]
    w = sum(i.width for i in imgs) + PAD * (len(imgs) + 1)
    h = max(i.height for i in imgs) + PAD * 2 + CAP + 24
    canvas = Image.new("RGB", (w, h), (22, 22, 22))
    d = ImageDraw.Draw(canvas)
    d.text((PAD, 8), title, fill=(240, 240, 235), font=font(17, True))
    x = PAD
    for img, lab in zip(imgs, labels):
        d.text((x, 34), lab, fill=(150, 150, 144), font=font(12, True))
        canvas.paste(img, (x, 34 + CAP))
        x += img.width + PAD
    canvas.save(os.path.join(DST, name))
    print("wrote", name, canvas.size)

skins = ["paper", "foundry", "instrument", "broadsheet"]
labels = ["paper", "foundry", "instrument", "broadsheet"]

sheet("rev-360-study.png", [os.path.join(SRC, f"rev-{s}-360-study.png") for s in skins], labels, "360 × 800 · 学习中 · 浅色")
sheet("rev-360-start.png", [os.path.join(SRC, f"rev-{s}-360-start.png") for s in skins], labels, "360 × 800 · 开始页 · 浅色")
sheet("rev-360-quiz.png", [os.path.join(SRC, f"rev-{s}-360-quiz.png") for s in skins], labels, "360 × 800 · 自测 · 浅色")
sheet("rev-1440-study.png", [os.path.join(SRC, f"rev-{s}-1440-study.png") for s in skins], labels, "1440 × 900 · 学习中 · 浅色")
