import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ItineraryCard({ it }) {
  const navigation = useNavigation();
  const mins = Math.round(it.totalDurationSec / 60);
  return (
    <TouchableOpacity style={styles.card}
      onPress={() => navigation.navigate('TripDetails', { id: it.id, item: it })}>
      <Text style={styles.title}>{it.label}</Text>
      <Text style={styles.meta}>~{mins} min · ৳{it.totalCost} · {(it.totalCo2g||0)/1000} kg CO₂</Text>
      <View style={styles.row}>
        {it.legs.map(l => (
          <View key={l.id} style={styles.chip}><Text style={styles.chipText}>{l.mode}</Text></View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(15,23,42,0.08)', backgroundColor: '#fff', marginBottom: 12 },
  title: { fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  meta: { color: '#334155' },
  row: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 6 },
  chipText: { fontSize: 12, color: '#0f172a' },
});
