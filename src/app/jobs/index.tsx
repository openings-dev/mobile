import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CatalogState } from "@/components/catalog-state";
import { FilterChip } from "@/components/filter-chip";
import { OpportunityCard } from "@/components/opportunity-card";
import { ScreenHeader } from "@/components/screen-header";
import { SearchField } from "@/components/search-field";
import { useCandidateState } from "@/contexts/candidate-state";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { useAppTheme } from "@/contexts/theme";
import { createDefaultJobFilters, filterAndSortJobs } from "@/domain/openings/discovery";
import { formatCount } from "@/domain/openings/formatting";
import { buildJobRoute } from "@/domain/openings/routing";
import type { JobFilters, JobSort } from "@/domain/openings/types";
import { isOfflineCatalogError } from "@/services/openings-catalog";
import { JobsFilterModal } from "./components/jobs-filter-modal";

const PAGE_SIZE = 20;

export function JobsScreen(): React.ReactNode {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const { theme } = useAppTheme();
  const catalog = useOpeningsCatalog();
  const candidate = useCandidateState();
  const [filters, setFilters] = useState<JobFilters>(createDefaultJobFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = useMemo(
    () => filterAndSortJobs(catalog.opportunities, filters, candidate),
    [candidate, catalog.opportunities, filters],
  );
  const visible = filtered.slice(0, visibleCount);
  const updateFilters = (next: JobFilters) => { setVisibleCount(PAGE_SIZE); setFilters(next); };
  const sortOptions: [JobSort, string][] = [
    ["newest", messages.common.sortRecent],
    ["oldest", messages.jobs.oldest],
    ["updated", messages.jobs.updatedSort],
    ["salary", messages.jobs.salary],
  ];
  const errorMessage = isOfflineCatalogError(catalog.error)
    ? messages.common.offline
    : messages.common.sourceError;
  const header = (
    <View className="pb-3">
      <ScreenHeader title={messages.jobs.title} description={messages.jobs.description} />
      <View className="gap-4 px-5 pb-4">
        <SearchField label={messages.common.search} placeholder={messages.jobs.searchPlaceholder} value={filters.query} onChangeText={(query) => updateFilters({ ...filters, query })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <FilterChip label={messages.common.filters} selected={filterOpen} onPress={() => setFilterOpen(true)} />
          <FilterChip label={messages.jobs.savedOnly} selected={filters.savedOnly} onPress={() => updateFilters({ ...filters, savedOnly: !filters.savedOnly })} />
          <FilterChip label={messages.jobs.salaryOnly} selected={filters.salaryOnly} onPress={() => updateFilters({ ...filters, salaryOnly: !filters.salaryOnly })} />
          <FilterChip label={messages.jobs.newOnly} selected={filters.newOnly} onPress={() => updateFilters({ ...filters, newOnly: !filters.newOnly })} />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {sortOptions.map(([value, label]) => <FilterChip key={value} label={label} selected={filters.sort === value} onPress={() => updateFilters({ ...filters, sort: value })} />)}
        </ScrollView>
        <View className="flex-row items-center justify-between">
          <Text className="font-body text-label font-semibold text-foreground">{formatCount(filtered.length, locale)} {messages.common.results}</Text>
          {catalog.isIncremental ? <View className="flex-row items-center gap-2"><Feather name="loader" size={14} color={theme.colors["primary-deep"]} /><Text className="font-body text-metadata text-primary-deep">{catalog.loadedPages}/{catalog.totalPages}</Text></View> : null}
        </View>
      </View>
    </View>
  );

  if (catalog.isLoading && catalog.opportunities.length === 0) {
    return <SafeAreaView className="flex-1 bg-canvas"><ScreenHeader title={messages.jobs.title} description={messages.jobs.description} /><CatalogState pending message={messages.common.loading} /></SafeAreaView>;
  }
  if (catalog.error && catalog.opportunities.length === 0) {
    return <SafeAreaView className="flex-1 bg-canvas"><ScreenHeader title={messages.jobs.title} description={messages.jobs.description} /><CatalogState message={errorMessage} actionLabel={messages.common.retry} onAction={() => void catalog.refresh()} /></SafeAreaView>;
  }
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "left", "right"]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={<CatalogState message={messages.common.noResults} actionLabel={messages.common.clear} onAction={() => updateFilters(createDefaultJobFilters())} />}
        ListFooterComponent={visibleCount < filtered.length ? <Pressable accessibilityRole="button" className="mx-5 min-h-12 items-center justify-center rounded-control border border-line bg-paper" onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}><Text className="font-body text-label font-semibold text-primary-deep">{messages.common.loadMore}</Text></Pressable> : <View className="h-5" />}
        refreshControl={<RefreshControl refreshing={catalog.isRefreshing} onRefresh={() => void catalog.refresh()} tintColor={theme.colors["primary-deep"]} />}
        renderItem={({ item }) => {
          const isNew = Boolean(candidate.previousVisitAt && !candidate.viewedIds.has(item.id) && Date.parse(item.createdAt) > Date.parse(candidate.previousVisitAt));
          return <OpportunityCard item={item} locale={locale} isSaved={candidate.isSaved(item.id)} isNew={isNew} newLabel={messages.jobs.newBadge} saveLabel={messages.jobs.save} unsaveLabel={messages.jobs.unsave} viewDetailsLabel={messages.jobs.viewDetails} onToggleSaved={() => candidate.toggleSaved(item.id)} onPress={() => router.push(buildJobRoute(item.id) as never)} />;
        }}
      />
      <JobsFilterModal open={filterOpen} filters={filters} items={catalog.opportunities} messages={messages} onChange={updateFilters} onClose={() => setFilterOpen(false)} />
    </SafeAreaView>
  );
}
