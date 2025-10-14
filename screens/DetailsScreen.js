import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../lib/theme';
import FloatingBar from '../components/FloatingBar';
import { getBookingStats } from '../lib/bookings';

//this will show the overall usage of a user

export default function DetailsScreen({ navigation }) {
  const [stats, setStats] = useState({ totalSpent: 0, totalRides: 0, vehicleUsage: {} });

  useEffect(() => {
    (async () => {
      const s = await getBookingStats();
      setStats(s);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details</Text>
      <View style={styles.card}>
        <Text style={{fontWeight: '700'}}>Total rides</Text>
        <Text style={{fontSize: 22, fontWeight: '800'}}>{stats.totalRides}</Text>
      </View>
      <View style={styles.card}>
        <Text style={{fontWeight: '700'}}>Total spent</Text>
        <Text style={{fontSize: 22, fontWeight: '800'}}>{stats.totalSpent}</Text>
      </View>

      <Text style={{marginTop: 12, fontWeight: '700'}}>Vehicle usage</Text>
      {Object.keys(stats.vehicleUsage || {}).map((k) => (
        <View key={k} style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
          <Text>{k}</Text>
          <Text style={{fontWeight: '700'}}>{stats.vehicleUsage[k]}</Text>
        </View>
      ))}

      <FloatingBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.outline, marginTop: 8 }
});