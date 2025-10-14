import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import theme from '../lib/theme';
import FloatingBar from '../components/FloatingBar';
import { estimateShiftCost } from '../lib/pricing';
import { saveBooking } from '../lib/bookings';

export default function ShiftScreen({ navigation }) {
  const [fromLat, setFromLat] = useState('37.7749');
  const [fromLon, setFromLon] = useState('-122.4194');
  const [toLat, setToLat] = useState('37.7849');
  const [toLon, setToLon] = useState('-122.4094');
  const [estimate, setEstimate] = useState(null);

  const calculate = () => {
    const from = { latitude: parseFloat(fromLat), longitude: parseFloat(fromLon) };
    const to = { latitude: parseFloat(toLat), longitude: parseFloat(toLon) };
    const res = estimateShiftCost(from, to);
    setEstimate(res);
  };

  const handleBook = async () => {
    if (!estimate) return Alert.alert('Estimate first', 'Please calculate price before booking');
    const booking = {
      type: 'shift',
      vehicle: 'mini-truck',
      from: { latitude: parseFloat(fromLat), longitude: parseFloat(fromLon) },
      to: { latitude: parseFloat(toLat), longitude: parseFloat(toLon) },
      price: estimate.price,
      createdAt: Date.now(),
    };
    const ok = await saveBooking(booking);
    if (ok) {
      Alert.alert('Booked', `Shift booked for ${estimate.price}`);
      navigation.navigate('Home');
    } else {
      Alert.alert('Error', 'Failed to save booking');//faild logic
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shift your home</Text>
      <Text style={{marginTop: 8, fontWeight: '600'}}>From</Text>
      <TextInput style={styles.input} value={fromLat} onChangeText={setFromLat} keyboardType="numeric" placeholder="Latitude" />
      <TextInput style={styles.input} value={fromLon} onChangeText={setFromLon} keyboardType="numeric" placeholder="Longitude" />

      <Text style={{marginTop: 8, fontWeight: '600'}}>To</Text>
      <TextInput style={styles.input} value={toLat} onChangeText={setToLat} keyboardType="numeric" placeholder="Latitude" />
      <TextInput style={styles.input} value={toLon} onChangeText={setToLon} keyboardType="numeric" placeholder="Longitude" />

      <TouchableOpacity style={styles.estimateButton} onPress={calculate}>
        <Text style={{color: '#fff', fontWeight: '700'}}>Estimate Price</Text>
      </TouchableOpacity>

      {estimate && (
        <View style={styles.estimateBox}>
          <Text style={{fontWeight: '700'}}>Price: {estimate.price}</Text>
          <Text style={{color: theme.colors.muted}}>Distance: {estimate.distanceKm.toFixed(2)} km</Text>
        </View>
      )}

      <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
        <Text style={{color: '#fff', fontWeight: '700'}}>Book Shift</Text>
      </TouchableOpacity>

      <FloatingBar navigation={navigation} /> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  input: { backgroundColor: theme.colors.surface, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.outline, marginTop: 8 },
  estimateButton: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  estimateBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: theme.colors.outline },
  bookButton: { backgroundColor: '#111', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 }
});