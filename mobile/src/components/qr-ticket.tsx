import { useMemo } from "react";
import { PixelRatio, Text, View } from "react-native";
import qrcode from "qrcode-generator";
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
  const matrix = useMemo(() => {
    if (!ticket.qr_payload) return null;
    const qr = qrcode(0, "M");
    qr.addData(ticket.qr_payload, "Byte");
    qr.make();
    const count = qr.getModuleCount();
    return Array.from({ length: count }, (_, row) =>
      Array.from({ length: count }, (_, col) => qr.isDark(row, col)),
    );
  }, [ticket.qr_payload]);
  // Align every module to physical pixels and keep a four-module quiet zone.
  const cell = matrix
    ? Math.max(1, Math.floor((220 * PixelRatio.get()) / (matrix.length + 8))) /
      PixelRatio.get()
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
          backgroundColor: colors.primary,
          padding: 16,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{ color: colors.white, fontWeight: "900", letterSpacing: 2 }}
        >
          TIXORA
        </Text>
        <Text style={{ color: colors.white, fontSize: 12 }}>
          ADMISSION PASS
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
        <Text style={{ color: colors.primary, fontWeight: "700" }}>
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
            style={{ padding: cell * 4, backgroundColor: "#fff" }}
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
            ? "Present this QR at entry. Keep your ticket private."
            : "This pass cannot be used for entry."}
        </Text>
        {ticket.qr_payload && (
          <Text
            selectable
            style={{
              fontSize: 10,
              textAlign: "center",
              color: colors.mutedForeground,
            }}
          >
            Entry code: {ticket.qr_payload}
          </Text>
        )}
      </View>
    </View>
  );
}
