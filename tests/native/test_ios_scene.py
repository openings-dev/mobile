"""Native startup contract required by apps built with the iOS 27 SDK."""
import json
from pathlib import Path
import plistlib
import unittest

ROOT = Path(__file__).resolve().parents[2]
CONFIG = json.loads((ROOT / "app.json").read_text())["expo"]
NATIVE = ROOT / "ios" / CONFIG["name"]


class SceneLifecycleTest(unittest.TestCase):
    def test_prebuild_opts_into_supported_scene_lifecycle(self):
        plugins = [plugin for plugin in CONFIG["plugins"] if isinstance(plugin, list) and plugin[0] == "expo-build-properties"]
        self.assertEqual(len(plugins), 1)
        self.assertIs(plugins[0][1]["ios"]["enableSceneSupport"], True)

    def test_uikit_can_resolve_the_main_scene_delegate(self):
        info = plistlib.loads((NATIVE / "Info.plist").read_bytes())
        scenes = info.get("UIApplicationSceneManifest", {}).get("UISceneConfigurations", {}).get("UIWindowSceneSessionRoleApplication", [])
        self.assertTrue(any(scene.get("UISceneDelegateClassName") == "EXExpoAppSceneDelegate" for scene in scenes))

    def test_scene_owns_window_and_firebase_initializes_before_react(self):
        delegate = (NATIVE / "AppDelegate.swift").read_text()
        self.assertIn("ExpoReactNativeFactoryProvider", delegate)
        self.assertNotIn("window = UIWindow(frame:", delegate)
        self.assertNotIn("factory.startReactNative(", delegate)
        self.assertEqual(delegate.count("FirebaseApp.configure()"), 1)
        self.assertLess(delegate.index("FirebaseApp.configure()"), delegate.index("return super.application("))


if __name__ == "__main__":
    unittest.main()
