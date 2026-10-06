import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme/tokens';

const icons = { Home: '⌂', Discover: '⌕', Account: '◉' };
export default function TabsLayout() {
  const { status } = useAuth();
  if (status !== 'authenticated') return <Redirect href={'/login' as never} />;
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.mutedForeground, tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.white }, tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21 }}>{icons[route.name as keyof typeof icons]}</Text> })}><Tabs.Screen name="index" options={{ title: 'Home' }} /><Tabs.Screen name="discover" options={{ title: 'Discover' }} /><Tabs.Screen name="account" options={{ title: 'Account' }} /></Tabs>;
}
