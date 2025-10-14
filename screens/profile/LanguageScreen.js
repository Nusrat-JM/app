import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import theme from "../../lib/theme";
import { useLang } from "../../hooks/useLang";

const OPTIONS = [
  { code: "en", label: "English (BD)" },
  { code: "bn", label: "বাংলা (BD)" },
];

export default function LanguageScreen() {
  const { lang, setLang, t } = useLang();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("chooseLanguage")}</Text>
      <View style={styles.card}>
        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.code}
            style={styles.row}
            onPress={() => setLang(opt.code)}
            activeOpacity={0.85}
          >
            <Text style={[styles.label, lang === opt.code && styles.active]}>{opt.label}</Text>
            {lang === opt.code ? <Text style={styles.check}>✓</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.note}>
        {lang === "bn" ? "অ্যাপের ভাষা সাথে সাথে পরিবর্তন হবে।" : "The app language updates instantly."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16, backgroundColor: theme.colors.background },
  title:{ fontSize:16, fontWeight:"800", marginBottom:10 },
  card:{
    backgroundColor:"#fff", borderRadius:14, borderWidth:1, borderColor: theme.colors.outline,
    elevation:4, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:10
  },
  row:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", padding:14, borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:"#eee" },
  label:{ fontSize:15, fontWeight:"600", color: theme.colors.text },
  active:{ color: theme.colors.primary },
  check:{ color: theme.colors.primary, fontWeight:"800" },
  note:{ marginTop:10, color: theme.colors.muted, fontSize:12 },
});
