// screens/RideSummaryScreen.js
import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { fetchRoute } from "../lib/geo";
import { estimateFare, vehicleList } from "../lib/pricing";
import { API_BASE } from "../lib/routing/baseURL";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../lib/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

async function getToken() {
  return (await SecureStore.getItemAsync("token")) || (await AsyncStorage.getItem("token"));
}

const PRIMARY = (theme?.colors?.primary) || "#6C63FF";
const EDGE = { top: 100, right: 40, bottom: 40, left: 40 };

// match your Sign up button gradient
const BTN_GRADIENT = (theme?.gradients?.primaryButton) || ["#7FB6FF", "#C58CFF"]; // left→right blue→purple

// robust CNG icon
const MCI = MaterialCommunityIcons;
const CNG_ICON_NAME = MCI?.glyphMap?.["auto-rickshaw"]
  ? "auto-rickshaw"
  : (MCI?.glyphMap?.["rickshaw"] ? "rickshaw" : "bike-fast");

const VEHICLE_ICON = {
  SEDAN: { set: "Ionicons", name: "car-outline" },
  SUV:   { set: "Ionicons", name: "car-sport-outline" },
  CNG:   { set: "MaterialCommunityIcons", name: CNG_ICON_NAME },
  BIKE:  { set: "MaterialCommunityIcons", name: "motorbike" }
};

//this is for the route

export default function RideSummaryScreen({ route, navigation }) {
  const { origin, destination } = route.params;
  const [coords, setCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [vehicle, setVehicle] = useState("SEDAN");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const mapRef = useRef(null);

  const region = useMemo(() => ({
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
        setCoords(r.polylineCoords);
        setDistanceKm(r.distanceKm);
        setDurationMin(r.durationMin);
        if (mapRef.current && r.polylineCoords?.length) {
          mapRef.current.fitToCoordinates(r.polylineCoords, { edgePadding: EDGE, animated: true });
        }
      } catch (e) {
        Alert.alert("Route error", String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [origin, destination]);

  const price = estimateFare(vehicle, distanceKm, durationMin);

  const onBook = async () => {
    try {
      setBooking(true);
      const token = await getToken();
      if (!token) { Alert.alert("Login required", "Please login again."); return; }

      const payload = {
        pickup:  { lat: origin.lat, lng: origin.lng, name: origin.name },
        dropoff: { lat: destination.lat, lng: destination.lng, name: destination.name },
        vehicle_type: vehicle,
        distance_km: distanceKm,
        duration_min: durationMin,
        price: price
      };

      const res = await fetch(`${API_BASE}/rides`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Non-JSON (${res.status}) ${res.url}\n${txt.slice(0, 160)}…`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to book ride");

      navigation.replace("RideTracker", {
        rideId: data.id, origin, destination, vehicle, initialPrice: price
      });
    } catch (e) {
      Alert.alert("Booking failed", String(e.message));
    } finally {
      setBooking(false);
    }
  };

  const VehicleButton = ({ v }) => {
    const meta = VEHICLE_ICON[v] || { set: "Ionicons", name: "car-outline" };
    const IconComp = meta.set === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
    const active = v === vehicle;
    return (
      <TouchableOpacity
        key={v}
        onPress={() => setVehicle(v)}
        style={[styles.vehicleBtn, active && styles.vehicleBtnActive]}
        activeOpacity={0.9}
      >
        <IconComp name={meta.name} size={26} color={active ? PRIMARY : "#111"} />
        <Text style={[styles.vehicleTxt, active && { color: PRIMARY }]}>{v}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex:1 }}>
      <MapView
        ref={mapRef}
        style={{ flex:1 }}
        initialRegion={region}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      >
        <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} title="From" description={origin.name} />
        <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title="To" description={destination.name} />
        {coords.length > 0 && <Polyline coordinates={coords} strokeWidth={5} />}
      </MapView>

      <View style={styles.sheet}>
        <Text numberOfLines={1} style={styles.routeLabel}>{origin.name}</Text>
        <Text style={styles.routeArrow}>↓</Text>
        <Text numberOfLines={1} style={styles.routeLabel}>{destination.name}</Text>

        <Text style={styles.metric}>
          {loading ? "Calculating…" : `${distanceKm.toFixed(1)} km • ${Math.round(durationMin)} min`}
        </Text>

        <View style={styles.vehicles}>
          {vehicleList().map(v => <VehicleButton key={v} v={v} />)}
        </View>

        {/* GRADIENT estimate button (matches Sign up) */}
        <TouchableOpacity disabled={loading} activeOpacity={0.9} style={styles.gradientBtnWrap}>
          <LinearGradient colors={BTN_GRADIENT} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.gradientBtn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.gradientBtnTxt}>Estimate: ৳{price}</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity disabled={loading || booking} onPress={onBook} style={[styles.book, (loading || booking) && { opacity:0.6 }]}>
          <Text style={styles.bookTxt}>{booking ? "Booking…" : "Book Ride"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

//page design here !!!
//its the design od 

const styles = StyleSheet.create({
  sheet:{
    position:"absolute", left:0, right:0, bottom:0,
    backgroundColor:"#fff", padding:14, borderTopLeftRadius:16, borderTopRightRadius:16,
    elevation:12, shadowColor:"#000", shadowOpacity:0.15, shadowRadius:8
  },
  routeLabel:{ fontSize:13, color:"#333" },
  routeArrow:{ textAlign:"center", marginVertical:2, color:"#999" },
  metric:{ fontSize:14, fontWeight:"600", marginTop:6, marginBottom:10 },

  vehicles:{ flexDirection:"row", flexWrap:"wrap", gap:10, marginBottom:12 },
  vehicleBtn:{ width:86, alignItems:"center", gap:6, paddingVertical:12, borderRadius:14, borderWidth:1, borderColor:"#e5e7eb", backgroundColor:"#fff" },
  vehicleBtnActive:{ backgroundColor:"#F1ECFF", borderColor:PRIMARY, shadowColor:"#000", shadowOpacity:0.08, shadowRadius:6, elevation:4 },
  vehicleTxt:{ fontWeight:"700", fontSize:12 },

  // gradient button wrapper (for press ripple + rounded clip)
  gradientBtnWrap:{ borderRadius:12, overflow:"hidden", marginBottom:8 },
  gradientBtn:{ padding:14, alignItems:"center" },
  gradientBtnTxt:{ color:"#fff", fontSize:16, fontWeight:"700" },

  book:{ backgroundColor:"#111", padding:14, borderRadius:12, alignItems:"center" },
  bookTxt:{ color:"#fff", fontSize:16, fontWeight:"700" },
});
