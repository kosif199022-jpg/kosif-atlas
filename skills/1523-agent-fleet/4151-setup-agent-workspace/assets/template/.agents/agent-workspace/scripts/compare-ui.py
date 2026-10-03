#!/usr/bin/env python3
"""Compare real UI captures without resizing or inventing a visual verdict."""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
import tempfile

try:
    from PIL import Image, ImageChops, ImageDraw, ImageFont, features
except ImportError:
    raise SystemExit("Pillow is required for image comparison. Use a project or bundled Python with Pillow; coordination itself does not require it.")


def inside(root, relative):
    """Refuse output redirects, including dangling symlinks, before creating paths."""
    path = root
    for part in Path(relative).parts:
        if part in ("..", "/"):
            raise ValueError("Output paths must remain within the workspace")
        path = path / part
        if path.is_symlink():
            raise ValueError(f"Refusing symlink output path: {path}")
    return path


def read_capture(path):
    source = Path(path).resolve(strict=True)
    data = source.read_bytes()
    with Image.open(io.BytesIO(data)) as image:
        if getattr(image, "n_frames", 1) != 1:
            raise ValueError("Use a single screenshot, not an animation")
        pixels = image.convert("RGBA")
    profile = pixels.info.get("icc_profile")
    return pixels, {
        "path": str(source),
        "sha256": hashlib.sha256(data).hexdigest(),
        "colorProfileSha256": hashlib.sha256(profile).hexdigest() if profile else None,
    }


def encode(image, format):
    output = io.BytesIO()
    options = {"lossless": True, "exact": True, "method": 6} if format == "WEBP" else {}
    if image.info.get("icc_profile"):
        options["icc_profile"] = image.info["icc_profile"]
    image.save(output, format=format, **options)
    return output.getvalue()


def write_image(path, data, replace):
    if path.exists():
        if path.read_bytes() == data:
            return
        if not replace:
            raise ValueError(f"Output exists with different content: {path}; inspect it and use --replace deliberately")
    descriptor, temporary = tempfile.mkstemp(prefix=".compare-ui-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(data)
        if replace:
            os.replace(temporary, path)
        else:
            # An atomic link also refuses a file created by an uncoordinated writer.
            os.link(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def compare(root, task, name, before_path, after_path, publish=False, replace=False):
    root = Path(root).resolve(strict=True)
    if not re.fullmatch(r"TASK-[1-9][0-9]*(?:\.[1-9][0-9]*)*", task, re.IGNORECASE):
        raise ValueError("Use a canonical task ID such as TASK-13")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name) or len(name) > 80:
        raise ValueError("Name must be a lowercase filename slug of at most 80 characters")
    task = task.upper()
    local_relative = Path(".local/visual-evidence") / task.lower()
    asset_relative = Path("backlog/assets") / task.lower()
    local = inside(root, local_relative)
    assets = inside(root, asset_relative)
    onion = inside(root, local_relative / f"{name}-onion.png")
    combined = inside(root, asset_relative / f"{name}.webp")
    lock = inside(root, Path(".agents/agent-workspace/runtime/locks") / f"visual-{task.lower()}.lock")
    before, before_info = read_capture(before_path)
    after, after_info = read_capture(after_path)
    if before.size != after.size:
        raise ValueError("Capture dimensions differ; recapture at the same viewport, scale and crop (never resize to align)")
    if before.info.get("icc_profile") != after.info.get("icc_profile"):
        raise ValueError("Capture color profiles differ; recapture with matching color settings")
    width, height = before.size
    margin, header = 16, 44
    if publish and (2 * width + 3 * margin > 16383 or height + header + 2 * margin > 16383):
        raise ValueError("Combined image exceeds WebP dimensions; recapture a meaningful common region")
    if publish and not features.check("webp"):
        raise ValueError("This Pillow build has no WebP support")

    difference = ImageChops.difference(before, after)
    channel_diffs = difference.split()
    maximum = channel_diffs[0]
    for channel in channel_diffs[1:]:
        maximum = ImageChops.lighter(maximum, channel)
    histogram = maximum.histogram()
    pixels = width * height
    changed = pixels - histogram[0]
    total_difference = sum(sum(value * count for value, count in enumerate(channel.histogram())) for channel in channel_diffs)
    result = {
        "version": 1,
        "task": task,
        "before": before_info,
        "after": after_info,
        "dimensions": {"width": width, "height": height},
        "difference": {
            "changedPixels": changed,
            "totalPixels": pixels,
            "changedFraction": changed / pixels,
            "meanAbsoluteRgbaDifference": total_difference / (pixels * 4),
            "maxChannelDifference": max(value for value, count in enumerate(histogram) if count),
            "boundingBox": maximum.getbbox(),
        },
        "onion": onion.relative_to(root).as_posix(),
        "onionRatio": "50% before / 50% after",
        "comparison": None,
        "markdown": None,
        "visualVerdict": "Inspect the onion at native size; pixel statistics do not decide whether a change is noticeable.",
    }
    local.mkdir(parents=True, exist_ok=True)
    lock.parent.mkdir(parents=True, exist_ok=True)
    try:
        lock.mkdir()
    except FileExistsError:
        raise ValueError(f"Comparison writer lock exists: {lock}; confirm its writer stopped before recovering it")
    try:
        if publish:
            assets.mkdir(parents=True, exist_ok=True)
            retained = list(assets.rglob("*"))
            if any(path.is_symlink() for path in retained):
                raise ValueError("Refusing symlink entries in task assets")
            images = [path for path in retained if path.is_file() and path.suffix.lower() == ".webp"]
            if len(images) + (0 if combined in images else 1) > 3:
                raise ValueError("A task may retain at most three WebP comparison images; curate existing evidence explicitly")
        overlay = Image.blend(before, after, 0.5)
        overlay.info["icc_profile"] = before.info.get("icc_profile")
        write_image(onion, encode(overlay, "PNG"), replace)
        if publish:
            image = Image.new("RGBA", (2 * width + 3 * margin, height + header + 2 * margin), "white")
            image.info["icc_profile"] = before.info.get("icc_profile")
            image.paste(before, (margin, margin + header))
            image.paste(after, (2 * margin + width, margin + header))
            draw = ImageDraw.Draw(image)
            font = ImageFont.load_default(size=20)
            draw.text((margin, margin), "Before", font=font, fill="black")
            draw.text((2 * margin + width, margin), "After", font=font, fill="black")
            write_image(combined, encode(image, "WEBP"), replace)
            result["comparison"] = combined.relative_to(root).as_posix()
            result["markdown"] = f"![Before and after: {name.replace('-', ' ')}](../assets/{task.lower()}/{name}.webp)"
    finally:
        lock.rmdir()
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Workspace root (default: current directory)")
    parser.add_argument("--task", required=True)
    parser.add_argument("--name", required=True, help="Stable lowercase subject/state slug")
    parser.add_argument("--before", required=True, type=Path)
    parser.add_argument("--after", required=True, type=Path)
    parser.add_argument("--publish", action="store_true", help="Also write the inspected pair to backlog/assets; otherwise produce only local onion evidence")
    parser.add_argument("--replace", action="store_true", help="Explicitly replace differing output at this exact slug; never delete other evidence")
    options = parser.parse_args()
    try:
        result = compare(options.root, options.task, options.name, options.before, options.after, options.publish, options.replace)
    except (OSError, ValueError, Image.DecompressionBombError) as error:
        parser.exit(1, f"compare-ui: {error}\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
