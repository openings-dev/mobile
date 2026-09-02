import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

import { ActionButton } from "@/components/action-button";
import { CatalogState } from "@/components/catalog-state";
import { DetailHeader } from "@/components/detail-header";
import { EntityAvatar } from "@/components/entity-avatar";
import { OpportunityCard } from "@/components/opportunity-card";
import { useCandidateState } from "@/contexts/candidate-state";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { useAppTheme } from "@/contexts/theme";
import { findSimilarJobs } from "@/domain/openings/discovery";
import { formatDate, formatSalary } from "@/domain/openings/formatting";
import {
  buildOpportunityCardPresentation,
  formatOpportunityTag,
  plainTextExcerpt,
  type OpportunityCardTagCategory,
} from "@/domain/openings/presentation";
import { buildAuthorRoute, buildCommunityRoute, buildJobRoute } from "@/domain/openings/routing";
import { openHttpsUrl, shareUrl } from "@/services/external-actions";

interface JobDetailsScreenProps { id: string }

function detailTagClasses(category: OpportunityCardTagCategory): string {
  if (category === "seniority") return "rounded-pill bg-primary-soft px-3 py-1.5";
  if (category === "technology") return "rounded-pill bg-info px-3 py-1.5";
  return "rounded-pill bg-surface-muted px-3 py-1.5";
}

function detailTagTextClasses(category: OpportunityCardTagCategory): string {
  if (category === "seniority") return "font-body text-metadata font-medium text-primary-deep";
  if (category === "technology") return "font-body text-metadata font-medium text-info-foreground";
  return "font-body text-metadata text-muted-foreground";
}

