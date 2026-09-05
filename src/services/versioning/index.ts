import { AndroidVersioningService } from "./android-versioning.service";
import { GooglePlayUpdateProvider } from "./google-play-update.provider";

export const androidVersioningService = new AndroidVersioningService();
export const googlePlayUpdateService = new GooglePlayUpdateProvider();

export { AndroidVersioningService } from "./android-versioning.service";
export { GooglePlayUpdateProvider } from "./google-play-update.provider";
export type { GooglePlayUpdateAvailability } from "./google-play-update.provider";
