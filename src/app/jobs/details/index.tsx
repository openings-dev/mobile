import { useRouter } from "expo-router";
import { MapPin, WalletCards } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CatalogState } from "@/components/catalog-state";
import { DataConfidenceCard } from "@/components/data-confidence-card";
import { DetailHeader } from "@/components/detail-header";
import { EntityAvatar } from "@/components/entity-avatar";
import { JobDetailActions } from "@/components/job-detail-actions";
import { OpportunityCard } from "@/components/opportunity-card";
import { useCandidateState } from "@/contexts/candidate-state";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { useAppTheme } from "@/contexts/theme";
import { buildOpportunityConfidence } from "@/domain/opportunity-confidence";
import { findSimilarJobs } from "@/domain/openings/discovery";
import { formatSalary } from "@/domain/openings/formatting";
import {
  buildOpportunityCardPresentation,
  formatOpportunityTag,
  plainTextExcerpt,
  type OpportunityCardTagCategory,
} from "@/domain/openings/presentation";
import {
  buildAuthorRoute,
  buildCommunityRoute,
  buildJobRoute,
} from "@/domain/openings/routing";
import { openHttpsUrl, shareUrl } from "@/services/external-actions";
import { trackProductEvent } from "@/services/telemetry/product-events";

interface JobDetailsScreenProps {
  id: string;
}

function detailTagClasses(category: OpportunityCardTagCategory): string {
  if (category === "seniority") {
    return "min-h-7 justify-center rounded-pill bg-primary-soft px-3";
  }
  if (category === "technology") {
    return "min-h-7 justify-center rounded-pill bg-info px-3";
  }
  return "min-h-7 justify-center rounded-pill bg-surface-muted px-3";
}

function detailTagTextClasses(category: OpportunityCardTagCategory): string {
  if (category === "seniority") {
    return "font-body text-metadata font-medium text-primary-deep";
  }
  if (category === "technology") {
    return "font-body text-metadata font-medium text-info-foreground";
  }
  return "font-body text-metadata text-muted-foreground";
}

