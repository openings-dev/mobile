import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";
import { JobReport } from "@/components/job-report";
import { LocaleProvider } from "@/contexts/locale";

it("keeps selectable contact and job reference available when email cannot open", async () => {
  const open = jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no mail client"));
  const screen = await render(<LocaleProvider><JobReport onClose={jest.fn()} title="Test & job" canonicalUrl="https://openings.dev/jobs/123" sourceUrl="https://github.com/a/b/issues/123" /></LocaleProvider>);
  expect(screen.getByText("support@openings.dev").props.selectable).toBe(true);
  expect(screen.getByText("https://openings.dev/jobs/123").props.selectable).toBe(true);
  await fireEvent.press(screen.getByText("Open email draft"));
  expect(await screen.findByText("Could not open email. Copy the address and listing reference below into your email app or webmail.")).toBeTruthy();
  const url = new URL(open.mock.calls[0]![0]);
  expect(url.protocol).toBe("mailto:");
  expect(url.pathname).toBe("support@openings.dev");
  expect(url.searchParams.get("subject")).toContain("Test & job");
  expect(url.searchParams.get("body")).toContain("https://openings.dev/jobs/123");
  open.mockRestore();
});
