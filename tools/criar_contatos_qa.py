from pathlib import Path
import argparse

from PIL import Image, ImageDraw, ImageFont


parser = argparse.ArgumentParser()
parser.add_argument('render_dir', type=Path)
args = parser.parse_args()
ROOT = args.render_dir.resolve()
OUT = ROOT / "contatos"
OUT.mkdir(exist_ok=True)
pages = sorted(ROOT.glob("page-*.png"))
font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 18)

cols, rows = 3, 4
cell_w, cell_h = 430, 590
for batch_index in range(0, len(pages), cols * rows):
    batch = pages[batch_index:batch_index + cols * rows]
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "#D0D0D0")
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(batch):
        page = Image.open(path).convert("RGB")
        page.thumbnail((cell_w - 18, cell_h - 34), Image.Resampling.LANCZOS)
        x = (index % cols) * cell_w + (cell_w - page.width) // 2
        y = (index // cols) * cell_h + 28
        sheet.paste(page, (x, y))
        draw.text(((index % cols) * cell_w + 8, (index // cols) * cell_h + 5), path.stem, font=font, fill="black")
    out = OUT / f"contato-{batch_index // (cols * rows) + 1:02d}.jpg"
    sheet.save(out, quality=88)
    print(out)
