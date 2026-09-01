import { useLocalSearchParams } from "expo-router";

import { JobDetailsScreen } from "@/app/jobs/details";

export default function JobDetailsRoute(): React.ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <JobDetailsScreen id={id} />;
}
