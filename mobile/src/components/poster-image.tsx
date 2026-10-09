import { useState } from "react";
import {
  Image,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import { mediaUrl } from "@/lib/media";
import { colors } from "@/theme/tokens";

export function PosterImage({
  uri,
  title,
  style,
}: {
  uri?: string | null;
  title: string;
  style: StyleProp<ImageStyle>;
}) {
  const source = mediaUrl(uri);
  const [failed, setFailed] = useState<string | null>(null);
  if (!source || failed === source)
    return (
      <View
        style={[
          style,
          {
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.muted,
            padding: 8,
          },
        ]}
      >
        <Text
          accessibilityLabel={`${title}: poster unavailable`}
          style={{
            color: colors.mutedForeground,
            textAlign: "center",
            fontSize: 11,
          }}
        >
          Poster unavailable
        </Text>
      </View>
    );
  return (
    <Image
      accessibilityLabel={`${title} poster`}
      source={{ uri: source }}
      resizeMode="cover"
      style={style}
      onError={() => setFailed(source)}
    />
  );
}
