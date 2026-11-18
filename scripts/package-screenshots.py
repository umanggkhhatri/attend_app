"""Create contact sheets and a shareable archive from the captured UI gallery."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(__file__).resolve().parents[1]
gallery = root / 'artifacts/team-screenshots'
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 17)
heading = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 29)

for directory, columns, thumb, title in [
    ('faculty-admin', 3, (600, 375), 'OneAttend | Faculty / admin-style web screens'),
    ('student', 5, (220, 477), 'OneAttend | Student browser-preview screens'),
]:
    files = sorted((gallery / directory).glob('*.png'))
    gap, label_height, header = 18, 35, 76
    rows = (len(files) + columns - 1) // columns
    width = gap + columns * (thumb[0] + gap)
    height = header + rows * (thumb[1] + label_height + gap)
    sheet = Image.new('RGB', (width, height), '#eef1f6')
    draw = ImageDraw.Draw(sheet)
    draw.text((gap, 16), title, font=heading, fill='#1b2d43')
    draw.text((gap, 52), 'Use original PNGs for slides. All student records are fictional fixtures.', font=font, fill='#596a80')
    for i, file in enumerate(files):
        x = gap + (i % columns) * (thumb[0] + gap)
        y = header + (i // columns) * (thumb[1] + label_height + gap)
        image = ImageOps.contain(Image.open(file).convert('RGB'), thumb, method=Image.Resampling.LANCZOS)
        sheet.paste(image, (x + (thumb[0] - image.width) // 2, y))
        name = file.stem.replace('-', ' ')
        if len(name) > 28 and directory == 'student':
            name = name[:26] + '…'
        draw.text((x, y + thumb[1] + 8), name, font=font, fill='#263b56')
    sheet.save(gallery / f'index-{directory}.png')

archive = root / 'artifacts/OneAttend_Team_Screenshots.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as z:
    for file in sorted(gallery.rglob('*')):
        if file.is_file():
            z.write(file, file.relative_to(gallery.parent))
    assert z.testzip() is None
count = len(list((gallery / 'faculty-admin').glob('*.png'))) + len(list((gallery / 'student').glob('*.png')))
print(f'{count} original screenshots + 2 contact sheets packaged: {archive}')
print(f'Archive size: {archive.stat().st_size / 1024 / 1024:.2f} MB')
