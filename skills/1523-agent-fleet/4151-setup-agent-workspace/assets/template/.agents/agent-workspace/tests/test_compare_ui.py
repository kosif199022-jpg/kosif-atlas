"""Run with Pillow: python3 -m unittest discover -s .agents/agent-workspace/tests -p test_compare_ui.py."""

import hashlib
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/compare-ui.py"
SPEC = importlib.util.spec_from_file_location("compare_ui", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CompareUiTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.before = self.root / "before.png"
        self.after = self.root / "after.png"
        Image.new("RGBA", (120, 80), "white").save(self.before)
        self.changed = Image.new("RGBA", (120, 80), "white")
        self.changed.putpixel((10, 20), (255, 0, 0, 255))
        self.changed.save(self.after)

    def compare(self, **options):
        return MODULE.compare(self.root, options.pop("task", "TASK-13"), options.pop("name", "panel-desktop"), self.before, self.after, **options)

    def test_local_onion_and_exact_statistics_without_retained_assets(self):
        result = self.compare()
        self.assertFalse((self.root / "backlog").exists())
        self.assertIsNone(result["comparison"])
        self.assertEqual(result["difference"]["changedPixels"], 1)
        self.assertEqual(result["difference"]["boundingBox"], (10, 20, 11, 21))
        self.assertEqual(result["before"]["sha256"], hashlib.sha256(self.before.read_bytes()).hexdigest())
        with Image.open(self.root / result["onion"]) as onion:
            self.assertEqual(onion.size, (120, 80))
            self.assertEqual(onion.getpixel((10, 20)), (255, 127, 127, 255))

    def test_published_lossless_pair_preserves_geometry_and_pixels(self):
        result = self.compare(publish=True)
        self.assertEqual(result["comparison"], "backlog/assets/task-13/panel-desktop.webp")
        self.assertIn("(../assets/task-13/panel-desktop.webp)", result["markdown"])
        with Image.open(self.root / result["comparison"]) as composite:
            self.assertEqual(composite.format, "WEBP")
            self.assertEqual(composite.size, (288, 156))
            pixels = composite.convert("RGBA")
            self.assertEqual(pixels.crop((16, 60, 136, 140)).tobytes(), Image.open(self.before).convert("RGBA").tobytes())
            self.assertEqual(pixels.crop((152, 60, 272, 140)).tobytes(), self.changed.tobytes())
        # A second identical command is deterministic and may be replayed safely.
        original = (self.root / result["comparison"]).read_bytes()
        self.compare(publish=True)
        self.assertEqual(original, (self.root / result["comparison"]).read_bytes())

    def test_unchanged_capture_reports_zero_without_visual_attestation(self):
        self.after.write_bytes(self.before.read_bytes())
        result = self.compare()
        self.assertEqual(result["difference"]["changedPixels"], 0)
        self.assertEqual(result["difference"]["meanAbsoluteRgbaDifference"], 0)
        self.assertEqual(result["difference"]["maxChannelDifference"], 0)
        self.assertIsNone(result["difference"]["boundingBox"])
        self.assertIn("Inspect", result["visualVerdict"])

    def test_mismatched_geometry_is_rejected_without_outputs(self):
        Image.new("RGB", (121, 80), "white").save(self.after)
        with self.assertRaisesRegex(ValueError, "dimensions differ"):
            self.compare(publish=True)
        self.assertFalse((self.root / "backlog").exists())

    def test_color_profiles_must_match_and_are_preserved(self):
        from PIL import ImageCms

        profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
        self.changed.save(self.after, icc_profile=profile)
        with self.assertRaisesRegex(ValueError, "color profiles differ"):
            self.compare(publish=True)
        Image.new("RGBA", (120, 80), "white").save(self.before, icc_profile=profile)
        result = self.compare(publish=True)
        for key in ("comparison", "onion"):
            with Image.open(self.root / result[key]) as image:
                self.assertEqual(image.info.get("icc_profile"), profile)
        self.assertEqual(result["before"]["colorProfileSha256"], hashlib.sha256(profile).hexdigest())

    def test_three_image_cap_and_explicit_replacement(self):
        for name in ("one", "two", "three"):
            self.compare(name=name, publish=True)
        with self.assertRaisesRegex(ValueError, "at most three"):
            self.compare(name="four", publish=True)
        self.changed.putpixel((11, 20), (0, 0, 255, 255))
        self.changed.save(self.after)
        with self.assertRaisesRegex(ValueError, "use --replace"):
            self.compare(name="one", publish=True)
        self.compare(name="one", publish=True, replace=True)
        self.assertEqual(len(list((self.root / "backlog/assets/task-13").glob("*.webp"))), 3)

    def test_output_names_cannot_traverse_or_change_task_directory(self):
        for options in ({"task": "../TASK-13"}, {"name": "../other"}, {"name": ""}):
            with self.assertRaises(ValueError):
                self.compare(**options)
        self.assertFalse((self.root / ".local").exists())

    def test_symlink_output_ancestors_and_files_are_refused(self):
        outside = self.root / "outside"
        outside.mkdir()
        (self.root / "backlog").symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "symlink"):
            self.compare(publish=True)
        (self.root / "backlog").unlink()
        assets = self.root / "backlog/assets/task-13"
        assets.mkdir(parents=True)
        (assets / "panel-desktop.webp").symlink_to(outside / "dangling.webp")
        with self.assertRaisesRegex(ValueError, "symlink"):
            self.compare(publish=True, replace=True)
        self.assertEqual(list(outside.iterdir()), [])

    def test_cli_failure_has_actionable_message_and_nonzero_status(self):
        result = subprocess.run([sys.executable, str(SCRIPT), "--root", str(self.root), "--task", "TASK-13", "--name", "panel", "--before", str(self.before), "--after", str(self.root / "missing.png")], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("compare-ui:", result.stderr)
        self.assertEqual(result.stdout, "")

    def test_comparison_locks_live_in_durable_runtime_and_are_not_stolen(self):
        lock = self.root / ".agents/agent-workspace/runtime/locks/visual-task-13.lock"
        lock.mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, "writer lock exists"):
            self.compare()
        self.assertTrue(lock.is_dir())
        lock.rmdir()
        self.compare()
        self.assertFalse(lock.exists())
        self.assertFalse((self.root / ".local/visual-evidence/task-13/.write.lock").exists())


if __name__ == "__main__":
    unittest.main()
