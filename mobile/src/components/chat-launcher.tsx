import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { safeChatPath, useAssistant } from "@/lib/assistant";
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const chat = useAssistant();
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Tixora assistant"
        style={{
          position: "absolute",
          right: 16,
          bottom: Math.max(insets.bottom, 12) + 64,
          backgroundColor: colors.primary,
          borderRadius: 28,
          padding: 16,
          elevation: 5,
        }}
        onPress={() => setOpen(true)}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>AI Assist</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            backgroundColor: "#0008",
            justifyContent: "flex-end",
            paddingTop: insets.top + 12,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              height: "85%",
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 18,
              paddingBottom: Math.max(insets.bottom, 16),
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "800" }}>
                Tixora assistant
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={chat.busy}
                onPress={chat.clear}
              >
                <Text>Clear</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
              >
                <Text>Close</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              AI answers may be inaccurate. Check the event page. Do not share
              passwords or payment details. Chat is kept in memory until cleared
              or the app restarts.
            </Text>
            <ScrollView
              ref={scroll}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                scroll.current?.scrollToEnd({ animated: true })
              }
              contentContainerStyle={{ gap: 12 }}
            >
              {chat.messages.length === 0 &&
                [
                  "Find events",
                  "How do I book tickets?",
                  "Help with payment",
                  "Where are my saved events?",
                ].map((q) => (
                  <Pressable
                    key={q}
                    accessibilityRole="button"
                    onPress={() => void chat.send(q)}
                    style={{
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                    }}
                  >
                    <Text>{q}</Text>
                  </Pressable>
                ))}
              {chat.messages.map((m, i) => (
                <View
                  key={i}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor:
                      m.role === "user" ? colors.primarySoft : colors.muted,
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800" }}>
                    {m.role === "user"
                      ? "You"
                      : m.mode === "ai"
                        ? "AI assistant"
                        : "Help guide (AI unavailable)"}
                  </Text>
                  <Text selectable accessibilityLiveRegion="polite">
                    {m.content}
                  </Text>
                  {m.actions?.map((a, n) => {
                    const path = safeChatPath(a, true);
                    return path ? (
                      <Pressable
                        key={n}
                        accessibilityRole="button"
                        onPress={() => {
                          setOpen(false);
                          router.push(path as never);
                        }}
                        style={{
                          padding: 10,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                        }}
                      >
                        <Text>{a.label}</Text>
                      </Pressable>
                    ) : null;
                  })}
                </View>
              ))}
              {chat.busy && <Text>Thinking…</Text>}
            </ScrollView>
            {!!chat.error && (
              <Text
                accessibilityRole="alert"
                style={{ color: colors.destructive }}
              >
                {chat.error}
              </Text>
            )}
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <TextInput
                accessibilityLabel="Message to Tixora assistant"
                placeholder="Ask a question…"
                value={chat.input}
                onChangeText={chat.setInput}
                editable={!chat.busy}
                maxLength={1000}
                onSubmitEditing={() => void chat.send()}
                style={{
                  flex: 1,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                }}
              />
              <Pressable
                accessibilityRole="button"
                disabled={chat.busy || !chat.input.trim()}
                onPress={() => void chat.send()}
                style={{
                  padding: 12,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white" }}>Send</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
