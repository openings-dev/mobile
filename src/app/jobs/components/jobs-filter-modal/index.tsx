import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilterChip } from "@/components/filter-chip";
import { useAppTheme } from "@/contexts/theme";
import type { FoundationMessages } from "@/i18n/types";
import { createDefaultJobFilters } from "@/domain/openings/discovery";
import type { JobFilters, Opportunity } from "@/domain/openings/types";

interface JobsFilterModalProps {
  filters: JobFilters;
  items: Opportunity[];
  messages: FoundationMessages;
  onChange: (filters: JobFilters) => void;
  onClose: () => void;
  open: boolean;
}

function values(items: Opportunity[], select: (item: Opportunity) => (string | undefined)[]): string[] {
  return [...new Set(items.flatMap(select).filter((value): value is string => Boolean(value)))].sort();
}

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

interface SectionProps {
  label: string;
  onToggle: (value: string) => void;
  options: string[];
  selected: string[];
}

function MultiSection({ label, onToggle, options, selected }: SectionProps): React.ReactNode {
  if (options.length === 0) return null;
  return (
    <View className="gap-3 border-b border-line pb-5">
      <Text className="font-display text-card-title font-semibold text-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((value) => (
          <FilterChip key={value} label={value} selected={selected.includes(value)} onPress={() => onToggle(value)} />
        ))}
      </View>
    </View>
  );
}

export function JobsFilterModal({ filters, items, messages, onChange, onClose, open }: JobsFilterModalProps): React.ReactNode {
  const { theme } = useAppTheme();
  const countries = values(items, (item) => [item.jobLocation?.country]);
  const regions = values(items, (item) => [item.jobLocation?.region]);
  const repositories = values(items, (item) => [item.repository]);
  const authors = values(items, (item) => [item.author.handle]);
  const workModels = values(items, (item) => item.taxonomy?.workModels ?? []);
  const areas = values(items, (item) => item.taxonomy?.areas ?? []);
  const technologies = values(items, (item) => item.taxonomy?.technologies ?? []);
  const seniority = values(items, (item) => item.taxonomy?.seniority ?? []);
  const employmentTypes = values(items, (item) => item.taxonomy?.employmentTypes ?? []);
  const languages = values(items, (item) => item.taxonomy?.languages ?? []);

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={open}>
      <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom"]}>
        <View className="min-h-16 flex-row items-center justify-between border-b border-line bg-paper px-5">
          <Text accessibilityRole="header" className="font-display text-card-title font-semibold text-foreground">{messages.common.filters}</Text>
          <Pressable accessibilityLabel={messages.common.close} accessibilityRole="button" className="h-11 w-11 items-center justify-center rounded-control" onPress={onClose}>
            <Feather name="x" size={22} color={theme.colors.foreground} />
          </Pressable>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="gap-5 p-5">
          <MultiSection label={messages.jobs.repositories} options={repositories} selected={filters.repository === "all" ? [] : [filters.repository]} onToggle={(value) => onChange({ ...filters, repository: filters.repository === value ? "all" : value })} />
          <MultiSection label={messages.jobs.regions} options={regions} selected={filters.region === "all" ? [] : [filters.region]} onToggle={(value) => onChange({ ...filters, country: "all", region: filters.region === value ? "all" : value })} />
          <MultiSection label={messages.jobs.countries} options={countries} selected={filters.country === "all" ? [] : [filters.country]} onToggle={(value) => onChange({ ...filters, country: filters.country === value ? "all" : value })} />
          <MultiSection label={messages.jobs.authors} options={authors} selected={filters.authors} onToggle={(value) => onChange({ ...filters, authors: toggle(filters.authors, value) })} />
          <MultiSection label={messages.jobs.workModels} options={workModels} selected={filters.workModels} onToggle={(value) => onChange({ ...filters, workModels: toggle(filters.workModels, value) })} />
          <MultiSection label={messages.jobs.areas} options={areas} selected={filters.areas} onToggle={(value) => onChange({ ...filters, areas: toggle(filters.areas, value) })} />
          <MultiSection label={messages.jobs.technologies} options={technologies} selected={filters.technologies} onToggle={(value) => onChange({ ...filters, technologies: toggle(filters.technologies, value) })} />
          <MultiSection label={messages.jobs.seniority} options={seniority} selected={filters.seniority} onToggle={(value) => onChange({ ...filters, seniority: toggle(filters.seniority, value) })} />
          <MultiSection label={messages.jobs.employmentTypes} options={employmentTypes} selected={filters.employmentTypes} onToggle={(value) => onChange({ ...filters, employmentTypes: toggle(filters.employmentTypes, value) })} />
          <MultiSection label={messages.jobs.languages} options={languages} selected={filters.languages} onToggle={(value) => onChange({ ...filters, languages: toggle(filters.languages, value) })} />
          <View className="gap-3">
            <Text className="font-display text-card-title font-semibold text-foreground">{messages.jobs.freshness}</Text>
            <View className="flex-row flex-wrap gap-2">
              {[7, 30, 90].map((days) => <FilterChip key={days} label={`${days}d`} selected={filters.freshnessDays === days} onPress={() => onChange({ ...filters, freshnessDays: filters.freshnessDays === days ? null : days })} />)}
            </View>
          </View>
        </ScrollView>
        <View className="flex-row gap-3 border-t border-line bg-paper p-5">
          <Pressable accessibilityRole="button" className="min-h-12 flex-1 items-center justify-center rounded-control border border-line" onPress={() => onChange({ ...createDefaultJobFilters(), query: filters.query, sort: filters.sort })}>
            <Text className="font-body text-label font-semibold text-foreground">{messages.common.clear}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" className="min-h-12 flex-[1.5] items-center justify-center rounded-control bg-primary" onPress={onClose}>
            <Text className="font-body text-label font-semibold text-primary-foreground">{messages.common.apply}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
