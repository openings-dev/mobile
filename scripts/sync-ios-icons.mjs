// Use the installed Expo icon generator without running unrelated prebuild mods.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setIconsAsync } from "@expo/prebuild-config/build/plugins/icons/withIosIcons.js";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const config = JSON.parse(await readFile(new URL("../app.json", import.meta.url), "utf8")).expo;
await setIconsAsync(config, root);
