import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CatalogState } from "@/components/catalog-state";
import { DirectoryCard } from "@/components/directory-card";
import { FilterChip } from "@/components/filter-chip";
import { ScreenHeader } from "@/components/screen-header";
import { SearchField } from "@/components/search-field";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { useAppTheme } from "@/contexts/theme";
import { filterAndSortDirectory } from "@/domain/openings/discovery";
import { formatCount, formatDate, formatLocation } from "@/domain/openings/formatting";
import { buildCommunityRoute } from "@/domain/openings/routing";
import type { CommunityActivity, DirectoryFilters } from "@/domain/openings/types";
import { isOfflineCatalogError } from "@/services/openings-catalog";

type ActivityFilter = CommunityActivity | "all";

export function CommunitiesScreen(): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const { theme } = useAppTheme();
  const catalog = useOpeningsCatalog();
  const [activity, setActivity] = useState<ActivityFilter>("healthy");
  const [filters, setFilters] = useState<DirectoryFilters>({ country: "all", query: "", region: "all", sort: "count" });
  const states = useMemo(() => new Map(catalog.status?.items.map((item) => [item.repository, item.state])), [catalog.status]);
  const stateFor = (repository: string, count: number): CommunityActivity => states.get(repository) ?? (count > 0 ? "healthy" : "no-openings");
  const activityCounts = { healthy: 0, "no-openings": 0, error: 0 };
  catalog.communities.forEach((item) => { activityCounts[stateFor(item.repository, item.opportunitiesCount)] += 1; });
  const activityItems = catalog.communities.filter((item) => activity === "all" || stateFor(item.repository, item.opportunitiesCount) === activity);
  const visible = filterAndSortDirectory(activityItems, filters, (item) => [item.name, item.repository], (item) => item.repository);
  const regions = [...new Set(activityItems.map((item) => item.region).filter(Boolean))].sort();
  const countries = [...new Set(activityItems.map((item) => item.country).filter(Boolean))].sort();
  const errorMessage = isOfflineCatalogError(catalog.error) ? messages.common.offline : messages.common.sourceError;

  if (catalog.isLoading && catalog.communities.length === 0) return <SafeAreaView className="flex-1 bg-canvas"><ScreenHeader title={messages.communities.title} description={messages.communities.description} /><CatalogState pending message={messages.common.loading} /></SafeAreaView>;
  if (catalog.error && catalog.communities.length === 0) return <SafeAreaView className="flex-1 bg-canvas"><ScreenHeader title={messages.communities.title} description={messages.communities.description} /><CatalogState message={errorMessage} actionLabel={messages.common.retry} onAction={() => void catalog.refresh()} /></SafeAreaView>;
  const header = <View className="gap-4 pb-4"><ScreenHeader title={messages.communities.title} description={messages.communities.description} /><View className="gap-4 px-5"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2"><FilterChip label={`${messages.communities.active} · ${activityCounts.healthy}`} selected={activity === "healthy"} onPress={() => setActivity("healthy")} /><FilterChip label={`${messages.communities.noOpenings} · ${activityCounts["no-openings"]}`} selected={activity === "no-openings"} onPress={() => setActivity("no-openings")} /><FilterChip label={`${messages.communities.errors} · ${activityCounts.error}`} selected={activity === "error"} onPress={() => setActivity("error")} /><FilterChip label={`${messages.communities.allSources} · ${catalog.communities.length}`} selected={activity === "all"} onPress={() => setActivity("all")} /></ScrollView><SearchField label={messages.common.search} placeholder={messages.communities.searchPlaceholder} value={filters.query} onChangeText={(query) => setFilters({ ...filters, query })} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2"><FilterChip label={messages.common.sortCount} selected={filters.sort === "count"} onPress={() => setFilters({ ...filters, sort: "count" })} /><FilterChip label={messages.common.sortRecent} selected={filters.sort === "recent"} onPress={() => setFilters({ ...filters, sort: "recent" })} /><FilterChip label={messages.common.sortName} selected={filters.sort === "name"} onPress={() => setFilters({ ...filters, sort: "name" })} /></ScrollView>{regions.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2"><FilterChip label={messages.common.all} selected={filters.region === "all"} onPress={() => setFilters({ ...filters, country: "all", region: "all" })} />{regions.map((region) => <FilterChip key={region} label={region} selected={filters.region === region} onPress={() => setFilters({ ...filters, country: "all", region })} />)}</ScrollView> : null}{countries.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">{countries.map((country) => <FilterChip key={country} label={country} selected={filters.country === country} onPress={() => setFilters({ ...filters, country: filters.country === country ? "all" : country })} />)}</ScrollView> : null}<Text className="font-body text-label font-semibold text-foreground">{formatCount(visible.length, locale)} {messages.common.results}</Text></View></View>;
  return <SafeAreaView className="flex-1 bg-canvas" edges={["top", "left", "right"]}><FlatList data={visible} keyExtractor={(item) => item.repository} ListHeaderComponent={header} ListEmptyComponent={<CatalogState message={messages.common.noResults} />} refreshControl={<RefreshControl refreshing={catalog.isRefreshing} onRefresh={() => void catalog.refresh()} tintColor={theme.colors["primary-deep"]} />} renderItem={({ item }) => <DirectoryCard title={item.name} subtitle={item.repository} avatarUrl={item.avatarUrl} location={formatLocation([item.region, item.country])} latestActivity={formatDate(item.lastPostedAt, locale)} countLabel={`${formatCount(item.opportunitiesCount, locale)} ${messages.jobs.title.toLocaleLowerCase(locale)}`} actionLabel={messages.communities.open} onPress={() => router.push(buildCommunityRoute(item.repository) as never)} />} ListFooterComponent={<View className="h-5" />} /></SafeAreaView>;
}
