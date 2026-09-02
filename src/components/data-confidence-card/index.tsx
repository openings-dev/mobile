import { ArrowUpRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";
import type { OpportunityConfidenceSummary } from "@/domain/opportunity-confidence";
import type { Opportunity } from "@/domain/openings/types";
import type { FoundationMessages } from "@/i18n/types";

interface DataConfidenceCardProps {
  copy: FoundationMessages["jobs"]["dataConfidence"];
  item: Opportunity;
  locale: string;
  onOpenSource: (url: string) => void;
  summary: OpportunityConfidenceSummary;
}

function formatConfidenceDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function provenanceBadgeClasses(
  provenance: "declared" | "inferred" | "unknown",
): string {
  if (provenance === "declared") {
    return "min-h-7 justify-center rounded-pill bg-positive px-3";
  }
  if (provenance === "inferred") {
    return "min-h-7 justify-center rounded-pill bg-info px-3";
  }
  return "min-h-7 justify-center rounded-pill border border-line bg-surface-muted px-3";
}

function provenanceTextClasses(
  provenance: "declared" | "inferred" | "unknown",
): string {
  if (provenance === "declared") {
    return "font-body text-metadata font-medium text-positive-foreground";
  }
  if (provenance === "inferred") {
    return "font-body text-metadata font-medium text-info-foreground";
  }
  return "font-body text-metadata font-medium text-foreground";
}

export function DataConfidenceCard({
  copy,
  item,
  locale,
  onOpenSource,
  summary,
}: DataConfidenceCardProps): React.ReactNode {
  const { theme } = useAppTheme();
  const sources = item.sources.length > 0
    ? item.sources
    : [{ id: item.id, repository: item.repository, url: item.url }];

  return (
    <View className="mx-4 gap-5 rounded-card border border-line bg-paper p-5">
      <View className="gap-2">
        <Text className="font-display text-card-title font-semibold text-foreground">
          {copy.title}
        </Text>
        <Text className="font-body text-product-body leading-6 text-muted-foreground">
          {copy.description}
        </Text>
      </View>

      {summary.stale ? (
        <Text className="rounded-control border border-warning-foreground/25 bg-warning px-4 py-3 font-body text-label leading-5 text-warning-foreground">
          {copy.staleWarning}
        </Text>
      ) : null}
      {summary.incomplete ? (
        <Text className="rounded-control border border-line bg-surface-muted px-4 py-3 font-body text-label leading-5 text-muted-foreground">
          {copy.incompleteWarning}
        </Text>
      ) : null}

      <View className="gap-4">
        <View className="gap-1">
          <Text className="font-body text-metadata text-muted-foreground">
            {copy.lastVerified}
          </Text>
          <Text className="font-body text-label font-medium text-foreground">
            {summary.lastVerifiedAt
              ? formatConfidenceDate(summary.lastVerifiedAt, locale)
              : copy.verificationUnavailable}
          </Text>
        </View>
        <View className="gap-1">
          <Text className="font-body text-metadata text-muted-foreground">
            {copy.published}
          </Text>
          <Text className="font-body text-label font-medium text-foreground">
            {formatConfidenceDate(item.createdAt, locale)}
          </Text>
        </View>
        <View className="gap-1">
          <Text className="font-body text-metadata text-muted-foreground">
            {copy.sources}
          </Text>
          <Text className="font-body text-label font-medium text-foreground">
            {summary.sourceCount.toLocaleString(locale)}
          </Text>
        </View>
      </View>

      <View className="gap-3 border-t border-line pt-5">
        {summary.fields.map(({ field, provenance }) => (
          <View
            className="flex-row flex-wrap items-center justify-between gap-3"
            key={field}
          >
            <Text className="font-body text-label text-muted-foreground">
              {copy.fields[field]}
            </Text>
            <View className={provenanceBadgeClasses(provenance)}>
              <Text className={provenanceTextClasses(provenance)}>
                {copy.states[provenance]}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View className="gap-2 border-t border-line pt-5">
        {sources.map((source) => (
          <Pressable
            accessibilityRole="link"
            className="min-h-11 flex-row items-center justify-between gap-3 rounded-control"
            key={source.id}
            onPress={() => onOpenSource(source.url)}
          >
            <Text
              className="min-w-0 flex-1 font-body text-label font-medium text-primary-deep"
              numberOfLines={1}
            >
              {source.repository}
            </Text>
            <ArrowUpRight
              accessibilityElementsHidden
              color={theme.colors["primary-deep"]}
              size={16}
              strokeWidth={1.8}
            />
          </Pressable>
        ))}
      </View>
      <Text className="font-body text-metadata leading-5 text-muted-foreground">
        {copy.originalAuthority}
      </Text>
    </View>
  );
}
