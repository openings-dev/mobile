import { Bookmark, Clock3, Sparkles, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  countModalFilters,
  toggleDiscoveryShortcut,
  type DiscoveryShortcut,
} from "@/app/jobs/helpers/filter-presentation";
import { FilterChip } from "@/components/filter-chip";
import { useAppTheme } from "@/contexts/theme";
import { createDefaultJobFilters } from "@/domain/openings/discovery";
import type { JobFilters, Opportunity } from "@/domain/openings/types";
import type { FoundationMessages } from "@/i18n/types";

interface JobsFilterModalProps {
  filters: JobFilters;
  items: Opportunity[];
  messages: FoundationMessages;
  onChange: (filters: JobFilters) => void;
  onClose: () => void;
  open: boolean;
  resultCount: number;
}

function values(
  items: Opportunity[],
  select: (item: Opportunity) => (string | undefined)[],
): string[] {
  return [...new Set(
    items.flatMap(select).filter((value): value is string => Boolean(value)),
  )].sort();
}

function toggle(selected: string[], value: string): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

interface SectionProps {
  label: string;
  onToggle: (value: string) => void;
  options: string[];
  selected: string[];
}

function MultiSection({
  label,
  onToggle,
  options,
  selected,
}: SectionProps): React.ReactNode {
  if (options.length === 0) return null;

  return (
    <View className="gap-3 rounded-card border border-line bg-paper p-4">
      <Text className="font-display text-card-title font-semibold text-foreground">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((value) => (
          <FilterChip
            key={value}
            label={value}
            onPress={() => onToggle(value)}
            selected={selected.includes(value)}
          />
        ))}
      </View>
    </View>
  );
}

function shortcutSelected(
  filters: JobFilters,
  shortcut: DiscoveryShortcut,
): boolean {
  switch (shortcut) {
    case "remote":
      return filters.workModels.includes("remote");
    case "internship":
      return filters.seniority.includes("internship");
    case "react":
      return filters.technologies.includes("react");
    case "data-ai":
      return filters.areas.includes("data-ai");
    case "devops":
      return filters.areas.includes("devops-sre");
    case "salary":
      return filters.salaryOnly;
    case "saved":
      return filters.savedOnly;
    case "new":
      return filters.newOnly;
    case "freshness-7":
      return filters.freshnessDays === 7;
    case "freshness-30":
      return filters.freshnessDays === 30;
    case "freshness-90":
      return filters.freshnessDays === 90;
  }
}

