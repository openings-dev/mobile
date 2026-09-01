import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";

interface DetailHeaderProps {
  backLabel: string;
  onBack: () => void;
  title: string;
}

export function DetailHeader({ backLabel, onBack, title }: DetailHeaderProps): React.ReactNode {
  const { theme } = useAppTheme();
  return (
    <View className="min-h-16 flex-row items-center gap-3 border-b border-line bg-paper px-3">
      <Pressable accessibilityLabel={backLabel} accessibilityRole="button" className="h-11 w-11 items-center justify-center rounded-control" onPress={onBack}>
        <Feather name="arrow-left" size={22} color={theme.colors.foreground} />
      </Pressable>
      <Text className="min-w-0 flex-1 font-display text-card-title font-semibold text-foreground" numberOfLines={1}>{title}</Text>
    </View>
  );
}
