import { useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PrimaryButton } from "@/components/primary-button";
import { apiRequest } from "@/lib/api";
import { apiBaseUrl } from "@/config/api";
export function PosterUpload({
  value,
  token,
  onChange,
  onBusy,
}: {
  value: string;
  token: string;
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pick() {
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024)
        throw new Error("Choose an image smaller than 5 MB.");
      const data = new FormData();
      if (Platform.OS === "web" && asset.file) data.append("image", asset.file);
      else
        data.append("image", {
          uri: asset.uri,
          name: asset.fileName ?? "poster.jpg",
          type: asset.mimeType ?? "image/jpeg",
        } as unknown as Blob);
      const uploaded = await apiRequest<{ image: string }>("/admin/images", {
        method: "POST",
        token,
        body: data,
      });
      onChange(uploaded.image.replace(apiBaseUrl.replace(/\/api$/, ""), ""));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  const preview = value.startsWith("/api/media/")
    ? apiBaseUrl.replace(/\/api$/, "") + value
    : value;
  return (
    <View style={{ gap: 8 }}>
      <PrimaryButton
        label={busy ? "Uploading…" : "Choose poster image"}
        disabled={busy}
        onPress={() => void pick()}
      />
      <Text>
        JPG, PNG or WebP, up to 5 MB and 4096 × 4096 pixels. Save the event to
        attach it.
      </Text>
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
      {!!preview && (
        <>
          <Image
            source={{ uri: preview }}
            accessibilityLabel="Poster preview"
            style={{ height: 160, width: "100%" }}
            resizeMode="contain"
          />
          <PrimaryButton
            label="Remove poster from form"
            disabled={busy}
            onPress={() => onChange("")}
          />
        </>
      )}
    </View>
  );
}
