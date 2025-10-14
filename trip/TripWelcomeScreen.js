// trip/TripWelcomeScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const APP_DARK = '#0f172a'; // your slate-900
const PASTELS = ['#e6f0ff', '#f8e8ff', '#fff4e6'];

const MODE_LIST = [
  { key: 'BUS', label: 'Bus', icon: <Ionicons name="bus" size={18} color={APP_DARK} /> },
  { key: 'TRAIN', label: 'Rail', icon: <Ionicons name="train" size={18} color={APP_DARK} /> },
  { key: 'AIR', label: 'Plane', icon: <Ionicons name="airplane" size={18} color={APP_DARK} /> },
  { key: 'FERRY', label: 'Ferry', icon: <MaterialCommunityIcons name="ferry" size={18} color={APP_DARK} /> },
  { key: 'RIDE_HAIL', label: 'Ride', icon: <Ionicons name="car" size={18} color={APP_DARK} /> },
];

export default function TripWelcomeScreen({ navigation }) {
  const [selected, setSelected] = useState(MODE_LIST.map(m => m.key)); // all on

  const toggle = (k) =>
    setSelected((cur) => cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]);

  const goPlan = (tripType) =>
    navigation.navigate('TripPlanner', { tripType, modes: selected });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Ambient gradient background */}
      <LinearGradient
        colors={PASTELS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Start Your Next Adventure</Text>
            <Text style={styles.title}>Discover Your Dream Vacation</Text>
            <Text style={styles.sub}>
              Plan multi-modal journeys that combine buses, rail, flights, ferries and rides — in one flow.
            </Text>
          </View>

          {/* Image: use your own asset for exact brand colors */}
          <View style={styles.heroImgWrap}>
            {/* Option A: local asset (put a PNG at assets/travel-hero.png) */}
            {/* <Image source={require('../assets/travel-hero.png')} style={styles.heroImg} /> */}

            {/* Option B: curated illustration fallback (works immediately) */}
            <Image
              style={styles.heroImg}
              resizeMode="contain"
              source={{ uri: 'https://i.imgur.com/fy9m3rB.png' }} // soft pastel travel illustration
            />
          </View>
        </View>

        {/* Modes selector */}
        <Text style={styles.sectionTitle}>Choose travel modes</Text>
        <View style={styles.modeRow}>
          {MODE_LIST.map(m => {
            const active = selected.includes(m.key);
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => toggle(m.key)}
                activeOpacity={0.9}
                style={[styles.modeChip, active && styles.modeChipActive]}
              >
                <View style={[styles.modeIcon, active && styles.modeIconActive]}>
                  {m.icon}
                </View>
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Destination scope */}
        <Text style={styles.sectionTitle}>Where are you going?</Text>

        <View style={{ gap: 12 }}>
          {/* Inside Country */}
          <TouchableOpacity activeOpacity={0.95} onPress={() => goPlan('domestic')}>
            <LinearGradient
              colors={['#ffffff', 'rgba(255,255,255,0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scopeCard}
            >
              <View style={styles.scopeIconWrap}>
                <FontAwesome5 name="route" size={18} color={APP_DARK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scopeTitle}>Inside Country</Text>
                <Text style={styles.scopeSub}>City-to-city road & rail, plus local rides.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={APP_DARK} style={{ opacity: 0.4 }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Outside Country */}
          <TouchableOpacity activeOpacity={0.95} onPress={() => goPlan('international')}>
            <LinearGradient
              colors={['#ffffff', 'rgba(255,255,255,0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scopeCard}
            >
              <View style={[styles.scopeIconWrap, { backgroundColor: 'rgba(14,165,233,0.16)' }]}>
                <Ionicons name="airplane" size={18} color={APP_DARK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scopeTitle}>Outside Country</Text>
                <Text style={styles.scopeSub}>Flights + connections by bus/rail and rides.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={APP_DARK} style={{ opacity: 0.4 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Skip CTA */}
        <TouchableOpacity style={styles.skipBtn} onPress={() => goPlan('auto')}>
          <Text style={styles.skipText}>Skip — I’ll choose in the planner</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    marginBottom: 16,
  },
  kicker: { color: '#334155', fontWeight: '700', marginBottom: 4 },
  title: { color: APP_DARK, fontWeight: '900', fontSize: 22, lineHeight: 26 },
  sub: { color: '#475569', marginTop: 6 },
  heroImgWrap: {
    marginLeft: 12, width: 110, height: 110, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(15,23,42,0.06)', backgroundColor: '#fff'
  },
  heroImg: { width: '100%', height: '100%' },

  sectionTitle: { color: APP_DARK, fontWeight: '800', marginVertical: 10, marginTop: 14 },

  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.06)'
  },
  modeChipActive: { backgroundColor: '#111827' },
  modeIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginRight: 8 },
  modeIconActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  modeText: { color: APP_DARK, fontWeight: '800', fontSize: 12 },
  modeTextActive: { color: '#fff' },

  scopeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(15,23,42,0.08)', backgroundColor: '#fff'
  },
  scopeIconWrap: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(22,163,74,0.14)', marginRight: 12, borderWidth: 1, borderColor: 'rgba(15,23,42,0.06)'
  },
  scopeTitle: { color: APP_DARK, fontWeight: '900' },
  scopeSub: { color: '#334155', marginTop: 2 },

  skipBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 18 },
  skipText: { color: '#334155', fontWeight: '700' },
});
