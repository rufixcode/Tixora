import { Redirect } from "expo-router";

import { LoadingState } from "@/components/state-view";
import { useAuth } from "@/providers/auth-provider";

export default function IndexRoute() {
  const { status, session } = useAuth();
  if (status === "loading") return <LoadingState label="Opening Tixora…" />;
  return (
    <Redirect
      href={
        (status === "authenticated"
          ? session?.user.is_admin
            ? "/admin"
            : "/(tabs)/home"
          : "/login") as never
      }
    />
  );
}
