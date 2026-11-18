"""Verify signing, launch a fresh simulator install, and preserve failure diagnostics."""

import argparse
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import time


def read_screen_text(identifier, screenshot, reader):
    subprocess.run(["xcrun", "simctl", "io", identifier, "screenshot", str(screenshot)], check=True, timeout=30, capture_output=True)
    return json.loads(subprocess.check_output([str(reader), str(screenshot)], text=True, timeout=30))


def wait_for_interface(identifier, pid, screenshot, reader, attempts=12):
    # Initial Remote Config and StoreKit lookups can outlast a five-second probe.
    # A running process with a blank root view is not a successful app launch.
    for _ in range(attempts):
        time.sleep(5)
        os.kill(pid, 0)
        text = read_screen_text(identifier, screenshot, reader)
        content = " ".join(text).casefold()
        labels = ("search jobs", "stack / technology", "all countries", "discover", "saved jobs", "with salary", "remote")
        if sum(label in content for label in labels) >= 2:
            return
    raise RuntimeError("Openings interface did not reach its job search screen")


def collect_diagnostics(identifier, executable, build_dir, started_at):
    diagnostics = build_dir / "ios-smoke"
    diagnostics.mkdir(parents=True, exist_ok=True)
    errors = []
    commands = [
        (["xcrun", "simctl", "io", identifier, "screenshot", str(build_dir / "ios-smoke.png")], 30, None),
        (["xcrun", "simctl", "spawn", identifier, "log", "show", "--last", "3m", "--style", "compact", "--predicate", "process == " + json.dumps(executable)], 45, diagnostics / "process.log"),
    ]
    for command, timeout, output in commands:
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
            if output:
                output.write_text((result.stdout or "") + (result.stderr or ""))
            if result.returncode:
                errors.append(f"Diagnostic command exited with {result.returncode}: {command[2]}")
        except (OSError, subprocess.SubprocessError) as error:
            errors.append(f"{type(error).__name__}: {error}")
    try:
        reports = Path.home() / "Library/Logs/DiagnosticReports"
        for report in reports.glob(executable + "*.ips"):
            if report.stat().st_mtime >= started_at:
                shutil.copy2(report, diagnostics / report.name)
    except OSError as error:
        errors.append(f"{type(error).__name__}: {error}")
    if errors:
        (diagnostics / "diagnostics-errors.txt").write_text("\n".join(errors) + "\n")


def run_smoke(bundle_id, app_path, build_dir=Path("build")):
    if not app_path.is_dir():
        raise ValueError("The verified simulator application was not found")
    with (app_path / "Info.plist").open("rb") as info_file:
        info = plistlib.load(info_file)
    if info.get("CFBundleIdentifier") != bundle_id:
        raise ValueError("The simulator app bundle identifier does not match the requested app")
    executable = info["CFBundleExecutable"]
    # Compilation alone cannot prove that embedded dynamic frameworks can load.
    subprocess.run(["codesign", "--verify", "--deep", "--strict", "--verbose=2", str(app_path)], check=True, timeout=60)
    devices = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "--json"], text=True, timeout=30))["devices"]
    candidates = [device for runtime, group in devices.items() if ".iOS-" in runtime for device in group if device["name"].startswith("iPhone")]
    if not candidates:
        raise ValueError("No available iPhone simulator")
    device = candidates[0]
    identifier = device["udid"]
    if device["state"] != "Booted":
        subprocess.run(["xcrun", "simctl", "boot", identifier], check=True, timeout=60)
    subprocess.run(["xcrun", "simctl", "bootstatus", identifier, "-b"], check=True, timeout=180)
    subprocess.run(["xcrun", "simctl", "install", identifier, str(app_path)], check=True, timeout=180)
    diagnostics = build_dir / "ios-smoke"
    diagnostics.mkdir(parents=True, exist_ok=True)
    reader = build_dir.resolve() / "ios-screen-reader"
    subprocess.run([
        "xcrun", "swiftc", "-module-cache-path", str(build_dir.resolve() / "ios-screen-reader-cache"),
        str(Path(__file__).with_name("read-ios-screen.swift")), "-o", str(reader),
    ], check=True, timeout=180)
    started_at = time.time()
    try:
        launch = subprocess.check_output(["xcrun", "simctl", "launch", "--terminate-running-process", identifier, bundle_id], text=True, timeout=60)
        print(launch.strip(), flush=True)
        match = re.search(r": (\d+)\s*$", launch)
        if not match:
            raise RuntimeError("simctl did not return the launched process ID")
        wait_for_interface(identifier, int(match.group(1)), build_dir / "ios-smoke.png", reader)
    except Exception as error:
        (diagnostics / "failure.txt").write_text(f"{type(error).__name__}: {error}\n")
        raise
    finally:
        # Diagnostics must never replace the original launch failure.
        try:
            collect_diagnostics(identifier, executable, build_dir, started_at)
        except Exception as error:
            print(f"Unable to collect simulator diagnostics: {type(error).__name__}: {error}", flush=True)
    print("Fresh simulator install and launch passed for " + bundle_id)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("bundle_id")
    parser.add_argument("app_path", type=Path)
    args = parser.parse_args()
    run_smoke(args.bundle_id, args.app_path)
