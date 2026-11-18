import { StoreUpdateProvider } from "@/services/versioning/store-update.provider";

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

describe("StoreUpdateProvider", () => {
  it("offers App Store updates when iOS omits Android-only capability flags", async () => {
    const sdk = {
      checkForUpdate: jest.fn().mockResolvedValue({ updateAvailable: true, storeVersion: "0.2.0" }),
      startUpdate: jest.fn().mockResolvedValue(true),
    };
    const provider = new StoreUpdateProvider(async () => sdk, () => "ios", () => true, jest.fn());

    await expect(provider.checkAvailability()).resolves.toMatchObject({
      available: true, flexibleAllowed: true, immediateAllowed: true, storeVersion: "0.2.0",
    });
    await expect(provider.startFlexibleUpdate()).resolves.toBe(true);
    await expect(provider.startImmediateUpdate()).resolves.toBe(true);
    expect(sdk.startUpdate).toHaveBeenCalledTimes(2);
  });

  it("does not start an iOS update when the store has no newer version", async () => {
    const sdk = createSdk({ updateAvailable: false });
    const provider = new StoreUpdateProvider(async () => sdk, () => "ios", () => true, jest.fn());
    await expect(provider.startFlexibleUpdate()).resolves.toBe(false);
    expect(sdk.startUpdate).not.toHaveBeenCalled();
  });

  it("reports a compatible available store update", async () => {
    const sdk = createSdk();
    const provider = new StoreUpdateProvider(
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
    const provider = new StoreUpdateProvider(
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
    const provider = new StoreUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      jest.fn(),
    );

    await expect(provider.startImmediateUpdate()).resolves.toBe(true);
    expect(sdk.startUpdate).toHaveBeenCalledWith(true);
  });

  it.each([
    { platform: "web", production: true },
    { platform: "ios", production: false },
    { platform: "android", production: false },
  ])("does not load the SDK outside native production %#", async (input) => {
    const loadSdk = jest.fn();
    const provider = new StoreUpdateProvider(
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

  it("does not report APP_NOT_OWNED while checking availability", async () => {
    const sdk = createSdk();
    sdk.checkForUpdate.mockRejectedValue(
      new Error(
        "Failed to check for updates: -10: Install Error(-10): The app is not owned by any user on this device.",
      ),
    );
    const report = jest.fn();
    const provider = new StoreUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      report,
    );

    await expect(provider.checkAvailability()).resolves.toEqual({
      available: false,
      flexibleAllowed: false,
      immediateAllowed: false,
      storeVersion: null,
      updateInProgress: false,
    });
    expect(report).not.toHaveBeenCalled();
  });

  it("does not report a Play service binding failure while checking availability", async () => {
    const sdk = createSdk();
    sdk.checkForUpdate.mockRejectedValue(
      new Error("Failed to check for updates: Failed to bind to the service."),
    );
    const report = jest.fn();
    const provider = new StoreUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      report,
    );

    await expect(provider.checkAvailability()).resolves.toEqual({
      available: false,
      flexibleAllowed: false,
      immediateAllowed: false,
      storeVersion: null,
      updateInProgress: false,
    });
    expect(report).not.toHaveBeenCalled();
  });

  it("does not report APP_NOT_OWNED while starting an update", async () => {
    const sdk = createSdk();
    sdk.checkForUpdate.mockRejectedValue(
      new Error(
        "Failed to check for updates: -10: Install Error(-10): The app is not owned by any user on this device.",
      ),
    );
    const report = jest.fn();
    const provider = new StoreUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      report,
    );

    await expect(provider.startFlexibleUpdate()).resolves.toBe(false);
    expect(report).not.toHaveBeenCalled();
    expect(sdk.startUpdate).not.toHaveBeenCalled();
  });

  it("does not report a Play service binding failure while starting an update", async () => {
    const sdk = createSdk();
    sdk.checkForUpdate.mockRejectedValue(
      new Error("Failed to check for updates: Failed to bind to the service."),
    );
    const report = jest.fn();
    const provider = new StoreUpdateProvider(
      async () => sdk,
      () => "android",
      () => true,
      report,
    );

    await expect(provider.startFlexibleUpdate()).resolves.toBe(false);
    expect(report).not.toHaveBeenCalled();
    expect(sdk.startUpdate).not.toHaveBeenCalled();
  });

  it("contains and reports native failures", async () => {
    const report = jest.fn();
    const provider = new StoreUpdateProvider(
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
