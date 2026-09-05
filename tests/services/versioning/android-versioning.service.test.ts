import { AndroidVersioningService } from "@/services/versioning/android-versioning.service";

describe("AndroidVersioningService", () => {
  it("requires an update for a production build below the remote minimum", async () => {
    const service = new AndroidVersioningService(
      { resolveRule: jest.fn().mockResolvedValue({ rule: { enabled: true, minimumBuildNumber: 3, source: "remote" } }) },
      () => "2",
      () => true,
      jest.fn(),
    );

    await expect(service.isUpdateRequired()).resolves.toBe(true);
  });

  it("does not resolve Remote Config outside production", async () => {
    const resolveRule = jest.fn();
    const service = new AndroidVersioningService(
      { resolveRule },
      () => "2",
      () => false,
      jest.fn(),
    );

    await expect(service.isUpdateRequired()).resolves.toBe(false);
    expect(resolveRule).not.toHaveBeenCalled();
  });

  it("fails open and reports provider errors", async () => {
    const report = jest.fn();
    const service = new AndroidVersioningService(
      { resolveRule: jest.fn().mockRejectedValue(new Error("offline")) },
      () => "2",
      () => true,
      report,
    );

    await expect(service.isUpdateRequired()).resolves.toBe(false);
    expect(report).toHaveBeenCalledWith(expect.any(Error));
  });

  it("reports an invalid enabled remote rule and remains permissive", async () => {
    const report = jest.fn();
    const service = new AndroidVersioningService(
      { resolveRule: jest.fn().mockResolvedValue({ rule: { enabled: true, minimumBuildNumber: 0, source: "remote" } }) },
      () => "2",
      () => true,
      report,
    );

    await expect(service.isUpdateRequired()).resolves.toBe(false);
    expect(report).toHaveBeenCalledWith(expect.any(Error));
  });
});
