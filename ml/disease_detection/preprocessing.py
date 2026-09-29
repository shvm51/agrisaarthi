"""Image validation + preprocessing for disease detection.

Raises QualityTooLow when the image is unusable so routers can return a
friendly retake message instead of an unreliable diagnosis.
"""
import io
from typing import Tuple

from PIL import Image, ImageOps

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
TARGET_SIZE: Tuple[int, int] = (224, 224)
BLUR_THRESHOLD = 100.0  # variance-of-Laplacian floor; below => too blurry


class QualityTooLow(Exception):
    user_message = (
        "Image quality is too low. Please capture a clearer image of the affected leaf."
    )


def _blur_score(img: Image.Image) -> float:
    """Variance of Laplacian — cheap blur estimate."""
    gray = img.convert("L").resize((128, 128))
    px = list(gray.tobytes())
    w, h = gray.size
    vals = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            c = px[y * w + x]
            lap = abs(4 * c - px[y * w + x - 1] - px[y * w + x + 1]
                      - px[(y - 1) * w + x] - px[(y + 1) * w + x])
            vals.append(lap)
    mean = sum(vals) / len(vals)
    return sum((v - mean) ** 2 for v in vals) / len(vals)


def validate(raw: bytes, max_bytes: int = 8 * 1024 * 1024) -> Image.Image:
    if not raw:
        raise ValueError("Empty image upload.")
    if len(raw) > max_bytes:
        raise ValueError(f"Image too large (max {max_bytes // (1024*1024)} MB).")
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception:
        raise ValueError("Unsupported image format. Please upload a JPEG or PNG photo.")
    if img.format not in ALLOWED_FORMATS:
        raise ValueError(f"Unsupported image format ({img.format}). Please upload a JPEG or PNG photo.")
    return img


def preprocess(raw: bytes, max_bytes: int = 8 * 1024 * 1024) -> Image.Image:
    """validate -> quality check -> orientation fix -> resize -> normalize."""
    img = validate(raw, max_bytes)
    if _blur_score(img) < BLUR_THRESHOLD:
        raise QualityTooLow()
    img = ImageOps.exif_transpose(img)  # orientation correction
    img = img.convert("RGB").resize(TARGET_SIZE)
    return img  # normalized tensor conversion happens in the model impl


if __name__ == "__main__":
    # Sharp test image passes; a flat grey image must be rejected.
    sharp = Image.new("RGB", (400, 400))
    px = sharp.load()
    for y in range(400):
        for x in range(400):
            px[x, y] = ((x * y) % 256, (x * 3) % 256, (y * 5) % 256)
    buf = io.BytesIO()
    sharp.save(buf, format="JPEG", quality=95)
    out = preprocess(buf.getvalue())
    assert out.size == TARGET_SIZE, out.size

    flat = Image.new("RGB", (400, 400), (128, 128, 128))
    buf2 = io.BytesIO()
    flat.save(buf2, format="JPEG", quality=95)
    try:
        preprocess(buf2.getvalue())
        raise AssertionError("flat image should be rejected as too blurry")
    except QualityTooLow:
        pass

    try:
        validate(b"not-an-image")
        raise AssertionError("garbage bytes should fail validation")
    except ValueError:
        pass
    print("OK: preprocessing validation + quality checks pass")
