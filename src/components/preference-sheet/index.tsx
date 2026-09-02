import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/theme";

export interface PreferenceOption<TValue extends string> {
  label: string;
  value: TValue;
}

interface PreferenceSheetProps<TValue extends string> {
  closeLabel: string;
  onClose: () => void;
  onSelect: (value: TValue) => void;
  options: readonly PreferenceOption<TValue>[];
  selectedValue: TValue;
  title: string;
  visible: boolean;
}

export function PreferenceSheet<TValue extends string>({
  closeLabel,
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
  visible,
}: PreferenceSheetProps<TValue>): React.ReactNode {
  const { theme } = useAppTheme();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom"]}>
        <View className="min-h-16 flex-row items-center justify-between border-b border-line bg-paper px-5">
          <Text
            accessibilityRole="header"
            className="font-display text-card-title font-semibold text-foreground"
          >
            {title}
          </Text>
          <Pressable
            accessibilityLabel={closeLabel}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-control"
            hitSlop={4}
            onPress={onClose}
          >
            <Feather name="x" size={21} color={theme.colors.foreground} />
          </Pressable>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="p-4">
          <View className="overflow-hidden rounded-card border border-line bg-paper">
            {options.map((option, index) => {
              const selected = option.value === selectedValue;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={index === 0
                    ? "min-h-14 flex-row items-center justify-between gap-4 px-4"
                    : "min-h-14 flex-row items-center justify-between gap-4 border-t border-line px-4"}
                  onPress={() => onSelect(option.value)}
                >
                  <Text className={selected
                    ? "flex-1 font-body text-product-body font-semibold text-foreground"
                    : "flex-1 font-body text-product-body text-foreground"}
                  >
                    {option.label}
                  </Text>
                  {selected ? (
                    <View className="h-7 w-7 items-center justify-center rounded-pill bg-primary">
                      <Feather
                        name="check"
                        size={16}
                        color={theme.colors["primary-foreground"]}
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
