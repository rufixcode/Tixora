import { AppAlert } from "@/lib/alert";
import { TierEditor } from "@/components/tier-editor";
import { PosterUpload } from "@/components/poster-upload";
import { LoginSettings } from "@/components/login-settings";
import { CustomerDirectory } from "@/components/customer-directory";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { AppScreen } from "@/components/screen";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import type { TixEvent } from "@/lib/events";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme/tokens";
const blank = {
  title: "",
  category: "Concerts",
  subtitle: "",
  about: "",
  venue: "",
  city: "",
  date: "",
  time: "",
  image: "",
  price: "",
  tickets: "",
};
export default function Admin() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [section, setSection] = useState<"events" | "customers" | "account">(
    "events",
  );
  const [showForm, setShowForm] = useState(false);
  const [tierTarget, setTierTarget] = useState<TixEvent | null>(null);
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState(false);
  const [items, setItems] = useState<TixEvent[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<TixEvent | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!session) return;
    try {
      setItems(
        await apiRequest<TixEvent[]>("/admin/events", { token: session.token }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, [session]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function save() {
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(
        editing
          ? `/admin/events/${editing.resource_type}/${editing.resource_id}`
          : "/admin/events",
        {
          method: editing ? "PATCH" : "POST",
          token: session.token,
          body: JSON.stringify(form),
        },
      );
      setForm(blank);
      setEditing(null);
      setShowForm(false);
      setMessage("Listing saved.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(e: TixEvent) {
    if (!session) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/events/${e.resource_type}/${e.resource_id}`, {
        method: "DELETE",
        token: session.token,
      });
      await load();
      setMessage("Listing archived and removed from both apps.");
      if (
        editing?.resource_type === e.resource_type &&
        editing.resource_id === e.resource_id
      ) {
        setEditing(null);
        setForm(blank);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(e: TixEvent) {
    setShowForm(true);
    setTierTarget(null);
    setEditing(e);
    const start = e.starts_at ?? "";
    setForm({
      title: e.title,
      category: e.category,
      subtitle: e.admin_subtitle ?? "",
      about: e.about,
      venue: e.venue,
      city: e.city,
      date: start.slice(0, 10),
      time: start.slice(11, 16),
      image: e.poster_path ?? e.image ?? "",
      price: String(e.tiers[0]?.price ?? 0),
      tickets: String(e.tiers[0]?.remaining ?? 0),
    });
  }
  const visibleItems = items.filter(
    (e) =>
      (e.status === "cancelled") === archive &&
      `${e.title} ${e.category} ${e.venue}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <AppScreen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 14 }}
      >
        <PrimaryButton
          label="Ticket scanner"
          onPress={() => router.push("/scanner" as never)}
        />
        <PrimaryButton
          label="Sign out"
          disabled={busy || uploading}
          onPress={async () => {
            try {
              await signOut();
            } catch {
              // The auth provider clears the local session even if logout cannot reach the server.
            } finally {
              router.replace("/login");
            }
          }}
        />
        <Text style={{ fontSize: 28, fontWeight: "800" }}>
          Tixora · Administration
        </Text>
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
            {error}
          </Text>
        )}
        {!!message && <Text>{message}</Text>}
        {!session?.user.is_admin && (
          <Text>Sign in with an administrator account to manage Tixora.</Text>
        )}
        {session?.user.is_admin && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(["events", "customers", "account"] as const).map((s) => (
              <Pressable
                accessibilityRole="button"
                key={s}
                disabled={busy || uploading}
                onPress={() => setSection(s)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor:
                    section === s ? colors.primarySoft : colors.muted,
                }}
              >
                <Text>
                  {s === "events"
                    ? "Listings"
                    : s === "account"
                      ? "Admin account"
                      : "Customers"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {session?.user.is_admin && section === "customers" && (
          <CustomerDirectory token={session.token} />
        )}
        {session?.user.is_admin && section === "account" && (
          <LoginSettings email={session.user.email} />
        )}
        {session?.user.is_admin && section === "events" && (
          <>
            {!showForm && !tierTarget && (
              <PrimaryButton
                label="Add listing"
                onPress={() => {
                  setForm(blank);
                  setEditing(null);
                  setShowForm(true);
                }}
              />
            )}
            {showForm && (
              <>
                <Text>
                  Movie entries create a two-hour screening. Capacity is limited
                  to 200 seats. Booked events cannot be edited.
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "800" }}>
                  {editing ? "Edit event" : "New event"}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["Concerts", "Movies", "Events"].map((c) => (
                    <Pressable
                      key={c}
                      disabled={!!editing}
                      onPress={() => setForm({ ...form, category: c })}
                      style={{
                        padding: 12,
                        backgroundColor:
                          form.category === c
                            ? colors.primarySoft
                            : colors.muted,
                        borderRadius: 8,
                      }}
                    >
                      <Text>{c}</Text>
                    </Pressable>
                  ))}
                </View>
                {(Object.keys(blank) as (keyof typeof blank)[])
                  .filter(
                    (k) =>
                      k !== "category" &&
                      k !== "image" &&
                      (k !== "subtitle" || form.category === "Concerts"),
                  )
                  .map((k) => (
                    <View key={k}>
                      <Text>
                        {k === "date"
                          ? "Date (YYYY-MM-DD)"
                          : k === "time"
                            ? "Time (HH:MM, UTC)"
                            : k === "tickets"
                              ? "Capacity / lowest-priced tier"
                              : k === "subtitle"
                                ? "Artist"
                                : k === "about"
                                  ? "Description"
                                  : k === "price"
                                    ? "Ticket price (PHP)"
                                    : k.charAt(0).toUpperCase() + k.slice(1)}
                      </Text>
                      <TextInput
                        multiline={k === "about"}
                        numberOfLines={k === "about" ? 4 : 1}
                        accessibilityLabel={k}
                        value={form[k]}
                        onChangeText={(v) => setForm({ ...form, [k]: v })}
                        keyboardType={
                          ["price", "tickets"].includes(k)
                            ? "numeric"
                            : "default"
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 10,
                          padding: 12,
                          marginTop: 4,
                        }}
                      />
                    </View>
                  ))}
                <PosterUpload
                  value={form.image}
                  token={session.token}
                  onChange={(image) => setForm((prev) => ({ ...prev, image }))}
                  onBusy={setUploading}
                />
                <PrimaryButton
                  label={
                    busy
                      ? "Saving..."
                      : editing
                        ? "Save changes & publish"
                        : "Publish event"
                  }
                  disabled={busy || uploading}
                  onPress={() => void save()}
                />
                {
                  <PrimaryButton
                    label="Cancel"
                    disabled={busy || uploading}
                    onPress={() => {
                      setEditing(null);
                      setForm(blank);
                      setShowForm(false);
                    }}
                  />
                }
              </>
            )}
            {!showForm && (
              <>
                <Text style={{ fontSize: 20, fontWeight: "800" }}>
                  Listings
                </Text>
                {tierTarget && (
                  <>
                    <PrimaryButton
                      label="Close ticket tiers"
                      onPress={() => setTierTarget(null)}
                    />
                    <TierEditor
                      key={`${tierTarget.resource_type}:${tierTarget.resource_id}`}
                      event={
                        items.find(
                          (e) =>
                            e.resource_type === tierTarget.resource_type &&
                            e.resource_id === tierTarget.resource_id,
                        ) ?? tierTarget
                      }
                      token={session.token}
                      onSaved={load}
                    />
                  </>
                )}
                <TextInput
                  accessibilityLabel="Search events"
                  placeholder="Search title, category or venue"
                  value={search}
                  onChangeText={setSearch}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                  }}
                />
                <PrimaryButton
                  label={
                    archive ? "Show active listings" : "Show archived listings"
                  }
                  onPress={() => setArchive((v) => !v)}
                />
                <PrimaryButton
                  label="Refresh catalog"
                  disabled={busy || uploading}
                  onPress={() => void load()}
                />
                {visibleItems.length === 0 && (
                  <Text>
                    No matching listings. Adjust your search or add a listing.
                  </Text>
                )}
                {visibleItems.map((e) => (
                  <View
                    key={`${e.resource_type}:${e.resource_id}`}
                    style={{
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 14,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: "800" }}>
                      {e.title}
                    </Text>
                    <Text>
                      {e.category} - {e.date} -{" "}
                      {e.status === "cancelled"
                        ? "Archived"
                        : e.booking_available
                          ? "On sale"
                          : "Ended / unavailable"}
                    </Text>
                    {e.resource_type !== "movie" && !archive && (
                      <PrimaryButton
                        label="Ticket tiers"
                        disabled={busy || uploading}
                        onPress={() => setTierTarget(e)}
                      />
                    )}
                    <PrimaryButton
                      label={archive ? "Edit & republish" : "Edit"}
                      disabled={busy || uploading}
                      onPress={() => edit(e)}
                    />
                    <PrimaryButton
                      label="Archive"
                      disabled={busy || uploading || archive}
                      onPress={() =>
                        AppAlert.alert(
                          "Archive event?",
                          `${e.title} will be removed from both apps.`,
                          [
                            { text: "Keep", style: "cancel" },
                            {
                              text: "Archive",
                              style: "destructive",
                              onPress: () => void remove(e),
                            },
                          ],
                        )
                      }
                    />
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}
