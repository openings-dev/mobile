import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { CatalogState } from "@/components/catalog-state";
import { DetailHeader } from "@/components/detail-header";
import { EntityAvatar } from "@/components/entity-avatar";
import { OpportunityCard } from "@/components/opportunity-card";
import { useCandidateState } from "@/contexts/candidate-state";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { findSimilarJobs } from "@/domain/openings/discovery";
import { formatDate, formatSalary } from "@/domain/openings/formatting";
import { buildAuthorRoute, buildCommunityRoute, buildJobRoute } from "@/domain/openings/routing";
import { openHttpsUrl, shareUrl } from "@/services/external-actions";

interface JobDetailsScreenProps { id: string }

export function JobDetailsScreen({ id }: JobDetailsScreenProps): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
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
  const canonicalUrl = `https://openings.dev${buildJobRoute(item.id)}`;
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom", "left", "right"]}>
      <DetailHeader title={messages.jobs.detailsTitle} backLabel={messages.common.close} onBack={() => router.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-7 px-5 py-6">
        <View className="gap-5">
          <View className="flex-row items-center gap-3">
            <Pressable accessibilityRole="button" className="min-h-12 flex-1 flex-row items-center gap-3 rounded-control" onPress={() => router.push(buildCommunityRoute(item.repository) as never)}>
              <EntityAvatar name={item.community.name} uri={item.community.avatarUrl} />
              <View className="min-w-0 flex-1"><Text className="font-body text-label font-semibold text-foreground" numberOfLines={1}>{item.community.name}</Text><Text className="font-mono text-metadata text-muted-foreground" numberOfLines={1}>{item.repository}</Text></View>
            </Pressable>
            <Pressable accessibilityRole="button" className="min-h-12 justify-center rounded-control px-2" onPress={() => router.push(buildAuthorRoute(item.author.handle) as never)}><Text className="font-body text-label font-semibold text-primary-deep">@{item.author.handle}</Text></Pressable>
          </View>
          <Text accessibilityRole="header" className="font-display text-section-title font-semibold text-foreground">{item.title}</Text>
          <View className="flex-row flex-wrap gap-2">{item.tags.map((tag) => <View className="rounded-pill bg-surface-muted px-3 py-1.5" key={tag}><Text className="font-body text-metadata text-muted-foreground">{tag}</Text></View>)}</View>
          <View className="gap-2 border-y border-line py-4">
            {salary ? <Text className="font-body text-product-body font-semibold text-foreground">{salary}</Text> : null}
            {item.jobLocation?.displayText ? <Text className="font-body text-product-body text-muted-foreground">⌖ {item.jobLocation.displayText}</Text> : null}
            <Text className="font-body text-metadata text-muted-foreground">{messages.jobs.posted}: {formatDate(item.createdAt, locale)}</Text>
            <Text className="font-body text-metadata text-muted-foreground">{messages.jobs.updated}: {formatDate(item.updatedAt, locale)}</Text>
            {item.freshness ? <Text className="font-body text-metadata text-muted-foreground">{item.freshness.status} · {item.freshness.ageDays}d</Text> : null}
          </View>
        </View>
        <View className="gap-3"><Text className="font-display text-card-title font-semibold text-foreground">{messages.jobs.detailsTitle}</Text><Text selectable className="font-body text-product-body leading-7 text-foreground">{item.description.trim() || messages.jobs.noDescription}</Text></View>
        <View className="gap-3"><ActionButton primary icon="external-link" label={messages.jobs.openOriginal} onPress={() => void openHttpsUrl(item.url)} /><View className="flex-row gap-3"><View className="flex-1"><ActionButton icon={candidate.isSaved(item.id) ? "bookmark" : "bookmark"} label={candidate.isSaved(item.id) ? messages.jobs.unsave : messages.jobs.save} onPress={() => candidate.toggleSaved(item.id)} /></View><View className="flex-1"><ActionButton icon="share-2" label={messages.jobs.share} onPress={() => void shareUrl(item.title, canonicalUrl)} /></View></View></View>
        {item.sources.length > 1 ? <View className="gap-3 border-t border-line pt-5"><Text className="font-display text-card-title font-semibold text-foreground">{messages.jobs.allSources}</Text>{item.sources.map((source) => <Pressable accessibilityRole="link" className="min-h-11 justify-center" key={source.id} onPress={() => void openHttpsUrl(source.url)}><Text className="font-body text-label font-semibold text-primary-deep">{source.repository}</Text></Pressable>)}</View> : null}
        {similar.length > 0 ? <View className="gap-3 border-t border-line pt-5"><Text className="font-display text-card-title font-semibold text-foreground">{messages.jobs.similar}</Text>{similar.map((opportunity) => <OpportunityCard key={opportunity.id} item={opportunity} locale={locale} isSaved={candidate.isSaved(opportunity.id)} newLabel={messages.jobs.newBadge} saveLabel={messages.jobs.save} unsaveLabel={messages.jobs.unsave} viewDetailsLabel={messages.jobs.viewDetails} onToggleSaved={() => candidate.toggleSaved(opportunity.id)} onPress={() => router.push(buildJobRoute(opportunity.id) as never)} />)}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
