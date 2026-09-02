import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { CatalogState } from "@/components/catalog-state";
import { DetailHeader } from "@/components/detail-header";
import { OpportunityCard } from "@/components/opportunity-card";
import { ProfileHero } from "@/components/profile-hero";
import { useCandidateState } from "@/contexts/candidate-state";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { formatCount, formatDate, formatLocation } from "@/domain/openings/formatting";
import { buildAuthorRoute, buildJobRoute } from "@/domain/openings/routing";
import { openHttpsUrl, shareUrl } from "@/services/external-actions";

interface CommunityProfileScreenProps { repository: string }

export function CommunityProfileScreen({ repository }: CommunityProfileScreenProps): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const catalog = useOpeningsCatalog();
  const candidate = useCandidateState();
  const profile = catalog.communities.find((item) => item.repository.toLocaleLowerCase() === repository.toLocaleLowerCase());
  const jobs = catalog.opportunities.filter((item) => item.repository.toLocaleLowerCase() === repository.toLocaleLowerCase());
  const status = catalog.status?.items.find((item) => item.repository === repository);
  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-canvas">
        <DetailHeader title={messages.communities.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} />
        <CatalogState pending={catalog.isLoading} message={catalog.isLoading ? messages.common.loading : messages.common.noResults} />
      </SafeAreaView>
    );
  }
  const canonical = `https://openings.dev/community/${profile.repository}`;
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom", "left", "right"]}>
      <DetailHeader title={messages.communities.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-6 py-6">
        <ProfileHero
          activityLabel={messages.communities.latestActivity}
          activityValue={formatDate(profile.lastPostedAt, locale) ?? "—"}
          avatarUrl={profile.avatarUrl}
          countLabel={`${formatCount(jobs.length, locale)} ${messages.jobs.title.toLocaleLowerCase(locale)}`}
          location={formatLocation([profile.region, profile.country])}
          status={status?.state}
          subtitle={profile.repository}
          title={profile.name}
        />
        <View className="mx-4 gap-3">
          <ActionButton primary icon="github" label={messages.communities.github} onPress={() => void openHttpsUrl(profile.repositoryUrl)} />
          <ActionButton icon="share-2" label={messages.communities.share} onPress={() => void shareUrl(profile.name, canonical)} />
        </View>
        <View className="gap-3">
          <Text className="mx-4 font-display text-card-title font-semibold text-foreground">{messages.jobs.title}</Text>
          {jobs.length === 0 ? (
            <CatalogState message={messages.common.noResults} />
          ) : jobs.map((item) => (
            <OpportunityCard
              hideCommunityIdentity
              isSaved={candidate.isSaved(item.id)}
              item={item}
              key={item.id}
              onAuthorPress={() => router.push(buildAuthorRoute(item.author.handle) as never)}
              onPress={() => router.push(buildJobRoute(item.id) as never)}
              onToggleSaved={() => candidate.toggleSaved(item.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
