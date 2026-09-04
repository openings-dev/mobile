import { fireEvent, render } from "@testing-library/react-native";
import { useState } from "react";

import { JobsFilterModal } from "@/app/jobs/components/jobs-filter-modal";
import { ThemeProvider } from "@/contexts/theme";
import { createDefaultJobFilters } from "@/domain/openings/discovery";
import type { JobFilters } from "@/domain/openings/types";
import { messages } from "@/i18n/messages";
import { makeOpportunity } from "../fixtures/openings";

function Harness({ onClose }: { onClose: () => void }): React.ReactNode {
  const [filters, setFilters] = useState<JobFilters>(createDefaultJobFilters);

  return (
    <ThemeProvider>
      <JobsFilterModal
        filters={filters}
        items={[makeOpportunity("mobile")]}
        messages={messages.en}
        onChange={setFilters}
        onClose={onClose}
        onShortcut={jest.fn()}
        open
        resultCount={2}
      />
    </ThemeProvider>
  );
}

describe("JobsFilterModal", () => {
  it("keeps discovery shortcuts inside More and applies them accessibly", async () => {
    const onClose = jest.fn();
    const screen = await render(<Harness onClose={onClose} />);

    expect(screen.getByText("Discover")).toBeTruthy();
    expect(screen.getByText("Remote")).toBeTruthy();
    expect(screen.getByText("Internships")).toBeTruthy();
    expect(screen.getByText("React")).toBeTruthy();
    expect(screen.getByText("Data & AI")).toBeTruthy();
    expect(screen.getByText("DevOps")).toBeTruthy();

    await fireEvent.press(screen.getByText("Remote"));
    expect(screen.getByText("Remote").parent?.props.accessibilityState).toEqual({
      selected: true,
    });

    await fireEvent.press(screen.getByText("Show results · 2"));
    expect(onClose).toHaveBeenCalled();
  });

  it("clears modal filters without losing the public search query", async () => {
    const onChange = jest.fn();
    const filters = {
      ...createDefaultJobFilters(),
      query: "frontend",
      workModels: ["remote"],
    };
    const screen = await render(
      <ThemeProvider>
        <JobsFilterModal
          filters={filters}
          items={[makeOpportunity("mobile")]}
          messages={messages.en}
          onChange={onChange}
          onClose={jest.fn()}
          onShortcut={jest.fn()}
          open
          resultCount={1}
        />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByText("Clear filters"));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      query: "frontend",
      workModels: [],
    }));
  });
});
