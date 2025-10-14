import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../../lib/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLang } from "../../hooks/useLang";

const STORE_KEY = "profile.info";
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

export default function EditEmailScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState("");

  useEffect(() => setEmail(user?.email || ""), [user?.email]);

  async function save() {
    if (!emailOk(email)) return Alert.alert("Invalid email");
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ ...saved, email }));
      Alert.alert("Saved", "Email updated");
      navigation.goBack();
    } catch (e) { Alert.alert("Error", String(e?.message ?? e)); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("email")}</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
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
