import { ChatLauncher } from "@/components/chat-launcher";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <ChatLauncher />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
