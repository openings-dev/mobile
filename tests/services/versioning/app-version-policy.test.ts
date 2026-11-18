import {
  parseBuildNumber,
  requiresAppUpdate,
  type AppVersionRule,
} from "@/services/versioning/app-version-policy";

const enabledRemoteRule: AppVersionRule = {
  enabled: true,
  minimumBuildNumber: 3,
  source: "remote",
};

describe("Android version policy", () => {
  it.each([
    ["2", 2],
    [2, 2],
    ["003", 3],
  ])("parses positive build number %p", (value, expected) => {
    expect(parseBuildNumber(value)).toBe(expected);
  });

  it.each([null, "", "0", 0, "2.1", -1, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid build number %p",
    (value) => {
      expect(parseBuildNumber(value)).toBeNull();
    },
  );

  it("requires an update when the installed build is below the remote minimum", () => {
    expect(requiresAppUpdate(enabledRemoteRule, "2")).toBe(true);
  });

  it.each(["3", "4"])(
    "accepts installed build %s at or above the minimum",
    (installed) => {
      expect(requiresAppUpdate(enabledRemoteRule, installed)).toBe(false);
    },
  );

  it.each([
    { ...enabledRemoteRule, enabled: false },
    { ...enabledRemoteRule, source: "default" as const },
    { ...enabledRemoteRule, source: "static" as const },
    { ...enabledRemoteRule, minimumBuildNumber: 0 },
    { ...enabledRemoteRule, minimumBuildNumber: 2.5 },
  ])("fails open for rule %#", (rule) => {
    expect(requiresAppUpdate(rule, "2")).toBe(false);
  });

  it("fails open for an invalid installed build", () => {
    expect(requiresAppUpdate(enabledRemoteRule, null)).toBe(false);
  });
});
