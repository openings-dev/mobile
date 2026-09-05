import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  dismissOptionalUpdate,
  isOptionalUpdateDismissed,
} from "@/services/versioning/optional-update-dismissal";

describe("optional update dismissal", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("dismisses only the current store version", async () => {
    await expect(dismissOptionalUpdate("3")).resolves.toBe(true);
    await expect(isOptionalUpdateDismissed("3")).resolves.toBe(true);
    await expect(isOptionalUpdateDismissed("4")).resolves.toBe(false);
  });

  it("fails open for malformed and unsupported documents", async () => {
    await AsyncStorage.setItem("openings:optional-update-dismissal", "not-json");
    await expect(isOptionalUpdateDismissed("3")).resolves.toBe(false);

    await AsyncStorage.setItem(
      "openings:optional-update-dismissal",
      JSON.stringify({ version: 99, storeVersion: "3" }),
    );
    await expect(isOptionalUpdateDismissed("3")).resolves.toBe(false);
  });

  it("rejects an empty store version", async () => {
    await expect(dismissOptionalUpdate("")).resolves.toBe(false);
    await expect(isOptionalUpdateDismissed("")).resolves.toBe(false);
  });
});
