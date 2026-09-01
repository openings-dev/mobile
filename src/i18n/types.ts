import type { SupportedLocale } from "@openingshq/core";

export interface FoundationMessages {
  description: string;
  errorMessage: string;
  errorTitle: string;
  eyebrow: string;
  localeLabel: string;
  retry: string;
  status: string;
  title: string;
}

export type MessageCatalog = Record<SupportedLocale, FoundationMessages>;
