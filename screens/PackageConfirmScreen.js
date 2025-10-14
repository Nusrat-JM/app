import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../lib/routing/baseURL';
import theme from '../lib/theme';

function Row({ left, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Text style={styles.rowRight}>{right}</Text>
    </View>
  );
}

async function getToken() {
  return (await SecureStore.getItemAsync('token')) || (await AsyncStorage.getItem('token'));
}
async function getRiderId() {
  return (
    (await SecureStore.getItemAsync('rider_id')) ||
    (await AsyncStorage.getItem('rider_id')) ||
    (await SecureStore.getItemAsync('userId')) ||
    (await AsyncStorage.getItem('userId')) ||
    '1'
  );
}

export default function PackageConfirmScreen({ navigation, route }) {
  const { pickup, drop, slot, size, qty, notes, est, mode = 'send' } = route.params || {};
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const token = await getToken();
      const rider_id = Number(await getRiderId());

      const payload = {
        rider_id,
        pickup_address: pickup,
        drop_address: drop,
        slot_text: slot,
        mode,
        size,
        qty,
        notes: notes || null,
        est_fare: Number(est),
      };

      const res = await fetch(`${API_BASE}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const problem = await res.text().catch(() => '');
        throw new Error(problem || 'Failed to create shipment');
      }

      const created = await res.json();
      DeviceEventEmitter.emit('SHIPMENT_CREATED', created);

      navigation.navigate('ShipmentDetails', {
        pickup, drop, slot, size, qty, notes,
        status: 'enroute',
        shipmentId: created?.id,
      });
    } catch (e) {
      Alert.alert('Couldn’t place request', e?.message || 'Please try again.');
      navigation.navigate('ShipmentDetails', { pickup, drop, slot, size, qty, notes, status: 'enroute' });
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={['#e6f0ff', '#f8e8ff', '#fff4e6']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="chevron-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Shipment</Text>
          <View style={{ width: 36 }} />
        </View>

        <LinearGradient colors={['#ffffff','#f8fafc']} style={styles.card}>
          <Row left="Pickup" right={pickup} />
          <Row left="Destination" right={drop} />
          <Row left="Time" right={slot} />
          <Row left="Boxes" right={`${qty} × ${size}`} />
          {!!notes && <Row left="Notes" right={notes} />}
          <View style={styles.divider} />
          <Row left="Estimated Fare" right={`৳ ${est}`} />
          <Row left="Payment" right="Cash (changeable)" />
        </LinearGradient>

        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={16} color="#1f2937" />
          <Text style={styles.hintText}>You’ll see the final fare after pickup is confirmed.</Text>
        </View>

        <TouchableOpacity onPress={handleConfirm} activeOpacity={0.9} style={[styles.cta, submitting && { opacity: 0.7 }]} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Request Courier</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing.md },
  topBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  circleBtn: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(15,23,42,0.06)', alignItems:'center', justifyContent:'center' },
  title: { fontSize: theme.typography.h2, fontWeight:'800', color:'#0f172a' },

  card: { marginTop:12, borderRadius:16, borderColor:'rgba(15,23,42,0.08)', borderWidth:1, padding:12 },
  row: { flexDirection:'row', justifyContent:'space-between', paddingVertical:6, gap:10 },
  rowLeft: { fontWeight:'800', color:'#0f172a' },
  rowRight: { flex:1, textAlign:'right', color:'#334155', fontWeight:'700' },
  divider: { height:1, backgroundColor:'rgba(15,23,42,0.08)', marginVertical:8 },

  hint: { flexDirection:'row', alignItems:'center', gap:8, marginTop:12 },
  hintText: { color:'#1f2937', fontWeight:'700' },

  cta: { marginTop:16, backgroundColor:'#0f172a', borderRadius:14, paddingVertical:14, alignItems:'center' },
  ctaText: { color:'#fff', fontWeight:'900' },
});
