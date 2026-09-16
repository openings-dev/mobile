import { useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { buildJobRoute } from "@/domain/openings/routing";
import { addNotificationClickListener } from "@/services/notifications/onesignal-client";

export function NotificationNavigation(): React.ReactNode {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const ready = useRef(false);
  const pendingJobId = useRef<string | null>(null);

  useEffect(() => {
    ready.current = Boolean(navigationState?.key);
    if (ready.current && pendingJobId.current) {
      const jobId = pendingJobId.current;
      pendingJobId.current = null;
      router.push(buildJobRoute(jobId) as never);
    }
  }, [navigationState?.key, router]);

  useEffect(() => addNotificationClickListener((jobId) => {
    if (!ready.current) {
      pendingJobId.current = jobId;
      return;
    }
    router.push(buildJobRoute(jobId) as never);
  }), [router]);

  return null;
}
