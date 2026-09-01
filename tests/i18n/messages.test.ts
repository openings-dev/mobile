import { SUPPORTED_LOCALES } from "@openingshq/core";

import * as messagesModule from "@/i18n/messages";

const moduleContract = messagesModule as Record<string, unknown>;

describe("localized messages", () => {
  it("provides a catalog for every supported locale", () => {
    const messages = moduleContract.messages as Record<string, unknown>;

    expect(Object.keys(messages)).toEqual(SUPPORTED_LOCALES);
  });

  it("keeps every catalog in key parity with English", () => {
    const messages = moduleContract.messages as Record<
      string,
      Record<string, string>
    >;
    const englishKeys = Object.keys(messages.en ?? {});

    expect(englishKeys.length).toBeGreaterThan(0);

    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(messages[locale] ?? {})).toEqual(englishKeys);
    }
  });
});
