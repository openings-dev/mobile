import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  androidVersioningService,
  googlePlayUpdateService,
  type GooglePlayUpdateAvailability,
} from "@/services/versioning";
import {
  dismissOptionalUpdate as persistOptionalUpdateDismissal,
  isOptionalUpdateDismissed,
} from "@/services/versioning/optional-update-dismissal";

export interface VersioningServices {
  checkAvailability(): Promise<GooglePlayUpdateAvailability>;
  isUpdateRequired(): Promise<boolean>;
  startFlexibleUpdate(): Promise<boolean>;
  startImmediateUpdate(): Promise<boolean>;
}

interface VersioningContextValue {
  dismissOptionalUpdate(): Promise<void>;
  mandatoryUpdate: boolean;
  optionalStoreVersion: string | null;
  refresh(): Promise<void>;
  startImmediateUpdate(): Promise<boolean>;
  startOptionalUpdate(): Promise<boolean>;
  status: "loading" | "ready";
}

const DEFAULT_SERVICES: VersioningServices = {
  checkAvailability: () => googlePlayUpdateService.checkAvailability(),
  isUpdateRequired: () => androidVersioningService.isUpdateRequired(),
  startFlexibleUpdate: () => googlePlayUpdateService.startFlexibleUpdate(),
  startImmediateUpdate: () => googlePlayUpdateService.startImmediateUpdate(),
};

const VersioningContext = createContext<VersioningContextValue | null>(null);

export function VersioningProvider({
  children,
  services = DEFAULT_SERVICES,
}: PropsWithChildren<{ services?: VersioningServices }>): React.ReactNode {
  const active = useRef(true);
  const [mandatoryUpdate, setMandatoryUpdate] = useState(false);
  const [optionalStoreVersion, setOptionalStoreVersion] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async (): Promise<void> => {
    setStatus("loading");
    try {
      const required = await services.isUpdateRequired();
      if (!active.current) return;
      setMandatoryUpdate(required);
      if (required) {
        setOptionalStoreVersion(null);
        return;
      }

      const availability = await services.checkAvailability();
      if (!active.current) return;
      const storeVersion = availability.storeVersion;
      const canOffer =
        availability.available &&
        availability.flexibleAllowed &&
        storeVersion !== null &&
        !(await isOptionalUpdateDismissed(storeVersion));
      if (active.current) setOptionalStoreVersion(canOffer ? storeVersion : null);
    } catch {
      if (active.current) {
        setMandatoryUpdate(false);
        setOptionalStoreVersion(null);
      }
    } finally {
      if (active.current) setStatus("ready");
    }
  }, [services]);

  useEffect(() => {
    active.current = true;
    void Promise.resolve().then(refresh);
    return () => {
      active.current = false;
    };
  }, [refresh]);

  const dismissOptionalUpdate = useCallback(async (): Promise<void> => {
    if (!optionalStoreVersion) return;
    if (await persistOptionalUpdateDismissal(optionalStoreVersion)) {
      setOptionalStoreVersion(null);
    }
  }, [optionalStoreVersion]);

  const value = useMemo<VersioningContextValue>(
    () => ({
      dismissOptionalUpdate,
      mandatoryUpdate,
      optionalStoreVersion,
      refresh,
      startImmediateUpdate: () => services.startImmediateUpdate(),
      startOptionalUpdate: () => services.startFlexibleUpdate(),
      status,
    }),
    [
      dismissOptionalUpdate,
      mandatoryUpdate,
      optionalStoreVersion,
      refresh,
      services,
      status,
    ],
  );

  return (
    <VersioningContext.Provider value={value}>
      {children}
    </VersioningContext.Provider>
  );
}

export function useVersioning(): VersioningContextValue {
  const context = useContext(VersioningContext);
  if (!context) {
    throw new Error("useVersioning must be used within VersioningProvider");
  }
  return context;
}
