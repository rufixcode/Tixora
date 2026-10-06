import type { ImageStyle } from 'react-native';
import { Image, StyleSheet } from 'react-native';

export function BrandLogo({ style }: { style?: ImageStyle }) {
  return <Image accessibilityLabel="Tixora" source={require('@/assets/images/tixora-logo.png')} resizeMode="contain" style={[styles.logo, style]} />;
}
const styles = StyleSheet.create({ logo: { height: 50, width: 166 } });