function reportUrl(title: string, canonicalUrl: string, sourceUrl: string): string {
  const issueTitle = `Job report: ${title}`;
  const issueBody = [
    "Please describe the problem with this listing.",
    "",
    `Openings URL: ${canonicalUrl}`,
    `Original source: ${sourceUrl}`,
  ].join("\n");

  return `https://github.com/openings-dev/web/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
}

function ageBucket(createdAt: string): "0-7" | "8-30" | "31-90" | "91+" {
  const days = Math.max(0, (Date.now() - Date.parse(createdAt)) / 86_400_000);
  if (days <= 7) return "0-7";
  if (days <= 30) return "8-30";
  if (days <= 90) return "31-90";
  return "91+";
}

function savedCountBucket(count: number): "0" | "1-5" | "6-20" | "21+" {
  if (count === 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 20) return "6-20";
  return "21+";
}

export function JobDetailsScreen({ id }: JobDetailsScreenProps): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const { theme } = useAppTheme();
  const catalog = useOpeningsCatalog();
  const candidate = useCandidateState();
  const [dockHeight, setDockHeight] = useState(0);
  const item = catalog.opportunities.find(
    (opportunity) => opportunity.id === id,
  );
  const markViewed = candidate.markViewed;

  useEffect(() => {
    if (item) {
      markViewed(item.id);
      trackProductEvent("Job Viewed", {
        age: ageBucket(item.createdAt),
        jobId: item.id,
        sourceCount: item.sources.length,
      });
    }
  }, [item, markViewed]);

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={["top", "left", "right"]}>
        <DetailHeader
          backLabel={messages.common.close}
          onBack={() => router.back()}
          title={messages.jobs.detailsTitle}
        />
        <CatalogState
          pending={catalog.isLoading}
          message={catalog.isLoading
            ? messages.common.loading
            : messages.common.noResults}
        />
      </SafeAreaView>
    );
  }

  const salary = formatSalary(item.salary, locale);
  const similar = findSimilarJobs(item, catalog.opportunities, 3);
  const presentation = buildOpportunityCardPresentation(item, 12);
  const confidence = buildOpportunityConfidence(item, catalog.status);
  const description = plainTextExcerpt(item.description) || messages.jobs.noDescription;
  const communityName = item.community.name || item.repository;
  const canonicalUrl = `https://openings.dev${buildJobRoute(item.id)}`;
  const issueUrl = reportUrl(item.title, canonicalUrl, item.url);

  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={["top", "left", "right"]}
    >
      <DetailHeader
        backLabel={messages.common.close}
        onBack={() => router.back()}
        title={messages.jobs.detailsTitle}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 py-6"
        contentContainerStyle={{ paddingBottom: dockHeight + 24 }}
      >
        <View className="mx-4 gap-5">
          <Text className="font-body text-label font-semibold text-primary-deep">
            {messages.jobs.detailsTitle}
          </Text>
          <View className="gap-2">
            <Pressable
              accessibilityLabel={messages.jobs.showCommunityJobs.replace(
                "{name}",
                communityName,
              )}
              accessibilityRole="button"
              className="min-h-11 self-start flex-row items-center gap-3 rounded-control"
              onPress={() =>
                router.push(buildCommunityRoute(item.repository) as never)}
            >
              <EntityAvatar
                name={communityName}
                size="small"
                uri={item.community.avatarUrl}
              />
              <View className="min-w-0 gap-0.5">
                <Text
                  className="font-body text-label font-semibold text-foreground"
                  numberOfLines={1}
                >
                  {communityName}
                </Text>
                <Text
                  className="font-body text-metadata text-muted-foreground"
                  numberOfLines={1}
                >
                  {item.repository}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel={messages.jobs.showAuthorJobs.replace(
                "{handle}",
                item.author.handle,
              )}
              accessibilityRole="button"
              className="min-h-11 self-start flex-row items-center gap-3 rounded-control"
              onPress={() =>
                router.push(buildAuthorRoute(item.author.handle) as never)}
            >
              <EntityAvatar
                name={item.author.name || item.author.handle}
                size="small"
                uri={item.author.avatarUrl}
              />
              <View className="gap-0.5">
                <Text className="font-body text-label font-semibold text-foreground">
                  {item.author.name || item.author.handle}
                </Text>
                <Text className="font-body text-metadata text-muted-foreground">
                  @{item.author.handle}
                </Text>
              </View>
            </Pressable>
          </View>
          <Text
            accessibilityRole="header"
            className="font-display text-[32px] font-semibold leading-[33px] tracking-[-1px] text-foreground"
          >
            {item.title}
          </Text>
          <View className="flex-row flex-wrap items-center gap-3 border-y border-line py-4">
            {salary ? (
              <View className="flex-row items-center gap-2">
                <WalletCards
                  accessibilityElementsHidden
                  color={theme.colors["positive-foreground"]}
                  size={17}
                  strokeWidth={1.8}
                />
                <Text className="font-body text-label font-semibold text-foreground">
                  {salary}
                </Text>
              </View>
            ) : null}
            {presentation.workModel ? (
              <View className="min-h-7 justify-center rounded-pill bg-positive px-3">
                <Text className="font-body text-metadata font-medium text-positive-foreground">
                  {formatOpportunityTag(presentation.workModel, locale)}
                </Text>
              </View>
            ) : null}
            {item.jobLocation?.displayText ? (
              <View className="min-w-0 flex-row items-center gap-2">
                <MapPin
                  accessibilityElementsHidden
                  color={theme.colors["muted-foreground"]}
                  size={17}
                  strokeWidth={1.8}
                />
                <Text className="min-w-0 flex-1 font-body text-label text-muted-foreground">
                  {item.jobLocation.displayText}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text
          className="mx-4 font-body text-product-body leading-7 text-foreground"
          selectable
        >
          {description}
        </Text>

        <DataConfidenceCard
          copy={messages.jobs.dataConfidence}
          item={item}
          locale={locale}
          onOpenSource={(url) => void openHttpsUrl(url)}
          summary={confidence}
        />

        {presentation.supportingTags.length > 0 ? (
          <View className="mx-4 flex-row flex-wrap gap-2 border-t border-line pt-6">
            {presentation.supportingTags.map((tag) => (
              <View
                className={detailTagClasses(tag.category)}
                key={`${tag.category}-${tag.value}`}
              >
                <Text className={detailTagTextClasses(tag.category)}>
                  {formatOpportunityTag(tag.value, locale)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {similar.length > 0 ? (
          <View className="gap-3 border-t border-line pt-6">
            <Text className="mx-4 font-display text-card-title font-semibold text-foreground">
              {messages.jobs.similar}
            </Text>
            {similar.map((opportunity) => (
              <OpportunityCard
                isSaved={candidate.isSaved(opportunity.id)}
                item={opportunity}
                key={opportunity.id}
                onAuthorPress={() =>
                  router.push(buildAuthorRoute(opportunity.author.handle) as never)}
                onCommunityPress={() =>
                  router.push(buildCommunityRoute(opportunity.repository) as never)}
                onPress={() => router.push(buildJobRoute(opportunity.id) as never)}
                onToggleSaved={() => candidate.toggleSaved(opportunity.id)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <JobDetailActions
        isSaved={candidate.isSaved(item.id)}
        labels={{
          openOriginal: messages.jobs.openOriginal,
          report: messages.jobs.reportProblem,
          save: candidate.isSaved(item.id)
            ? messages.jobs.unsave
            : messages.jobs.save,
          share: messages.jobs.share,
        }}
        onHeightChange={setDockHeight}
        onOpenOriginal={() => {
          trackProductEvent("Original Listing Opened", { jobId: item.id, sourceCount: item.sources.length });
          void openHttpsUrl(item.url);
        }}
        onReport={() => void openHttpsUrl(issueUrl)}
        onShare={() => void shareUrl(item.title, canonicalUrl)}
        onToggleSaved={() => {
          const nextCount = candidate.isSaved(item.id)
            ? Math.max(0, candidate.savedIds.size - 1)
            : candidate.savedIds.size + 1;
          candidate.toggleSaved(item.id);
          trackProductEvent("Job Saved", { jobId: item.id, savedCount: savedCountBucket(nextCount) });
        }}
      />
    </SafeAreaView>
  );
}
