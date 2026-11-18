import base64
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("ios_ci", Path(__file__).resolve().parents[2] / "scripts/prepare-ios-ci.py")
ci = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ci)


class IosCiInputsTest(unittest.TestCase):
    def test_restores_private_files_and_preserves_single_line_environment(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            environ = {"IOS_CI_RUNTIME_JSON": json.dumps({"SENTRY_AUTH_TOKEN": "synthetic-ci-token"}),
                       "IOS_CI_FIREBASE_PLIST_B64": base64.b64encode(b"synthetic plist").decode()}
            with contextlib.redirect_stdout(io.StringIO()) as output:
                result = ci.prepare("openings", root / "source", root / "runner", root / "environment", environ, True)
            self.assertIn("::add-mask::synthetic-ci-token", output.getvalue())
            file = Path(result["GOOGLE_SERVICE_INFO_PLIST"])
            self.assertEqual(file.read_bytes(), b"synthetic plist")
            self.assertEqual(file.stat().st_mode & 0o777, 0o600)
            self.assertEqual((root / "source/ios/Openings/GoogleService-Info.plist").read_bytes(), file.read_bytes())
            self.assertIn("SENTRY_AUTH_TOKEN=synthetic-ci-token\n", (root / "environment").read_text())

    def test_rejects_process_overrides_and_environment_injection_before_writing(self):
        for runtime in ({"PATH": "/untrusted"}, {"SENTRY_AUTH_TOKEN": "value\nPATH=/untrusted"}):
            with self.subTest(runtime=runtime), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                with self.assertRaises(ValueError):
                    ci.prepare("openings", root, root / "runner", root / "environment", {"IOS_CI_RUNTIME_JSON": json.dumps(runtime)}, True)
                self.assertFalse((root / "runner").exists())

    def test_rejects_invalid_encoded_inputs_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises(ValueError):
                ci.prepare("openings", root, root / "runner", root / "environment", {
                    "IOS_CI_RUNTIME_JSON": "{}", "IOS_CI_FIREBASE_PLIST_B64": "invalid!"}, True)
            self.assertFalse((root / "runner").exists())


if __name__ == "__main__":
    unittest.main()
