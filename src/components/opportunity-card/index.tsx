import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

import { EntityAvatar } from "@/components/entity-avatar";
import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";
import { formatDate, formatSalary } from "@/domain/openings/formatting";
import {
  buildOpportunityCardPresentation,
  formatOpportunityTag,
  plainTextExcerpt,
  type OpportunityCardTagCategory,
} from "@/domain/openings/presentation";
import type { Opportunity } from "@/domain/openings/types";

interface OpportunityCardProps {
  hideAuthorIdentity?: boolean;
  hideCommunityIdentity?: boolean;
  isNew?: boolean;
  isSaved: boolean;
  item: Opportunity;
  locale?: string;
  newLabel?: string;
  onAuthorPress?: () => void;
  onCommunityPress?: () => void;
  onPress: () => void;
  onToggleSaved: () => void;
  saveLabel?: string;
  unsaveLabel?: string;
  viewDetailsLabel?: string;
}

function tagClasses(category: OpportunityCardTagCategory): string {
  switch (category) {
    case "seniority":
      return "rounded-pill bg-primary-soft px-3 py-1";
    case "technology":
      return "rounded-pill bg-info px-3 py-1";
    case "neutral":
      return "rounded-pill bg-surface-muted px-3 py-1";
  }
}

function tagTextClasses(category: OpportunityCardTagCategory): string {
  switch (category) {
    case "seniority":
      return "font-body text-metadata font-medium text-primary-deep";
    case "technology":
      return "font-body text-metadata font-medium text-info-foreground";
    case "neutral":
      return "font-body text-metadata text-muted-foreground";
  }
}

