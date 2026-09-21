import { useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Screen = 'login' | 'signup' | 'home';

const categories = [
  { icon: '🎬', label: 'Cinema', color: '#261114' },
  { icon: '🎤', label: 'Concerts', color: '#181818' },
  { icon: '✨', label: 'Events', color: '#21171A' },
];

export default function TixoraApp() {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const signingUp = screen === 'signup';

  if (screen === 'home') {
    return <HomeCanvas name={name || 'Tixora guest'} onSignOut={() => setScreen('login')} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.authHero}>
          <Image source={require('@/assets/images/tixora-logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.tagline}>Your next great moment starts here.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{signingUp ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {signingUp ? 'Save your tickets and discover what’s on.' : 'Sign in to manage your next experience.'}
          </Text>

          {signingUp && <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />}
          <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />

          {!signingUp && <Text style={styles.forgot}>Forgot password?</Text>}
          <Pressable style={styles.primary} onPress={() => setScreen('home')}>
            <Text style={styles.primaryText}>{signingUp ? 'Create account' : 'Sign in'}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.or}>or</Text>
            <View style={styles.divider} />
          </View>

          <Pressable style={styles.social} onPress={() => setScreen('home')}>
            <Text style={styles.google}>G</Text>
            <Text style={styles.socialText}>Continue with Google</Text>
          </Pressable>
          <Text style={styles.switchText}>
            {signingUp ? 'Already have an account? ' : 'New to Tixora? '}
            <Text style={styles.link} onPress={() => setScreen(signingUp ? 'login' : 'signup')}>
              {signingUp ? 'Sign in' : 'Create an account'}
            </Text>
          </Text>
        </View>
        <Text style={styles.terms}>By continuing, you agree to Tixora’s Terms and Privacy Policy.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType={props.keyboardType}
        placeholder={props.placeholder}
        placeholderTextColor="#8D8D8D"
        secureTextEntry={props.secureTextEntry}
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}

function HomeCanvas({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  return (
    <SafeAreaView style={styles.homeSafe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View>
            <Text style={styles.greeting}>Hello, {name.split(' ')[0]}!</Text>
            <Text style={styles.location}>📍 SM City — What’s happening today?</Text>
          </View>
          <Pressable accessibilityLabel="Sign out" style={styles.avatar} onPress={onSignOut}>
            <Text style={styles.avatarText}>ME</Text>
          </Pressable>
        </View>

        <Pressable style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchText}>Search movies, concerts, events</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.eyebrow}>THIS WEEKEND</Text>
          <Text style={styles.heroTitle}>Find your{`\n`}next favorite night.</Text>
          <Pressable style={styles.heroButton}><Text style={styles.heroButtonText}>Explore now  →</Text></Pressable>
          <Text style={styles.ticket}>🎟️</Text>
        </View>

        <Text style={styles.section}>Discover</Text>
        <View style={styles.categories}>
          {categories.map((category) => (
            <Pressable key={category.label} style={styles.category}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}><Text style={styles.emoji}>{category.icon}</Text></View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}><Text style={styles.section}>Now showing</Text><Text style={styles.link}>See all</Text></View>
        <Pressable style={styles.event}>
          <View style={styles.poster}><Text style={styles.posterIcon}>🎞️</Text></View>
          <View style={styles.eventInfo}>
            <Text style={styles.type}>CINEMA</Text>
            <Text style={styles.eventName}>Stories on Screen</Text>
            <Text style={styles.meta}>Today · Cinema 2 · from ₱250</Text>
            <View style={styles.pill}><Text style={styles.pillText}>Tickets available</Text></View>
          </View>
        </Pressable>

        <View style={styles.nav}>
          <Nav icon="⌂" label="Home" active />
          <Nav icon="◫" label="Discover" />
          <Nav icon="▣" label="Tickets" />
          <Nav icon="✦" label="Assistant" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Nav({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return <View style={styles.navItem}><Text style={[styles.navIcon, active && styles.active]}>{icon}</Text><Text style={[styles.navLabel, active && styles.active]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080808' },
  authScroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  authHero: { alignItems: 'center', marginBottom: 30 },
  logoImage: { width: 240, height: 78 },
  tagline: { color: '#A7A7A7', fontSize: 14, marginTop: 11 },
  card: { backgroundColor: '#161616', borderColor: '#2B2B2B', borderRadius: 20, borderWidth: 1, padding: 23 },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '800' },
  subtitle: { color: '#ADADAD', lineHeight: 20, marginBottom: 22, marginTop: 6 },
  field: { marginBottom: 16 },
  label: { color: '#ECECEC', fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { backgroundColor: '#242424', borderColor: '#393939', borderRadius: 10, borderWidth: 1, color: '#FFFFFF', fontSize: 15, height: 50, paddingHorizontal: 14 },
  forgot: { color: '#E50914', fontSize: 13, fontWeight: '700', marginBottom: 20, marginTop: -6, textAlign: 'right' },
  primary: { alignItems: 'center', backgroundColor: '#E50914', borderRadius: 10, height: 52, justifyContent: 'center', marginTop: 7 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginVertical: 19 },
  divider: { backgroundColor: '#343434', flex: 1, height: 1 },
  or: { color: '#8D8D8D', fontSize: 12 },
  social: { alignItems: 'center', borderColor: '#4A4A4A', borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 11, height: 50, justifyContent: 'center' },
  google: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  socialText: { color: '#F2F2F2', fontWeight: '700' },
  switchText: { color: '#A9A9A9', fontSize: 13, marginTop: 22, textAlign: 'center' },
  link: { color: '#E50914', fontWeight: '800' },
  terms: { color: '#767676', fontSize: 11, lineHeight: 16, marginTop: 18, paddingHorizontal: 20, textAlign: 'center' },
  homeSafe: { backgroundColor: '#080808', flex: 1 },
  homeScroll: { padding: 20, paddingBottom: 12 },
  top: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  location: { color: '#A8A8A8', fontSize: 12, marginTop: 5 },
  avatar: { alignItems: 'center', backgroundColor: '#301013', borderColor: '#E50914', borderRadius: 21, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  avatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  search: { alignItems: 'center', backgroundColor: '#1B1B1B', borderColor: '#303030', borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 10, height: 48, marginBottom: 21, paddingHorizontal: 15 },
  searchIcon: { color: '#D9D9D9', fontSize: 25, lineHeight: 25 },
  searchText: { color: '#969696', fontSize: 13 },
  hero: { backgroundColor: '#22080A', borderColor: '#7A171D', borderRadius: 20, borderWidth: 1, height: 193, marginBottom: 27, overflow: 'hidden', padding: 21 },
  heroGlow: { backgroundColor: '#8D1018', borderRadius: 110, height: 215, opacity: 0.8, position: 'absolute', right: -55, top: -65, width: 215 },
  eyebrow: { color: '#FF9DA2', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '800', letterSpacing: -0.7, lineHeight: 31, marginTop: 10 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: '#E50914', borderRadius: 8, marginTop: 16, paddingHorizontal: 13, paddingVertical: 9 },
  heroButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  ticket: { bottom: 18, fontSize: 54, position: 'absolute', right: 17 },
  section: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  categories: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, marginTop: 15 },
  category: { alignItems: 'center', width: '30%' },
  categoryIcon: { alignItems: 'center', borderColor: '#363636', borderRadius: 21, borderWidth: 1, height: 66, justifyContent: 'center', marginBottom: 8, width: 66 },
  emoji: { fontSize: 29 },
  categoryLabel: { color: '#E5E5E5', fontSize: 13, fontWeight: '700' },
  sectionHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  event: { backgroundColor: '#171717', borderColor: '#303030', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 13, padding: 12 },
  poster: { alignItems: 'center', backgroundColor: '#4A1014', borderRadius: 12, height: 100, justifyContent: 'center', width: 83 },
  posterIcon: { fontSize: 34 },
  eventInfo: { flex: 1, justifyContent: 'center' },
  type: { color: '#FF6A70', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  eventName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 5 },
  meta: { color: '#A6A6A6', fontSize: 11, lineHeight: 16, marginTop: 5 },
  pill: { alignSelf: 'flex-start', backgroundColor: '#252525', borderRadius: 6, marginTop: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { color: '#FF8A8F', fontSize: 9, fontWeight: '800' },
  nav: { borderTopColor: '#303030', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', marginTop: 25, paddingTop: 14 },
  navItem: { alignItems: 'center', gap: 4 },
  navIcon: { color: '#858585', fontSize: 20, height: 21 },
  navLabel: { color: '#858585', fontSize: 10, fontWeight: '600' },
  active: { color: '#E50914', fontWeight: '800' },
});
