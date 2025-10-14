// screens/ShortestPathScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { searchPlaces } from "../lib/geocode";

export default function ShortestPathScreen({ navigation }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Use real geocoding from lib/geocode.js
  const geocode = async (place) => {
    const results = await searchPlaces(place, { country: "bd" });
    if (!results.length) throw new Error(`Could not find location: ${place}`);
    return {
      lat: results[0].lat,
      lng: results[0].lng,
      name: results[0].name,
    };
  };

  const onSubmit = async () => {
    if (!from || !to) {
      Alert.alert('Missing input', 'Please enter both From and To locations.');
      return;
    }
    try {
      const origin = await geocode(from);
      const destination = await geocode(to);
      navigation.navigate('RideSummary', { origin, destination });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>From:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter origin city"
        value={from}
        onChangeText={setFrom}
      />

      <Text style={styles.label}>To:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter destination city"
        value={to}
        onChangeText={setTo}
      />

      <TouchableOpacity style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Show Shortest Path</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#2F80ED', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
