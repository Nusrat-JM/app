import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const makeMockItineraries = (origin, destination) => {
  // Simple mocked results so the flow works immediately
  return [
    { id: 'it1', label: 'Recommended', mins: 48, cost: 110, co2kg: 0.7, legs: ['WALK','METRO','RIDE_HAIL'] },
    { id: 'it2', label: 'Fastest',     mins: 42, cost: 165, co2kg: 1.0, legs: ['RIDE_HAIL','METRO','WALK'] },
    { id: 'it3', label: 'Cheapest',    mins: 60, cost: 40,  co2kg: 0.4, legs: ['WALK','BUS','WALK'] },
  ];
};

export default function TripResultsScreen({ navigation, route }) {
  const { origin, destination, priority } = route.params || {};
  const data = useMemo(() => makeMockItineraries(origin, destination), [origin, destination]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Top routes</Text>
      <Text style={styles.sub}>
        {origin} → {destination} · Pref: {priority}
      </Text>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TripDetails', { itineraryId: item.id, item })}
          >
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.meta}>~{item.mins} min · ৳{item.cost} · {item.co2kg} kg CO₂</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {item.legs.map((m, idx) => (
                <View key={idx} style={styles.chip}><Text style={styles.chipText}>{m}</Text></View>
              ))}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  h1: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#475569', marginBottom: 12 },
  card: {
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(15,23,42,0.08)',
    backgroundColor: '#fff', marginBottom: 12
  },
  cardTitle: { fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  meta: { color: '#334155' },
  chip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 8 },
  chipText: { fontSize: 12, color: '#0f172a' },
});
