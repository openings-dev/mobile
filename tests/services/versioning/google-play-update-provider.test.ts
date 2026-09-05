import { GooglePlayUpdateProvider } from "@/services/versioning/google-play-update.provider";

function createSdk({
  flexibleAllowed = true,
  immediateAllowed = true,
  updateAvailable = true,
  updateInProgress = false,
}: {
  flexibleAllowed?: boolean;
  immediateAllowed?: boolean;
  updateAvailable?: boolean;
  updateInProgress?: boolean;
} = {}) {
  return {
    checkForUpdate: jest.fn().mockResolvedValue({
      flexibleAllowed,
      immediateAllowed,
      storeVersion: "3",
      updateAvailable,
      updateInProgress,
    }),
    startUpdate: jest.fn().mockResolvedValue(true),
  };
}

describe("GooglePlayUpdateProvider", () => {
  it("reports a compatible available store update", async () => {
    const sdk = createSdk();
    const provider = new GooglePlayUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      jest.fn(),
    );

    await expect(provider.checkAvailability()).resolves.toEqual({
      available: true,
      flexibleAllowed: true,
      immediateAllowed: true,
      storeVersion: "3",
      updateInProgress: false,
    });
  });

  it("starts immediate and flexible updates with their matching mode", async () => {
    const sdk = createSdk();
    const provider = new GooglePlayUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      jest.fn(),
    );

    await expect(provider.startImmediateUpdate()).resolves.toBe(true);
    await expect(provider.startFlexibleUpdate()).resolves.toBe(true);
    expect(sdk.startUpdate).toHaveBeenNthCalledWith(1, true);
    expect(sdk.startUpdate).toHaveBeenNthCalledWith(2, false);
  });

  it("resumes an immediate update already in progress", async () => {
    const sdk = createSdk({
      immediateAllowed: false,
      updateAvailable: false,
      updateInProgress: true,
    });
    const provider = new GooglePlayUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      jest.fn(),
    );

    await expect(provider.startImmediateUpdate()).resolves.toBe(true);
    expect(sdk.startUpdate).toHaveBeenCalledWith(true);
  });

  it.each([
    { platform: "ios", production: true },
    { platform: "android", production: false },
  ])("does not load the SDK outside Android production %#", async (input) => {
    const loadSdk = jest.fn();
    const provider = new GooglePlayUpdateProvider(
      loadSdk,
      () => input.platform,
      () => input.production,
      jest.fn(),
    );

    await expect(provider.checkAvailability()).resolves.toEqual({
      available: false,
      flexibleAllowed: false,
      immediateAllowed: false,
      storeVersion: null,
      updateInProgress: false,
    });
    expect(loadSdk).not.toHaveBeenCalled();
  });

  it("contains and reports native failures", async () => {
    const report = jest.fn();
    const provider = new GooglePlayUpdateProvider(
      async () => {
        throw new Error("Play unavailable");
      },
      () => "android",
      () => true,
      report,
    );

    await expect(provider.startFlexibleUpdate()).resolves.toBe(false);
    expect(report).toHaveBeenCalledWith(expect.any(Error));
  });
});
