import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

export function PrimaryButton({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && !disabled && styles.pressed]}><Text style={styles.label}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, height: 52, justifyContent: 'center', marginTop: spacing.md }, disabled: { opacity: 0.6 }, pressed: { backgroundColor: colors.primaryDeep }, label: { color: colors.white, fontSize: typography.body, fontWeight: '800' } });
