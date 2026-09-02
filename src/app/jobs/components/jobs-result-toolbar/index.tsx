import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";

import {
  SelectionSheet,
  type SelectionOption,
} from "@/components/selection-sheet";
import { useAppTheme } from "@/contexts/theme";
import { buildWebDiscoveryUrl } from "@/app/jobs/helpers/share-search";
import { formatCount, formatDate } from "@/domain/openings/formatting";
import type { JobFilters, JobSort } from "@/domain/openings/types";
import type { FoundationMessages } from "@/i18n/types";

interface JobsResultToolbarProps {
  filters: JobFilters;
  generatedAt: string | null;
  isIncremental: boolean;
  loadedPages: number;
  locale: string;
  messages: FoundationMessages;
  onChange: (filters: JobFilters) => void;
  resultCount: number;
  totalPages: number;
}

function updatedLabel(
  generatedAt: string | null,
  locale: string,
  messages: FoundationMessages,
): string | null {
  if (!generatedAt || Number.isNaN(Date.parse(generatedAt))) return null;
  const elapsedHours = Math.floor((Date.now() - Date.parse(generatedAt)) / 3_600_000);

  if (elapsedHours >= 0 && elapsedHours < 24) {
    return messages.jobs.workspace.updatedHours.replace(
      "{count}",
      String(elapsedHours),
    );
  }

  const date = formatDate(generatedAt, locale);
  return date
    ? messages.jobs.workspace.updatedAt.replace("{date}", date)
    : null;
}

export function JobsResultToolbar({
  filters,
  generatedAt,
  isIncremental,
  loadedPages,
  locale,
  messages,
  onChange,
  resultCount,
  totalPages,
}: JobsResultToolbarProps): React.ReactNode {
  const { theme } = useAppTheme();
  const [sortOpen, setSortOpen] = useState(false);
  const sortOptions: readonly SelectionOption<JobSort>[] = [
    { label: messages.common.sortRecent, value: "newest" },
    { label: messages.jobs.oldest, value: "oldest" },
    { label: messages.jobs.updatedSort, value: "updated" },
    { label: messages.jobs.salary, value: "salary" },
  ];
  const selectedSort = sortOptions.find(({ value }) => value === filters.sort)
    ?? sortOptions[0];
  const recency = updatedLabel(generatedAt, locale, messages);

  return (
    <View className="gap-3 border-y border-line px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="gap-1">
          <Text className="font-mono text-label font-semibold text-foreground">
            {formatCount(resultCount, locale)} {messages.common.results}
          </Text>
          {recency ? (
            <View className="flex-row items-center gap-1.5">
              <Feather
                name="clock"
                size={14}
                color={theme.colors["muted-foreground"]}
              />
              <Text className="font-body text-metadata text-muted-foreground">
                {recency}
              </Text>
            </View>
          ) : null}
        </View>
        {isIncremental ? (
          <Text className="font-mono text-metadata text-primary-deep">
            {loadedPages}/{totalPages}
          </Text>
        ) : null}
      </View>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-control border border-control bg-paper px-3"
          onPress={() => {
            void Share.share({ message: buildWebDiscoveryUrl(filters) });
          }}
        >
          <Feather
            name="share-2"
            size={17}
            color={theme.colors.foreground}
          />
          <Text className="font-body text-label font-semibold text-foreground">
            {messages.jobs.workspace.shareSearch}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={messages.jobs.workspace.chooseSort}
          accessibilityRole="button"
          className="min-h-12 min-w-36 flex-row items-center justify-between gap-2 rounded-control border border-control bg-paper px-3"
          onPress={() => setSortOpen(true)}
        >
          <Text className="font-body text-label font-medium text-foreground">
            {selectedSort?.label}
          </Text>
          <Feather
            name="chevron-down"
            size={17}
            color={theme.colors["muted-foreground"]}
          />
        </Pressable>
      </View>
      <SelectionSheet
        applyLabel={messages.common.apply}
        clearLabel={messages.common.clear}
        closeLabel={messages.common.close}
        emptyLabel={messages.jobs.workspace.noOptions}
        mode="single"
        onApply={(values) => onChange({ ...filters, sort: values[0] ?? "newest" })}
        onClose={() => setSortOpen(false)}
        options={sortOptions}
        selectedValues={[filters.sort]}
        title={messages.jobs.workspace.chooseSort}
        visible={sortOpen}
      />
    </View>
  );
}
