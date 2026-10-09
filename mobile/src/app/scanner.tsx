import { useCallback, useRef, useState } from "react";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { useAuth } from "@/providers/auth-provider";
import { apiRequest } from "@/lib/api";
import { colors } from "@/theme/tokens";

type CheckedTicket = {
  ticket_number: string;
  event_title: string;
  status: string;
  admitted: boolean;
};
export default function Scanner() {
  const { session, status, signOut } = useAuth();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<CheckedTicket | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scanLock = useRef(false);
  useFocusEffect(
    useCallback(() => {
      setActive(AppState.currentState === "active");
      const subscription = AppState.addEventListener("change", (state) => {
        setActive(state === "active");
        if (state !== "active") setPassword("");
      });
      return () => {
        setActive(false);
        setPassword("");
        subscription.remove();
      };
    }, []),
  );
  async function check(value: string, admit = false) {
    if (!session || busy) return;
    scanLock.current = true;
    setBusy(true);
    setError("");
    setCode(value);
    try {
      if (!/^tixora:ticket:[a-zA-Z0-9]{48}$/.test(value))
        throw new Error(
          "This is not a Tixora admission QR. Scan the ticket from My bookings.",
        );
      setResult(
        await apiRequest<CheckedTicket>("/tickets/check", {
          token: session.token,
          method: "POST",
          body: JSON.stringify({
            code: value,
            admit,
            ...(admit ? { password } : {}),
          }),
        }),
      );
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setPassword("");
    }
  }
  function reset() {
    scanLock.current = false;
    setResult(null);
    setCode("");
    setPassword("");
    setError("");
  }
  if (status === "loading")
    return (
      <AppScreen>
        <Text>Checking staff access…</Text>
      </AppScreen>
    );
  if (!session) return <Redirect href={"/login" as never} />;
  if (!session.user.is_security && !session.user.is_admin)
    return (
      <AppScreen>
        <View style={styles.content}>
          <Text style={styles.title}>Staff access required</Text>
          <Text>Sign in with a security staff or administrator account.</Text>
          <PrimaryButton
            label="Back to account"
            onPress={() => router.replace("/account" as never)}
          />
        </View>
      </AppScreen>
    );
  return (
    <AppScreen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>TIXORA · SECURITY</Text>
        <Text style={styles.title}>Ticket scanner</Text>
        <Text style={styles.copy}>
          Signed in as {session.user.name}. Scan a guest’s admission ticket,
          check the event, then confirm entry.
        </Text>
        {!code && (
          <View style={styles.camera}>
            {permission?.granted && active ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => {
                  if (!scanLock.current) {
                    scanLock.current = true;
                    void check(data.trim());
                  }
                }}
                onMountError={() =>
                  setError("Camera could not start. Use the entry code below.")
                }
              />
            ) : (
              <View style={styles.cameraPrompt}>
                <Text style={{ color: colors.white, textAlign: "center" }}>
                  Camera access is needed to scan tickets.
                </Text>
                <PrimaryButton
                  label="Enable camera"
                  onPress={() => {
                    if (permission?.canAskAgain === false)
                      void Linking.openSettings();
                    else void requestPermission();
                  }}
                />
              </View>
            )}
          </View>
        )}
        {!result && (
          <View style={styles.card}>
            <Text style={styles.label}>Or paste the entry code</Text>
            <TextInput
              accessibilityLabel="Ticket entry code"
              value={code}
              editable={!busy}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="tixora:ticket:…"
              style={styles.input}
              onChangeText={setCode}
            />
            <PrimaryButton
              label={busy ? "Checking…" : "Check ticket"}
              disabled={busy || !code.trim()}
              onPress={() => void check(code.trim())}
            />
          </View>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
            {error} Check the ticket again before admitting the guest.
          </Text>
        )}
        {result && (
          <View style={styles.card}>
            <Text style={styles.title}>{result.event_title}</Text>
            <Text selectable style={styles.copy}>
              {result.ticket_number}
            </Text>
            <Text
              style={{
                color:
                  result.status === "valid" ? colors.success : colors.primary,
                fontWeight: "800",
              }}
            >
              {result.admitted
                ? "ENTRY CONFIRMED"
                : result.status === "valid"
                  ? "VALID · NOT YET ADMITTED"
                  : "ALREADY USED / UNAVAILABLE"}
            </Text>
            {result.status === "valid" && (
              <>
                <Text style={styles.label}>Your staff password</Text>
                <TextInput
                  accessibilityLabel="Staff password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
                <PrimaryButton
                  label={busy ? "Confirming…" : "Confirm guest entry"}
                  disabled={busy || !password}
                  onPress={() =>
                    Alert.alert(
                      "Confirm entry?",
                      `Admit one guest to ${result.event_title}? This ticket can only be used once.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Admit guest",
                          onPress: () => void check(code, true),
                        },
                      ],
                    )
                  }
                />
              </>
            )}
          </View>
        )}
        {!!code && (
          <PrimaryButton
            label="Scan next ticket"
            disabled={busy}
            onPress={reset}
          />
        )}
        <Text style={styles.copy}>
          An internet connection is required. If confirmation fails, check the
          same ticket again before admitting the guest.
        </Text>
        {session.user.is_admin && (
          <PrimaryButton
            label="Admin dashboard"
            onPress={() => router.replace("/admin")}
          />
        )}
        <PrimaryButton
          label="Sign out"
          disabled={busy}
          onPress={() => {
            void signOut()
              .catch(() => setError("Signed out locally."))
              .finally(() => router.replace("/login" as never));
          }}
        />
      </ScrollView>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 50, gap: 14 },
  eyebrow: {
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 1.5,
    fontSize: 12,
  },
  title: { fontSize: 26, fontWeight: "800", color: colors.foreground },
  copy: { color: colors.mutedForeground, lineHeight: 20, fontSize: 14 },
  camera: {
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.ink,
  },
  cameraPrompt: { flex: 1, justifyContent: "center", padding: 25 },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    gap: 10,
    backgroundColor: colors.card,
  },
  label: { fontWeight: "700", color: colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
});
