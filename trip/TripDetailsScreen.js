import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function TripDetailsScreen({ route, navigation }) {
  const { item } = route.params || {};
  if (!item) return <View style={styles.wrap}><Text>No itinerary.</Text></View>;

  const handleBookTransit = () => {
    // Jump to your existing ticket screen with prefilled payload (you can refine later)
    navigation.navigate('TicketBooking', {
      routeId: 'MRT',
      fromStop: 'Agargaon',
      toStop: 'Uttara North',
      departTime: Date.now() + 10 * 60 * 1000,
    });
  };

  const handleBookRide = () => {
    // Open your in-app ride flow (replace screen name with your ride screen)
    Alert.alert('Ride', 'Open your ride booking flow here with origin/destination prefilled.');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>{item.label}</Text>
      <Text style={styles.sub}>~{item.mins} min · ৳{item.cost} · {item.co2kg} kg CO₂</Text>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Legs</Text>
        {item.legs.map((m, i) => (
          <Text key={i} style={styles.leg}>• {m}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleBookTransit}>
        <Text style={styles.btnText}>Book Transit Ticket</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#0ea5e9' }]} onPress={handleBookRide}>
        <Text style={styles.btnText}>Book Ride Connector</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  h1: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#475569', marginBottom: 14 },
  box: { borderWidth: 1, borderColor: 'rgba(15,23,42,0.08)', borderRadius: 12, padding: 12, marginBottom: 16 },
  boxTitle: { fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  leg: { color: '#334155', marginVertical: 2 },
  btn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '800' },
});
