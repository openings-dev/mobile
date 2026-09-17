import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CatalogState } from "@/components/catalog-state";
import { NewMatchesCard } from "@/components/new-matches-card";
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
import type { TelemetryFilterDimension } from "@/services/telemetry/contracts";
import { isOfflineCatalogError } from "@/services/openings-catalog";
import { trackProductEvent } from "@/services/telemetry/product-events";
import { JobsFilterModal } from "./components/jobs-filter-modal";
import { JobsResultToolbar } from "./components/jobs-result-toolbar";
import { JobsWorkspaceHeader } from "./components/jobs-workspace-header";
import {
  countModalFilters,
  getActiveJobFilters,
  removeActiveJobFilter,
} from "./helpers/filter-presentation";

const PAGE_SIZE = 20;

function lengthBucket(length: number): "1-3" | "4-10" | "11-30" | "31+" {
  if (length <= 3) return "1-3";
  if (length <= 10) return "4-10";
  if (length <= 30) return "11-30";
  return "31+";
}

function resultBucket(count: number): "0" | "1-10" | "11-50" | "51+" {
  if (count === 0) return "0";
  if (count <= 10) return "1-10";
  if (count <= 50) return "11-50";
  return "51+";
}

function changedFilter(
  previous: JobFilters,
  next: JobFilters,
): { dimension: TelemetryFilterDimension; value: string } | null {
  const scalar: readonly [keyof JobFilters, TelemetryFilterDimension][] = [
    ["country", "country"], ["region", "region"], ["repository", "community"],
    ["freshnessDays", "freshness"], ["salaryOnly", "salary"],
  ];
  for (const [key, dimension] of scalar) {
    if (previous[key] !== next[key]) return { dimension, value: String(next[key] ?? "all") };
  }
  const lists: readonly [keyof JobFilters, TelemetryFilterDimension][] = [
    ["areas", "area"], ["workModels", "work-model"], ["seniority", "seniority"],
    ["technologies", "technology"], ["employmentTypes", "employment-type"],
  ];
  for (const [key, dimension] of lists) {
    const before = previous[key] as string[];
    const after = next[key] as string[];
    if (before.join("|") !== after.join("|")) {
      return { dimension, value: after.find((value) => !before.includes(value)) ?? "none" };
    }
  }
  return null;
}

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
  const newMatchCount = useMemo(
    () => filterAndSortJobs(
      catalog.opportunities,
      { ...filters, newOnly: true },
      candidate,
    ).length,
    [candidate, catalog.opportunities, filters],
  );
  const dismissalPredatesVisit = Boolean(
    !candidate.newMatchesDismissedAt ||
      (candidate.previousVisitAt &&
        Date.parse(candidate.newMatchesDismissedAt) <
          Date.parse(candidate.previousVisitAt)),
  );
  const showNewMatches =
    !filters.newOnly && newMatchCount > 0 && dismissalPredatesVisit;
  const updateFilters = (next: JobFilters) => {
    const change = changedFilter(filters, next);
    if (change) trackProductEvent("Filter Applied", { ...change, locale });
    setVisibleCount(PAGE_SIZE);
    setFilters(next);
  };
  const activeFilters = useMemo(() => getActiveJobFilters(filters), [filters]);
  const errorMessage = isOfflineCatalogError(catalog.error)
    ? messages.common.offline
    : messages.common.sourceError;
  const header = (
    <View className="pb-16">
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
        onSubmitSearch={() => trackProductEvent("Search Submitted", {
          activeFilterCount: activeFilters.length,
          locale,
          queryLength: lengthBucket(filters.query.length),
          resultCount: resultBucket(filtered.length),
        })}
      />
      {showNewMatches ? (
        <NewMatchesCard
          copy={messages.jobs.newMatches}
          onDismiss={candidate.dismissNewMatches}
          onShow={() => updateFilters({ ...filters, newOnly: true })}
        />
      ) : null}
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
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={["left", "right", "bottom"]}
      testID="jobs-screen"
    >
      <FlatList
        data={visible}
        initialNumToRender={8}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        ListFooterComponent={visibleCount < filtered.length ? <Pressable accessibilityRole="button" className="mx-16 min-h-12 items-center justify-center rounded-control border border-line bg-paper" onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}><Text className="font-body text-label font-semibold text-primary-deep">{messages.common.loadMore}</Text></Pressable> : <View className="h-5" />}
        maxToRenderPerBatch={8}
        refreshControl={<RefreshControl refreshing={catalog.isRefreshing} onRefresh={() => void catalog.refresh()} tintColor={theme.colors["primary-deep"]} />}
        renderItem={({ item }) => {
          const isNew = Boolean(candidate.previousVisitAt && !candidate.viewedIds.has(item.id) && Date.parse(item.createdAt) > Date.parse(candidate.previousVisitAt));
          return <OpportunityCard item={item} isSaved={candidate.isSaved(item.id)} isNew={isNew} onAuthorPress={() => router.push(buildAuthorRoute(item.author.handle) as never)} onCommunityPress={() => router.push(buildCommunityRoute(item.repository) as never)} onToggleSaved={() => candidate.toggleSaved(item.id)} onPress={() => router.push(buildJobRoute(item.id) as never)} />;
        }}
        windowSize={7}
      />
      <JobsFilterModal open={filterOpen} filters={filters} items={catalog.opportunities} messages={messages} onChange={updateFilters} onClose={() => setFilterOpen(false)} onShortcut={(shortcut) => trackProductEvent("Discovery Shortcut Opened", { locale, shortcut })} resultCount={filtered.length} />
    </SafeAreaView>
  );
}
