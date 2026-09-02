import type { Opportunity } from "./types";

export type OpportunityCardTagCategory =
  | "neutral"
  | "seniority"
  | "technology";

export interface OpportunityCardTag {
  category: OpportunityCardTagCategory;
  value: string;
}

export interface OpportunityCardPresentation {
  overflowCount: number;
  sourceCount: number;
  supportingTags: OpportunityCardTag[];
  workModel: string | null;
}

export interface VisibleResultRange {
  end: number;
  start: number;
}

const LOCALIZED_TAG_LABELS = {
  de: {
    especialista: "Spezialist",
    estagio: "Praktikum / Trainee",
    hybrid: "Hybrid",
    junior: "Junior",
    lead: "Lead",
    "on-site": "Vor Ort",
    pleno: "Mid-Level",
    principal: "Principal",
    remote: "Remote",
    senior: "Senior",
    staff: "Staff",
  },
  en: {
    especialista: "Specialist",
    estagio: "Internship / trainee",
    hybrid: "Hybrid",
    junior: "Junior",
    lead: "Lead",
    "on-site": "On-site",
    pleno: "Mid-level",
    principal: "Principal",
    remote: "Remote",
    senior: "Senior",
    staff: "Staff",
  },
  es: {
    especialista: "Especialista",
    estagio: "Pasantía / Trainee",
    hybrid: "Híbrido",
    junior: "Junior",
    lead: "Líder",
    "on-site": "Presencial",
    pleno: "Semi Senior",
    principal: "Principal",
    remote: "Remoto",
    senior: "Senior",
    staff: "Staff",
  },
  fr: {
    especialista: "Spécialiste",
    estagio: "Stage / Trainee",
    hybrid: "Hybride",
    junior: "Junior",
    lead: "Lead",
    "on-site": "Sur site",
    pleno: "Intermédiaire",
    principal: "Principal",
    remote: "Télétravail",
    senior: "Senior",
    staff: "Staff",
  },
  it: {
    especialista: "Specialista",
    estagio: "Stage / Trainee",
    hybrid: "Ibrido",
    junior: "Junior",
    lead: "Lead",
    "on-site": "In sede",
    pleno: "Intermedio",
    principal: "Principal",
    remote: "Remoto",
    senior: "Senior",
    staff: "Staff",
  },
  pt: {
    especialista: "Especialista",
    estagio: "Estágio / Trainee",
    hybrid: "Híbrido",
    junior: "Júnior",
    lead: "Lead",
    "on-site": "Presencial",
    pleno: "Pleno",
    principal: "Principal",
    remote: "Remoto",
    senior: "Sênior",
    staff: "Staff",
  },
} as const;

const UNIVERSAL_TAG_LABELS: Record<string, string> = {
  ai: "AI",
  angular: "Angular",
  aws: "AWS",
  azure: "Azure",
  backend: "Back end",
  csharp: "C#",
  "data-engineering": "Data Engineering",
  "data-science": "Data Science",
  django: "Django",
  docker: "Docker",
  dotnet: ".NET",
  fastapi: "FastAPI",
  flask: "Flask",
  frontend: "Front end",
  fullstack: "Full stack",
  gcp: "GCP",
  go: "Go",
  java: "Java",
  javascript: "JavaScript",
  kotlin: "Kotlin",
  kubernetes: "Kubernetes",
  laravel: "Laravel",
  ml: "Machine Learning",
  mobile: "Mobile",
  mongodb: "MongoDB",
  mysql: "MySQL",
  nextjs: "Next.js",
  nodejs: "Node.js",
  php: "PHP",
  postgres: "PostgreSQL",
  python: "Python",
  qa: "QA",
  react: "React",
  "react-native": "React Native",
  redis: "Redis",
  ruby: "Ruby",
  "ruby-on-rails": "Ruby on Rails",
  rust: "Rust",
  spring: "Spring",
  terraform: "Terraform",
  typescript: "TypeScript",
  vue: "Vue",
};

const TAG_ALIASES: Record<string, string> = {
  "back-end": "backend",
  "front-end": "frontend",
  hibrido: "hybrid",
  híbrido: "hybrid",
  intern: "estagio",
  internship: "estagio",
  mid: "pleno",
  "on-site": "on-site",
  onsite: "on-site",
  presencial: "on-site",
  remoto: "remote",
  specialist: "especialista",
  trainee: "estagio",
};

function tagKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s_]+/g, "-");
}

export function formatOpportunityTag(value: string, locale: string): string {
  const normalized = tagKey(value);
  const canonical = TAG_ALIASES[normalized] ?? normalized;
  const localeKey = locale.toLocaleLowerCase().startsWith("pt")
    ? "pt"
    : locale.toLocaleLowerCase().split("-")[0];
  const labels = LOCALIZED_TAG_LABELS[
    localeKey as keyof typeof LOCALIZED_TAG_LABELS
  ] ?? LOCALIZED_TAG_LABELS.en;
  const localized = labels[canonical as keyof typeof labels];

  if (localized) return localized;
  if (UNIVERSAL_TAG_LABELS[canonical]) {
    return UNIVERSAL_TAG_LABELS[canonical];
  }

  return canonical
    .split("-")
    .filter(Boolean)
    .map((part) =>
      `${part.charAt(0).toLocaleUpperCase(locale)}${part.slice(1)}`)
    .join(" ");
}

export function plainTextExcerpt(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*```[^\n]*$/gm, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[ \t]*(?:#{1,6}|>|[-+*]|\d+[.)])[ \t]+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildOpportunityCardPresentation(
  item: Opportunity,
  visibleTagLimit = 3,
): OpportunityCardPresentation {
  const workModel = item.taxonomy?.workModels[0]
    ?? item.jobLocation?.workModel
    ?? null;
  const workModelKey = workModel ? tagKey(workModel) : null;
  const seen = new Set<string>();
  const tags: OpportunityCardTag[] = [];
  const add = (values: string[], category: OpportunityCardTagCategory) => {
    values.forEach((value) => {
      const key = tagKey(value);

      if (!key || key === workModelKey || seen.has(key)) return;
      seen.add(key);
      tags.push({ category, value });
    });
  };

  add(item.taxonomy?.seniority ?? [], "seniority");
  add(item.taxonomy?.technologies ?? [], "technology");
  add(item.taxonomy?.employmentTypes ?? [], "neutral");
  add(item.taxonomy?.areas ?? [], "neutral");
  add(item.taxonomy?.languages ?? [], "neutral");
  add(item.tags, "neutral");

  const limit = Math.max(0, Math.trunc(visibleTagLimit));
  const supportingTags = tags.slice(0, limit);

  return {
    overflowCount: Math.max(0, tags.length - supportingTags.length),
    sourceCount: Math.max(
      item.sources.length,
      item.deduplication?.sourceCount ?? 0,
    ),
    supportingTags,
    workModel,
  };
}

export function formatVisibleResultRange(
  visibleCount: number,
  resultCount: number,
): VisibleResultRange {
  const total = Math.max(0, Math.trunc(resultCount));
  const end = Math.min(total, Math.max(0, Math.trunc(visibleCount)));

  return {
    end,
    start: end > 0 ? 1 : 0,
  };
}