export function JobsFilterModal({
  filters,
  items,
  messages,
  onChange,
  onClose,
  open,
  resultCount,
}: JobsFilterModalProps): React.ReactNode {
  const { theme } = useAppTheme();
  const workspace = messages.jobs.workspace;
  const countries = values(items, (item) => [item.jobLocation?.country]);
  const regions = values(items, (item) => [item.jobLocation?.region]);
  const repositories = values(items, (item) => [item.repository]);
  const authors = values(items, (item) => [item.author.handle]);
  const workModels = values(items, (item) => item.taxonomy?.workModels ?? []);
  const areas = values(items, (item) => item.taxonomy?.areas ?? []);
  const technologies = values(items, (item) => item.taxonomy?.technologies ?? []);
  const seniority = values(items, (item) => item.taxonomy?.seniority ?? []);
  const employmentTypes = values(
    items,
    (item) => item.taxonomy?.employmentTypes ?? [],
  );
  const languages = values(items, (item) => item.taxonomy?.languages ?? []);
  const shortcuts: readonly [DiscoveryShortcut, string][] = [
    ["remote", workspace.remote],
    ["internship", workspace.internships],
    ["react", "React"],
    ["data-ai", workspace.dataAi],
    ["devops", workspace.devops],
    ["salary", workspace.withSalary],
    ["freshness-7", workspace.lastDays.replace("{days}", "7")],
    ["freshness-30", workspace.lastDays.replace("{days}", "30")],
    ["freshness-90", workspace.lastDays.replace("{days}", "90")],
    ["saved", workspace.savedJobs],
    ["new", workspace.newSinceVisit],
  ];
  const selectedCount = countModalFilters(filters);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={open}
    >
      <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom"]}>
        <View className="min-h-16 flex-row items-center justify-between border-b border-line bg-paper px-4 py-3">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-mono text-metadata font-semibold uppercase tracking-widest text-primary-deep">
              {messages.jobs.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text
                accessibilityRole="header"
                className="font-display text-product-title font-semibold text-foreground"
              >
                {messages.common.filters}
              </Text>
              {selectedCount > 0 ? (
                <View className="min-h-6 min-w-6 items-center justify-center rounded-pill bg-primary-soft px-1.5">
                  <Text className="font-mono text-metadata font-semibold text-primary-deep">
                    {selectedCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Pressable
            accessibilityLabel={messages.common.close}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-control border border-line"
            onPress={onClose}
          >
            <X accessibilityElementsHidden size={20} strokeWidth={1.8} color={theme.colors.foreground} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 p-5"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-3 rounded-card border border-primary-deep bg-primary-soft p-4">
            <View className="flex-row items-center gap-2">
              <Sparkles
                accessibilityElementsHidden
                size={16}
                strokeWidth={1.8}
                color={theme.colors["primary-deep"]}
              />
              <Text className="font-display text-card-title font-semibold text-foreground">
                {workspace.discover}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {shortcuts.map(([shortcut, label]) => (
                <FilterChip
                  icon={shortcut.startsWith("freshness-") ? (
                    <Clock3
                      accessibilityElementsHidden
                      color={shortcutSelected(filters, shortcut) ? theme.colors["primary-foreground"] : theme.colors["muted-foreground"]}
                      size={15}
                      strokeWidth={1.8}
                    />
                  ) : shortcut === "saved" ? (
                    <Bookmark
                      accessibilityElementsHidden
                      color={shortcutSelected(filters, shortcut) ? theme.colors["primary-foreground"] : theme.colors["muted-foreground"]}
                      size={15}
                      strokeWidth={1.8}
                    />
                  ) : undefined}
                  key={shortcut}
                  label={label}
                  onPress={() => onChange(
                    toggleDiscoveryShortcut(filters, shortcut),
                  )}
                  selected={shortcutSelected(filters, shortcut)}
                />
              ))}
            </View>
          </View>

          <MultiSection
            label={messages.jobs.repositories}
            onToggle={(value) => onChange({
              ...filters,
              repository: filters.repository === value ? "all" : value,
            })}
            options={repositories}
            selected={filters.repository === "all" ? [] : [filters.repository]}
          />
          <MultiSection
            label={messages.jobs.regions}
            onToggle={(value) => onChange({
              ...filters,
              country: "all",
              region: filters.region === value ? "all" : value,
            })}
            options={regions}
            selected={filters.region === "all" ? [] : [filters.region]}
          />
          <MultiSection
            label={messages.jobs.countries}
            onToggle={(value) => onChange({
              ...filters,
              country: filters.country === value ? "all" : value,
            })}
            options={countries}
            selected={filters.country === "all" ? [] : [filters.country]}
          />
          <MultiSection
            label={messages.jobs.authors}
            onToggle={(value) => onChange({
              ...filters,
              authors: toggle(filters.authors, value),
            })}
            options={authors}
            selected={filters.authors}
          />
          <MultiSection
            label={messages.jobs.workModels}
            onToggle={(value) => onChange({
              ...filters,
              workModels: toggle(filters.workModels, value),
            })}
            options={workModels}
            selected={filters.workModels}
          />
          <MultiSection
            label={messages.jobs.areas}
            onToggle={(value) => onChange({
              ...filters,
              areas: toggle(filters.areas, value),
            })}
            options={areas}
            selected={filters.areas}
          />
          <MultiSection
            label={messages.jobs.technologies}
            onToggle={(value) => onChange({
              ...filters,
              technologies: toggle(filters.technologies, value),
            })}
            options={technologies}
            selected={filters.technologies}
          />
          <MultiSection
            label={messages.jobs.seniority}
            onToggle={(value) => onChange({
              ...filters,
              seniority: toggle(filters.seniority, value),
            })}
            options={seniority}
            selected={filters.seniority}
          />
          <MultiSection
            label={messages.jobs.employmentTypes}
            onToggle={(value) => onChange({
              ...filters,
              employmentTypes: toggle(filters.employmentTypes, value),
            })}
            options={employmentTypes}
            selected={filters.employmentTypes}
          />
          <MultiSection
            label={messages.jobs.languages}
            onToggle={(value) => onChange({
              ...filters,
              languages: toggle(filters.languages, value),
            })}
            options={languages}
            selected={filters.languages}
          />
        </ScrollView>

        <View className="flex-row gap-3 border-t border-line bg-paper p-5">
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-1 items-center justify-center rounded-control border border-control"
            onPress={() => onChange({
              ...createDefaultJobFilters(),
              query: filters.query,
              sort: filters.sort,
            })}
          >
            <Text className="font-body text-label font-semibold text-foreground">
              {workspace.clearFilters}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-[1.5] items-center justify-center rounded-pill bg-primary px-3"
            onPress={onClose}
          >
            <Text className="font-body text-label font-semibold text-primary-foreground">
              {messages.common.apply} · {resultCount}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
