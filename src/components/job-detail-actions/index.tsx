import {
  Bookmark,
  CircleAlert,
  ExternalLink,
  Share2,
} from "lucide-react-native";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/theme";

interface JobDetailActionLabels {
  openOriginal: string;
  report: string;
  save: string;
  share: string;
}

interface JobDetailActionsProps {
  isSaved: boolean;
  labels: JobDetailActionLabels;
  onHeightChange?: (height: number) => void;
  onOpenOriginal: () => void;
  onReport: () => void;
  onShare: () => void;
  onToggleSaved: () => void;
}

export function JobDetailActions({
  isSaved,
  labels,
  onHeightChange,
  onOpenOriginal,
  onReport,
  onShare,
  onToggleSaved,
}: JobDetailActionsProps): React.ReactNode {
  const { theme } = useAppTheme();
  const handleLayout = (event: LayoutChangeEvent) => {
    onHeightChange?.(event.nativeEvent.layout.height);
  };

  return (
    <SafeAreaView
      className="border-t border-line bg-paper"
      edges={["bottom", "left", "right"]}
      onLayout={handleLayout}
      testID="job-detail-actions"
    >
      <View className="gap-2 px-16 py-3">
        <Pressable
          accessibilityRole="button"
          className="min-h-11 flex-row items-center justify-center gap-2 rounded-pill bg-primary px-16"
          onPress={onOpenOriginal}
        >
          <ExternalLink accessibilityElementsHidden color={theme.colors["primary-foreground"]} size={17} strokeWidth={1.8} />
          <Text className="font-body text-label font-semibold text-primary-foreground">
            {labels.openOriginal}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="min-h-11 flex-row items-center justify-center gap-2 rounded-control border border-line bg-paper px-16"
          onPress={onShare}
        >
          <Share2 accessibilityElementsHidden color={theme.colors.foreground} size={17} strokeWidth={1.8} />
          <Text className="font-body text-label font-semibold text-foreground">
            {labels.share}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isSaved }}
          className="min-h-11 flex-row items-center justify-center gap-2 rounded-control border border-line bg-paper px-16"
          onPress={onToggleSaved}
        >
          <Bookmark accessibilityElementsHidden color={theme.colors.foreground} fill={isSaved ? theme.colors.foreground : "none"} size={17} strokeWidth={1.8} />
          <Text className="font-body text-label font-semibold text-foreground">
            {labels.save}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="min-h-11 flex-row items-center justify-center gap-2 rounded-control px-16"
          onPress={onReport}
        >
          <CircleAlert accessibilityElementsHidden color={theme.colors["muted-foreground"]} size={17} strokeWidth={1.8} />
          <Text className="font-body text-label font-medium text-muted-foreground">
            {labels.report}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
