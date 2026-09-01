import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { CatalogState } from "@/components/catalog-state";
import { DetailHeader } from "@/components/detail-header";
import { EntityAvatar } from "@/components/entity-avatar";
import { OpportunityCard } from "@/components/opportunity-card";
import { useCandidateState } from "@/contexts/candidate-state";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { formatCount, formatDate, formatLocation } from "@/domain/openings/formatting";
import { buildJobRoute } from "@/domain/openings/routing";
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
  if (!profile) return <SafeAreaView className="flex-1 bg-canvas"><DetailHeader title={messages.communities.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} /><CatalogState pending={catalog.isLoading} message={catalog.isLoading ? messages.common.loading : messages.common.noResults} /></SafeAreaView>;
  const canonical = `https://openings.dev/community/${profile.repository}`;
  return <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom", "left", "right"]}><DetailHeader title={messages.communities.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} /><ScrollView className="flex-1" contentContainerClassName="gap-6 py-6"><View className="mx-5 gap-5 rounded-editorial bg-night p-6"><EntityAvatar name={profile.name} size="large" uri={profile.avatarUrl} /><View className="gap-2"><Text accessibilityRole="header" className="font-display text-section-title font-semibold text-night-foreground">{profile.name}</Text><Text className="font-mono text-metadata text-night-muted-foreground">{profile.repository}</Text></View><View className="gap-2"><Text className="font-body text-product-body text-night-muted-foreground">{formatLocation([profile.region, profile.country])}</Text><Text className="font-body text-product-body text-night-muted-foreground">{formatCount(jobs.length, locale)} {messages.jobs.title.toLocaleLowerCase(locale)}</Text><Text className="font-body text-metadata text-night-muted-foreground">{messages.communities.latestActivity}: {formatDate(profile.lastPostedAt, locale) ?? "—"}</Text>{status ? <Text className="font-body text-metadata text-night-muted-foreground">{status.state}</Text> : null}</View></View><View className="mx-5 gap-3"><ActionButton primary icon="github" label={messages.communities.github} onPress={() => void openHttpsUrl(profile.repositoryUrl)} /><ActionButton icon="share-2" label={messages.communities.share} onPress={() => void shareUrl(profile.name, canonical)} /></View><View className="gap-3"><Text className="mx-5 font-display text-card-title font-semibold text-foreground">{messages.jobs.title}</Text>{jobs.length === 0 ? <CatalogState message={messages.common.noResults} /> : jobs.map((item) => <OpportunityCard key={item.id} item={item} locale={locale} isSaved={candidate.isSaved(item.id)} newLabel={messages.jobs.newBadge} saveLabel={messages.jobs.save} unsaveLabel={messages.jobs.unsave} viewDetailsLabel={messages.jobs.viewDetails} onToggleSaved={() => candidate.toggleSaved(item.id)} onPress={() => router.push(buildJobRoute(item.id) as never)} />)}</View></ScrollView></SafeAreaView>;
}
