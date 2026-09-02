import { BriefcaseBusiness, Clock3, MapPin } from "lucide-react-native";
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
  return (
    <View className="mx-4 gap-6">
      <View className="flex-row items-center gap-4">
        <EntityAvatar name={props.title} size="large" uri={props.avatarUrl} />
        <View className="min-w-0 flex-1 gap-1.5">
          {props.status ? (
            <View className="mb-1 min-h-6 self-start justify-center rounded-pill bg-primary-soft px-3">
              <Text className="font-body text-metadata font-semibold text-primary-deep">
                {props.status}
              </Text>
            </View>
          ) : null}
          <Text accessibilityRole="header" className="font-display text-[32px] font-semibold leading-[34px] tracking-[-1px] text-foreground" numberOfLines={3}>
            {props.title}
          </Text>
          <Text className="font-mono text-label text-muted-foreground" numberOfLines={2}>
            {props.subtitle}
          </Text>
        </View>
      </View>
      <View className="gap-4 rounded-card border border-line bg-surface-muted p-5">
        <View className="flex-row items-center gap-2 border-b border-line pb-4">
          <BriefcaseBusiness accessibilityElementsHidden size={19} strokeWidth={1.8} color={theme.colors["primary-deep"]} />
          <Text className="font-mono text-card-title font-semibold text-primary-deep">
            {props.countLabel}
          </Text>
        </View>
        {props.location ? (
          <View className="flex-row items-center gap-2">
            <MapPin accessibilityElementsHidden size={16} strokeWidth={1.8} color={theme.colors["primary-deep"]} />
            <Text className="min-w-0 flex-1 font-body text-label text-foreground">
              {props.location}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center gap-2">
          <Clock3 accessibilityElementsHidden size={16} strokeWidth={1.8} color={theme.colors["primary-deep"]} />
          <Text className="min-w-0 flex-1 font-body text-label text-foreground">
            {props.activityLabel}: {props.activityValue}
          </Text>
        </View>
      </View>
    </View>
  );
}
