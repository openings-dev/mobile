import Feather from "@expo/vector-icons/Feather";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SearchField } from "@/components/search-field";
import {
  SelectionSheet,
  type SelectionOption,
} from "@/components/selection-sheet";
import { useAppTheme } from "@/contexts/theme";
import type {
  ActiveJobFilter,
} from "@/app/jobs/helpers/filter-presentation";
import type { JobFilters, Opportunity } from "@/domain/openings/types";
import type { FoundationMessages } from "@/i18n/types";

interface JobsWorkspaceHeaderProps {
  activeFilters: ActiveJobFilter[];
  filters: JobFilters;
  filtersOpen: boolean;
  items: Opportunity[];
  modalFilterCount: number;
  onChange: (filters: JobFilters) => void;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onRemoveFilter: (filter: ActiveJobFilter) => void;
  messages: FoundationMessages;
}

interface QuickSelectorProps {
  label: string;
  onPress: () => void;
  value: string;
}

function QuickSelector({
  label,
  onPress,
  value,
}: QuickSelectorProps): React.ReactNode {
  const { theme } = useAppTheme();

  return (
    <View className="min-w-0 flex-1 gap-2">
      <Text className="font-body text-label font-medium text-foreground">
        {label}
      </Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        className="min-h-12 flex-row items-center justify-between gap-2 rounded-control border border-control bg-paper px-3"
        onPress={onPress}
      >
        <Text
          className="min-w-0 flex-1 font-body text-product-body text-foreground"
          numberOfLines={1}
        >
          {value}
        </Text>
        <Feather
          name="chevron-down"
          size={17}
          color={theme.colors["muted-foreground"]}
        />
      </Pressable>
    </View>
  );
}

function countedOptions(
  items: Opportunity[],
  select: (item: Opportunity) => string[],
): SelectionOption<string>[] {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    new Set(select(item).filter(Boolean)).forEach((value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, count]) => ({ count, label: value, value }));
}

function activeLabel(
  filter: ActiveJobFilter,
  messages: FoundationMessages,
): string {
  const workspace = messages.jobs.workspace;

  switch (filter.kind) {
    case "salary":
      return workspace.withSalary;
    case "saved":
      return workspace.savedJobs;
    case "new":
      return workspace.newSinceVisit;
    case "freshness":
      return workspace.lastDays.replace("{days}", filter.value);
    case "sort":
      return {
        oldest: messages.jobs.oldest,
        salary: messages.jobs.salary,
        updated: messages.jobs.updatedSort,
      }[filter.value] ?? filter.value;
    case "technology-match":
      return messages.jobs.technologies;
    default:
      return filter.value;
  }
}

export function JobsWorkspaceHeader({
  activeFilters,
  filters,
  filtersOpen,
  items,
  messages,
  modalFilterCount,
  onChange,
  onClearFilters,
  onOpenFilters,
  onRemoveFilter,
}: JobsWorkspaceHeaderProps): React.ReactNode {
  const { theme } = useAppTheme();
  const [countryOpen, setCountryOpen] = useState(false);
  const [stackOpen, setStackOpen] = useState(false);
  const countryOptions = useMemo<SelectionOption<string>[]>(() => [
    { label: messages.jobs.workspace.allCountries, value: "all" },
    ...countedOptions(items, (item) =>
      item.jobLocation?.country ? [item.jobLocation.country] : []),
  ], [items, messages.jobs.workspace.allCountries]);
  const technologyOptions = useMemo(
    () => countedOptions(items, (item) => item.taxonomy?.technologies ?? []),
    [items],
  );
  const selectedStackLabel = filters.technologies.length === 0
    ? messages.jobs.technologies
    : filters.technologies.length === 1
      ? filters.technologies[0] ?? messages.jobs.technologies
      : messages.jobs.workspace.stackSelected.replace(
          "{count}",
          String(filters.technologies.length),
        );

  return (
    <View className="gap-4 px-4 pb-5 pt-4">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="font-display text-product-title font-semibold tracking-tight text-foreground"
        >
          {messages.jobs.title}
        </Text>
        <Text className="font-body text-label leading-5 text-muted-foreground">
          {messages.jobs.description}
        </Text>
      </View>
      <SearchField
        label={messages.jobs.workspace.searchLabel}
        onChangeText={(query) => onChange({ ...filters, query })}
        placeholder={messages.jobs.searchPlaceholder}
        value={filters.query}
      />
      <View className="flex-row gap-3">
        <QuickSelector
          label={messages.jobs.workspace.country}
          onPress={() => setCountryOpen(true)}
          value={filters.country === "all"
            ? messages.jobs.workspace.allCountries
            : filters.country}
        />
        <QuickSelector
          label={messages.jobs.workspace.stack}
          onPress={() => setStackOpen(true)}
          value={selectedStackLabel}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: filtersOpen }}
        className="min-h-12 flex-row items-center justify-center gap-2 rounded-control border border-control bg-paper px-4"
        onPress={onOpenFilters}
      >
        <Feather
          name="sliders"
          size={17}
          color={theme.colors.foreground}
        />
        <Text className="font-body text-label font-semibold text-foreground">
          {messages.jobs.workspace.more}
        </Text>
        {modalFilterCount > 0 ? (
          <View className="min-h-6 min-w-6 items-center justify-center rounded-pill bg-primary-soft px-1.5">
            <Text className="font-mono text-metadata font-semibold text-primary-deep">
              {modalFilterCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
      {activeFilters.length > 0 ? (
        <View className="gap-3 border-t border-line pt-4">
          <View className="flex-row flex-wrap gap-2">
            {activeFilters.map((filter) => {
              const label = activeLabel(filter, messages);

              return (
                <Pressable
                  key={filter.id}
                  accessibilityLabel={messages.jobs.workspace.removeFilter.replace(
                    "{filter}",
                    label,
                  )}
                  accessibilityRole="button"
                  className="min-h-11 flex-row items-center gap-2 rounded-pill border border-primary-deep bg-primary-soft px-3"
                  onPress={() => onRemoveFilter(filter)}
                >
                  <Text className="font-body text-label font-medium text-primary-deep">
                    {label}
                  </Text>
                  <Feather
                    name="x"
                    size={15}
                    color={theme.colors["primary-deep"]}
                  />
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            className="min-h-11 self-start justify-center rounded-control border border-control px-3"
            onPress={onClearFilters}
          >
            <Text className="font-body text-label font-medium text-muted-foreground">
              {messages.jobs.workspace.clearFilters}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <SelectionSheet
        applyLabel={messages.common.apply}
        clearLabel={messages.common.clear}
        closeLabel={messages.common.close}
        emptyLabel={messages.jobs.workspace.noOptions}
        mode="single"
        onApply={(values) => {
          onChange({
            ...filters,
            country: values[0] ?? "all",
            region: "all",
          });
        }}
        onClose={() => setCountryOpen(false)}
        options={countryOptions}
        selectedValues={[filters.country]}
        title={messages.jobs.workspace.chooseCountry}
        visible={countryOpen}
      />
      <SelectionSheet
        applyLabel={messages.common.apply}
        clearLabel={messages.common.clear}
        closeLabel={messages.common.close}
        emptyLabel={messages.jobs.workspace.noOptions}
        mode="multiple"
        onApply={(technologies) => onChange({ ...filters, technologies })}
        onClose={() => setStackOpen(false)}
        options={technologyOptions}
        selectedValues={filters.technologies}
        title={messages.jobs.workspace.chooseStack}
        visible={stackOpen}
      />
    </View>
  );
}
