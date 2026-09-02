import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";

export interface PreferenceOption<TValue extends string> {
  label: string;
  value: TValue;
}

interface PreferencePopoverProps<TValue extends string> {
  onClose: () => void;
  onSelect: (value: TValue) => void;
  options: readonly PreferenceOption<TValue>[];
  selectedValue: TValue;
  title: string;
  visible: boolean;
}

export function PreferencePopover<TValue extends string>({
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
  visible,
}: PreferencePopoverProps<TValue>): React.ReactNode {
  const { theme } = useAppTheme();

  if (!visible) return null;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityViewIsModal
      className="absolute inset-0 z-20 justify-end bg-overlay/20 px-4 pb-24"
      onPress={onClose}
    >
      <Pressable
        className="ml-auto w-full max-w-[284px] overflow-hidden rounded-card border border-line bg-paper py-1 shadow-floating"
        onPress={(event) => event.stopPropagation()}
      >
        <Text
          accessibilityRole="header"
          className="px-4 pb-2 pt-3 font-body text-label font-semibold text-muted-foreground"
        >
          {title}
        </Text>
        {options.map((option) => {
          const selected = option.value === selectedValue;

          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={selected
                ? "mx-1 min-h-12 flex-row items-center gap-3 rounded-control border border-primary-deep bg-primary-soft px-3"
                : "mx-1 min-h-12 flex-row items-center gap-3 rounded-control border border-transparent px-3"}
              key={option.value}
              onPress={() => onSelect(option.value)}
            >
              <View className="w-4 items-center">
                {selected ? (
                  <Check
                    color={theme.colors["primary-deep"]}
                    size={16}
                    strokeWidth={1.8}
                  />
                ) : null}
              </View>
              <Text className="font-body text-product-body font-medium text-foreground">
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </Pressable>
    </Pressable>
  );
}
