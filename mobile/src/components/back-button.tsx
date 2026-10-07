import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius } from "@/theme/tokens";

export function BackButton({ label = "Go back", onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" hitSlop={8} onPress={onPress} style={styles.button}>
      <Text style={styles.icon}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 40, justifyContent: "center", width: 40 },
  icon: { color: colors.primary, fontSize: 30, lineHeight: 32, marginTop: -3 },
});
