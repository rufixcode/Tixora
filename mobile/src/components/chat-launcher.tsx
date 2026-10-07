import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Tixora assistant"
        style={[s.launcher, { bottom: Math.max(insets.bottom, 12) + 64 }]}
        onPress={() => setOpen(true)}
      >
        <Text style={s.white}>AI Assist</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.overlay}>
          <View accessibilityViewIsModal style={s.panel}>
            <Text style={s.title}>Tixora assistant</Text>
            <Text style={s.copy}>
              Coming soon. The AI assistant is not connected yet. No messages
              are collected or sent.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close chat"
              onPress={() => setOpen(false)}
              style={s.close}
            >
              <Text style={s.white}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
const s = StyleSheet.create({
  launcher: {
    position: "absolute",
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 5,
  },
  white: { color: "white", fontWeight: "800" },
  overlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "flex-end",
    padding: 24,
  },
  panel: { backgroundColor: colors.card, borderRadius: 20, padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: colors.foreground },
  copy: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    color: colors.mutedForeground,
  },
  close: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
});
