import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";

interface CatalogStateProps {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  pending?: boolean;
}

export function CatalogState({ actionLabel, message, onAction, pending }: CatalogStateProps): React.ReactNode {
  const { theme } = useAppTheme();
  return (
    <View className="flex-1 items-center justify-center gap-16 px-8 py-16">
      {pending ? <ActivityIndicator color={theme.colors["primary-deep"]} /> : null}
      <Text className="text-center font-body text-product-body text-muted-foreground">{message}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" className="min-h-11 justify-center rounded-control bg-primary px-5" onPress={onAction}>
          <Text className="font-body text-label font-semibold text-primary-foreground">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
