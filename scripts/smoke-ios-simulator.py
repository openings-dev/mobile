"""Launch the freshly built simulator app and check that its process stays alive."""

import argparse
import json
import os
import plistlib
import shutil
from pathlib import Path
import re
import subprocess
import time


parser = argparse.ArgumentParser()
parser.add_argument("bundle_id")
parser.add_argument("app_path", type=Path)
args = parser.parse_args()
if not args.app_path.is_dir():
    raise SystemExit("The verified simulator application was not found")
devices = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "--json"]))["devices"]
candidates = [device for runtime, group in devices.items() if ".iOS-" in runtime for device in group if device["name"].startswith("iPhone")]
if not candidates:
    raise SystemExit("No available iPhone simulator")
device = candidates[0]
identifier = device["udid"]
if device["state"] != "Booted":
    subprocess.run(["xcrun", "simctl", "boot", identifier], check=True)
subprocess.run(["xcrun", "simctl", "bootstatus", identifier, "-b"], check=True, timeout=180)
subprocess.run(["xcrun", "simctl", "install", identifier, str(args.app_path)], check=True)
diagnostics = Path("build/ios-smoke")
diagnostics.mkdir(parents=True, exist_ok=True)
with (args.app_path / "Info.plist").open("rb") as info_file:
    executable = plistlib.load(info_file)["CFBundleExecutable"]
try:
    launch = subprocess.check_output(["xcrun", "simctl", "launch", "--terminate-running-process", identifier, args.bundle_id], text=True)
    print(launch.strip(), flush=True)
    match = re.search(r": (\d+)\s*$", launch)
    if not match:
        raise SystemExit("simctl did not return the launched process ID")
    time.sleep(5)
    os.kill(int(match.group(1)), 0)
finally:
    subprocess.run(["xcrun", "simctl", "io", identifier, "screenshot", "build/ios-smoke.png"], check=False, timeout=30)
    # Only this freshly installed app's process, on the ephemeral CI simulator.
    predicate = "process == " + json.dumps(executable)
    result = subprocess.run(["xcrun", "simctl", "spawn", identifier, "log", "show", "--last", "3m", "--style", "compact", "--predicate", predicate], capture_output=True, text=True, timeout=45)
    (diagnostics / "process.log").write_text(result.stdout + result.stderr)
    reports = Path.home() / "Library/Logs/DiagnosticReports"
    for report in reports.glob(executable + "*.ips"):
        shutil.copy2(report, diagnostics / report.name)
print("Fresh simulator install and launch passed for " + args.bundle_id)
