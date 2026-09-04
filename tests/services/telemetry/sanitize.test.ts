import {
  sanitizeProductEvent,
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "@/services/telemetry/sanitize";

describe("sanitizeProductEvent", () => {
  it("rejects unknown events and keeps only safe allowlisted properties", () => {
    expect(sanitizeProductEvent("Unknown", {})).toBeNull();
    expect(sanitizeProductEvent("Filter Applied", {
      dimension: "technology",
      value: "React Native",
      locale: "pt-BR",
      email: "person@example.com",
      extra: "secret",
    })).toEqual({
      name: "Filter Applied",
      properties: {
        dimension: "technology",
        locale: "pt-BR",
        value: "react-native",
      },
    });
  });
});

describe("sanitizeSentryEvent", () => {
  it("redacts emails and strips query strings from URLs in the message", () => {
    const result = sanitizeSentryEvent({
      environment: "production",
      release: "1.0.0",
      message: "Failed for user@example.com at https://openings.dev/jobs?q=secret",
    });

    expect(result.message).toBe(
      "Failed for [redacted] at https://openings.dev/jobs",
    );
    expect(result.environment).toBe("production");
    expect(result.release).toBe("1.0.0");
  });

  it("keeps exception type/value pairs after normalizing free text", () => {
    const stacktrace = { frames: [{ filename: "app.js", lineno: 42 }] };
    const result = sanitizeSentryEvent({
      exception: {
        values: [{ type: "TypeError", value: "Cannot read prop of user@example.com", stacktrace }],
      },
    });

    expect(result.exception).toEqual({
      values: [{ type: "TypeError", value: "Cannot read prop of [redacted]", stacktrace }],
    });
  });

  it("drops forbidden tag keys and non-string tag values", () => {
    const result = sanitizeSentryEvent({
      tags: { screen: "jobs", email: "user@example.com", count: 3 },
    });

    expect(result.tags).toEqual({ screen: "jobs" });
  });

  it("omits fields that are absent or unsafe", () => {
    const result = sanitizeSentryEvent({});

    expect(result).toEqual({});
  });
});

describe("sanitizeSentryBreadcrumb", () => {
  it("keeps safe fields and redacts the message", () => {
    const result = sanitizeSentryBreadcrumb({
      category: "navigation",
      type: "default",
      level: "info",
      message: "Visited https://openings.dev/jobs?ref=user@example.com",
    });

    expect(result).toEqual({
      category: "navigation",
      type: "default",
      level: "info",
      message: "Visited https://openings.dev/jobs",
    });
  });

  it("returns an empty object when every field is unsafe", () => {
    const result = sanitizeSentryBreadcrumb({ message: 42 });

    expect(result).toEqual({});
  });
});
