import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import theme from "../../lib/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLang } from "../../hooks/useLang";

const STORE_KEY = "profile.info";

export default function PersonalInfoScreen({ navigation }) {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [info, setInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    language: lang === "bn" ? "বাংলা (BD)" : "English (BD)",
  });

  // Load saved overrides every time this screen gets focus
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(STORE_KEY);
          const saved = raw ? JSON.parse(raw) : {};
          const merged = {
            name: saved.name ?? user?.name ?? "",
            email: saved.email ?? user?.email ?? "",
            phone: saved.phone ?? user?.phone ?? "",
            language: lang === "bn" ? "বাংলা (BD)" : "English (BD)",
          };
          if (alive) setInfo(merged);
        } catch {}
      })();
      return () => { alive = false; };
    }, [user?.name, user?.email, user?.phone, lang])
  );

  return (
    <View style={styles.container}>
      <Card>
        <NavRow
          icon={<MaterialIcons name="person" size={20} color={theme.colors.muted} />}
          label={t("name")}
          value={info.name || "-"}
          onPress={() => navigation.navigate("EditName")}
        />
        <NavRow
          icon={<MaterialIcons name="email" size={20} color={theme.colors.muted} />}
          label={t("email")}
          value={info.email || "-"}
          onPress={() => navigation.navigate("EditEmail")}
        />
        <NavRow
          icon={<Ionicons name="call" size={20} color={theme.colors.muted} />}
          label={t("phone")}
          value={info.phone || t("addPhone")}
          onPress={() => navigation.navigate("EditPhone")}
        />
        <NavRow
          icon={<Ionicons name="language" size={20} color={theme.colors.muted} />}
          label={t("language")}
          value={info.language}
          onPress={() => navigation.navigate("Language")}
        />
      </Card>
    </View>
  );
}

function Card({ children }) { return <View style={styles.card}>{children}</View>; }

function NavRow({ icon, label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1, borderColor: theme.colors.outline,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 6,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ececec" },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f3f6ff", alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowLabel: { fontSize: 12, color: theme.colors.muted, marginBottom: 2 },
  rowValue: { fontSize: 15, color: theme.colors.text, fontWeight: "600" },
});
