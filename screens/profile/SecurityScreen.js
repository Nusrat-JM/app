import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Switch, Alert, Platform, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import theme from "../../lib/theme";

const TWO_FA_KEY = "profile.security.2fa";

export default function SecurityScreen() {
  const [twoFA, setTwoFA] = useState(false);
  useEffect(() => { (async () => setTwoFA((await AsyncStorage.getItem(TWO_FA_KEY)) === "1"))(); }, []);
  async function toggle2FA() {
    const next = !twoFA; setTwoFA(next); await AsyncStorage.setItem(TWO_FA_KEY, next ? "1" : "0");
  }

  return (
    <View style={styles.container}>
      <Card>
        <NavRow icon={<Ionicons name="key-outline" size={20} color={theme.colors.muted} />} label="Change password" onPress={() => Alert.alert("Change Password", "Hook this to your password flow.")} />
        <ToggleRow icon={<MaterialCommunityIcons name="shield-check-outline" size={20} color={theme.colors.muted} />} label="Two-step verification" value={twoFA} onValueChange={toggle2FA} />
        <NavRow icon={<MaterialIcons name="history" size={20} color={theme.colors.muted} />} label="Login activity" onPress={() => Alert.alert("Login Activity", "Show recent devices here.")} />
      </Card>
    </View>
  );
}

function Card({ children }) { return <View style={styles.card}>{children}</View>; }
function NavRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabelPrimary}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );
}
function ToggleRow({ icon, label, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabelPrimary}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.colors.primary }} thumbColor={Platform.OS === "android" ? "#fff" : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.outline, elevation: 6, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ececec" },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f3f6ff", alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowLabelPrimary: { fontSize: 15, color: theme.colors.text, fontWeight: "600" },
});
