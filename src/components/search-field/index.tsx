import { Search } from "lucide-react-native";
import { Text, TextInput, View } from "react-native";

import { useAppTheme } from "@/contexts/theme";

interface SearchFieldProps {
  label: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder: string;
  value: string;
}

export function SearchField({ label, onChangeText, onSubmitEditing, placeholder, value }: SearchFieldProps): React.ReactNode {
  const { theme } = useAppTheme();
  return (
    <View className="gap-2">
      <Text className="font-body text-label font-semibold text-foreground">{label}</Text>
      <View className="min-h-11 flex-row items-center gap-3 rounded-control border border-line bg-paper px-3">
        <Search size={18} strokeWidth={1.8} color={theme.colors["muted-foreground"]} accessibilityElementsHidden />
        <TextInput
          accessibilityLabel={label}
          className="min-h-11 flex-1 font-body text-product-body text-foreground"
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={theme.colors["muted-foreground"]}
          returnKeyType="search"
          value={value}
        />
      </View>
    </View>
  );
}
