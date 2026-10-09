import { useMemo, useState } from "react";
import { PixelRatio, Pressable, StyleSheet, Text, View } from "react-native";
import createQr from "qrcode-generator";
import { colors } from "@/theme/tokens";

export type IssuedTicket = {
  ticket_number: string;
  status: string;
  qr_payload: string | null;
  seat: { row_label: string; seat_number: number } | null;
};

export function QrTicket({
  ticket,
  title,
  reference,
}: {
  ticket: IssuedTicket;
  title: string;
  reference: string;
}) {
  const [availableWidth, setAvailableWidth] = useState(220);
  const [showCode, setShowCode] = useState(false);
  const payload =
    ticket.status === "valid" &&
    /^tixora:ticket:[a-zA-Z0-9]{48}$/.test(ticket.qr_payload ?? "")
      ? ticket.qr_payload
      : null;
  const matrix = useMemo(() => {
    if (!payload) return null;
    const qr = createQr(0, "M");
    qr.addData(payload, "Byte");
    qr.make();
    const count = qr.getModuleCount();
    return Array.from({ length: count }, (_, row) =>
      Array.from({ length: count }, (_, col) => qr.isDark(row, col)),
    );
  }, [payload]);
  // Align every module to physical pixels and keep a four-module quiet zone.
  const cell = matrix
    ? Math.max(
        1,
        Math.floor(
          (Math.min(240, availableWidth) * PixelRatio.get()) /
            (matrix.length + 8),
        ),
      ) / PixelRatio.get()
    : 4;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: colors.card,
      }}
    >
      <View
        style={{
          backgroundColor:
            ticket.status === "used" ? colors.mutedForeground : colors.primary,
          padding: 16,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{ color: colors.white, fontWeight: "900", letterSpacing: 2 }}
        >
          TIXORA
        </Text>
        <Text
          style={{
            color: colors.white,
            fontSize: 10,
            letterSpacing: 1,
            fontWeight: "700",
          }}
        >
          DIGITAL ADMISSION PASS
        </Text>
      </View>
      <View style={{ padding: 18, gap: 8 }}>
        <Text
          style={{ fontSize: 21, fontWeight: "800", color: colors.foreground }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
          Booking {reference}
        </Text>
        <Text
          style={{
            color:
              ticket.status === "valid"
                ? colors.success
                : colors.mutedForeground,
            fontWeight: "700",
            backgroundColor: colors.muted,
            padding: 10,
            borderRadius: 8,
            alignSelf: "flex-start",
          }}
        >
          {ticket.status === "valid"
            ? "Ready for entry"
            : ticket.status === "used"
              ? "Already used"
              : "Unavailable"}
          {ticket.seat
            ? ` · Seat ${ticket.seat.row_label}${ticket.seat.seat_number}`
            : ""}
        </Text>
      </View>
      <View
        onLayout={(event) =>
          setAvailableWidth(Math.max(100, event.nativeEvent.layout.width - 36))
        }
        style={{
          borderTopWidth: 1,
          borderStyle: "dashed",
          borderColor: colors.border,
          padding: 18,
          alignItems: "center",
          gap: 12,
        }}
      >
        {matrix && (
          <View
            accessible
            accessibilityLabel="Admission QR code"
            style={{
              padding: cell * 4,
              backgroundColor: "#fff",
              alignSelf: "center",
            }}
          >
            {matrix.map((row, y) => (
              <View key={y} style={{ flexDirection: "row" }}>
                {row.map((dark, x) => (
                  <View
                    key={x}
                    style={{
                      width: cell,
                      height: cell,
                      backgroundColor: dark ? colors.ink : "#fff",
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
        {!matrix && (
          <View style={styles.inactive}>
            <Text style={styles.inactiveTitle}>
              {ticket.status === "used"
                ? "ENTRY ALREADY CONFIRMED"
                : "PASS UNAVAILABLE"}
            </Text>
            <Text style={styles.note}>
              This ticket cannot be scanned again.
            </Text>
          </View>
        )}
        <Text
          selectable
          style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}
        >
          {ticket.ticket_number}
        </Text>
        <Text
          style={{
            fontSize: 12,
            textAlign: "center",
            color: colors.mutedForeground,
          }}
        >
          {matrix
            ? "Show this QR to Tixora security at entry. One ticket admits one guest."
            : "This pass cannot be used for entry."}
        </Text>
        {!!payload && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showCode }}
            onPress={() => setShowCode(!showCode)}
            style={styles.codeButton}
          >
            <Text style={styles.codeButtonText}>
              {showCode ? "Hide entry code" : "Show entry code instead"}
            </Text>
          </Pressable>
        )}
        {payload && showCode && (
          <Text
            selectable
            style={{
              fontSize: 10,
              textAlign: "center",
              color: colors.mutedForeground,
            }}
          >
            {payload}
          </Text>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  inactive: {
    backgroundColor: colors.muted,
    borderRadius: 14,
    padding: 24,
    width: "100%",
    gap: 8,
  },
  inactiveTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 1,
  },
  note: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  codeButton: { padding: 12, minHeight: 44 },
  codeButtonText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});
