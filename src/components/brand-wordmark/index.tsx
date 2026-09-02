import Svg, { G, Path } from "react-native-svg";

import { useAppTheme } from "@/contexts/theme";
import {
  BRAND_ARTWORK_PATH,
  BRAND_ARTWORK_TRANSFORM,
  WORDMARK_VIEW_BOX,
} from "./geometry";

interface BrandWordmarkProps {
  height?: number;
  width?: number;
}

export function BrandWordmark({
  height = 30,
  width = 165,
}: BrandWordmarkProps): React.ReactNode {
  const { theme } = useAppTheme();

  return (
    <Svg
      accessibilityElementsHidden
      focusable={false}
      height={height}
      preserveAspectRatio="xMinYMid meet"
      viewBox={WORDMARK_VIEW_BOX}
      width={width}
    >
      <G transform={BRAND_ARTWORK_TRANSFORM}>
        <Path
          clipRule="evenodd"
          d={BRAND_ARTWORK_PATH}
          fill={theme.colors.foreground}
          fillRule="evenodd"
        />
      </G>
    </Svg>
  );
}
