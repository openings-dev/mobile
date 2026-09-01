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
import { deriveAuthors, filterAndSortDirectory } from "@/domain/openings/discovery";
import { formatCount, formatDate, formatLocation } from "@/domain/openings/formatting";
import { buildAuthorRoute } from "@/domain/openings/routing";
import type { DirectoryFilters } from "@/domain/openings/types";
import { isOfflineCatalogError } from "@/services/openings-catalog";

export function AuthorsScreen(): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const { theme } = useAppTheme();
  const catalog = useOpeningsCatalog();
  const [filters, setFilters] = useState<DirectoryFilters>({ country: "all", query: "", region: "all", sort: "count" });
  const authors = useMemo(() => deriveAuthors(catalog.opportunities), [catalog.opportunities]);
  const visible = filterAndSortDirectory(authors, filters, (item) => [item.name, item.handle, `@${item.handle}`], (item) => item.handle);
  const regions = [...new Set(authors.map((item) => item.region).filter((value): value is string => Boolean(value)))].sort();
  const countries = [...new Set(authors.map((item) => item.country).filter((value): value is string => Boolean(value)))].sort();
  const errorMessage = isOfflineCatalogError(catalog.error) ? messages.common.offline : messages.common.sourceError;
  if (catalog.isLoading && authors.length === 0) return <SafeAreaView className="flex-1 bg-canvas"><ScreenHeader title={messages.authors.title} description={messages.authors.description} /><CatalogState pending message={messages.common.loading} /></SafeAreaView>;
  if (catalog.error && authors.length === 0) return <SafeAreaView className="flex-1 bg-canvas"><ScreenHeader title={messages.authors.title} description={messages.authors.description} /><CatalogState message={errorMessage} actionLabel={messages.common.retry} onAction={() => void catalog.refresh()} /></SafeAreaView>;
  const header = <View className="gap-4 pb-4"><ScreenHeader title={messages.authors.title} description={messages.authors.description} /><View className="gap-4 px-5"><SearchField label={messages.common.search} placeholder={messages.authors.searchPlaceholder} value={filters.query} onChangeText={(query) => setFilters({ ...filters, query })} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2"><FilterChip label={messages.common.sortCount} selected={filters.sort === "count"} onPress={() => setFilters({ ...filters, sort: "count" })} /><FilterChip label={messages.common.sortRecent} selected={filters.sort === "recent"} onPress={() => setFilters({ ...filters, sort: "recent" })} /><FilterChip label={messages.common.sortName} selected={filters.sort === "name"} onPress={() => setFilters({ ...filters, sort: "name" })} /></ScrollView>{regions.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2"><FilterChip label={messages.common.all} selected={filters.region === "all"} onPress={() => setFilters({ ...filters, country: "all", region: "all" })} />{regions.map((region) => <FilterChip key={region} label={region} selected={filters.region === region} onPress={() => setFilters({ ...filters, country: "all", region })} />)}</ScrollView> : null}{countries.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">{countries.map((country) => <FilterChip key={country} label={country} selected={filters.country === country} onPress={() => setFilters({ ...filters, country: filters.country === country ? "all" : country })} />)}</ScrollView> : null}<Text className="font-body text-label font-semibold text-foreground">{formatCount(visible.length, locale)} {messages.common.results}</Text></View></View>;
  return <SafeAreaView className="flex-1 bg-canvas" edges={["top", "left", "right"]}><FlatList data={visible} keyExtractor={(item) => item.handle} ListHeaderComponent={header} ListEmptyComponent={<CatalogState message={messages.common.noResults} />} refreshControl={<RefreshControl refreshing={catalog.isRefreshing} onRefresh={() => void catalog.refresh()} tintColor={theme.colors["primary-deep"]} />} renderItem={({ item }) => <DirectoryCard title={item.name} subtitle={`@${item.handle}`} avatarUrl={item.avatarUrl} location={formatLocation([item.region, item.country])} latestActivity={formatDate(item.lastPostedAt, locale)} countLabel={`${formatCount(item.opportunitiesCount, locale)} ${messages.jobs.title.toLocaleLowerCase(locale)}`} actionLabel={messages.authors.open} onPress={() => router.push(buildAuthorRoute(item.handle) as never)} />} ListFooterComponent={<View className="h-5" />} /></SafeAreaView>;
}
