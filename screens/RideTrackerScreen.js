// screens/RideTrackerScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { API_BASE } from "../lib/routing/baseURL";
import { fetchRoute } from "../lib/geo";
import theme from "../lib/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const PRIMARY = (theme?.colors?.primary) || "#6C63FF";
const BTN_GRADIENT = (theme?.gradients?.primaryButton) || ["#7FB6FF", "#C58CFF"];
const EDGE = { top: 100, right: 40, bottom: 220, left: 40 };

async function getToken() {
  return (await SecureStore.getItemAsync("token")) || (await AsyncStorage.getItem("token"));
}

export default function RideTrackerScreen({ route, navigation }) {
  const { rideId, origin, destination, vehicle, initialPrice } = route.params;
  const [status, setStatus] = useState("searching");
  const [driver, setDriver] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  const baseRegion = useMemo(() => ({
    latitude: (origin.lat + destination.lat) / 2,
    longitude: (origin.lng + destination.lng) / 2,
    latitudeDelta: Math.max(Math.abs(origin.lat - destination.lat) * 2, 0.05),
    longitudeDelta: Math.max(Math.abs(origin.lng - destination.lng) * 2, 0.05),
  }), [origin, destination]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetchRoute(origin, destination);
        if (!mounted) return;
        setPath(r.polylineCoords || []);
        if (mapRef.current && r.polylineCoords?.length) {
          mapRef.current.fitToCoordinates(r.polylineCoords, { edgePadding: EDGE, animated: true });
        }
      } finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [origin, destination]);

  useEffect(() => {
    let alive = true, timer;
    const poll = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/rides/${rideId}`, { headers: { Authorization: `Bearer ${token}` }});
        const data = await res.json();
        if (!alive) return;
        if (data?.status) setStatus(data.status);
        if (data?.driver) setDriver(data.driver);
        if (data?.driver?.lat && data?.driver?.lng) setDriverPos({ lat: Number(data.driver.lat), lng: Number(data.driver.lng) });
      } catch {}
      finally { timer = setTimeout(poll, 3000); }
    };
    poll();
    return () => { alive = false; clearTimeout(timer); };
  }, [rideId]);

  const StatusBadge = () => (
    <View style={[styles.badge, { backgroundColor: PRIMARY }]}>
      <Text style={styles.badgeTxt}>{String(status).replace("_"," ").toUpperCase()}</Text>
    </View>
  );

  return (
    <View style={{ flex:1 }}>
      <MapView
        ref={mapRef}
        style={{ flex:1 }}
        initialRegion={baseRegion}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      >
        {path.length > 0 && <Polyline coordinates={path} strokeWidth={5} />}
        <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} title="Pickup" description={origin.name} />
        <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title="Dropoff" description={destination.name} />
        {driverPos && (
          <Marker coordinate={{ latitude: driverPos.lat, longitude: driverPos.lng }} title="Driver" description={driver?.name || ""} pinColor="#111">
            <MaterialCommunityIcons name="steering" size={28} color="#111" />
          </Marker>
        )}
      </MapView>

      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Ride #{rideId} • {vehicle}</Text>
          <StatusBadge />
        </View>

        <Text style={styles.subline} numberOfLines={1}>{origin.name}</Text>
        <Text style={styles.arrow}>↓</Text>
        <Text style={styles.subline} numberOfLines={1}>{destination.name}</Text>

        <View style={styles.row}>
          <View style={styles.pill}>
            <Ionicons name="cash-outline" size={18} color="#111" />
            <Text style={styles.pillTxt}>৳{initialPrice}</Text>
          </View>
          {driver?.plate ? (
            <View style={styles.pill}>
              <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#111" />
              <Text style={styles.pillTxt}>{driver.plate}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarTxt}>{(driver?.name || "DR")[0].toUpperCase()}</Text></View>
          <View style={{ flex:1 }}>
            <Text style={styles.driverName}>{driver?.name || "Finding a nearby driver…"}</Text>
            {driver?.rating ? <Text style={styles.driverMeta}>★ {driver.rating.toFixed(1)}</Text> : null}
            {driver?.vehicle ? <Text style={styles.driverMeta}>{driver.vehicle}</Text> : null}
          </View>
          {driver?.phone ? (
            <TouchableOpacity style={styles.circleBtn} onPress={() => Linking.openURL(`tel:${driver.phone}`)}>
              <Ionicons name="call-outline" size={20} color="#111" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flexDirection:"row", gap:10, marginTop:10 }}>
          <TouchableOpacity onPress={() => navigation.popToTop()} style={[styles.actionBtn, { backgroundColor:"#111" }]}>
            <Text style={styles.actionTxt}>Close</Text>
          </TouchableOpacity>

          {/* GRADIENT focus button (matches Sign up) */}
          <TouchableOpacity
            onPress={() => mapRef.current?.fitToCoordinates([
              { latitude: origin.lat, longitude: origin.lng },
              { latitude: destination.lat, longitude: destination.lng },
              ...(driverPos ? [{ latitude: driverPos.lat, longitude: driverPos.lng }] : [])
            ], { edgePadding: EDGE, animated: true })}
            activeOpacity={0.9}
            style={styles.gradientBtnWrap}
          >
            <LinearGradient colors={BTN_GRADIENT} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.gradientBtn}>
              <Text style={styles.actionTxt}>Focus Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet:{
    position:"absolute", left:0, right:0, bottom:0,
    backgroundColor:"#fff", padding:16, borderTopLeftRadius:18, borderTopRightRadius:18,
    elevation:12, shadowColor:"#000", shadowOpacity:0.15, shadowRadius:8
  },
  sheetHeader:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:6 },
  sheetTitle:{ fontSize:16, fontWeight:"800", color:"#111" },
  badge:{ paddingVertical:6, paddingHorizontal:10, borderRadius:999 },
  badgeTxt:{ color:"#fff", fontWeight:"800", fontSize:12, letterSpacing:0.3 },

  subline:{ color:"#333", fontSize:13 },
  arrow:{ textAlign:"center", color:"#999", marginVertical:2 },

  row:{ flexDirection:"row", gap:8, marginTop:8, marginBottom:10 },
  pill:{ flexDirection:"row", gap:6, alignItems:"center", backgroundColor:"#F4F4F5", paddingVertical:6, paddingHorizontal:10, borderRadius:999 },
  pillTxt:{ fontWeight:"700" },

  card:{ flexDirection:"row", alignItems:"center", gap:12, padding:12, borderRadius:14, borderWidth:1, borderColor:"#eee",
         backgroundColor:"#fff", elevation:4, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6 },
  avatar:{ width:44, height:44, borderRadius:22, backgroundColor:"#F1ECFF", alignItems:"center", justifyContent:"center" },
  avatarTxt:{ color:PRIMARY, fontWeight:"900" },
  driverName:{ fontWeight:"800", fontSize:14, color:"#111" },
  driverMeta:{ color:"#555", fontSize:12, marginTop:2 },
  circleBtn:{ width:40, height:40, borderRadius:20, borderWidth:1, borderColor:"#e5e7eb", alignItems:"center", justifyContent:"center", backgroundColor:"#fff" },

  actionBtn:{ flex:1, alignItems:"center", paddingVertical:12, borderRadius:12 },
  actionTxt:{ color:"#fff", fontWeight:"800" },

  // gradient button wrapper
  gradientBtnWrap:{ flex:1, borderRadius:12, overflow:"hidden" },
  gradientBtn:{ flex:1, alignItems:"center", justifyContent:"center", paddingVertical:12 },

  loadingOverlay:{ position:"absolute", left:0, right:0, top:0, bottom:0, alignItems:"center", justifyContent:"center" }
});
