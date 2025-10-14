import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const ScreenBg = ({ children }) => (
  <LinearGradient
    colors={['#e6f0ff', '#f8e8ff', '#fff4e6']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{ flex: 1 }}
  >
    {children}
  </LinearGradient>
);

export const s = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { padding: 16, paddingBottom: 24 },
  header: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#334155', marginTop: 4 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  shadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
      default: {}, // web
    }),
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  btn: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
