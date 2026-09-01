import { useState } from "react";
import { Image, Text, View } from "react-native";

interface EntityAvatarProps {
  name: string;
  size?: "medium" | "large";
  uri: string | null | undefined;
}

export function EntityAvatar({ name, size = "medium", uri }: EntityAvatarProps): React.ReactNode {
  const [failed, setFailed] = useState(false);
  const frame = size === "large" ? "h-20 w-20" : "h-12 w-12";
  if (uri && !failed) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={name}
        className={`${frame} rounded-pill bg-surface-muted`}
        onError={() => setFailed(true)}
        source={{ uri }}
      />
    );
  }
  return (
    <View className={`${frame} items-center justify-center rounded-pill bg-primary-soft`}>
      <Text className="font-display text-card-title font-semibold text-primary-deep">
        {name.trim().charAt(0).toLocaleUpperCase() || "#"}
      </Text>
    </View>
  );
}
