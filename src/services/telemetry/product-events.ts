import { getCachedAnalyticsConsent } from "./consent";
import type { TelemetryEventMap, TelemetryEventName } from "./contracts";
import { sanitizeProductEvent } from "./sanitize";

type ProductEventHandler = (name: string, properties: Record<string, unknown>) => void;
let handler: ProductEventHandler | null = null;

export function setProductEventHandler(next: ProductEventHandler | null): void {
  handler = next;
}

export function trackProductEvent<Name extends TelemetryEventName>(
  name: Name,
  properties: TelemetryEventMap[Name],
): void {
  if (getCachedAnalyticsConsent() !== "granted") return;
  const event = sanitizeProductEvent(name, properties);
  if (!event) return;
  handler?.(event.name, event.properties as Record<string, unknown>);
}
