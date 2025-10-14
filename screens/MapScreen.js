import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

export default function MapScreen({ route }) {
  const { origin, destination } = route.params; 
  const [coords, setCoords] = useState([]);
  const [pathText, setPathText] = useState("");
  const mapRef = useRef(null);

  const showShortestPath = async () => {
    try {
      const res = await fetch(`http://YOUR_SERVER_IP:3000/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`);
      const data = await res.json();

      if (!data.routes || !data.routes[0]) throw new Error("No route found");

      const routeCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      setCoords(routeCoords);

      // For demo, we just show origin → destination
      setPathText(`${origin.name} → ${destination.name}`);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates(routeCoords, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    } catch (err) {
      Alert.alert("Route Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: (origin.lat + destination.lat) / 2,
          longitude: (origin.lng + destination.lng) / 2,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} title={origin.name} />
        <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title={destination.name} />

        {coords.length > 0 && <Polyline coordinates={coords} strokeColor="blue" strokeWidth={5} />}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.pathText}>{pathText ? "Shortest path: " + pathText : "Press button to show route"}</Text>
        <TouchableOpacity style={styles.button} onPress={showShortestPath}>
          <Text style={styles.buttonText}>Show Shortest Path</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 12,
  },
  pathText: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  button: { backgroundColor: "#2F80ED", padding: 14, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
