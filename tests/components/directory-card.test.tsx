import { fireEvent, render } from "@testing-library/react-native";

import { DirectoryCard } from "@/components/directory-card";
import { ThemeProvider } from "@/contexts/theme";

describe("DirectoryCard", () => {
  it("presents identity, activity, volume, and an explicit action", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <ThemeProvider>
        <DirectoryCard
          actionLabel="View community"
          avatarUrl={null}
          countLabel="24 jobs"
          latestActivity="Sep 1, 2026"
          location="South America · Brazil"
          onPress={onPress}
          subtitle="openings-dev/jobs"
          title="Openings"
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("Openings")).toBeTruthy();
    expect(screen.getByText("openings-dev/jobs")).toBeTruthy();
    expect(screen.getByText("South America · Brazil")).toBeTruthy();
    expect(screen.getByText("Sep 1, 2026")).toBeTruthy();
    expect(screen.getByText("24 jobs")).toBeTruthy();
    await fireEvent.press(screen.getByText("View community"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
