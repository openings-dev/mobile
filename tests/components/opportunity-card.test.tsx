import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";

import { OpportunityCard } from "@/components/opportunity-card";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";
import { makeOpportunity } from "../fixtures/openings";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("OpportunityCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it("matches the responsive web card's information hierarchy", async () => {
    const item = makeOpportunity("rich-card", {
      deduplication: { sourceCount: 3 },
      excerpt: "Build **native** experiences for a public community.",
      freshness: {
        ageDays: 45,
        publishedAt: "2026-07-18T12:00:00Z",
        status: "stale",
      },
      salary: { currency: "USD", max: 110, min: 60, period: "hour" },
      tags: ["remote", "senior", "react-native", "typescript", "product"],
    });
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <OpportunityCard
            isNew
            isSaved={false}
            item={item}
            onPress={jest.fn()}
            onToggleSaved={jest.fn()}
          />
        </ThemeProvider>
      </LocaleProvider>,
    );

    expect(screen.getByText("Openings")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("Older listing")).toBeTruthy();
    expect(screen.getByText("3 sources")).toBeTruthy();
    expect(screen.getByText("Senior React Native Engineer").props.numberOfLines).toBe(3);
    expect(screen.getByText(
      "Build native experiences for a public community.",
    ).props.numberOfLines).toBe(2);
    expect(screen.getByLabelText("Save job").props.accessibilityState).toEqual({
      selected: false,
    });
    expect(JSON.stringify(screen.toJSON())).toContain("RNSVGSvgView");
    expect(screen.getByText("$60 – $110 / hour")).toBeTruthy();
    expect(screen.getByText("Remote")).toBeTruthy();
    expect(screen.getByText("São Paulo · Remote")).toBeTruthy();
    expect(screen.getByText("Senior")).toBeTruthy();
    expect(screen.getByText("React Native")).toBeTruthy();
    expect(screen.getByText("TypeScript")).toBeTruthy();
    expect(screen.getByText("+4")).toBeTruthy();
    expect(screen.getByText("@alice")).toBeTruthy();
    expect(screen.getByText("Sep 1, 2026")).toBeTruthy();
    expect(screen.getByText("openings-dev/jobs")).toBeTruthy();
    expect(screen.getByText("View details")).toBeTruthy();
  });

  it("keeps save, community, and author actions independent from job opening", async () => {
    const onPress = jest.fn();
    const onToggleSaved = jest.fn();
    const onCommunityPress = jest.fn();
    const onAuthorPress = jest.fn();
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <OpportunityCard
            isSaved={false}
            item={makeOpportunity("nested-actions")}
            onAuthorPress={onAuthorPress}
            onCommunityPress={onCommunityPress}
            onPress={onPress}
            onToggleSaved={onToggleSaved}
          />
        </ThemeProvider>
      </LocaleProvider>,
    );

    await fireEvent.press(screen.getByLabelText("Save job"));
    await fireEvent.press(screen.getByLabelText("Show jobs from Openings"));
    await fireEvent.press(screen.getByLabelText("Show jobs from @alice"));

    expect(onToggleSaved).toHaveBeenCalledTimes(1);
    expect(onCommunityPress).toHaveBeenCalledTimes(1);
    expect(onAuthorPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
