import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import {
  VersioningProvider,
  useVersioning,
  type VersioningServices,
} from "@/contexts/versioning";

function Harness(): React.ReactNode {
  const versioning = useVersioning();
  return (
    <>
      <Text>{versioning.status}</Text>
      <Text>{versioning.mandatoryUpdate ? "mandatory" : "compatible"}</Text>
      <Text>{versioning.optionalStoreVersion ?? "no-optional"}</Text>
      <Pressable accessibilityRole="button" onPress={() => void versioning.dismissOptionalUpdate()}>
        <Text>dismiss</Text>
      </Pressable>
    </>
  );
}

function services(overrides: Partial<VersioningServices> = {}): VersioningServices {
  return {
    checkAvailability: jest.fn().mockResolvedValue({
      available: true,
      flexibleAllowed: true,
      immediateAllowed: true,
      storeVersion: "3",
      updateInProgress: false,
    }),
    isUpdateRequired: jest.fn().mockResolvedValue(false),
    startFlexibleUpdate: jest.fn().mockResolvedValue(true),
    startImmediateUpdate: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("VersioningProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("resolves mandatory policy before checking optional availability", async () => {
    const checkAvailability = jest.fn().mockResolvedValue({
      available: true,
      flexibleAllowed: true,
      immediateAllowed: true,
      storeVersion: "3",
      updateInProgress: false,
    });
    const screen = await render(
      <VersioningProvider services={services({
        checkAvailability,
        isUpdateRequired: jest.fn().mockResolvedValue(true),
      })}>
        <Harness />
      </VersioningProvider>,
    );

    await screen.findByText("mandatory");
    expect(checkAvailability).not.toHaveBeenCalled();
    expect(screen.getByText("no-optional")).toBeTruthy();
  });

  it("offers a compatible available update and persists its dismissal", async () => {
    const screen = await render(
      <VersioningProvider services={services()}>
        <Harness />
      </VersioningProvider>,
    );

    await screen.findByText("3");
    await fireEvent.press(screen.getByText("dismiss"));
    await waitFor(() => expect(screen.getByText("no-optional")).toBeTruthy());

    const stored = await AsyncStorage.getItem("openings:optional-update-dismissal");
    expect(stored).toContain('"storeVersion":"3"');
  });

  it("fails open when update services reject", async () => {
    const screen = await render(
      <VersioningProvider services={services({
        isUpdateRequired: jest.fn().mockRejectedValue(new Error("offline")),
      })}>
        <Harness />
      </VersioningProvider>,
    );

    await screen.findByText("ready");
    expect(screen.getByText("compatible")).toBeTruthy();
    expect(screen.getByText("no-optional")).toBeTruthy();
  });
});
