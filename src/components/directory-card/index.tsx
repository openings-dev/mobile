import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";
import { EntityAvatar } from "@/components/entity-avatar";

interface DirectoryCardProps {
  actionLabel: string;
  avatarUrl?: string | null;
  countLabel: string;
  latestActivity?: string | null;
  location?: string;
  onPress: () => void;
  subtitle: string;
  title: string;
}

export function DirectoryCard(props: DirectoryCardProps): React.ReactNode {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={`${props.actionLabel}: ${props.title}`}
      accessibilityRole="button"
      className="mx-5 mb-3 min-h-44 gap-4 rounded-card border border-line bg-paper p-5 active:bg-surface-muted"
      onPress={props.onPress}
    >
      <View className="flex-row items-start gap-4">
        <EntityAvatar name={props.title} uri={props.avatarUrl} />
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-display text-card-title font-semibold text-foreground" numberOfLines={2}>{props.title}</Text>
          <Text className="font-mono text-metadata text-muted-foreground" numberOfLines={1}>{props.subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={theme.colors["muted-foreground"]} accessibilityElementsHidden />
      </View>
      <View className="gap-2 border-t border-line pt-3">
        {props.location ? <Text className="font-body text-metadata text-muted-foreground">⌖ {props.location}</Text> : null}
        {props.latestActivity ? <Text className="font-body text-metadata text-muted-foreground">◷ {props.latestActivity}</Text> : null}
        <Text className="font-body text-label font-semibold text-primary-deep">{props.countLabel}</Text>
      </View>
    </Pressable>
  );
}
