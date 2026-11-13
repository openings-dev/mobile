"""Restore one app's encrypted CI inputs into ephemeral runner storage."""

import argparse
import base64
import json
import os
from pathlib import Path
import re
import secrets
import shutil


APP_NAMES = {"godlier": "Godlier", "openings": "Openings", "troco": "Troco", "crivo": "Crivo"}
RUNTIME_KEY = re.compile(r"(?:EXPO_PUBLIC_|SENTRY_|IOS_|FIREBASE_|GOOGLE_ADMOB_|ADMOB_|IS_|SUBSCRIPTION_|MIXPANEL_|ONE_SIGNAL_)[A-Z0-9_]+|APP_VARIANT")


def single_line(value):
    if not isinstance(value, str) or not value or any(c in value for c in "\r\n\0"):
        raise ValueError("CI environment values must be nonempty single-line strings")
    return value


def prepare(app, root, temporary, environment_file, environ, verify_only=False):
    if app not in APP_NAMES:
        raise ValueError("Unknown iOS app")
    runtime = json.loads(environ["IOS_CI_RUNTIME_JSON"])
    if not isinstance(runtime, dict):
        raise ValueError("Runtime configuration must be an object")
    for key, value in runtime.items():
        if not RUNTIME_KEY.fullmatch(key):
            raise ValueError("Unexpected runtime environment key")
        single_line(value)

    files = {"FIREBASE_PLIST": ("GoogleService-Info.plist", "GOOGLE_SERVICE_INFO_PLIST")}
    if not verify_only:
        files.update({
            "P12": ("distribution.p12", "IOS_P12_PATH"),
            "ASC_KEY": ("asc.p8", "ASC_KEY_FILE"),
            "APP_PROFILE": ("profiles/app.mobileprovision", "IOS_APP_PROFILE_PATH"),
        })
        extensions = (["NOTIFICATION"] if app in ("openings", "troco") else
                      ["MONITOR", "ACTIVITY_REPORT", "SHIELD_CONFIGURATION", "SHIELD_ACTION"] if app == "crivo" else [])
        for extension in extensions:
            files[extension + "_PROFILE"] = ("profiles/" + extension.lower() + ".mobileprovision", "IOS_" + extension + "_PROFILE_PATH")
        for name in ("P12_PASSWORD", "ASC_KEY_ID", "ASC_ISSUER_ID"):
            single_line(environ["IOS_CI_" + name])

    # Validate every input before creating any private file.
    payloads = {key: base64.b64decode(environ["IOS_CI_" + key + "_B64"], validate=True) for key in files}
    if not all(payloads.values()):
        raise ValueError("CI credential files must not be empty")
    directory = temporary / "trebla-ios-release"
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    directory.chmod(0o700)
    output = dict(runtime)
    output["IOS_SECRETS_DIR"] = str(directory)
    for key, (relative, variable) in files.items():
        path = directory / relative
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        path.write_bytes(payloads[key])
        path.chmod(0o600)
        output[variable] = str(path)

    if app != "crivo":
        for relative in ("GoogleService-Info.plist", "ios/GoogleService-Info.plist", f"ios/{APP_NAMES[app]}/GoogleService-Info.plist"):
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(output["GOOGLE_SERVICE_INFO_PLIST"], path)
            path.chmod(0o600)
        output["FIREBASE_IOS_GOOGLE_SERVICES_FILE"] = str(root / "GoogleService-Info.plist")
    if app == "troco":
        output["APP_VARIANT"] = "production"
    if not verify_only:
        output.update({
            "IOS_PROFILES_DIR": str(directory / "profiles"),
            "IOS_P12_PASSWORD": environ["IOS_CI_P12_PASSWORD"],
            "ASC_KEY_ID": environ["IOS_CI_ASC_KEY_ID"],
            "ASC_ISSUER_ID": environ["IOS_CI_ASC_ISSUER_ID"],
            "IOS_KEYCHAIN_PATH": str(directory / "trebla-ios-release.keychain"),
            "IOS_KEYCHAIN_PASSWORD": secrets.token_urlsafe(32),
        })
    for key, value in output.items():
        single_line(value)
        if any(word in key for word in ("TOKEN", "PASSWORD", "DSN", "KEY_ID", "ISSUER_ID", "APP_ID", "UNIT_ID")):
            print("::add-mask::" + value)
    with environment_file.open("a") as stream:
        for key, value in output.items():
            stream.write(key + "=" + value + "\n")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("app", choices=APP_NAMES)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    if os.environ.get("GITHUB_ACTIONS") != "true" or os.environ.get("RUNNER_OS") != "macOS":
        raise SystemExit("This credential restoration command requires a macOS GitHub Actions runner")
    prepare(args.app, Path.cwd(), Path(os.environ["RUNNER_TEMP"]), Path(os.environ["GITHUB_ENV"]), os.environ, args.verify_only)
    print("iOS CI inputs restored into private ephemeral files.")
