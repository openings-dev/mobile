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

  it("translates the web-native navigation and job trust surfaces", () => {
    const messages = moduleContract.messages as Record<
      string,
      {
        header?: {
          menu?: string;
          support?: { action?: string; description?: string; title?: string };
        };
        jobs?: {
          dataConfidence?: {
            fields?: { location?: string };
            title?: string;
          };
          actions?: string;
          closeActions?: string;
          newMatches?: { action?: string; title?: string };
          reportProblem?: string;
        };
      }
    >;

    for (const locale of SUPPORTED_LOCALES) {
      const copy = messages[locale];

      expect(copy?.header?.menu).toBeTruthy();
      expect(copy?.header?.support?.title).toBeTruthy();
      expect(copy?.header?.support?.description).toBeTruthy();
      expect(copy?.header?.support?.action).toBeTruthy();
      expect(copy?.jobs?.newMatches?.title).toBeTruthy();
      expect(copy?.jobs?.newMatches?.action).toBeTruthy();
      expect(copy?.jobs?.dataConfidence?.title).toBeTruthy();
      expect(copy?.jobs?.dataConfidence?.fields?.location).toBeTruthy();
      expect(copy?.jobs?.actions).toBeTruthy();
      expect(copy?.jobs?.closeActions).toBeTruthy();
      expect(copy?.jobs?.reportProblem).toBeTruthy();
    }
  });

  it("provides complete Android update copy", () => {
    const messages = moduleContract.messages as Record<
      string,
      { versioning?: Record<string, string> }
    >;

    for (const locale of SUPPORTED_LOCALES) {
      expect(messages[locale]?.versioning).toEqual({
        description: expect.any(String),
        dismiss: expect.any(String),
        optionalDescription: expect.any(String),
        optionalTitle: expect.any(String),
        storeAction: expect.any(String),
        title: expect.any(String),
        updateAction: expect.any(String),
      });
    }
  });
});
