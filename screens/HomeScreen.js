// screens/HomeScreen.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../lib/theme';
import FloatingBar from '../components/FloatingBar';

/* ---------- Offer helpers (UI only) ---------- */
function computeOffer({ trips = 0, totalSpent = 0 } = {}) {
  if (trips >= 20 || totalSpent >= 30000) {
    return { badge: 'PLATINUM', pct: 30, tagline: 'Your loyalty deserves more.', colors: ['#ffd6e7', '#e8d3ff', '#d7f2ff'] };
  }
  if (trips >= 12 || totalSpent >= 20000) {
    return { badge: 'GOLD', pct: 20, tagline: 'Ride more, pay less.', colors: ['#fff0d6', '#f3e8ff', '#e6fffa'] };
  }
  if (trips >= 5 || totalSpent >= 8000) {
    return { badge: 'SILVER', pct: 12, tagline: 'Keep going — you’re close!', colors: ['#ecffe6', '#e6f0ff', '#fff6e6'] };
  }
  return { badge: 'WELCOME', pct: 7, tagline: 'Kickstart your first rides.', colors: ['#eef2ff', '#fdf2f8', '#fef9c3'] };
}

function OfferCard({ stats, onApply = () => {} }) {
  const offer = useMemo(() => computeOffer(stats), [stats]);
  const glow = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] });

  return (
    <LinearGradient colors={offer.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.offer}>
      <Animated.View style={[styles.offerGlow, { opacity: glowOpacity }]} />
      <View style={styles.offerHeader}>
        <View style={styles.badgePill}>
          <Ionicons name="sparkles" size={14} color="#111827" />
          <Text style={styles.badgeText}>{offer.badge}</Text>
        </View>
        <Ionicons name="gift" size={20} color="#111827" />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
        <Text style={styles.offerPct}>{offer.pct}</Text>
        <Text style={styles.offerPctSmall}>% OFF</Text>
      </View>
      <Text style={styles.offerTag}>{offer.tagline}</Text>

      <TouchableOpacity activeOpacity={0.9} style={styles.offerBtn} onPress={onApply}>
        <Text style={styles.offerBtnText}>Apply Now</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

export default function HomeScreen({ navigation, route }) {
  const stats = route?.params?.userStats || { trips: 0, totalSpent: 0 };
  // Replace the fallback with your authenticated user's id if available
  const userId = route?.params?.userId ?? 1;

  const cards = [
    {
      title: 'Get a Ride',
      subtitle: 'Fast rides around town',
      icon: <Ionicons name="car" size={24} color="#0f172a" />,
      navigateTo: 'PickRide',
    },
    {
      title: 'Send a Package',
      subtitle: 'Deliver items safely',
      icon: <MaterialCommunityIcons name="package-variant" size={24} color="#0f172a" />,
      navigateTo: 'Package',
    },
    {
      title: 'Shift Your Home',
      subtitle: 'Mini truck for moving',
      icon: <FontAwesome5 name="truck-moving" size={22} color="#0f172a" />,
      navigateTo: 'Shift',
    },
    {
      title: 'Shortest Path',
      subtitle: 'Check best route with traffic',
      icon: <Ionicons name="map" size={24} color="#0f172a" />,
      navigateTo: 'ShortestPath',
      params: {
        origin: { latitude: 37.7749, longitude: -122.4194 },
        destination: { latitude: 34.0522, longitude: -118.2437 },
      },
    },
    {
      title: 'Plan My Trip',
      subtitle: 'Bus + Plane + Rail + Ferry',
      icon: <Ionicons name="git-branch-outline" size={24} color="#0f172a" />,
      navigateTo: 'TripIntro',
      params: { departAt: Date.now() + 15 * 60 * 1000 },
    },
  ];

  const gradients = [
    ['#eef2ff', '#fff7ed'],
    ['#fdf2f8', '#f0fdf4'],
    ['#e0f2fe', '#fff1f2'],
    ['#fef3c7', '#ede9fe'],
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#e6f0ff', '#f8e8ff', '#fff4e6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Home</Text>
        <Text style={styles.title}>What do you need?</Text>

        <OfferCard
          stats={stats}
          onApply={() => navigation.navigate('EcoRewards', { userId })}
        />

        {/* >>> ACTION ROW: appears ABOVE the first card <<< */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionTicket, styles.actionBtnLeft]}
            onPress={() => navigation.navigate('TicketBooking')}
            activeOpacity={0.9}
          >
            <Ionicons name="ticket" size={18} color="#0f172a" style={{ marginRight: 8 }} />
            <Text style={[styles.actionText, { color: '#0f172a' }]}>Book Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDashboard]}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.9}
          >
            <Ionicons name="stats-chart" size={18} color="#052e16" style={{ marginRight: 8 }} />
            <Text style={[styles.actionText, { color: '#052e16' }]}>Dashboard</Text>
          </TouchableOpacity>
        </View>
        {/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}

        {/* Cards list — "Get a Ride" is the first card after the action row */}
        {cards.map((c, i) => {
          const scale = new Animated.Value(1);

          const onPressIn = () => {
            Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
          };

          const onPressOut = () => {
            Animated.spring(scale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
          };

          return (
            <TouchableWithoutFeedback
              key={`${c.title}-${i}`}
              onPress={() => navigation.navigate(c.navigateTo, c.params)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
            >
              <Animated.View style={{ transform: [{ scale }], marginBottom: theme.spacing.md }}>
                <LinearGradient
                  colors={gradients[i % gradients.length]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={['#ffffff', 'rgba(255,255,255,0.65)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconInner}
                    >
                      {c.icon}
                    </LinearGradient>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    <Text style={styles.cardSubtitle}>{c.subtitle}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#0f172a" style={{ opacity: 0.5 }} />
                </LinearGradient>
              </Animated.View>
            </TouchableWithoutFeedback>
          );
        })}

        <View style={{ height: 110 }} />
      </ScrollView>

      <FloatingBar navigation={navigation} />
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: theme.spacing.md, paddingBottom: 120 },

  header: {
    fontSize: theme.typography.h2,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.h1,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: theme.spacing.lg,
  },

  /* Offer */
  offer: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    marginBottom: theme.spacing.lg,
  },
  offerGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 200,
    backgroundColor: '#ffffff',
  },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontWeight: '900', color: '#111827', fontSize: 11, letterSpacing: 0.8 },
  offerPct: { fontSize: 38, fontWeight: '900', color: '#0f172a', lineHeight: 40 },
  offerPctSmall: { marginLeft: 6, marginBottom: 4, fontSize: 16, fontWeight: '800', color: '#334155' },
  offerTag: { marginTop: 6, color: '#1f2937', fontSize: 14 },
  offerBtn: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  offerBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.4 },

  /* Action buttons row (now above the cards) */
  actionRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: theme.radii.md,
  },
  actionBtnLeft: { marginRight: 10 },
  actionTicket: { backgroundColor: 'rgba(15,23,42,0.06)' },
  actionDashboard: { backgroundColor: 'rgba(22,163,74,0.12)' },
  actionText: { fontWeight: '800', fontSize: theme.typography.h3 },

  /* Card tiles */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff00',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  iconInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: theme.typography.h2, fontWeight: '800', color: '#0f172a' },
  cardSubtitle: { color: '#334155', marginTop: 2 },
});
