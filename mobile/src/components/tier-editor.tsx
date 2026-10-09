import { AppAlert } from "@/lib/alert";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { apiRequest } from "@/lib/api";
import type { TixEvent } from "@/lib/events";
import { PrimaryButton } from "@/components/primary-button";
import { colors } from "@/theme/tokens";
const blank = { name: "", description: "", price: "", quantity: "" };
export function TierEditor({
  event,
  token,
  onSaved,
}: {
  event: TixEvent;
  token: string;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState(blank);
  const [id, setId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const base = `/admin/events/${event.resource_type}/${event.resource_id}/tiers`;
  async function save() {
    setBusy(true);
    setError("");
    try {
      await apiRequest(id ? `${base}/${id.replace("ticket-", "")}` : base, {
        method: id ? "PATCH" : "POST",
        token,
        body: JSON.stringify(form),
      });
      setForm(blank);
      setId(null);
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(tier: string) {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`${base}/${tier.replace("ticket-", "")}`, {
        method: "DELETE",
        token,
      });
      setForm(blank);
      setId(null);
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View
      style={{
        gap: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontWeight: "800" }}>Ticket tiers · {event.title}</Text>
      <Text>Manage tiers before bookings start. Keep at least one tier.</Text>
      {event.tiers.map((t) => (
        <View key={t.id} style={{ gap: 6 }}>
          <Text>
            {t.name} · PHP {t.price} · {t.remaining} available
          </Text>
          <PrimaryButton
            label="Edit tier"
            disabled={busy}
            onPress={() => {
              setId(t.id);
              setForm({
                name: t.name,
                description: t.note,
                price: String(t.price),
                quantity: String(t.remaining),
              });
            }}
          />
          <PrimaryButton
            label="Delete tier"
            disabled={busy || event.tiers.length <= 1}
            onPress={() =>
              AppAlert.alert("Delete tier?", t.name, [
                { text: "Keep", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => void remove(t.id),
                },
              ])
            }
          />
        </View>
      ))}
      <Text>{id ? "Edit tier" : "Add tier"}</Text>
      {(Object.keys(blank) as (keyof typeof blank)[]).map((k) => (
        <View key={k}>
          <Text>{k}</Text>
          <TextInput
            accessibilityLabel={`Tier ${k}`}
            value={form[k]}
            onChangeText={(v) => setForm({ ...form, [k]: v })}
            keyboardType={
              ["price", "quantity"].includes(k) ? "numeric" : "default"
            }
            editable={!busy}
            style={{ padding: 10, borderWidth: 1, borderColor: colors.border }}
          />
        </View>
      ))}
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
      <PrimaryButton
        label="Save tier"
        disabled={busy}
        onPress={() => void save()}
      />
      {id && (
        <PrimaryButton
          label="Cancel tier edit"
          onPress={() => {
            setId(null);
            setForm(blank);
          }}
        />
      )}
    </View>
  );
}
