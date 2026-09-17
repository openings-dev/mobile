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
import { deriveAuthors } from "@/domain/openings/discovery";
import { formatCount, formatDate, formatLocation } from "@/domain/openings/formatting";
import { buildCommunityRoute, buildJobRoute } from "@/domain/openings/routing";
import { openHttpsUrl, shareUrl } from "@/services/external-actions";

interface AuthorProfileScreenProps { handle: string }

export function AuthorProfileScreen({ handle }: AuthorProfileScreenProps): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const catalog = useOpeningsCatalog();
  const candidate = useCandidateState();
  const normalized = handle.toLocaleLowerCase();
  const profile = deriveAuthors(catalog.opportunities).find((item) => item.handle === normalized);
  const jobs = catalog.opportunities.filter((item) => item.author.handle.toLocaleLowerCase() === normalized);
  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-canvas">
        <DetailHeader title={messages.authors.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} />
        <CatalogState pending={catalog.isLoading} message={catalog.isLoading ? messages.common.loading : messages.common.noResults} />
      </SafeAreaView>
    );
  }
  const githubUrl = `https://github.com/${encodeURIComponent(profile.handle)}`;
  const canonical = `https://openings.dev/users/${encodeURIComponent(profile.handle)}`;
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom", "left", "right"]}>
      <DetailHeader title={messages.authors.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} />
      <ScrollView className="flex-1" contentContainerClassName="gap-6 py-6">
        <ProfileHero
          activityLabel={messages.authors.latestActivity}
          activityValue={formatDate(profile.lastPostedAt, locale) ?? "—"}
          avatarUrl={profile.avatarUrl}
          countLabel={`${formatCount(jobs.length, locale)} ${messages.jobs.title.toLocaleLowerCase(locale)}`}
          location={formatLocation([profile.region, profile.country])}
          subtitle={`@${profile.handle}`}
          title={profile.name}
        />
        <View className="mx-16 gap-3">
          <ActionButton primary icon="github" label={messages.authors.github} onPress={() => void openHttpsUrl(githubUrl)} />
          <ActionButton icon="share-2" label={messages.authors.share} onPress={() => void shareUrl(profile.name, canonical)} />
        </View>
        <View className="gap-3">
          <Text className="mx-16 font-display text-card-title font-semibold text-foreground">{messages.jobs.title}</Text>
          {jobs.map((item) => (
            <OpportunityCard
              hideAuthorIdentity
              isSaved={candidate.isSaved(item.id)}
              item={item}
              key={item.id}
              onCommunityPress={() => router.push(buildCommunityRoute(item.repository) as never)}
              onPress={() => router.push(buildJobRoute(item.id) as never)}
              onToggleSaved={() => candidate.toggleSaved(item.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
