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
      className="mx-4 mb-3 gap-4 rounded-card border border-line bg-surface p-4 active:bg-surface-elevated"
      onPress={props.onPress}
    >
      <View className="flex-row items-center gap-3">
        <EntityAvatar name={props.title} uri={props.avatarUrl} />
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-display text-card-title font-semibold text-foreground" numberOfLines={2}>{props.title}</Text>
          <Text className="font-mono text-metadata text-muted-foreground" numberOfLines={1}>{props.subtitle}</Text>
        </View>
      </View>
      <View className="gap-2.5">
        {props.location ? (
          <View className="flex-row items-center gap-2">
            <Feather name="map-pin" size={15} color={theme.colors["muted-foreground"]} />
            <Text className="min-w-0 flex-1 font-body text-metadata text-muted-foreground" numberOfLines={2}>{props.location}</Text>
          </View>
        ) : null}
        {props.latestActivity ? (
          <View className="flex-row items-center gap-2">
            <Feather name="calendar" size={15} color={theme.colors["muted-foreground"]} />
            <Text className="font-body text-metadata text-muted-foreground">{props.latestActivity}</Text>
          </View>
        ) : null}
      </View>
      <View className="min-h-11 flex-row items-center justify-between gap-3 border-t border-line pt-3">
        <View className="flex-row items-center gap-2">
          <Feather name="briefcase" size={16} color={theme.colors["primary-deep"]} />
          <Text className="font-body text-label font-semibold text-primary-deep">{props.countLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="font-body text-label font-semibold text-primary-deep">{props.actionLabel}</Text>
          <Feather name="arrow-up-right" size={15} color={theme.colors["primary-deep"]} />
        </View>
      </View>
    </Pressable>
  );
}