export function OpportunityCard({ item, ...props }: OpportunityCardProps): React.ReactNode {
  const { locale, messages } = useLocale();
  const { theme } = useAppTheme();
  const salary = formatSalary(item.salary, locale);
  const date = formatDate(item.createdAt, locale);
  const location = item.jobLocation?.displayText;
  const excerpt = plainTextExcerpt(item.excerpt || item.description);
  const presentation = buildOpportunityCardPresentation(item);
  const communityName = item.community.name || item.repository;
  const sourceLabel = messages.jobs.sourcesCount.replace(
    "{count}",
    presentation.sourceCount.toLocaleString(locale),
  );
  const moreTagsLabel = messages.jobs.moreTags.replace(
    "{count}",
    presentation.overflowCount.toLocaleString(locale),
  );

  return (
    <Pressable
      accessibilityLabel={`${messages.jobs.viewDetails}: ${item.title}`}
      accessibilityRole="button"
      className="relative mx-4 mb-3 gap-3 overflow-hidden rounded-card border border-line bg-surface p-4 active:bg-surface-elevated"
      onPress={props.onPress}
    >
      <Pressable
        accessibilityLabel={props.isSaved ? messages.jobs.unsave : messages.jobs.save}
        accessibilityRole="button"
        accessibilityState={{ selected: props.isSaved }}
        className="absolute right-1 top-1 z-10 h-11 w-11 items-center justify-center rounded-control"
        hitSlop={4}
        onPress={(event) => {
          event.stopPropagation();
          props.onToggleSaved();
        }}
      >
        <Feather
          name="bookmark"
          size={20}
          color={props.isSaved
            ? theme.colors["primary-deep"]
            : theme.colors["muted-foreground"]}
        />
      </Pressable>

      <View className="min-h-8 flex-row items-center gap-3 pr-12">
        {!props.hideCommunityIdentity ? (
          props.onCommunityPress ? (
            <Pressable
              accessibilityLabel={messages.jobs.showCommunityJobs.replace(
                "{name}",
                communityName,
              )}
              accessibilityRole="button"
              className="min-h-11 min-w-0 flex-row items-center gap-2 rounded-control px-1"
              onPress={(event) => {
                event.stopPropagation();
                props.onCommunityPress?.();
              }}
            >
              <EntityAvatar
                name={communityName}
                size="small"
                uri={item.community.avatarUrl}
              />
              <Text
                className="min-w-0 flex-1 font-body text-metadata font-semibold text-primary-deep"
                numberOfLines={1}
              >
                {communityName}
              </Text>
            </Pressable>
          ) : (
            <View className="min-h-8 min-w-0 flex-row items-center gap-2">
              <EntityAvatar
                name={communityName}
                size="small"
                uri={item.community.avatarUrl}
              />
              <Text
                className="min-w-0 flex-1 font-body text-metadata font-semibold text-primary-deep"
                numberOfLines={1}
              >
                {communityName}
              </Text>
            </View>
          )
        ) : null}
        {item.companyName ? (
          <View className="min-w-0 flex-row items-center gap-1.5">
            <Feather
              name="briefcase"
              size={14}
              color={theme.colors["muted-foreground"]}
            />
            <Text
              className="min-w-0 flex-1 font-body text-metadata text-muted-foreground"
              numberOfLines={1}
            >
              {item.companyName}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-1.5">
        {props.isNew ? (
          <View className="rounded-pill bg-positive px-3 py-1">
            <Text className="font-body text-metadata font-semibold text-positive-foreground">
              {messages.jobs.newBadge}
            </Text>
          </View>
        ) : null}
        {item.freshness?.status === "stale" ? (
          <View className="rounded-pill bg-surface-muted px-3 py-1">
            <Text className="font-body text-metadata font-medium text-muted-foreground">
              {messages.jobs.olderBadge}
            </Text>
          </View>
        ) : null}
        {presentation.sourceCount > 1 ? (
          <View className="rounded-pill bg-info px-3 py-1">
            <Text className="font-body text-metadata font-medium text-info-foreground">
              {sourceLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-2">
        <Text
          className="font-display text-card-title font-semibold tracking-tight text-foreground"
          numberOfLines={4}
        >
          {item.title}
        </Text>
        {excerpt ? (
          <Text
            className="font-body text-product-body text-muted-foreground"
            numberOfLines={3}
          >
            {excerpt}
          </Text>
        ) : null}
      </View>

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
        {salary ? (
          <View className="flex-row items-center gap-1.5">
            <Feather
              name="credit-card"
              size={16}
              color={theme.colors["positive-foreground"]}
            />
            <Text className="font-body text-label font-semibold text-foreground">
              {salary}
            </Text>
          </View>
        ) : null}
        {presentation.workModel ? (
          <View className="rounded-pill bg-positive px-3 py-1">
            <Text className="font-body text-metadata font-medium text-positive-foreground">
              {formatOpportunityTag(presentation.workModel, locale)}
            </Text>
          </View>
        ) : null}
        {location ? (
          <View className="min-w-0 flex-row items-center gap-1.5">
            <Feather
              name="map-pin"
              size={16}
              color={theme.colors["muted-foreground"]}
            />
            <Text
              className="min-w-0 flex-1 font-body text-label text-muted-foreground"
              numberOfLines={2}
            >
              {location}
            </Text>
          </View>
        ) : null}
      </View>

      {presentation.supportingTags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {presentation.supportingTags.map((tag) => (
            <View className={tagClasses(tag.category)} key={`${tag.category}-${tag.value}`}>
              <Text className={tagTextClasses(tag.category)}>
                {formatOpportunityTag(tag.value, locale)}
              </Text>
            </View>
          ))}
          {presentation.overflowCount > 0 ? (
            <View
              accessible
              accessibilityLabel={moreTagsLabel}
              className="rounded-pill bg-surface-muted px-3 py-1"
            >
              <Text className="font-body text-metadata font-medium text-muted-foreground">
                +{presentation.overflowCount.toLocaleString(locale)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          {!props.hideAuthorIdentity ? (
            props.onAuthorPress ? (
              <Pressable
                accessibilityLabel={messages.jobs.showAuthorJobs.replace(
                  "{handle}",
                  item.author.handle,
                )}
                accessibilityRole="button"
                className="-my-2 min-h-11 min-w-0 flex-row items-center gap-2 rounded-control px-1"
                onPress={(event) => {
                  event.stopPropagation();
                  props.onAuthorPress?.();
                }}
              >
                <EntityAvatar
                  name={item.author.name || item.author.handle}
                  size="small"
                  uri={item.author.avatarUrl}
                />
                <Text
                  className="font-body text-metadata font-medium text-muted-foreground"
                  numberOfLines={1}
                >
                  @{item.author.handle}
                </Text>
              </Pressable>
            ) : (
              <View className="min-w-0 flex-row items-center gap-2">
                <EntityAvatar
                  name={item.author.name || item.author.handle}
                  size="small"
                  uri={item.author.avatarUrl}
                />
                <Text
                  className="font-body text-metadata font-medium text-muted-foreground"
                  numberOfLines={1}
                >
                  @{item.author.handle}
                </Text>
              </View>
            )
          ) : null}
          {date ? (
            <View className="flex-row items-center gap-1.5">
              <Feather
                name="calendar"
                size={14}
                color={theme.colors["muted-foreground"]}
              />
              <Text className="font-body text-metadata text-muted-foreground">
                {date}
              </Text>
            </View>
          ) : null}
          {!props.hideCommunityIdentity ? (
            <View className="min-w-0 flex-row items-center gap-1.5">
              <Feather
                name="git-branch"
                size={14}
                color={theme.colors["muted-foreground"]}
              />
              <Text
                className="min-w-0 flex-1 font-body text-metadata text-muted-foreground"
                numberOfLines={1}
              >
                {item.repository}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="font-body text-metadata font-semibold text-primary-deep">
            {messages.jobs.viewDetails}
          </Text>
          <Feather
            name="arrow-up-right"
            size={14}
            color={theme.colors["primary-deep"]}
          />
        </View>
      </View>
    </Pressable>
  );
}
