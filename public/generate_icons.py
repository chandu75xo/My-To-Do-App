# Run this once to generate PNG icons if you have Pillow installed:
# pip install Pillow
# python generate_icons.py
from PIL import Image, ImageDraw, ImageFont
import os

for size in [192, 512]:
    img  = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Rounded rect background
    draw.rounded_rectangle([0, 0, size, size], radius=size//5, fill='#111827')
    # Text
    font_size = int(size * 0.47)
    try:
        font = ImageFont.truetype('arial.ttf', font_size)
    except:
        font = ImageFont.load_default()
    draw.text((size//2, size//2 + size*0.05), 'd.', fill='white', font=font, anchor='mm')
    img.save(f'icon-{size}.png')
    print(f'Generated icon-{size}.png')
