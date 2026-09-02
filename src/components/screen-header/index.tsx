import { Text, View } from "react-native";

interface ScreenHeaderProps {
  description: string;
  eyebrow?: string;
  title: string;
}

export function ScreenHeader({
  description,
  eyebrow = "openings.dev",
  title,
}: ScreenHeaderProps): React.ReactNode {
  return (
    <View className="gap-3 px-4 pb-5 pt-4">
      <Text className="font-body text-label font-semibold text-primary-deep">
        {eyebrow}
      </Text>
      <View className="gap-2">
        <Text accessibilityRole="header" className="font-display text-section-title font-semibold text-foreground">
          {title}
        </Text>
        <Text className="font-body text-product-body text-muted-foreground">
          {description}
        </Text>
      </View>
    </View>
  );
}
