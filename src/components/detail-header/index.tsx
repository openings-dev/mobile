import { X } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { BrandWordmark } from "@/components/brand-wordmark";
import { useAppTheme } from "@/contexts/theme";

interface DetailHeaderProps {
  backLabel: string;
  onBack: () => void;
  title: string;
}

export function DetailHeader(props: DetailHeaderProps): React.ReactNode {
  const { theme } = useAppTheme();
  return (
    <View className="min-h-16 flex-row items-center justify-between gap-3 border-b border-line bg-paper px-4">
      <BrandWordmark height={28} width={154} />
      <Pressable accessibilityHint={props.title} accessibilityLabel={props.backLabel} accessibilityRole="button" className="h-11 w-11 items-center justify-center rounded-control border border-line bg-paper" onPress={props.onBack}>
        <X accessibilityElementsHidden size={20} strokeWidth={1.8} color={theme.colors.foreground} />
      </Pressable>
    </View>
  );
}
