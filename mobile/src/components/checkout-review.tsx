import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppScreen } from "@/components/screen";
import { BackButton } from "@/components/back-button";
import { formatPrice } from "@/lib/events";
import { colors } from "@/theme/tokens";

export function CheckoutReview({
  children,
  total,
  quantity,
  unitPrice,
  busy,
  disabled,
  error,
  notice,
  onPay,
  onChange,
}: {
  children: ReactNode;
  total: number;
  quantity: number;
  unitPrice: number;
  busy: boolean;
  disabled?: boolean;
  error?: string;
  notice?: string;
  onPay: () => void;
  onChange?: () => void;
}) {
  const router = useRouter();
  return (
    <AppScreen>
      <View style={styles.header}>
        <BackButton label="Back" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Checkout</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/bookings" as never)}
        >
          <Text style={styles.link}>My bookings</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Review & pay</Text>
        <Text style={styles.copy}>Your tickets are almost ready.</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.section}>Your booking</Text>
            {onChange && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={onChange}
              >
                <Text style={styles.link}>Change</Text>
              </Pressable>
            )}
          </View>
          {children}
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
        </View>
        <Text style={styles.section}>Payment</Text>
        <View style={[styles.card, styles.payment]}>
          <View style={styles.check}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>PayMongo checkout</Text>
            <Text style={styles.copy}>
              Choose your payment method on the secure payment page.
            </Text>
          </View>
        </View>
        <View style={styles.test}>
          <Text style={styles.testText}>
            Test mode · No real money is charged
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Order summary</Text>
          <View style={styles.row}>
            <Text style={styles.copy}>
              {quantity} {quantity === 1 ? "ticket" : "tickets"} ×{" "}
              {formatPrice(unitPrice)}
            </Text>
            <Text style={styles.name}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.name}>Total to pay</Text>
            <Text style={styles.amount}>{formatPrice(total)}</Text>
          </View>
        </View>
        <Text style={styles.hint}>
          After payment is verified, find your entry QR in My bookings.
        </Text>
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <View>
          <Text style={styles.copy}>Total</Text>
          <Text style={styles.amount}>{formatPrice(total)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || disabled }}
          disabled={busy || disabled}
          onPress={onPay}
          style={[styles.pay, (busy || disabled) && styles.disabled]}
        >
          <Text style={styles.payText}>
            {busy ? "Opening…" : "Continue to pay"}
          </Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 28,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.foreground },
  copy: { fontSize: 13, lineHeight: 20, color: colors.mutedForeground },
  section: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  payment: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.primary,
  },
  flex: { flex: 1, gap: 4 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  checkText: { color: colors.white, fontWeight: "800" },
  name: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 8,
  },
  notice: {
    color: colors.primaryDeep,
    fontSize: 12,
    backgroundColor: colors.primarySoft,
    padding: 10,
    borderRadius: 8,
  },
  test: { alignItems: "center" },
  testText: { color: colors.mutedForeground, fontSize: 12 },
  divider: { height: 1, backgroundColor: colors.border },
  amount: { fontSize: 21, fontWeight: "800", color: colors.foreground },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  error: { color: colors.destructive, fontSize: 13, lineHeight: 20 },
  footer: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  pay: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  payText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  disabled: { opacity: 0.5 },
});
