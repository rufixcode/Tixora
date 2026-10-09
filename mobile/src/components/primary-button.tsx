import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "@/theme/tokens";

export function PrimaryButton({
  label,
  disabled = false,
  onPress,
  variant = "primary",
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "text";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondary,
        variant === "text" && styles.text,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[styles.label, variant !== "primary" && styles.secondaryLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    marginTop: spacing.md,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { backgroundColor: "transparent" },
  secondaryLabel: { color: colors.primary },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  label: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },
});
