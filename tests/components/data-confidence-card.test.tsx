import { render } from "@testing-library/react-native";

import { DataConfidenceCard } from "@/components/data-confidence-card";
import { LocaleProvider } from "@/contexts/locale";
import { ThemeProvider } from "@/contexts/theme";
import { messages } from "@/i18n/messages";
import { makeOpportunity } from "../fixtures/openings";

describe("DataConfidenceCard", () => {
  it("renders verification facts, ordered provenance, and published sources", async () => {
    const item = makeOpportunity("confidence-card");
    const screen = await render(
      <LocaleProvider>
        <ThemeProvider>
          <DataConfidenceCard
            copy={messages.en.jobs.dataConfidence}
            item={item}
            locale="en"
            onOpenSource={jest.fn()}
            summary={{
              fields: [
                { field: "location", provenance: "declared" },
                { field: "salary", provenance: "unknown" },
                { field: "seniority", provenance: "inferred" },
                { field: "workModel", provenance: "declared" },
              ],
              incomplete: false,
              lastVerifiedAt: null,
              sourceCount: 1,
              stale: false,
            }}
          />
        </ThemeProvider>
      </LocaleProvider>,
    );

    expect(screen.getByText("Data confidence")).toBeTruthy();
    expect(screen.getByText("Verification time unavailable")).toBeTruthy();
    expect(screen.getByText("Published sources")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getAllByText("Declared in source")).toHaveLength(2);
    expect(screen.getByText("Not identified")).toBeTruthy();
    expect(screen.getByText("Inferred")).toBeTruthy();
    expect(screen.getByText("openings-dev/jobs")).toBeTruthy();
  });
});
