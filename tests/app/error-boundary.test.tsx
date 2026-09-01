import { fireEvent, render } from "@testing-library/react-native";
import type { ComponentType, PropsWithChildren } from "react";
import { Text } from "react-native";

import * as boundaryModule from "@/components/app-error-boundary";

const AppErrorBoundary = (
  boundaryModule as Record<string, unknown>
).AppErrorBoundary as ComponentType<
  PropsWithChildren<{
    fallback: { message: string; retry: string; title: string };
  }>
>;

describe("AppErrorBoundary", () => {
  it("offers an accessible retry that renders the child again", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let shouldFail = true;

    function UnstableChild(): React.ReactNode {
      if (shouldFail) {
        throw new Error("startup failed");
      }

      return <Text>Recovered</Text>;
    }

    const screen = await render(
      <AppErrorBoundary
        fallback={{
          message: "Please try again.",
          retry: "Try again",
          title: "Openings could not start",
        }}
      >
        <UnstableChild />
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Openings could not start")).toBeTruthy();
    shouldFail = false;
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Recovered")).toBeTruthy();

    consoleError.mockRestore();
  });
});
