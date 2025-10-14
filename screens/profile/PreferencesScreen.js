// screens/profile/PreferencesScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Animated,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../lib/theme";

// Storage keys
const PREF_FAVS_KEY = "pref.favorites"; // [{id,label,name,lat?,lng?}]
const PREF_MODES_KEY = "pref.modes";     // ["Sedan","SUV",...]
const PREF_ACCESS_KEY = "pref.access";   // { wheelchair:true, ... }

// Choices
const ALL_MODES = ["Sedan", "SUV", "CNG", "Bike", "Transit", "Walk"];
const ALL_ACCESS = [
  { key: "wheelchair",   label: "Wheelchair friendly" },
  { key: "avoid_stairs", label: "Avoid stairs" },
  { key: "extra_time",   label: "Extra pick-up time" },
  { key: "high_contrast",label: "High-contrast maps/UI" },
];

// Icon + gradient meta for mode tiles (no images)
const MODE_META = {
  Sedan:   { key: "Sedan",   icon: "car-outline",       gradient: ["#eef2ff", "#e0f2fe"] },
  SUV:     { key: "SUV",     icon: "car-sport-outline", gradient: ["#f5f3ff", "#e9d5ff"] },
  CNG:     { key: "CNG",     icon: "leaf-outline",      gradient: ["#ecfccb", "#d9f99d"] },
  Bike:    { key: "Bike",    icon: "bicycle-outline",   gradient: ["#f0f9ff", "#bae6fd"] },
  Transit: { key: "Transit", icon: "bus-outline",       gradient: ["#fff7ed", "#fed7aa"] },
  Walk:    { key: "Walk",    icon: "walk-outline",      gradient: ["#f0fdf4", "#bbf7d0"] },
};

// Nice, soft gradients for big cards
const CARD_GRADIENTS = {
  favs:   ["#eef2ff", "#e0f2fe", "#fef3c7"], // indigo-50 → sky-50 → amber-100
  modes:  ["#ecfeff", "#e9d5ff", "#f5f5f4"], // cyan-50 → violet-200 → stone-100
  access: ["#f0fdf4", "#dcfce7", "#fef9c3"], // green-50 → green-100 → yellow-100
};

