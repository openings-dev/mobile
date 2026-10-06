export type LegalContentKind = "privacy" | "terms";

const LEGAL_CONTENT = {
  privacy: {
    kind: "privacy",
    path: "/privacy",
    uri: "https://openings.dev/privacy",
  },
  terms: {
    kind: "terms",
    path: "/terms",
    uri: "https://openings.dev/terms",
  },
} as const satisfies Record<
  LegalContentKind,
  { kind: LegalContentKind; path: string; uri: string }
>;

export function parseLegalContentKind(value: unknown): LegalContentKind | null {
  return value === "privacy" || value === "terms" ? value : null;
}

export function getLegalContent(kind: LegalContentKind) {
  return LEGAL_CONTENT[kind];
}
