import { ChatLauncher } from "@/components/chat-launcher";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <ContextualChatLauncher />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function ContextualChatLauncher() {
  const pathname = usePathname();

  // The assistant is a discovery aid, not part of the authentication flow.
  return pathname === "/home" || pathname === "/discover" ? <ChatLauncher /> : null;
}
