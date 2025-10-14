import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { setPriority } from '../store/tripPlannerSlice';

const marks = ['time', 'cost', 'co2', 'reliability'];

export default function GoalSelector({ value = 'time' }) {
  const dispatch = useDispatch();
  return (
    <View style={{ marginVertical: 12 }}>
      <Text style={styles.label}>Optimize for</Text>
      <View style={styles.row}>
        {marks.map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => dispatch(setPriority(m))}
            style={[styles.chip, value === m && styles.chipActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, value === m && styles.chipTextActive]}>
              {m.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.tip}>Tap a chip: Time ↔ Cost ↔ CO₂ ↔ Reliability</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 8, color: '#0f172a' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
    backgroundColor: '#e5e7eb', marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: '#111827' },
  chipText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#fff' },
  tip: { marginTop: 6, fontSize: 12, color: '#475569' },
});
