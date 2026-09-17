import { ArrowUpRight, Bookmark, GitBranch, Share2 } from "lucide-react-native";
import { Pressable, Text } from "react-native";

import { useAppTheme } from "@/contexts/theme";

const ACTION_ICONS = {
  bookmark: Bookmark,
  "external-link": ArrowUpRight,
  github: GitBranch,
  "share-2": Share2,
} as const;

interface ActionButtonProps {
  icon: keyof typeof ACTION_ICONS;
  label: string;
  onPress: () => void;
  primary?: boolean;
}

export function ActionButton({ icon, label, onPress, primary }: ActionButtonProps): React.ReactNode {
  const { theme } = useAppTheme();
  const Icon = ACTION_ICONS[icon];
  return (
    <Pressable accessibilityRole="button" className={primary ? "min-h-11 flex-row items-center justify-center gap-2 rounded-pill bg-primary px-16" : "min-h-11 flex-row items-center justify-center gap-2 rounded-control border border-line bg-paper px-16"} onPress={onPress}>
      <Icon accessibilityElementsHidden size={18} strokeWidth={1.8} color={primary ? theme.colors["primary-foreground"] : theme.colors["primary-deep"]} />
      <Text className={primary ? "font-body text-label font-semibold text-primary-foreground" : "font-body text-label font-semibold text-primary-deep"}>{label}</Text>
    </Pressable>
  );
}
