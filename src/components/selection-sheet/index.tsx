import { Check, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/contexts/theme";

export interface SelectionOption<TValue extends string> {
  count?: number;
  label: string;
  value: TValue;
}

interface SelectionSheetProps<TValue extends string> {
  applyLabel: string;
  clearLabel: string;
  closeLabel: string;
  emptyLabel: string;
  mode: "multiple" | "single";
  onApply: (values: TValue[]) => void;
  onClose: () => void;
  options: readonly SelectionOption<TValue>[];
  selectedValues: readonly TValue[];
  title: string;
  visible: boolean;
}

export function SelectionSheet<TValue extends string>({
  applyLabel,
  clearLabel,
  closeLabel,
  emptyLabel,
  mode,
  onApply,
  onClose,
  options,
  selectedValues,
  title,
  visible,
}: SelectionSheetProps<TValue>): React.ReactNode {
  const { theme } = useAppTheme();
  const [draftValues, setDraftValues] = useState<TValue[]>([...selectedValues]);

  const select = (value: TValue) => {
    if (mode === "single") {
      onApply([value]);
      onClose();
      return;
    }

    setDraftValues((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    );
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => setDraftValues([...selectedValues])}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom"]}>
        <View className="min-h-14 flex-row items-center justify-between border-b border-line bg-paper px-16">
          <Text
            accessibilityRole="header"
            className="flex-1 font-display text-card-title font-semibold text-foreground"
          >
            {title}
          </Text>
          <Pressable
            accessibilityLabel={closeLabel}
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-control"
            onPress={onClose}
          >
            <X accessibilityElementsHidden size={20} strokeWidth={1.8} color={theme.colors.foreground} />
          </Pressable>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="p-16">
          {options.length === 0 ? (
            <Text className="py-12 text-center font-body text-product-body text-muted-foreground">
              {emptyLabel}
            </Text>
          ) : (
            <View className="overflow-hidden rounded-card border border-line bg-paper">
              {options.map((option, index) => {
                const selected = draftValues.includes(option.value);

                return (
                  <Pressable
                    key={option.value}
                    accessibilityLabel={option.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={index === 0
                      ? "min-h-[52px] flex-row items-center gap-3 px-16"
                      : "min-h-[52px] flex-row items-center gap-3 border-t border-line px-16"}
                    onPress={() => select(option.value)}
                  >
                    <Text
                      className={selected
                        ? "flex-1 font-body text-product-body font-semibold text-foreground"
                        : "flex-1 font-body text-product-body text-foreground"}
                    >
                      {option.label}
                    </Text>
                    {typeof option.count === "number" ? (
                      <Text className="font-mono text-metadata text-muted-foreground">
                        {option.count}
                      </Text>
                    ) : null}
                    <View
                      className={selected
                        ? "h-7 w-7 items-center justify-center rounded-pill bg-primary"
                        : "h-7 w-7 items-center justify-center rounded-pill border border-control"}
                    >
                      {selected ? (
                        <Check
                          accessibilityElementsHidden
                          size={16}
                          strokeWidth={1.8}
                          color={theme.colors["primary-foreground"]}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
        {mode === "multiple" ? (
          <View className="flex-row gap-3 border-t border-line bg-paper p-5">
            <Pressable
              accessibilityRole="button"
              className="min-h-11 flex-1 items-center justify-center rounded-control border border-control"
              onPress={() => setDraftValues([])}
            >
              <Text className="font-body text-label font-semibold text-foreground">
                {clearLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-11 flex-[1.4] items-center justify-center rounded-control bg-primary"
              onPress={() => {
                onApply(draftValues);
                onClose();
              }}
            >
              <Text className="font-body text-label font-semibold text-primary-foreground">
                {applyLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
