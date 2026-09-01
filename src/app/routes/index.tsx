import { Redirect } from "expo-router";

export default function IndexRoute(): React.ReactNode {
  return <Redirect href={"/jobs" as never} />;
}
