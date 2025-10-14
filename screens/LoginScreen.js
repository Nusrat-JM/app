// screens/LoginScreen.js
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Pressable
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import theme from "../lib/theme";


const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => {
  const n = (v || "").replace(/\D/g, ""); // digits only
  return n.length >= 7 && n.length <= 15;
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (identifier) {
      const id = identifier.trim();
      if (!(isEmail(id) || isPhone(id))) e.identifier = "Enter a valid email or phone";
    }
    if (password && password.length < 6) e.password = "Minimum 6 characters";
    return e;
  }, [identifier, password]);

  const canSubmit =
    identifier && password && Object.keys(errors).length === 0 && !submitting;

  const handleLogin = async () => {
    const id = identifier.trim();
    if (!id || !password) return alert("Please fill all fields");
    if (Object.keys(errors).length) return;

    // If it's an email, send as-is (lowercased). If not, treat as phone and send digits only.
    const isEmailLike = isEmail(id);
    const phoneOnly = id.replace(/\D/g, "");

    try {
      setSubmitting(true);
      await login({
        identifier: isEmailLike ? id.toLowerCase() : phoneOnly,
        password,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Phone keypad only if it clearly looks like a phone (starts with + or only digits, >=3 chars, and no '@')
  const looksPhone = /^\+?\d{3,}$/.test(identifier.trim()) && !identifier.includes("@");
  const dynamicKeyboard = looksPhone ? "phone-pad" : "email-address";

  return (
    <LinearGradient
      colors={["#F7FAFF", "#F5F3FF", "#FFF8ED"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <LinearGradient colors={["#9EE1FF", "#C9C2FF", "#FFE29A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <Text style={styles.headerTitle}>Welcome back</Text>
            <Text style={styles.headerSub}>Log in with email or phone</Text>
          </LinearGradient>

          {/* Card */}
          <View style={styles.card}>
            {/* Email or Phone */}
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or phone"
                keyboardType={dynamicKeyboard}
                value={identifier}
                onChangeText={setIdentifier}
                placeholderTextColor="#9aa5b1"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
            {!!errors.identifier && <Text style={styles.error}>{errors.identifier}</Text>}

            {/* Password */}
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={secure}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#9aa5b1"
                autoCapitalize="none"
              />
              <Pressable onPress={() => setSecure((s) => !s)} style={styles.eyeBtn} hitSlop={10}>
                <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
              </Pressable>
            </View>
            {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}

            {/* Helper row */}
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
              <Text style={styles.hintText}>Tip: You can give phone or your email.</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={handleLogin}
              disabled={!canSubmit}
              style={[styles.ctaOuter, !canSubmit && { opacity: 0.6 }]}
            >
              <LinearGradient colors={["#2563EB", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log in"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Link */}
            <TouchableOpacity onPress={() => navigation.navigate("Signup")} style={{ marginTop: 14 }}>
              <Text style={styles.link}>
                Don’t have an account? <Text style={styles.linkBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tiny footer */}
          <Text style={styles.terms}>Having trouble? Check your connection or try again.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 18, paddingBottom: 40 },

  header: {
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  headerSub: { marginTop: 4, color: "#1f2937", opacity: 0.8, fontSize: 13 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(2,6,23,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(2,6,23,0.08)",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: theme.colors.text },
  eyeBtn: { paddingLeft: 6, paddingVertical: 4 },

  error: { color: "#b91c1c", fontSize: 12, marginTop: -6, marginBottom: 10 },

  hintRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2, marginBottom: 14 },
  hintText: { color: "#1e40af", fontSize: 12, flex: 1 },

  ctaOuter: { marginTop: 6, borderRadius: 12, overflow: "hidden" },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  link: { color: theme.colors.primary, textAlign: "center" },
  linkBold: { fontWeight: "800" },

  terms: { textAlign: "center", marginTop: 14, fontSize: 12, color: "#6b7280" },
});
