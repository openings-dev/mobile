import Feather from "@expo/vector-icons/Feather";
import { Text, View } from "react-native";

import { EntityAvatar } from "@/components/entity-avatar";
import { useAppTheme } from "@/contexts/theme";

interface ProfileHeroProps {
  activityLabel: string;
  activityValue: string;
  avatarUrl?: string | null;
  countLabel: string;
  location?: string;
  status?: string;
  subtitle: string;
  title: string;
}

export function ProfileHero(props: ProfileHeroProps): React.ReactNode {
  const { theme } = useAppTheme();
  const muted = theme.colors["night-muted-foreground"];

  return (
    <View className="mx-4 gap-5 rounded-editorial bg-night p-5">
      <View className="flex-row items-center gap-4">
        <EntityAvatar name={props.title} size="large" uri={props.avatarUrl} />
        <View className="min-w-0 flex-1 gap-1.5">
          <Text accessibilityRole="header" className="font-display text-section-title font-semibold text-night-foreground" numberOfLines={3}>
            {props.title}
          </Text>
          <Text className="font-mono text-metadata text-night-muted-foreground" numberOfLines={2}>
            {props.subtitle}
          </Text>
        </View>
      </View>
      <View className="gap-3 border-t border-night-muted-foreground pt-4">
        {props.location ? (
          <View className="flex-row items-center gap-2">
            <Feather name="map-pin" size={16} color={muted} />
            <Text className="min-w-0 flex-1 font-body text-product-body text-night-muted-foreground">
              {props.location}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-2">
          <Feather name="briefcase" size={16} color={muted} />
          <Text className="font-body text-product-body text-night-muted-foreground">
            {props.countLabel}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Feather name="clock" size={16} color={muted} />
          <Text className="min-w-0 flex-1 font-body text-metadata text-night-muted-foreground">
            {props.activityLabel}: {props.activityValue}
          </Text>
        </View>
        {props.status ? (
          <View className="self-start rounded-pill bg-night-muted-foreground px-3 py-1">
            <Text className="font-body text-metadata font-semibold text-night">
              {props.status}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
