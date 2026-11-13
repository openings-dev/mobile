import { AppVersioningService } from "./app-versioning.service";
import { StoreUpdateProvider } from "./store-update.provider";

export const appVersioningService = new AppVersioningService();
export const storeUpdateService = new StoreUpdateProvider();

export { AppVersioningService } from "./app-versioning.service";
export { StoreUpdateProvider } from "./store-update.provider";
export type { StoreUpdateAvailability } from "./store-update.provider";
