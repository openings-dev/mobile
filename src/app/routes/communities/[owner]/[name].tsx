import { useLocalSearchParams } from "expo-router";

import { CommunityProfileScreen } from "@/app/communities/profile";

export default function CommunityProfileRoute(): React.ReactNode {
  const { owner, name } = useLocalSearchParams<{ name: string; owner: string }>();
  return <CommunityProfileScreen repository={`${owner}/${name}`} />;
}
