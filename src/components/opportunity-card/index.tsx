import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";
import type { Opportunity } from "@/domain/openings/types";
import { formatDate, formatSalary } from "@/domain/openings/formatting";

interface OpportunityCardProps {
  isNew?: boolean;
  isSaved: boolean;
  item: Opportunity;
  locale: string;
  newLabel: string;
  onPress: () => void;
  onToggleSaved: () => void;
  saveLabel: string;
  unsaveLabel: string;
  viewDetailsLabel: string;
}

export function OpportunityCard({ item, locale, ...props }: OpportunityCardProps): React.ReactNode {
  const { theme } = useAppTheme();
  const salary = formatSalary(item.salary, locale);
  const date = formatDate(item.createdAt, locale);
  const location = item.jobLocation?.displayText;
  return (
    <Pressable
      accessibilityLabel={`${props.viewDetailsLabel}: ${item.title}`}
      accessibilityRole="button"
      className="mx-5 mb-3 gap-4 rounded-card border border-line bg-paper p-5 active:bg-surface-muted"
      onPress={props.onPress}
    >
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1 gap-2">
          <Text className="font-body text-metadata font-semibold text-primary-deep" numberOfLines={1}>{item.community.name || item.repository}</Text>
          <Text className="font-display text-card-title font-semibold text-foreground" numberOfLines={3}>{item.title}</Text>
        </View>
        <Pressable
          accessibilityLabel={props.isSaved ? props.unsaveLabel : props.saveLabel}
          accessibilityRole="button"
          accessibilityState={{ selected: props.isSaved }}
          className="h-11 w-11 items-center justify-center rounded-control"
          hitSlop={4}
          onPress={(event) => { event.stopPropagation(); props.onToggleSaved(); }}
        >
          <Feather name="bookmark" size={20} color={props.isSaved ? theme.colors["primary-deep"] : theme.colors["muted-foreground"]} />
        </Pressable>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {props.isNew ? <View className="rounded-pill bg-positive px-3 py-1"><Text className="font-body text-metadata font-semibold text-positive-foreground">{props.newLabel}</Text></View> : null}
        {item.tags.slice(0, 4).map((tag) => <View className="rounded-pill bg-surface-muted px-3 py-1" key={tag}><Text className="font-body text-metadata text-muted-foreground">{tag}</Text></View>)}
      </View>
      <View className="gap-1 border-t border-line pt-3">
        {salary ? <Text className="font-body text-label font-semibold text-foreground">{salary}</Text> : null}
        {location ? <Text className="font-body text-metadata text-muted-foreground">⌖ {location}</Text> : null}
        <Text className="font-body text-metadata text-muted-foreground">@{item.author.handle}{date ? ` · ${date}` : ""}</Text>
      </View>
    </Pressable>
  );
}
