// screens/ShipmentDetailsScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import theme from '../lib/theme';
// If you have live backend, uncomment next line and pass socketUrl via params
// import io from 'socket.io-client';

/** Utility to make a simple straight polyline between two points (fallback demo) */
function buildSimpleRoute(a, b, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      latitude: a.latitude + (b.latitude - a.latitude) * t,
      longitude: a.longitude + (b.longitude - a.longitude) * t,
    });
  }
  return pts;
}

export default function ShipmentDetailsScreen({ navigation, route }) {
  const {
    pickup, drop, slot, size, qty,
    status: statusParam = 'enroute',
    // Optional: pass precise coordinates + (optional) socket URL + shipmentId
    pickupCoord = { latitude: 23.8069, longitude: 90.3681 },      // Mirpur 10 (fallback)
    dropCoord   = { latitude: 23.7939, longitude: 90.4255 },      // Notun Bazar (fallback)
    socketUrl,   // e.g. 'http://192.168.0.10:3001'
    shipmentId,  // e.g. 123
    encodedPolyline, // if you already decode routes server-side, you can send coords instead
  } = route.params || {};

  const [status, setStatus] = useState(statusParam);
  const [courier, setCourier] = useState(pickupCoord);        // live courier pin
  const [routeCoords, setRouteCoords] = useState(() =>
    encodedPolyline ? encodedPolyline : buildSimpleRoute(pickupCoord, dropCoord)
  );

  const mapRef = useRef(null);
  const arrived = status === 'arrived';

  // Fit camera to all important markers
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!mapRef.current) return;
      mapRef.current.fitToCoordinates(
        [pickupCoord, dropCoord, courier],
        { edgePadding: { top: 80, left: 40, right: 40, bottom: 240 }, animated: true }
      );
    }, 400);
    return () => clearTimeout(timeout);
  }, [pickupCoord, dropCoord, courier]);

  // --- Live updates via Socket.IO (if provided) ---
  useEffect(() => {
    if (!socketUrl) return; // skip if you don't have backend yet
    // const socket = io(socketUrl, { transports: ['websocket'] });
    // socket.emit('courier:join', { shipmentId });
    // socket.on('courier:location', ({ lat, lng, status: st }) => {
    //   setCourier({ latitude: lat, longitude: lng });
    //   if (st) setStatus(st);
    // });
    // return () => socket.disconnect();
  }, [socketUrl, shipmentId]);

  // --- Demo simulation (only runs when no socketUrl is given) ---
  useEffect(() => {
    if (socketUrl) return; // real-time is handled above
    let i = 0;
    const pts = routeCoords;
    const tick = setInterval(() => {
      i = Math.min(i + 1, pts.length - 1);
      setCourier(pts[i]);
      if (i === pts.length - 1) {
        setStatus('arrived');
        clearInterval(tick);
      }
    }, 800); // move every 0.8s
    return () => clearInterval(tick);
  }, [socketUrl, routeCoords]);

  const steps = useMemo(() => ([
    { title: pickup || 'Pickup', sub: '10:00 AM, Today' },
    { title: drop || 'Destination', sub: 'ETA updates live' },
  ]), [pickup, drop]);

  return (
    <SafeAreaView style={{ flex:1 }}>
      <LinearGradient colors={['#e6f0ff', '#f8e8ff', '#fff4e6']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        {/* Top */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="chevron-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>Shipment Details</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: arrived ? '#dcfce7' : '#e0f2fe', borderColor: arrived ? '#16a34a':'#0284c7' }]}>
          <Ionicons name={arrived ? 'checkmark-circle' : 'bicycle-outline'} size={18} color={arrived ? '#166534':'#075985'} />
          <Text style={[styles.bannerText, { color: arrived ? '#166534':'#075985' }]}>
            {arrived ? 'Your shipment has arrived!' : 'Courier is on the way'}
          </Text>
        </View>

        {/* Directions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Directions</Text>

          {/* REAL MAP */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: pickupCoord.latitude,
              longitude: pickupCoord.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsCompass={false}
            showsUserLocation={false}
            toolbarEnabled={false}
          >
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#3b82f6" />
            <Marker coordinate={pickupCoord} title="Pickup" description={pickup || 'Pickup'}>
              <Ionicons name="pin" size={28} color="#0f172a" />
            </Marker>
            <Marker coordinate={dropCoord} title="Destination" description={drop || 'Destination'}>
              <Ionicons name="flag" size={26} color="#059669" />
            </Marker>
            <Marker coordinate={courier} title="Courier" description={arrived ? 'Arrived' : 'En route'}>
              <Ionicons name="bicycle" size={26} color={arrived ? '#16a34a' : '#f59e0b'} />
            </Marker>
          </MapView>

          {steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.dot, { backgroundColor: i===0 ? '#0f172a' : '#059669' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepSub}>{s.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Boxes */}
        <View style={styles.card}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={styles.cardTitle}>Boxes ({qty})</Text>
          </View>

          <FlatList
            data={Array.from({ length: qty }).map((_,i)=>({id:i}))}
            keyExtractor={(i)=>String(i.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap:10 }}
            renderItem={({ item }) => (
              <View style={styles.boxThumb}>
                <Ionicons name="cube" size={22} color="#0f172a" />
                <Text style={{ fontWeight:'800', color:'#0f172a', marginTop:6 }}>{size}</Text>
              </View>
            )}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor:'rgba(15,23,42,0.06)'}]}>
            <Ionicons name="call-outline" size={18} color="#0f172a" />
            <Text style={styles.actionText}>Contact Courier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor:'#0f172a' }]}
            onPress={() => setStatus('arrived')}
          >
            <Text style={[styles.actionText, { color:'#fff' }]}>Mark Arrived (demo)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex:1, padding: theme.spacing.md, paddingBottom: 8 },
  topBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  circleBtn: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(15,23,42,0.06)', alignItems:'center', justifyContent:'center' },
  title: { fontSize: theme.typography.h2, fontWeight:'800', color:'#0f172a' },

  banner: { marginTop:12, borderRadius:12, padding:12, borderWidth:1, flexDirection:'row', alignItems:'center', gap:8 },
  bannerText: { fontWeight:'800' },

  card: { backgroundColor:'#fff', borderRadius:16, borderWidth:1, borderColor:'rgba(15,23,42,0.08)', padding:12, marginTop:12 },
  cardTitle: { fontWeight:'900', color:'#0f172a', marginBottom:8 },

  map: { height: 220, borderRadius:12 },

  stepRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:6 },
  dot: { width:10, height:10, borderRadius:5 },
  stepTitle: { fontWeight:'800', color:'#0f172a' },
  stepSub: { color:'#334155', marginTop:2 },

  boxThumb: { width:110, height:80, borderRadius:12, borderWidth:1, borderColor:'rgba(15,23,42,0.08)', backgroundColor:'#fff', alignItems:'center', justifyContent:'center' },

  actions: { flexDirection:'row', gap:10, marginTop:14 },
  actionBtn: { flex:1, paddingVertical:12, borderRadius:12, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:8 },
  actionText: { fontWeight:'900', color:'#0f172a' },
});
