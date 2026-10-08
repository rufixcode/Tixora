import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import type { AdminPage } from "@/lib/admin";
import { colors } from "@/theme/tokens";
export function CustomerDirectory({ token }: { token: string }) {
  const [result, setResult] = useState<AdminPage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ q: search, page: String(page) });
    apiRequest<AdminPage>(`/admin/customers?${params}`, {
      token,
    })
      .then((data) => {
        if (!active) return;
        setResult(data);
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
  }, [token, search, page, refresh]);
  function reload() {
    setLoading(true);
    setRefresh((v) => v + 1);
  }
  return (
    <View style={{ gap: 14 }}>
      <PrimaryButton label="Refresh" disabled={loading} onPress={reload} />
      {
        <>
          <TextInput
            accessibilityLabel="Search customers"
            placeholder="Name or email"
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
        </>
      }
      {!!error ? (
        <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
          {error}
        </Text>
      ) : loading ? (
        <Text>Loading…</Text>
      ) : (
        result && (
          <>
            <Text>{result.total} accounts</Text>
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
                <Text style={{ fontWeight: "800" }}>{row.name}</Text>
                <Text>{row.is_admin ? "Administrator" : "Customer"}</Text>

                <Text>{row.email}</Text>
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
