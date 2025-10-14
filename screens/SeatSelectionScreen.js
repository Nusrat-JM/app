import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import theme from '../lib/theme';

export default function SeatSelectionScreen({ route }) {
  const { bus } = route.params;

  const totalSeats = 20;
  const bookedSeats = [2, 5, 8, 12]; 
  const [selectedSeats, setSelectedSeats] = useState([]);

  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return; 
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{bus.name} - {bus.time}</Text>
      <Text style={styles.subHeader}>Type: {bus.type} | Price: ${bus.price}</Text>

      <Text style={styles.label}>Select your seats:</Text>

      <ScrollView contentContainerStyle={styles.seatContainer}>
        {Array.from({ length: totalSeats }, (_, i) => {
          const seatNumber = i + 1;
          let seatColor = '#4CAF50'; 
          if (bookedSeats.includes(seatNumber)) seatColor = '#F44336'; 
          if (selectedSeats.includes(seatNumber)) seatColor = '#1976D2'; 
          return (
            <TouchableOpacity
              key={i}
              style={[styles.seat, { backgroundColor: seatColor }]}
              onPress={() => toggleSeat(seatNumber)}
            >
              <Text style={styles.seatText}>{seatNumber}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => alert(`Booked seats: ${selectedSeats.join(', ')}`)}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md, backgroundColor: '#F8F9FA' },
  header: { fontSize: theme.typography.h2, fontWeight: '700', color: '#000' },
  subHeader: { fontSize: theme.typography.h3, color: '#4A90E2', marginVertical: 8 },
  label: { fontWeight: '600', fontSize: theme.typography.h3, marginTop: 16, marginBottom: 12 },
  seatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  seat: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatText: { color: '#fff', fontWeight: '700' },
  bookButton: {
    backgroundColor: '#1976D2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonText: { color: '#fff', fontWeight: '700', fontSize: theme.typography.h2 },
});
