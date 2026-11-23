import type { Opportunity } from "@/domain/openings/types";

export function parseBlockedAuthors(raw: string | null): string[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((handle): handle is string =>
    typeof handle === "string" && handle.trim().length > 0)) {
    throw new Error("Invalid blocked-author preferences");
  }
  return [...new Set(value.map((handle) => handle.trim().toLowerCase()))];
}

export function visibleOpportunities(
  items: readonly Opportunity[],
  blockedHandles: ReadonlySet<string>,
  hydrated: boolean,
): Opportunity[] {
  if (!hydrated) return [];
  return items.filter((item) => !blockedHandles.has(item.author.handle.trim().toLowerCase()));
}
