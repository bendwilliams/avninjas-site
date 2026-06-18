#!/usr/bin/env python3
"""
Generative outpaint / uncrop of the three AV Ninjas "audiences" images.

Technique: nano-banana / Gemini image *editing* (image-to-image), NOT
text-to-image. Each 928x1152 source is composited, centered, onto a
1152x1152 square canvas leaving 112px empty margins on the LEFT and RIGHT.
The model is then asked to fill ONLY those empty side margins so the
original (untouched, centered) scene is extended seamlessly outward.

The original scene region is pasted back over the model's output at full
fidelity afterwards, so the central 928px column is byte-for-byte the
source -- the model only ever contributes the two 112px side strips.

Usage:
  python scripts/outpaint-audiences.py            # all three
  python scripts/outpaint-audiences.py in-person  # one
"""
import os, sys, io, base64, json, time
import requests
from PIL import Image

KEY = os.environ.get("GEMINI_API_KEY")
if not KEY:
    sys.exit("GEMINI_API_KEY not set in environment")

MODEL = os.environ.get("OUTPAINT_MODEL", "gemini-3-pro-image")
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

IMG_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "images")
IMG_DIR = os.path.abspath(IMG_DIR)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "_outpaint")
OUT_DIR = os.path.abspath(OUT_DIR)
os.makedirs(OUT_DIR, exist_ok=True)

TARGET = 1152  # final square edge

PROMPTS = {
    "in-person": (
        "This is a photograph of a corporate event in a warm, golden-lit hotel "
        "ballroom: round banquet tables with white linens and seated business "
        "attendees, gold chandeliers, a coffered wood-paneled ceiling with recessed "
        "lighting, wall sconces, and at the right a low stage with a speaker at a "
        "podium beside a large presentation screen, with AV crew in black polo shirts. "
        "The central image is intact; only the empty vertical margin strips on the FAR "
        "LEFT and FAR RIGHT edges need to be filled in. Extend the ballroom scene "
        "outward into those side margins ONLY: continue the rows of round banquet "
        "tables and seated attendees, the patterned carpet, the wood-paneled walls "
        "with sconces, and the coffered ceiling with chandeliers. Match the existing "
        "warm golden color grade, the soft event lighting, the perspective and "
        "vanishing point, grain, and depth of field EXACTLY so the addition is "
        "completely seamless and invisible. Do not alter, move, restyle, or "
        "regenerate anything in the central region. Photorealistic, same camera."
    ),
    "hybrid": (
        "This is a photograph of a hybrid corporate event in an elegant dim ballroom "
        "with crystal chandeliers, a gray-and-gold coffered ceiling, an ornate "
        "patterned carpet, round banquet tables of seated attendees in dark suits, a "
        "speaker at a lit podium on a stage at the left, a professional broadcast "
        "video camera on a tripod in the center foreground, an AV crew member in a "
        "black 'AV Ninjas' polo seen from behind at the right, and a large screen "
        "showing a grid of remote video attendees. The central image is intact; only "
        "the empty vertical margin strips on the FAR LEFT and FAR RIGHT edges need to "
        "be filled in. Extend the ballroom scene outward into those side margins ONLY: "
        "continue the patterned carpet, more round banquet tables and seated "
        "attendees, the paneled walls, and the coffered ceiling with additional "
        "crystal chandeliers. Match the existing cool-but-warm dim event color grade, "
        "the moody lighting, the perspective, grain, and depth of field EXACTLY so the "
        "addition is completely seamless. Do not alter, move, restyle, or regenerate "
        "anything in the central region. Photorealistic, same camera."
    ),
    "virtual": (
        "This is a photograph of a broadcast studio: a presenter in a dark blazer "
        "stands in profile at the left speaking to a professional video camera (a "
        "dark out-of-focus camera body is in the foreground), a large monitor on the "
        "right displays a grid of remote video-call attendees, an AV crew operator in "
        "a black 'AV Ninjas' polo works at the right, all against a smooth neutral "
        "gray seamless studio backdrop with soft warm directional lighting. The "
        "central image is intact; only the empty vertical margin strips on the FAR "
        "LEFT and FAR RIGHT edges need to be filled in. Extend the studio scene "
        "outward into those side margins ONLY: continue the smooth gray seamless "
        "backdrop, the studio floor, and subtle studio lighting falloff; you may add "
        "plausible studio elements such as a light stand, c-stand, or softbox edge at "
        "the far margins if natural. Match the existing warm-on-gray color grade, the "
        "soft cinematic lighting gradient, the perspective, grain, and shallow depth "
        "of field EXACTLY so the addition is completely seamless. Do not alter, move, "
        "restyle, or regenerate anything in the central region. Photorealistic, same "
        "camera."
    ),
}


def build_canvas(src_path):
    src = Image.open(src_path).convert("RGB")
    w, h = src.size  # 928 x 1152
    canvas = Image.new("RGB", (TARGET, h), (128, 128, 128))
    off_x = (TARGET - w) // 2
    canvas.paste(src, (off_x, 0))
    return canvas, src, off_x, w, h


def call_model(canvas_img, prompt, retries=4):
    buf = io.BytesIO()
    canvas_img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    body = {
        "contents": [{
            "role": "user",
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/png", "data": b64}},
            ],
        }],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    delay = 4
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(URL + "?key=" + KEY, json=body, timeout=180)
            if r.status_code == 200:
                data = r.json()
                for cand in data.get("candidates", []):
                    for part in cand.get("content", {}).get("parts", []):
                        inl = part.get("inline_data") or part.get("inlineData")
                        if inl and inl.get("data"):
                            return base64.b64decode(inl["data"])
                raise RuntimeError("200 but no image part: " +
                                   json.dumps(data)[:600])
            if r.status_code in (429, 500, 503):
                print(f"  [{r.status_code}] retry {attempt}/{retries} in {delay}s")
                time.sleep(delay); delay *= 2; continue
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:600]}")
        except requests.RequestException as e:
            print(f"  net error {attempt}/{retries}: {e}; retry in {delay}s")
            time.sleep(delay); delay *= 2
    raise RuntimeError("exhausted retries")


def process(name):
    src_path = os.path.join(IMG_DIR, f"img-audiences-{name}.jpg")
    print(f"== {name} ==  source {src_path}")
    canvas, src, off_x, w, h = build_canvas(src_path)
    canvas_path = os.path.join(OUT_DIR, f"{name}-canvas.png")
    canvas.save(canvas_path)

    out_bytes = call_model(canvas, PROMPTS[name])
    gen = Image.open(io.BytesIO(out_bytes)).convert("RGB")
    # normalize the model output to the square target
    if gen.size != (TARGET, TARGET):
        gen = gen.resize((TARGET, TARGET), Image.LANCZOS)

    raw_path = os.path.join(OUT_DIR, f"{name}-model-raw.png")
    gen.save(raw_path)

    # Re-paste the ORIGINAL center column at full fidelity. The square output
    # may be TARGET tall while the source is 1152 tall already (h==TARGET),
    # so the vertical mapping is 1:1. off_x..off_x+w is the protected column.
    final = gen.copy()
    final.paste(src, (off_x, 0))

    out_jpg = os.path.join(OUT_DIR, f"img-audiences-{name}.jpg")
    final.save(out_jpg, format="JPEG", quality=92, optimize=True)
    print(f"   -> {out_jpg}  {final.size}  (center {w}px preserved, "
          f"{off_x}px extended each side)")
    return out_jpg


if __name__ == "__main__":
    names = sys.argv[1:] or ["in-person", "hybrid", "virtual"]
    for n in names:
        process(n)
        time.sleep(2)
