import {
  Bookmark,
  CircleAlert,
  ExternalLink,
  MoreHorizontal,
  Share2,
  X,
} from "lucide-react-native";
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/theme";

interface JobDetailActionLabels {
  actions: string;
  closeActions: string;
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
  const [actionsVisible, setActionsVisible] = useState(false);
  const closeActions = () => setActionsVisible(false);
  const handleLayout = (event: LayoutChangeEvent) => {
    onHeightChange?.(event.nativeEvent.layout.height);
  };
  const runAction = (action: () => void) => {
    closeActions();
    action();
  };

  return (
    <>
      <SafeAreaView
        className="border-t border-line bg-paper"
        edges={["bottom", "left", "right"]}
        onLayout={handleLayout}
        testID="job-detail-actions"
      >
        <View className="flex-row gap-2 px-16 py-3">
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-pill bg-primary px-4"
            onPress={onOpenOriginal}
          >
            <ExternalLink accessibilityElementsHidden color={theme.colors["primary-foreground"]} size={17} strokeWidth={1.8} />
            <Text className="font-body text-label font-semibold text-primary-foreground">
              {labels.openOriginal}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-row items-center justify-center gap-2 rounded-control border border-line bg-paper px-4"
            onPress={() => setActionsVisible(true)}
          >
            <MoreHorizontal accessibilityElementsHidden color={theme.colors.foreground} size={18} strokeWidth={1.8} />
            <Text className="font-body text-label font-semibold text-foreground">
              {labels.actions}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal
        animationType="slide"
        onRequestClose={closeActions}
        transparent
        testID="job-detail-action-sheet"
        visible={actionsVisible}
      >
        <View className="flex-1 justify-end bg-overlay">
          <Pressable
            accessible={false}
            className="absolute inset-0"
            onPress={closeActions}
          />
          <SafeAreaView
            accessibilityViewIsModal
            className="overflow-hidden rounded-t-card border-t border-line bg-paper shadow-floating"
            edges={["bottom", "left", "right"]}
          >
            <View className="min-h-14 flex-row items-center justify-between border-b border-line px-16">
              <Text
                accessibilityRole="header"
                className="flex-1 font-display text-card-title font-semibold text-foreground"
              >
                {labels.actions}
              </Text>
              <Pressable
                accessibilityLabel={labels.closeActions}
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-control"
                onPress={closeActions}
              >
                <X accessibilityElementsHidden color={theme.colors.foreground} size={20} strokeWidth={1.8} />
              </Pressable>
            </View>
            <View className="px-16 py-3">
              <Pressable
                accessibilityRole="button"
                className="min-h-[52px] flex-row items-center gap-3 px-3"
                onPress={() => runAction(onShare)}
              >
                <Share2 accessibilityElementsHidden color={theme.colors.foreground} size={18} strokeWidth={1.8} />
                <Text className="flex-1 font-body text-product-body font-semibold text-foreground">
                  {labels.share}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={labels.save}
                accessibilityRole="button"
                accessibilityState={{ selected: isSaved }}
                className="min-h-[52px] flex-row items-center gap-3 border-t border-line px-3"
                onPress={() => runAction(onToggleSaved)}
              >
                <Bookmark
                  accessibilityElementsHidden
                  color={theme.colors.foreground}
                  fill={isSaved ? theme.colors.foreground : "none"}
                  size={18}
                  strokeWidth={1.8}
                />
                <Text className="flex-1 font-body text-product-body font-semibold text-foreground">
                  {labels.save}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                className="min-h-[52px] flex-row items-center gap-3 border-t border-line px-3"
                onPress={() => runAction(onReport)}
              >
                <CircleAlert accessibilityElementsHidden color={theme.colors["muted-foreground"]} size={18} strokeWidth={1.8} />
                <Text className="flex-1 font-body text-product-body font-medium text-muted-foreground">
                  {labels.report}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
