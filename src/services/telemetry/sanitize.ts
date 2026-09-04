import {
  TELEMETRY_EVENT_FIELDS,
  type TelemetryEventMap,
  type TelemetryEventName,
} from "./contracts";

const FORBIDDEN_KEYS = new Set([
  "query",
  "search",
  "title",
  "description",
  "email",
  "url",
  "referrer",
]);
const MAX_TEXT_LENGTH = 240;
const SAFE_IDENTIFIER = /^[A-Za-z0-9_./-]+$/u;
const MAX_IDENTIFIER_LENGTH = 96;

function stableSlug(value: string): string {
  return value.toLowerCase().normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function safeEventProperty(name: string, key: string, value: unknown): unknown {
  if (FORBIDDEN_KEYS.has(key.toLowerCase())) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }
  const normalized = name === "Filter Applied" && key === "value" &&
    typeof value === "string" ? stableSlug(value) : value;
  if (typeof normalized !== "string" || normalized.length > MAX_IDENTIFIER_LENGTH ||
    normalized.includes("@") || normalized.includes("://") || /\s/u.test(normalized)) {
    return undefined;
  }
  return SAFE_IDENTIFIER.test(normalized) ? normalized : undefined;
}

export function sanitizeProductEvent<Name extends TelemetryEventName>(
  name: Name | string,
  properties: TelemetryEventMap[Name] | Record<string, unknown>,
): { name: Name; properties: Partial<TelemetryEventMap[Name]> } | null {
  if (!(name in TELEMETRY_EVENT_FIELDS)) return null;
  const eventName = name as Name;
  const allowed = TELEMETRY_EVENT_FIELDS[eventName] as readonly string[];
  const input = properties as Record<string, unknown>;
  const sanitized = Object.fromEntries(allowed.flatMap((key) => {
    const value = safeEventProperty(name, key, input[key]);
    return value === undefined ? [] : [[key, value]];
  })) as Partial<TelemetryEventMap[Name]>;
  return { name: eventName, properties: sanitized };
}

function stripUrlDetails(value: string): string {
  try {
    const url = new URL(value, "https://openings.dev");
    return `${url.origin}${url.pathname}`;
  } catch {
    return "https://openings.dev/";
  }
}

function normalizeErrorText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value
    .replace(/https?:\/\/[^\s]+/giu, (url) => stripUrlDetails(url))
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/gu, "[redacted]")
    .slice(0, MAX_TEXT_LENGTH);
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function safeTags(tags: unknown): Record<string, string> | undefined {
  if (!tags || typeof tags !== "object") return undefined;
  const entries = Object.entries(tags as Record<string, unknown>).flatMap(
    ([key, value]) => {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) return [];
      const safeValue = safeString(value);
      return safeValue ? [[key, safeValue] as const] : [];
    },
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export interface SentryLikeEvent {
  environment?: unknown;
  release?: unknown;
  message?: unknown;
  exception?: { values?: Record<string, unknown>[] };
  tags?: unknown;
}

export function sanitizeSentryEvent(
  event: SentryLikeEvent,
): Record<string, unknown> {
  const values = event.exception?.values?.map((value) => ({
    ...(safeString(value.type) ? { type: value.type } : {}),
    ...(normalizeErrorText(value.value)
      ? { value: normalizeErrorText(value.value) }
      : {}),
    ...(value.stacktrace && typeof value.stacktrace === "object"
      ? { stacktrace: value.stacktrace }
      : {}),
  }));
  const tags = safeTags(event.tags);
  const message = normalizeErrorText(event.message);

  return {
    ...(safeString(event.environment) ? { environment: event.environment } : {}),
    ...(safeString(event.release) ? { release: event.release } : {}),
    ...(message ? { message } : {}),
    ...(values?.length ? { exception: { values } } : {}),
    ...(tags ? { tags } : {}),
  };
}

export interface SentryLikeBreadcrumb {
  category?: unknown;
  type?: unknown;
  level?: unknown;
  message?: unknown;
}

export function sanitizeSentryBreadcrumb(
  breadcrumb: SentryLikeBreadcrumb,
): Record<string, unknown> {
  const message = normalizeErrorText(breadcrumb.message);

  return {
    ...(safeString(breadcrumb.category) ? { category: breadcrumb.category } : {}),
    ...(safeString(breadcrumb.type) ? { type: breadcrumb.type } : {}),
    ...(safeString(breadcrumb.level) ? { level: breadcrumb.level } : {}),
    ...(message ? { message } : {}),
  };
}
