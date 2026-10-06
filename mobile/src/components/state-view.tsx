import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

export function LoadingState({ label = 'Loading…' }: { label?: string }) { return <View style={styles.wrapper}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.text}>{label}</Text></View>; }
export function MessageState({ title, detail, actionLabel, onAction }: { title: string; detail: string; actionLabel?: string; onAction?: () => void }) { return <View style={styles.wrapper}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{detail}</Text>{actionLabel && onAction ? <Pressable onPress={onAction} style={styles.action}><Text style={styles.actionText}>{actionLabel}</Text></Pressable> : null}</View>; }
const styles = StyleSheet.create({ wrapper: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl }, title: { color: colors.foreground, fontSize: typography.title, fontWeight: '800', textAlign: 'center' }, text: { color: colors.mutedForeground, fontSize: typography.body, lineHeight: 22, marginTop: spacing.md, textAlign: 'center' }, action: { marginTop: spacing.lg }, actionText: { color: colors.primary, fontSize: typography.body, fontWeight: '800' } });
