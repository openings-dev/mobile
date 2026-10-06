import {
  getLegalContent,
  parseLegalContentKind,
} from "@/app/web-content/legal-content";

describe("Openings legal content", () => {
  it.each([
    ["privacy", "https://openings.dev/privacy", "/privacy"],
    ["terms", "https://openings.dev/terms", "/terms"],
  ] as const)("maps %s to its canonical first-party document", (kind, uri, path) => {
    expect(getLegalContent(kind)).toEqual({ kind, path, uri });
  });

  it.each([undefined, "", "https://evil.example", "support", ["privacy"]])(
    "rejects the route parameter %p",
    (value) => expect(parseLegalContentKind(value)).toBeNull(),
  );

  it.each(["privacy", "terms"] as const)("accepts %s", (value) => {
    expect(parseLegalContentKind(value)).toBe(value);
  });
});
