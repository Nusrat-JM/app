import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../lib/theme";

export default function AccountScreen() {
  return (
    <View style={styles.container}>
      <Card>
        <NavRow icon={<Ionicons name="wallet-outline" size={20} color={theme.colors.muted} />} label="Wallet" rightPill="৳" onPress={() => Alert.alert("Wallet", "Payment methods & transactions go here.")} />
        <NavRow icon={<MaterialCommunityIcons name="steering" size={20} color={theme.colors.muted} />} label="Ride activity" onPress={() => Alert.alert("Activity", "Past rides & receipts here.")} />
        <NavRow icon={<Ionicons name="settings-outline" size={20} color={theme.colors.muted} />} label="Settings" onPress={() => Alert.alert("Settings", "App preferences & notifications.")} />
        <NavRow icon={<Ionicons name="help-circle-outline" size={20} color={theme.colors.muted} />} label="Help & Support" onPress={() => Alert.alert("Help & Support", "Chat with support or FAQs.")} />
      </Card>
    </View>
  );
}

function Card({ children }) { return <View style={styles.card}>{children}</View>; }
function NavRow({ icon, label, rightPill, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {rightPill ? <Text style={styles.rightPill}>{rightPill}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.outline, elevation: 6, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ececec" },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f3f6ff", alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowLabel: { fontSize: 15, color: theme.colors.text, fontWeight: "600" },
  rightPill: { fontSize: 12, color: theme.colors.primary, backgroundColor: "#eef4ff", borderWidth: 1, borderColor: "#dbe6ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 6 },
});
