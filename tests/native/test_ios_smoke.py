import importlib.util
from pathlib import Path
import plistlib
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("smoke", Path(__file__).resolve().parents[2] / "scripts/smoke-ios-simulator.py")
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SimulatorSmokeTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.app = self.root / "Example.app"
        self.app.mkdir()
        (self.app / "Info.plist").write_bytes(plistlib.dumps({"CFBundleExecutable": "Example", "CFBundleIdentifier": "test.example"}))

    def test_unsigned_app_is_rejected_before_simulator_installation(self):
        failure = subprocess.CalledProcessError(1, ["codesign"], stderr="invalid signature")
        with patch.object(smoke.subprocess, "run", side_effect=failure) as run, patch.object(smoke.subprocess, "check_output") as output:
            with self.assertRaises(subprocess.CalledProcessError):
                smoke.run_smoke("test.example", self.app, self.root / "build")
        self.assertEqual(run.call_args.args[0][:4], ["codesign", "--verify", "--deep", "--strict"])
        output.assert_not_called()

    def test_diagnostic_timeout_does_not_hide_the_launch_crash(self):
        def run(command, **options):
            if "screenshot" in command or "log" in command:
                raise subprocess.TimeoutExpired(command, options.get("timeout", 1))
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")
        devices = '{"devices":{"com.apple.CoreSimulator.SimRuntime.iOS-27-1":[{"name":"iPhone Test","udid":"synthetic-device","state":"Booted"}]}}'
        with patch.object(smoke.subprocess, "run", side_effect=run), patch.object(smoke.subprocess, "check_output", side_effect=[devices, "test.example: 123\n"]), patch.object(smoke.time, "sleep"), patch.object(smoke.os, "kill", side_effect=ProcessLookupError("application terminated")):
            with self.assertRaisesRegex(ProcessLookupError, "application terminated"):
                smoke.run_smoke("test.example", self.app, self.root / "build")
        error = (self.root / "build/ios-smoke/failure.txt").read_text()
        self.assertIn("ProcessLookupError", error)
        self.assertIn("application terminated", error)
        self.assertIn("TimeoutExpired", (self.root / "build/ios-smoke/diagnostics-errors.txt").read_text())

    def test_bundle_mismatch_is_rejected_without_running_commands(self):
        with patch.object(smoke.subprocess, "run") as run:
            with self.assertRaisesRegex(ValueError, "bundle identifier"):
                smoke.run_smoke("test.different", self.app, self.root / "build")
        run.assert_not_called()

    def test_process_alive_with_blank_screen_never_passes_readiness(self):
        with patch.object(smoke, "read_screen_text", return_value=["9:41"], create=True), patch.object(smoke.time, "sleep"), patch.object(smoke.os, "kill"):
            with self.assertRaisesRegex(RuntimeError, "interface"):
                smoke.wait_for_interface("device", 123, self.root / "screen.png", Path("reader"), attempts=2)

    def test_waits_for_navigation_after_initial_loading_screen(self):
        with patch.object(smoke, "read_screen_text", side_effect=[["9:41"], ["Discover Saved jobs", "Remote", "All countries"]], create=True) as screen, patch.object(smoke.time, "sleep"), patch.object(smoke.os, "kill") as alive:
            smoke.wait_for_interface("device", 123, self.root / "screen.png", Path("reader"), attempts=2)
        self.assertEqual(screen.call_count, 2)
        self.assertEqual(alive.call_count, 2)


if __name__ == "__main__":
    unittest.main()
