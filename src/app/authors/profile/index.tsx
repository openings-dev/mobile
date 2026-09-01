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
import { deriveAuthors } from "@/domain/openings/discovery";
import { formatCount, formatDate, formatLocation } from "@/domain/openings/formatting";
import { buildJobRoute } from "@/domain/openings/routing";
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
  if (!profile) return <SafeAreaView className="flex-1 bg-canvas"><DetailHeader title={messages.authors.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} /><CatalogState pending={catalog.isLoading} message={catalog.isLoading ? messages.common.loading : messages.common.noResults} /></SafeAreaView>;
  const githubUrl = `https://github.com/${encodeURIComponent(profile.handle)}`;
  const canonical = `https://openings.dev/users/${encodeURIComponent(profile.handle)}`;
  return <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom", "left", "right"]}><DetailHeader title={messages.authors.profileTitle} backLabel={messages.common.close} onBack={() => router.back()} /><ScrollView className="flex-1" contentContainerClassName="gap-6 py-6"><View className="mx-5 gap-5 rounded-editorial bg-night p-6"><EntityAvatar name={profile.name} size="large" uri={profile.avatarUrl} /><View className="gap-2"><Text accessibilityRole="header" className="font-display text-section-title font-semibold text-night-foreground">{profile.name}</Text><Text className="font-mono text-product-body text-night-muted-foreground">@{profile.handle}</Text></View><View className="gap-2"><Text className="font-body text-product-body text-night-muted-foreground">{formatLocation([profile.region, profile.country])}</Text><Text className="font-body text-product-body text-night-muted-foreground">{formatCount(jobs.length, locale)} {messages.jobs.title.toLocaleLowerCase(locale)}</Text><Text className="font-body text-metadata text-night-muted-foreground">{messages.authors.latestActivity}: {formatDate(profile.lastPostedAt, locale) ?? "—"}</Text></View></View><View className="mx-5 gap-3"><ActionButton primary icon="github" label={messages.authors.github} onPress={() => void openHttpsUrl(githubUrl)} /><ActionButton icon="share-2" label={messages.authors.share} onPress={() => void shareUrl(profile.name, canonical)} /></View><View className="gap-3"><Text className="mx-5 font-display text-card-title font-semibold text-foreground">{messages.jobs.title}</Text>{jobs.map((item) => <OpportunityCard key={item.id} item={item} locale={locale} isSaved={candidate.isSaved(item.id)} newLabel={messages.jobs.newBadge} saveLabel={messages.jobs.save} unsaveLabel={messages.jobs.unsave} viewDetailsLabel={messages.jobs.viewDetails} onToggleSaved={() => candidate.toggleSaved(item.id)} onPress={() => router.push(buildJobRoute(item.id) as never)} />)}</View></ScrollView></SafeAreaView>;
}
