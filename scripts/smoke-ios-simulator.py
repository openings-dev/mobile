"""Launch the freshly built simulator app and check that its process stays alive."""

import argparse
import json
import os
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
launch = subprocess.check_output(["xcrun", "simctl", "launch", "--terminate-running-process", identifier, args.bundle_id], text=True)
match = re.search(r": (\d+)\s*$", launch)
if not match:
    raise SystemExit("simctl did not return the launched process ID")
time.sleep(5)
os.kill(int(match.group(1)), 0)
subprocess.run(["xcrun", "simctl", "io", identifier, "screenshot", "build/ios-smoke.png"], check=True)
print("Fresh simulator install and launch passed for " + args.bundle_id)
