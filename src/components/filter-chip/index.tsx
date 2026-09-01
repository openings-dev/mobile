import { Pressable, Text } from "react-native";

interface FilterChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
}

export function FilterChip({ label, onPress, selected = false }: FilterChipProps): React.ReactNode {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={selected
        ? "min-h-11 justify-center rounded-pill border border-primary-deep bg-primary-soft px-4"
        : "min-h-11 justify-center rounded-pill border border-line bg-paper px-4"}
      onPress={onPress}
    >
      <Text className={selected
        ? "font-body text-label font-semibold text-primary-deep"
        : "font-body text-label font-medium text-muted-foreground"}
      >
        {label}
      </Text>
    </Pressable>
  );
}
