import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CountryPicker from "react-native-country-picker-modal";
import theme from "../../lib/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLang } from "../../hooks/useLang";

const STORE_KEY = "profile.info";
const phoneOk = v => String(v).replace(/[^\d]/g, "").length >= 6;

export default function EditPhoneScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();

  const [countryCode, setCountryCode] = useState("BD");
  const [callingCode, setCallingCode] = useState("880");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // Pre-fill from saved phone if it starts with +code
    const p = user?.phone || "";
    const m = /^\+(\d+)\s?(.*)$/.exec(p);
    if (m) {
      setCallingCode(m[1]);
      setPhone(m[2]);
    } else {
      setPhone(p);
    }
  }, [user?.phone]);

  async function save() {
    if (!phoneOk(phone)) return Alert.alert("Invalid phone");
    const value = `+${callingCode} ${phone}`;
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ ...saved, phone: value }));
      Alert.alert("Saved", "Phone updated");
      navigation.goBack();
    } catch (e) { Alert.alert("Error", String(e?.message ?? e)); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("phone")}</Text>

      <View style={styles.row}>
        <CountryPicker
          withFilter
          withCallingCode
          withFlag
          countryCode={countryCode}
          onSelect={(c) => {
            setCountryCode(c.cca2);
            const cc = Array.isArray(c.callingCode) ? c.callingCode[0] : c.callingCode;
            setCallingCode(String(cc || "880"));
          }}
          containerButtonStyle={styles.countryBtn}
        />
        <Text style={styles.cc}>+{callingCode}</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="1XXXXXXXXX"
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={save}><Text style={styles.btnTxt}>{t("save")}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16 },
  label:{ color: theme.colors.muted, marginBottom:6, fontWeight:"600" },
  row:{ flexDirection:"row", alignItems:"center" },
  countryBtn:{ paddingHorizontal:10, paddingVertical:12, borderRadius:10, borderWidth:1, borderColor:"#e5e7eb", backgroundColor:"#fff" },
  cc:{ marginHorizontal:8, fontWeight:"700" },
  input:{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:10, padding:12, backgroundColor:"#fff" },
  btn:{ marginTop:16, backgroundColor: theme.colors.primary, padding:14, borderRadius:12, alignItems:"center" },
  btnTxt:{ color:"#fff", fontWeight:"800" },
});
