import { Sparkles, X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";
import type { FoundationMessages } from "@/i18n/types";

interface NewMatchesCardProps {
  copy: FoundationMessages["jobs"]["newMatches"];
  onDismiss: () => void;
  onShow: () => void;
}

export function NewMatchesCard({
  copy,
  onDismiss,
  onShow,
}: NewMatchesCardProps): React.ReactNode {
  const { theme } = useAppTheme();

  return (
    <View className="mx-4 my-5 rounded-card border border-primary/40 bg-primary-soft p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-primary">
          <Sparkles
            accessibilityElementsHidden
            color={theme.colors["primary-foreground"]}
            size={20}
            strokeWidth={1.8}
          />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-display text-card-title font-semibold text-foreground">
            {copy.title}
          </Text>
          <Text className="font-body text-product-body leading-[22px] text-muted-foreground">
            {copy.description}
          </Text>
          <Text className="font-body text-metadata leading-[17px] text-muted-foreground">
            {copy.privacy}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={copy.dismiss}
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-control border border-primary/30"
          hitSlop={4}
          onPress={onDismiss}
        >
          <X
            accessibilityElementsHidden
            color={theme.colors["muted-foreground"]}
            size={18}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        className="mt-4 min-h-11 self-start justify-center rounded-pill bg-primary px-5"
        onPress={onShow}
      >
        <Text className="font-body text-label font-semibold text-primary-foreground">
          {copy.action}
        </Text>
      </Pressable>
    </View>
  );
}
