import { useLocalSearchParams } from "expo-router";

import { AuthorProfileScreen } from "@/app/authors/profile";

export default function AuthorProfileRoute(): React.ReactNode {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return <AuthorProfileScreen handle={handle} />;
}
