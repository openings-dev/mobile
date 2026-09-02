import { ExternalLink, Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useLocale } from "@/contexts/locale";
import { useAppTheme } from "@/contexts/theme";
import { openHttpsUrl } from "@/services/external-actions";

const OPENINGS_WEB_REPOSITORY_URL = "https://github.com/openings-dev/web";

export function SupportCard(): React.ReactNode {
  const { messages } = useLocale();
  const { theme } = useAppTheme();
  const copy = messages.header.support;

  return (
    <View className="rounded-card border border-primary/40 bg-primary-soft p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-primary">
          <Star color={theme.colors["primary-foreground"]} size={17} strokeWidth={1.8} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-body text-metadata font-semibold text-foreground">
            {copy.title}
          </Text>
          <Text className="font-body text-label leading-5 text-muted-foreground">
            {copy.description}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={copy.ariaLabel}
        accessibilityRole="link"
        className="mt-4 min-h-11 flex-row items-center justify-center gap-2 rounded-pill bg-primary px-4"
        onPress={() => void openHttpsUrl(OPENINGS_WEB_REPOSITORY_URL)}
      >
        <Star color={theme.colors["primary-foreground"]} size={16} strokeWidth={1.8} />
        <Text className="font-body text-metadata font-semibold text-primary-foreground">
          {copy.action}
        </Text>
        <ExternalLink color={theme.colors["primary-foreground"]} size={15} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}