export default function PreferencesScreen() {
  // Favorites
  const [favs, setFavs] = useState([]);
  const [label, setLabel] = useState("");
  const [place, setPlace] = useState("");
  const [showFavsModal, setShowFavsModal] = useState(false);

  // Modes & Access
  const [modes, setModes] = useState([]);
  const [access, setAccess] = useState({});
  const [showModes, setShowModes] = useState(false);
  const [showAccess, setShowAccess] = useState(false);

  // Load all
  useEffect(() => {
    (async () => {
      try {
        const F = await AsyncStorage.getItem(PREF_FAVS_KEY);
        const M = await AsyncStorage.getItem(PREF_MODES_KEY);
        const A = await AsyncStorage.getItem(PREF_ACCESS_KEY);
        if (F) setFavs(JSON.parse(F));
        if (M) setModes(JSON.parse(M));
        if (A) setAccess(JSON.parse(A));
      } catch {}
    })();
  }, []);

  async function saveFavs(next) {
    setFavs(next);
    await AsyncStorage.setItem(PREF_FAVS_KEY, JSON.stringify(next));
  }

  function addFav(custom = null) {
    const _label = (custom?.label ?? label).trim();
    const _place = (custom?.place ?? place).trim();

    if (!_label || !_place) {
      Alert.alert("Missing info", "Please enter both a label and a place/address.");
      return;
    }

    // Avoid duplicate labels (case-insensitive)
    const exists = favs.some((f) => f.label.toLowerCase() === _label.toLowerCase());
    if (exists) {
      Alert.alert("Already added", `"${_label}" is already in your favorites.`);
      return;
    }

    const next = [{ id: Date.now(), label: _label, name: _place }, ...favs];
    saveFavs(next);
    setLabel("");
    setPlace("");
  }

  function removeFav(id) {
    saveFavs(favs.filter((i) => i.id !== id));
  }

  // Modes / Access toggles
  const toggleMode = (name) => {
    setModes((prev) => {
      const next = prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name];
      AsyncStorage.setItem(PREF_MODES_KEY, JSON.stringify(next));
      return next;
    });
  };
  const toggleAccess = (k) => {
    setAccess((prev) => {
      const next = { ...prev, [k]: !prev?.[k] };
      AsyncStorage.setItem(PREF_ACCESS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const accessSummary = useMemo(
    () =>
      Object.entries(access)
        .filter(([, v]) => v)
        .map(([k]) => ALL_ACCESS.find((x) => x.key === k)?.label)
        .join(" • "),
    [access]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Preferences</Text>

      {/* 1) Favorite Locations card */}
      <GradientCard
        icon="star"
        title="Favorite Locations"
        gradient={CARD_GRADIENTS.favs}
        onPress={() => setShowFavsModal(true)}
        subtitle={
          favs.length
            ? favs.slice(0, 3).map((f) => f.label).join(" • ")
            : "Add Home, Work, Vacation & more"
        }
      />

      {/* 2) Transport Modes card */}
      <GradientCard
        icon="car-sport"
        title="Transportation Mode"
        gradient={CARD_GRADIENTS.modes}
        onPress={() => setShowModes(true)}
        subtitle={modes.length ? `${modes.length} selected` : "Choose your preferred modes"}
      />

      {/* 3) Accessibility card */}
      <GradientCard
        icon="accessibility"
        title="Accessibility Needs"
        gradient={CARD_GRADIENTS.access}
        onPress={() => setShowAccess(true)}
        subtitle={accessSummary || "Set your accessibility needs"}
      />

      {/* MODAL: Favorite Locations */}
      <Modal
        visible={showFavsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFavsModal(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Favorite Locations</Text>
              <TouchableOpacity onPress={() => setShowFavsModal(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Quick shortcuts */}
            <View style={styles.quickRow}>
              <QuickAdd icon="home"      label="Home"     onPress={() => addFav({ label: "Home",     place: "Set your home address" })} />
              <QuickAdd icon="briefcase" label="Work"     onPress={() => addFav({ label: "Work",     place: "Set your work address" })} />
              <QuickAdd icon="school"    label="Campus"   onPress={() => addFav({ label: "Campus",   place: "Set your campus address" })} />
              <QuickAdd icon="airplane"  label="Vacation" onPress={() => addFav({ label: "Vacation", place: "Set your vacation spot" })} />
            </View>
            <Text style={styles.helperText}>
              Tip: Use short labels (e.g., “Home”, “Gym”). You can add as many places as you want.
            </Text>

            {/* Manual add */}
            <View style={styles.addRow}>
              <View style={[styles.inputWrap, { width: 150 }]}>
                <Ionicons name="pricetag-outline" size={16} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Label (Home/Work)"
                  value={label}
                  onChangeText={setLabel}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Place name or address"
                  value={place}
                  onChangeText={setPlace}
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => addFav()} activeOpacity={0.9}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>Add</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={favs}
              keyExtractor={(i) => String(i.id)}
              style={{ marginTop: 10, maxHeight: 280 }}
              renderItem={({ item }) => (
                <View style={styles.favItem}>
                  <View style={styles.pin}>
                    <Ionicons name="pin" size={18} color="#4f46e5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700" }}>{item.label}</Text>
                    <Text style={{ color: "#6b7280" }} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFav(item.id)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: "#6b7280", marginTop: 6 }}>
                  No favorites yet. Add Home/Work/Vacation to plan faster.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* MODAL: Modes (icon tiles + animation) */}
      <Modal
        visible={showModes}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModes(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Transportation Mode</Text>
              <TouchableOpacity onPress={() => setShowModes(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Select/Clear helpers */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 6 }}>
              <TouchableOpacity
                onPress={() => {
                  const all = Object.keys(MODE_META);
                  setModes(all);
                  AsyncStorage.setItem(PREF_MODES_KEY, JSON.stringify(all));
                }}
              >
                <Text style={{ fontWeight: "700", color: "#2563eb", marginRight: 16 }}>Select all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setModes([]);
                  AsyncStorage.setItem(PREF_MODES_KEY, JSON.stringify([]));
                }}
              >
                <Text style={{ fontWeight: "700", color: "#ef4444" }}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* 2-column animated tiles */}
            <View style={styles.modeGrid}>
              {ALL_MODES.map((m) => (
                <ModeTile key={m} meta={MODE_META[m]} selected={modes.includes(m)} onPress={() => toggleMode(m)} />
              ))}
            </View>

            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowModes(false)}>
              <Text style={styles.modalBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Accessibility */}
      <Modal
        visible={showAccess}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAccess(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Accessibility</Text>
              <TouchableOpacity onPress={() => setShowAccess(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {ALL_ACCESS.map((opt) => (
              <TouchableOpacity key={opt.key} style={styles.switchRow} onPress={() => toggleAccess(opt.key)}>
                <Text style={{ flex: 1, fontWeight: "600" }}>{opt.label}</Text>
                <View style={[styles.switch, access?.[opt.key] && styles.switchOn]}>
                  <View style={[styles.switchKnob, access?.[opt.key] && { left: 20 }]} />
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowAccess(false)}>
              <Text style={styles.modalBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Gradient, animated, press/hover-friendly card */
function GradientCard({ icon, title, subtitle, gradient, onPress, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (val) =>
    Animated.spring(scale, {
      toValue: val,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === "web" ? () => animateTo(0.985) : undefined}
      onHoverOut={Platform.OS === "web" ? () => animateTo(1) : undefined}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      style={{ marginBottom: 14 }}
    >
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
          <View style={styles.cardHeader}>
            <View style={styles.rowIconLg}>
              <Ionicons name={icon} size={24} color="#334155" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{title}</Text>
              {!!subtitle && <Text style={styles.cardSubTitle}>{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </View>
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function QuickAdd({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAdd} onPress={onPress} activeOpacity={0.9}>
      <Ionicons name={icon} size={18} color="#1f2937" />
      <Text style={{ fontWeight: "700", marginLeft: 6 }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Single mode tile with icon + selection animation */
function ModeTile({ meta, selected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(ring, { toValue: selected ? 1 : 0, useNativeDriver: false, friction: 6 }).start();
  }, [selected]);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  const ringSize = ring.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.modeTileWrap}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={meta.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.modeTile, selected && styles.modeTileSelected]}>
          <View style={styles.modeIconWrap}>
            <Ionicons name={meta.icon} size={36} color="#0f172a" />
            <Animated.View style={[styles.modePulseRing, { borderWidth: ringSize, opacity: ringOpacity }]} />
          </View>
          <Text style={styles.modeLabel}>{meta.key}</Text>

          {selected && (
            <View style={styles.modeCheck}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============== Styles ==============
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  title: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
    color: theme?.colors?.text ?? "#0f172a",
  },

  // BIG gradient card
  cardGradient: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    minHeight: 96,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  rowIconLg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: { fontWeight: "900", fontSize: 16, color: "#0f172a" },
  cardSubTitle: { color: "#475569", marginTop: 2 },

  // Inputs & list inside modal
  addRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 10 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  input: { flex: 1, paddingVertical: 2, color: "#111827" },
  addBtn: {
    backgroundColor: theme.colors?.primary ?? "#2F80ED",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  helperText: { color: "#64748b", marginTop: 6 },

  favItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  pin: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: "#eef2ff",
    alignItems: "center", justifyContent: "center", marginRight: 10
  },
  removeBtn: { padding: 8, borderRadius: 8, backgroundColor: "#fee2e2" },

  // Quick add row
  quickRow: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 2, flexWrap: "wrap" },
  quickAdd: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffffaa",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },

  // Modals
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 10,
  },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontWeight: "900" },

  // Old chips (kept for reference, not used in Modes now)
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#eaf2ff", borderColor: "#2F80ED" },
  chipText: { fontWeight: "700", color: "#111827" },
  chipTextActive: { color: "#2F80ED" },

  modalBtn: { marginTop: 12, backgroundColor: "#2F80ED", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalBtnTxt: { color: "#fff", fontWeight: "800" },

  switchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  switch: { width: 40, height: 22, borderRadius: 11, backgroundColor: "#e5e7eb", position: "relative" },
  switchOn: { backgroundColor: "#2F80ED" },
  switchKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff", position: "absolute", top: 2, left: 2 },

  // New: icon tile grid for modes
  modeGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, marginBottom: 4, justifyContent: "space-between" },
  modeTileWrap: { width: "48%", marginBottom: 12 },
  modeTile: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  modeTileSelected: { borderColor: "#2F80ED", shadowOpacity: 0.12, elevation: 4 },
  modeIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  modePulseRing: { position: "absolute", width: 62, height: 62, borderRadius: 16, borderColor: "#2F80ED" },
  modeLabel: { fontWeight: "900", color: "#0f172a" },
  modeCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2F80ED",
    alignItems: "center",
    justifyContent: "center",
  },
});
