// screens/SignupScreen.js
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
const phoneDigits = (v) => v.replace(/\D/g, "");
const isPhone = (v) => {
  const n = phoneDigits(v);
  return n.length >= 7 && n.length <= 15;
};

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");   // NEW
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (name && name.trim().length < 2) e.name = "Enter your full name";
    if (phone && !isPhone(phone)) e.phone = "Enter a valid phone";
    if (email && !isEmail(email)) e.email = "Enter a valid email";
    if (password && password.length < 6) e.password = "Minimum 6 characters";
    return e;
  }, [name, phone, email, password]);

  const canSubmit =
    name && phone && email && password &&
    Object.keys(errors).length === 0 && !submitting;

  const handleSignup = async () => {
    if (!name || !phone || !email || !password) return alert("Please fill all fields");
    if (Object.keys(errors).length) return;
    try {
      setSubmitting(true);
      await signup({
        name,
        email,
        password,
        phone: phoneDigits(phone), // normalize; backend can add +88 if needed
      });
    } finally {
      setSubmitting(false);
    }
  };

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
            <Text style={styles.headerTitle}>Create an account</Text>
            <Text style={styles.headerSub}>Use your name, phone and email</Text>
          </LinearGradient>

          {/* Card */}
          <View style={styles.card}>
            {/* Name */}
            <View style={styles.inputWrap}>
              <Ionicons name="person-circle-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9aa5b1"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {!!errors.name && <Text style={styles.error}>{errors.name}</Text>}

            {/* Phone (required) */}
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone (e.g., +8801XXXXXXXXX)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#9aa5b1"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
            {!!errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

            {/* Email */}
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#9aa5b1"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
            {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}

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

            {/* Hint */}
            <View style={styles.hintRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#16a34a" />
              <Text style={styles.hintText}>Phone helps with OTP & ride contact. Password is encrypted.</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={handleSignup}
              disabled={!canSubmit}
              style={[styles.ctaOuter, !canSubmit && { opacity: 0.6 }]}
            >
              <LinearGradient colors={["#2563EB", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
                <Ionicons name="person-add-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>{submitting ? "Creating..." : "Sign up"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Link */}
            <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 14 }}>
              <Text style={styles.link}>
                Already have an account? <Text style={styles.linkBold}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer tiny terms */}
          <Text style={styles.terms}>
            By continuing you agree to our <Text style={styles.termsLink}>Terms</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
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
  hintText: { color: "#14532d", fontSize: 12, flex: 1 },

  ctaOuter: { marginTop: 6, borderRadius: 12, overflow: "hidden" },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  link: { color: theme.colors.primary, textAlign: "center" },
  linkBold: { fontWeight: "800" },

  terms: { textAlign: "center", marginTop: 14, fontSize: 12, color: "#6b7280" },
  termsLink: { color: theme.colors.primary, fontWeight: "700" },
});
