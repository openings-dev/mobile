import type { OpportunitySalary } from "./types";

export function formatDate(value: string | null, locale: string): string | null {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatSalary(
  salary: OpportunitySalary | undefined,
  locale: string,
): string | null {
  if (!salary) return null;
  const formatter = new Intl.NumberFormat(locale, {
    currency: salary.currency,
    maximumFractionDigits: 0,
    style: "currency",
  });
  const amount =
    salary.min !== undefined && salary.max !== undefined
      ? `${formatter.format(salary.min)} – ${formatter.format(salary.max)}`
      : formatter.format(salary.min ?? salary.max ?? 0);
  return `${amount} / ${salary.period}`;
}

export function formatCount(value: number, locale: string): string {
  return value.toLocaleString(locale);
}

export function formatLocation(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}
