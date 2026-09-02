import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CatalogState } from "@/components/catalog-state";
import { OpportunityCard } from "@/components/opportunity-card";
import { useCandidateState } from "@/contexts/candidate-state";
import { useLocale } from "@/contexts/locale";
import { useOpeningsCatalog } from "@/contexts/openings-catalog";
import { useAppTheme } from "@/contexts/theme";
import { createDefaultJobFilters, filterAndSortJobs } from "@/domain/openings/discovery";
import {
  buildAuthorRoute,
  buildCommunityRoute,
  buildJobRoute,
} from "@/domain/openings/routing";
import type { JobFilters } from "@/domain/openings/types";
import { isOfflineCatalogError } from "@/services/openings-catalog";
import { JobsFilterModal } from "./components/jobs-filter-modal";
import { JobsResultToolbar } from "./components/jobs-result-toolbar";
import { JobsWorkspaceHeader } from "./components/jobs-workspace-header";
import {
  countModalFilters,
  getActiveJobFilters,
  removeActiveJobFilter,
} from "./helpers/filter-presentation";

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
  const activeFilters = useMemo(() => getActiveJobFilters(filters), [filters]);
  const errorMessage = isOfflineCatalogError(catalog.error)
    ? messages.common.offline
    : messages.common.sourceError;
  const header = (
    <View className="pb-4">
      <JobsWorkspaceHeader
        activeFilters={activeFilters}
        filters={filters}
        filtersOpen={filterOpen}
        items={catalog.opportunities}
        messages={messages}
        modalFilterCount={countModalFilters(filters)}
        onChange={updateFilters}
        onClearFilters={() => updateFilters(createDefaultJobFilters())}
        onOpenFilters={() => setFilterOpen(true)}
        onRemoveFilter={(filter) => updateFilters(removeActiveJobFilter(filters, filter))}
      />
      <JobsResultToolbar
        filters={filters}
        generatedAt={catalog.generatedAt}
        isIncremental={catalog.isIncremental}
        loadedPages={catalog.loadedPages}
        locale={locale}
        messages={messages}
        onChange={updateFilters}
        resultCount={filtered.length}
        totalPages={catalog.totalPages}
        visibleCount={visible.length}
      />
    </View>
  );
  const emptyState = catalog.isLoading && catalog.opportunities.length === 0
    ? <CatalogState pending message={messages.common.loading} />
    : catalog.error && catalog.opportunities.length === 0
      ? <CatalogState message={errorMessage} actionLabel={messages.common.retry} onAction={() => void catalog.refresh()} />
      : <CatalogState message={messages.common.noResults} actionLabel={messages.common.clear} onAction={() => updateFilters(createDefaultJobFilters())} />;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["left", "right"]}>
      <FlatList
        data={visible}
        initialNumToRender={8}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        ListFooterComponent={visibleCount < filtered.length ? <Pressable accessibilityRole="button" className="mx-4 min-h-12 items-center justify-center rounded-control border border-line bg-paper" onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}><Text className="font-body text-label font-semibold text-primary-deep">{messages.common.loadMore}</Text></Pressable> : <View className="h-5" />}
        maxToRenderPerBatch={8}
        refreshControl={<RefreshControl refreshing={catalog.isRefreshing} onRefresh={() => void catalog.refresh()} tintColor={theme.colors["primary-deep"]} />}
        renderItem={({ item }) => {
          const isNew = Boolean(candidate.previousVisitAt && !candidate.viewedIds.has(item.id) && Date.parse(item.createdAt) > Date.parse(candidate.previousVisitAt));
          return <OpportunityCard item={item} isSaved={candidate.isSaved(item.id)} isNew={isNew} onAuthorPress={() => router.push(buildAuthorRoute(item.author.handle) as never)} onCommunityPress={() => router.push(buildCommunityRoute(item.repository) as never)} onToggleSaved={() => candidate.toggleSaved(item.id)} onPress={() => router.push(buildJobRoute(item.id) as never)} />;
        }}
        windowSize={7}
      />
      <JobsFilterModal open={filterOpen} filters={filters} items={catalog.opportunities} messages={messages} onChange={updateFilters} onClose={() => setFilterOpen(false)} resultCount={filtered.length} />
    </SafeAreaView>
  );
}
