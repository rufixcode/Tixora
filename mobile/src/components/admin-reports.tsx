import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import type { AdminOverview, AdminPage } from "@/lib/admin";
import { colors } from "@/theme/tokens";
export function AdminReports({
  section,
  token,
}: {
  section: "overview" | "bookings" | "customers";
  token: string;
}) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [result, setResult] = useState<AdminPage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ q: search, page: String(page) });
    if (section === "bookings" && status) params.set("status", status);
    apiRequest<AdminOverview | AdminPage>(`/admin/${section}?${params}`, {
      token,
    })
      .then((data) => {
        if (!active) return;
        if (section === "overview") setOverview(data as AdminOverview);
        else setResult(data as AdminPage);
        setError("");
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section, token, search, page, status, refresh]);
  function reload() {
    setLoading(true);
    setRefresh((v) => v + 1);
  }
  return (
    <View style={{ gap: 14 }}>
      <PrimaryButton label="Refresh" disabled={loading} onPress={reload} />
      {section !== "overview" && (
        <>
          <TextInput
            accessibilityLabel={`Search ${section}`}
            placeholder={
              section === "bookings"
                ? "Reference, event or email"
                : "Name or email"
            }
            value={query}
            maxLength={200}
            onChangeText={setQuery}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
            }}
          />
          <PrimaryButton
            label="Search"
            disabled={loading}
            onPress={() => {
              setPage(1);
              setSearch(query);
              reload();
            }}
          />
          {section === "bookings" && (
            <View style={{ gap: 6 }}>
              {["", "pending", "confirmed", "cancelled"].map((s) => (
                <PrimaryButton
                  key={s}
                  label={`${status === s ? "✓ " : ""}${s || "All statuses"}`}
                  onPress={() => {
                    setStatus(s);
                    setPage(1);
                    reload();
                  }}
                />
              ))}
            </View>
          )}
        </>
      )}
      {!!error ? (
        <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
          {error}
        </Text>
      ) : loading ? (
        <Text>Loading…</Text>
      ) : section === "overview" && overview ? (
        <>
          {[
            ["Customers", overview.customers],
            ["Total bookings", overview.bookings],
            ["Awaiting payment", overview.pending],
            ["Confirmed bookings", overview.confirmed],
          ].map(([label, value]) => (
            <View
              key={label}
              style={{
                padding: 18,
                borderRadius: 12,
                backgroundColor: colors.muted,
              }}
            >
              <Text>{label}</Text>
              <Text style={{ fontSize: 28, fontWeight: "800" }}>{value}</Text>
            </View>
          ))}
          <Text>
            Confirmed sandbox payments: PHP{" "}
            {Number(overview.confirmed_amount).toFixed(2)}
          </Text>
        </>
      ) : (
        result && (
          <>
            <Text>
              {result.total} records.{" "}
              {section === "bookings"
                ? "Payment status is verified by PayMongo. Refunds are not connected."
                : "Roles are assigned through the trusted server console."}
            </Text>
            {result.data.length === 0 && <Text>No matching records.</Text>}
            {result.data.map((row) => (
              <View
                key={row.id}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  gap: 6,
                }}
              >
                <Text style={{ fontWeight: "800" }}>
                  {row.booking_reference ?? row.name}
                </Text>
                <Text>
                  {row.status ?? (row.is_admin ? "Administrator" : "Customer")}
                </Text>
                {row.event_title && (
                  <Text>
                    {row.event_title} · PHP{" "}
                    {Number(row.total_amount).toFixed(2)}
                  </Text>
                )}
                <Text>
                  {row.customer} {row.email}
                </Text>
                <Text>Created {row.created_at} UTC</Text>
              </View>
            ))}
            <Text>
              Page {result.current_page} of {result.last_page}
            </Text>
            <PrimaryButton
              label="Previous"
              disabled={page <= 1}
              onPress={() => {
                setPage((p) => p - 1);
                setLoading(true);
              }}
            />
            <PrimaryButton
              label="Next"
              disabled={page >= result.last_page}
              onPress={() => {
                setPage((p) => p + 1);
                setLoading(true);
              }}
            />
          </>
        )
      )}
    </View>
  );
}
