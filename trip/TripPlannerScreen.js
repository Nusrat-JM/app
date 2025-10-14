import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function TripPlannerScreen({ navigation, route }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const priorityFromOffer = route?.params?.priority ?? 'time';
  const tripType = route?.params?.tripType || 'auto';          // 'domestic' | 'international' | 'auto'
  const defaultModes = route?.params?.modes || ['BUS','TRAIN','AIR','FERRY','RIDE_HAIL'];
  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Trip Planner</Text>
      <Text style={styles.sub}>Multi-modal (bus · metro · ride · walk)</Text>

      <Text style={styles.label}>Origin</Text>
      <TextInput
        value={origin}
        onChangeText={setOrigin}
        placeholder="e.g., Dhanmondi 27"
        style={styles.input}
      />

      <Text style={styles.label}>Destination</Text>
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder="e.g., Uttara North Metro"
        style={styles.input}
      />

      <Text style={styles.meta}>Preference: {priorityFromOffer}</Text>

      <TouchableOpacity
        style={[styles.btn, !(origin && destination) && styles.btnDisabled]}
        disabled={!(origin && destination)}
        onPress={() =>
          navigation.navigate('TripResults', {
            origin,
            destination,
            priority: priorityFromOffer,
            departAt: Date.now(),
          })
        }
      >
        <Text style={styles.btnText}>Plan Trip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#475569', marginTop: 4, marginBottom: 16 },
  label: { fontWeight: '700', marginTop: 10, marginBottom: 6, color: '#0f172a' },
  input: {
    borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff'
  },
  meta: { marginTop: 10, color: '#334155' },
  btn: {
    marginTop: 16, backgroundColor: '#111827', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center'
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '800' },
});
