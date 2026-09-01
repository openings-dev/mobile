import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text } from "react-native";

import { useAppTheme } from "@/contexts/theme";

interface ActionButtonProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  primary?: boolean;
}

export function ActionButton({ icon, label, onPress, primary }: ActionButtonProps): React.ReactNode {
  const { theme } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" className={primary ? "min-h-12 flex-row items-center justify-center gap-2 rounded-control bg-primary px-4" : "min-h-12 flex-row items-center justify-center gap-2 rounded-control border border-line bg-paper px-4"} onPress={onPress}>
      <Feather name={icon} size={18} color={primary ? theme.colors["primary-foreground"] : theme.colors["primary-deep"]} />
      <Text className={primary ? "font-body text-label font-semibold text-primary-foreground" : "font-body text-label font-semibold text-primary-deep"}>{label}</Text>
    </Pressable>
  );
}
