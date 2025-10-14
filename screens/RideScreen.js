
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function RideScreen() {
  const nav = useNavigation();
  const [fromLat, setFromLat] = useState("37.7749");
  const [fromLng, setFromLng] = useState("-122.4194");
  const [toLat, setToLat] = useState("37.7849");
  const [toLng, setToLng] = useState("-122.4094");

  const goToMap = () => {
    const origin = { lat: Number(fromLat), lng: Number(fromLng) };
    const destination = { lat: Number(toLat), lng: Number(toLng) };
    console.log("→ RideMap", origin, destination);
    nav.navigate("RideMap", { origin, destination });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get a ride</Text>

      <Text style={styles.label}>From</Text>
      <TextInput style={styles.input} value={fromLat} onChangeText={setFromLat} placeholder="Latitude" keyboardType="numeric" />
      <TextInput style={styles.input} value={fromLng} onChangeText={setFromLng} placeholder="Longitude" keyboardType="numeric" />

      <Text style={[styles.label,{marginTop:12}]}>To</Text>
      <TextInput style={styles.input} value={toLat} onChangeText={setToLat} placeholder="Latitude" keyboardType="numeric" />
      <TextInput style={styles.input} value={toLng} onChangeText={setToLng} placeholder="Longitude" keyboardType="numeric" />

      <TouchableOpacity style={styles.primary} onPress={goToMap} activeOpacity={0.85}>
        <Text style={styles.primaryText}>Get a Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16, backgroundColor:"#fff" },
  title:{ fontSize:26, fontWeight:"700", marginBottom:16 },
  label:{ fontSize:14, color:"#555", marginBottom:6 },
  input:{ borderWidth:1, borderColor:"#e1e1e1", borderRadius:10, padding:12, marginBottom:10 },
  primary:{ backgroundColor:"#2F80ED", padding:14, borderRadius:12, alignItems:"center", marginTop:14 },
  primaryText:{ color:"#fff", fontSize:16, fontWeight:"600" }
});
