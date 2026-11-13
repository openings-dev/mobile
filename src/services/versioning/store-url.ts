import { Platform } from "react-native";

export function getAppStoreUrl(): string {
  return Platform.OS === "ios"
    ? "https://apps.apple.com/app/id6834098510"
    : "https://play.google.com/store/apps/details?id=dev.openings.mobile";
}