export function JobDetailsScreen({ id }: JobDetailsScreenProps): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const { theme } = useAppTheme();
  const catalog = useOpeningsCatalog();
  const candidate = useCandidateState();
  const item = catalog.opportunities.find((opportunity) => opportunity.id === id);
  const markViewed = candidate.markViewed;
  useEffect(() => { if (item) markViewed(item.id); }, [item, markViewed]);
  if (!item) {
    return <SafeAreaView className="flex-1 bg-canvas"><DetailHeader title={messages.jobs.detailsTitle} backLabel={messages.common.close} onBack={() => router.back()} /><CatalogState pending={catalog.isLoading} message={catalog.isLoading ? messages.common.loading : messages.common.noResults} /></SafeAreaView>;
  }
  const salary = formatSalary(item.salary, locale);
  const similar = findSimilarJobs(item, catalog.opportunities, 3);
  const presentation = buildOpportunityCardPresentation(item, 12);
  const description = plainTextExcerpt(item.description) || messages.jobs.noDescription;
  const communityName = item.community.name || item.repository;
  const canonicalUrl = `https://openings.dev${buildJobRoute(item.id)}`;
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom", "left", "right"]}>
      <DetailHeader title={messages.jobs.detailsTitle} backLabel={messages.common.close} onBack={() => router.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-7 py-6">
        <View className="mx-4 gap-5">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityLabel={messages.jobs.showCommunityJobs.replace("{name}", communityName)}
              accessibilityRole="button"
              className="min-h-12 flex-1 flex-row items-center gap-3 rounded-control"
              onPress={() => router.push(buildCommunityRoute(item.repository) as never)}
            >
              <EntityAvatar name={communityName} uri={item.community.avatarUrl} />
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-body text-label font-semibold text-primary-deep" numberOfLines={1}>{communityName}</Text>
                <Text className="font-mono text-metadata text-muted-foreground" numberOfLines={1}>{item.repository}</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel={messages.jobs.showAuthorJobs.replace("{handle}", item.author.handle)}
              accessibilityRole="button"
              className="min-h-12 flex-row items-center gap-2 rounded-control px-2"
              onPress={() => router.push(buildAuthorRoute(item.author.handle) as never)}
            >
              <EntityAvatar name={item.author.name || item.author.handle} size="small" uri={item.author.avatarUrl} />
              <Text className="font-body text-label font-semibold text-primary-deep">@{item.author.handle}</Text>
            </Pressable>
          </View>
          <Text accessibilityRole="header" className="font-display text-section-title font-semibold text-foreground">{item.title}</Text>
          <View className="flex-row flex-wrap gap-2">
            {item.freshness?.status === "stale" ? (
              <View className="rounded-pill bg-surface-muted px-3 py-1.5">
                <Text className="font-body text-metadata font-medium text-muted-foreground">{messages.jobs.olderBadge}</Text>
              </View>
            ) : null}
            {presentation.sourceCount > 1 ? (
              <View className="rounded-pill bg-info px-3 py-1.5">
                <Text className="font-body text-metadata font-medium text-info-foreground">
                  {messages.jobs.sourcesCount.replace("{count}", presentation.sourceCount.toLocaleString(locale))}
                </Text>
              </View>
            ) : null}
            {presentation.supportingTags.map((tag) => (
              <View className={detailTagClasses(tag.category)} key={`${tag.category}-${tag.value}`}>
                <Text className={detailTagTextClasses(tag.category)}>{formatOpportunityTag(tag.value, locale)}</Text>
              </View>
            ))}
            {presentation.overflowCount > 0 ? (
              <View className="rounded-pill bg-surface-muted px-3 py-1.5">
                <Text className="font-body text-metadata font-medium text-muted-foreground">+{presentation.overflowCount}</Text>
              </View>
            ) : null}
          </View>
          <View className="gap-3 rounded-card border border-line bg-surface p-4">
            {salary ? (
              <View className="flex-row items-center gap-2">
                <Feather name="credit-card" size={17} color={theme.colors["positive-foreground"]} />
                <Text className="font-body text-product-body font-semibold text-foreground">{salary}</Text>
              </View>
            ) : null}
            {presentation.workModel ? (
              <View className="flex-row items-center gap-2">
                <Feather name="wifi" size={17} color={theme.colors["muted-foreground"]} />
                <Text className="font-body text-product-body text-muted-foreground">{formatOpportunityTag(presentation.workModel, locale)}</Text>
              </View>
            ) : null}
            {item.jobLocation?.displayText ? (
              <View className="flex-row items-center gap-2">
                <Feather name="map-pin" size={17} color={theme.colors["muted-foreground"]} />
                <Text className="min-w-0 flex-1 font-body text-product-body text-muted-foreground">{item.jobLocation.displayText}</Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-2">
              <Feather name="calendar" size={16} color={theme.colors["muted-foreground"]} />
              <Text className="font-body text-metadata text-muted-foreground">{messages.jobs.posted}: {formatDate(item.createdAt, locale)}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Feather name="refresh-cw" size={16} color={theme.colors["muted-foreground"]} />
              <Text className="font-body text-metadata text-muted-foreground">{messages.jobs.updated}: {formatDate(item.updatedAt, locale)}</Text>
            </View>
          </View>
        </View>
        <View className="mx-4 gap-3 rounded-card border border-line bg-surface p-4">
          <Text className="font-display text-card-title font-semibold text-foreground">{messages.jobs.detailsTitle}</Text>
          <Text selectable className="font-body text-product-body leading-7 text-foreground">{description}</Text>
        </View>
        <View className="mx-4 gap-3">
          <ActionButton primary icon="external-link" label={messages.jobs.openOriginal} onPress={() => void openHttpsUrl(item.url)} />
          <View className="flex-row gap-3">
            <View className="flex-1"><ActionButton icon="bookmark" label={candidate.isSaved(item.id) ? messages.jobs.unsave : messages.jobs.save} onPress={() => candidate.toggleSaved(item.id)} /></View>
            <View className="flex-1"><ActionButton icon="share-2" label={messages.jobs.share} onPress={() => void shareUrl(item.title, canonicalUrl)} /></View>
          </View>
        </View>
        {item.sources.length > 1 ? (
          <View className="mx-4 gap-3 border-t border-line pt-5">
            <Text className="font-display text-card-title font-semibold text-foreground">{messages.jobs.allSources}</Text>
            {item.sources.map((source) => (
              <Pressable accessibilityRole="link" className="min-h-11 flex-row items-center justify-between rounded-control border border-line bg-surface px-4" key={source.id} onPress={() => void openHttpsUrl(source.url)}>
                <Text className="min-w-0 flex-1 font-body text-label font-semibold text-primary-deep" numberOfLines={1}>{source.repository}</Text>
                <Feather name="external-link" size={16} color={theme.colors["primary-deep"]} />
              </Pressable>
            ))}
          </View>
        ) : null}
        {similar.length > 0 ? (
          <View className="gap-3 border-t border-line pt-5">
            <Text className="mx-4 font-display text-card-title font-semibold text-foreground">{messages.jobs.similar}</Text>
            {similar.map((opportunity) => (
              <OpportunityCard
                isSaved={candidate.isSaved(opportunity.id)}
                item={opportunity}
                key={opportunity.id}
                onAuthorPress={() => router.push(buildAuthorRoute(opportunity.author.handle) as never)}
                onCommunityPress={() => router.push(buildCommunityRoute(opportunity.repository) as never)}
                onPress={() => router.push(buildJobRoute(opportunity.id) as never)}
                onToggleSaved={() => candidate.toggleSaved(opportunity.id)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
