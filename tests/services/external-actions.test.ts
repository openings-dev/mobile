import { Linking, Share } from "react-native";

import { openHttpsUrl, shareUrl } from "@/services/external-actions";

describe("external actions", () => {
  it("opens deliberate HTTPS destinations", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await openHttpsUrl("https://github.com/openings-dev");
    expect(open).toHaveBeenCalledWith("https://github.com/openings-dev");
  });

  it("rejects non-HTTPS destinations", async () => {
    await expect(openHttpsUrl("javascript:alert(1)")).rejects.toThrow("HTTPS");
    await expect(openHttpsUrl("http://github.com/openings-dev")).rejects.toThrow("HTTPS");
  });

  it("uses the native share sheet", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    await shareUrl("Openings", "https://openings.dev/jobs/gh_123");
    expect(share).toHaveBeenCalledWith({ message: "Openings\nhttps://openings.dev/jobs/gh_123", title: "Openings", url: "https://openings.dev/jobs/gh_123" });
  });
});
