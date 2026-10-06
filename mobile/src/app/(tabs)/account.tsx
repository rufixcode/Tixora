import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { PrimaryButton } from '@/components/primary-button';
import { AppScreen } from '@/components/screen';
import { useAuth } from '@/providers/auth-provider';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function AccountScreen() {
  const router = useRouter(); const { session, signOut } = useAuth();
  async function logout() { await signOut(); router.replace('/login' as never); }
  return <AppScreen><View style={styles.content}><BrandLogo style={styles.logo} /><Text style={styles.eyebrow}>ACCOUNT</Text><View style={styles.card}><Text style={styles.name}>{session?.user.name}</Text><Text style={styles.email}>{session?.user.email}</Text></View><View style={styles.notice}><Text style={styles.noticeTitle}>More account features are on the way</Text><Text style={styles.noticeCopy}>Tickets, booking history, notifications, favorites, and settings do not yet have backend endpoints, so they are intentionally not shown as working features.</Text></View><PrimaryButton label="Sign out" onPress={() => void logout()} /></View></AppScreen>;
}
const styles = StyleSheet.create({ content: { padding: spacing.lg }, logo: { marginBottom: spacing.xxl }, eyebrow: { color: colors.primary, fontSize: typography.eyebrow, fontWeight: '800', letterSpacing: 1.5 }, card: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.sm, padding: spacing.lg }, name: { color: colors.foreground, fontSize: typography.title, fontWeight: '800' }, email: { color: colors.mutedForeground, fontSize: typography.body, marginTop: spacing.xs }, notice: { backgroundColor: colors.primarySoft, borderRadius: radius.md, marginTop: spacing.lg, padding: spacing.lg }, noticeTitle: { color: colors.primaryDeep, fontSize: typography.body, fontWeight: '800' }, noticeCopy: { color: colors.foreground, fontSize: typography.label, lineHeight: 20, marginTop: spacing.sm } });
