// screens/DashboardScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

// import the feature dashboards (new files below)
import RideDashboardScreen from "./RideDashboardScreen";
import PackageDashboardScreen from "./PackageDashboardScreen";
import ShiftDashboardScreen from "./ShiftDashboardScreen";
import TicketDashboardScreen from "./TicketDashboardScreen";
import TripDashboardScreen from "./TripDashboardScreen";

const PAGE_PAD = 16;
const SCREEN_W = Dimensions.get("window").width;

const FEATURES = [
  { key: "ride",    label: "Ride",        icon: <Ionicons name="car" size={16} color="#0f172a" /> },
  { key: "package", label: "Package",     icon: <MaterialCommunityIcons name="package-variant" size={16} color="#0f172a" /> },
  { key: "shift",   label: "Shift Home",  icon: <FontAwesome5 name="truck-moving" size={15} color="#0f172a" /> },
  { key: "ticket",  label: "Ticket",      icon: <Ionicons name="ticket" size={16} color="#0f172a" /> },
  { key: "trip",    label: "Plan Trip",   icon: <Ionicons name="git-branch-outline" size={16} color="#0f172a" /> },
];

export default function DashboardScreen() {
  const [active, setActive] = useState("ride");

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Upper navbar (feature tabs) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featureTabs}
      >
        {FEATURES.map(f => {
          const isActive = active === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActive(f.key)}
              activeOpacity={0.9}
              style={[styles.featureChip, isActive && styles.featureChipActive]}
            >
              <View style={[styles.featureIcon, isActive && styles.featureIconActive]}>
                {f.icon}
              </View>
              <Text style={[styles.featureTxt, isActive && styles.featureTxtActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Render the selected dashboard */}
      <View style={{ width: SCREEN_W - PAGE_PAD * 2 }}>
        {active === "ride"    && <RideDashboardScreen />}
        {active === "package" && <PackageDashboardScreen />}
        {active === "shift"   && <ShiftDashboardScreen />}
        {active === "ticket"  && <TicketDashboardScreen />}
        {active === "trip"    && <TripDashboardScreen />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: PAGE_PAD },
  header: { fontSize: 26, fontWeight: "900", marginBottom: 10, color: "#0f172a" },

  featureTabs: { flexDirection: "row", gap: 10, paddingVertical: 6, marginBottom: 8 },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  featureChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  featureIcon: {
    width: 24, height: 24, borderRadius: 999,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
    marginRight: 8,
  },
  featureIconActive: {
    backgroundColor: "#ffffff",
  },
  featureTxt: { fontWeight: "800", color: "#334155" },
  featureTxtActive: { color: "#1d4ed8" },
});
