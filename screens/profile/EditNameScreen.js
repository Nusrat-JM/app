import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../../lib/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLang } from "../../hooks/useLang";

const STORE_KEY = "profile.info";

export default function EditNameScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  useEffect(() => {
    const parts = (user?.name || "").split(" ");
    setFirst(parts[0] || "");
    setLast(parts.slice(1).join(" ") || "");
  }, [user?.name]);

  async function save() {
    const name = `${first || ""} ${last || ""}`.trim();
    if (!name) return Alert.alert("Name required");
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ ...saved, name }));
      Alert.alert("Saved", "Name updated");
      navigation.goBack();
    } catch (e) { Alert.alert("Error", String(e?.message ?? e)); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("firstName")}</Text>
      <TextInput style={styles.input} value={first} onChangeText={setFirst} autoCapitalize="words" />
      <Text style={[styles.label,{marginTop:10}]}>{t("lastName")}</Text>
      <TextInput style={styles.input} value={last} onChangeText={setLast} autoCapitalize="words" />
      <TouchableOpacity style={styles.btn} onPress={save}><Text style={styles.btnTxt}>{t("save")}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16 },
  label:{ color: theme.colors.muted, marginBottom:6, fontWeight:"600" },
  input:{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:10, padding:12, backgroundColor:"#fff" },
  btn:{ marginTop:16, backgroundColor: theme.colors.primary, padding:14, borderRadius:12, alignItems:"center" },
  btnTxt:{ color:"#fff", fontWeight:"800" },
});
