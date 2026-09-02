import { Pressable, Text } from "react-native";

interface FilterChipProps {
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
  selected?: boolean;
}

export function FilterChip({ icon, label, onPress, selected = false }: FilterChipProps): React.ReactNode {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={selected
        ? "min-h-11 flex-row items-center justify-center gap-2 rounded-pill border border-primary bg-primary px-4"
        : "min-h-11 flex-row items-center justify-center gap-2 rounded-pill border border-line bg-paper px-4"}
      onPress={onPress}
    >
      {icon}
      <Text className={selected
        ? "font-body text-label font-semibold text-primary-foreground"
        : "font-body text-label font-medium text-muted-foreground"}
      >
        {label}
      </Text>
    </Pressable>
  );
}
