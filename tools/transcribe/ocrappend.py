#!/usr/bin/env python3
"""OCR one column crop of a page scan and append the text to a page file.

Usage: python3 -I ocrappend.py <scan.png> <x> <y> <w> <h> <out.md>

The crop is taken at full resolution and upscaled 200% for Tesseract. Lines are joined into
one running paragraph: a hyphen at a line end joins the word halves, other line ends become a
space. The agent then corrects OCR errors and inserts paragraph breaks with small edits, so it
never has to type the whole passage itself.
"""
import os
import re
import subprocess
import sys
import tempfile

png, x, y, w, h, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
with tempfile.TemporaryDirectory() as tmp:
    crop = os.path.join(tmp, "crop.png")
    subprocess.run(["convert", png, "-crop", f"{w}x{h}+{x}+{y}", "+repage", "-resize", "200%", crop], check=True)
    res = subprocess.run(["tesseract", crop, "stdout", "--psm", "4", "-l", "eng"], check=True,
                         capture_output=True, text=True)
lines = [l.strip() for l in res.stdout.splitlines()]
text = ""
for line in lines:
    if not line:
        continue
    # Drop stray column-rule characters Tesseract reads at the crop edges.
    line = line.strip("|¦ ")
    # Drop a fragment of the neighbouring column after a column rule ("pro- | (", "honour } t").
    line = re.sub(r"\s+[|}\]¦]\s*\S{0,3}$", "", line).strip()
    if not text:
        text = line
    elif text.endswith("-"):
        text = text[:-1] + line
    else:
        text += " " + line
with open(out, "a", encoding="utf-8") as f:
    f.write(text.replace("’", "'").replace("‘", "'") + "\n")
print(f"appended {len(text.split())} OCR words to {out}")
