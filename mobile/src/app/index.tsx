import { Redirect } from "expo-router";

import { LoadingState } from "@/components/state-view";
import { useAuth } from "@/providers/auth-provider";

export default function IndexRoute() {
  const { status } = useAuth();
  if (status === "loading") return <LoadingState label="Opening Tixora…" />;
  return (
    <Redirect
      href={(status === "authenticated" ? "/(tabs)/home" : "/login") as never}
    />
  );
}
