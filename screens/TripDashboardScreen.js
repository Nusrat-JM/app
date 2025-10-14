// screens/TripDashboardScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, BarChart } from "react-native-chart-kit";
import { API_BASE } from "../lib/routing/baseURL";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PERIODS = [
  { key: "7d",  label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "ytd", label: "Year to Date" },
];

const SCREEN_W = Dimensions.get("window").width;
const CARD_PAD = 12;
const CHART_W = SCREEN_W - 16 * 2 - CARD_PAD * 2;

async function getToken() {
  return (await SecureStore.getItemAsync("token")) || (await AsyncStorage.getItem("token"));
}

export default function TripDashboardScreen() {
  const [period, setPeriod] = useState("30d");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const demoMonthlySavings = [
    { month: "Jan", value: 60 }, { month: "Feb", value: 72 }, { month: "Mar", value: 78 }, { month: "Apr", value: 69 },
    { month: "May", value: 85 }, { month: "Jun", value: 81 }, { month: "Jul", value: 96 }, { month: "Aug", value: 92 },
    { month: "Sep", value: 104 }, { month: "Oct", value: 111 }, { month: "Nov", value: 118 }, { month: "Dec", value: 126 },
  ];
  const demoByMode = {
    "7d":  { Bus: 3, Train: 1, Ride: 2, Bike: 1, Ferry: 0 },
    "30d": { Bus: 11, Train: 5, Ride: 9, Bike: 4, Ferry: 2 },
    "90d": { Bus: 30, Train: 15, Ride: 26, Bike: 12, Ferry: 6 },
    "ytd": { Bus: 84, Train: 41, Ride: 72, Bike: 33, Ferry: 16 },
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) { setSummary(null); return; }
        const res = await fetch(`${API_BASE}/dashboard/trip?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (mounted && res.ok) setSummary(data); else if (mounted) setSummary(null);
      } catch { if (mounted) setSummary(null); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [period]);

  const savingsSlice = useMemo(() => {
    if (summary?.monthlySavings?.length) return summary.monthlySavings;
    const n = period === "7d" ? 2 : period === "30d" ? 4 : period === "90d" ? 6 : demoMonthlySavings.length;
    return demoMonthlySavings.slice(-n);
  }, [period, summary]);

  const byMode = useMemo(() => {
    const obj = summary?.byMode || demoByMode[period] || {};
    return Object.entries(obj).map(([type, count]) => ({ type, count }));
  }, [period, summary]);

  const totalTrips = summary?.totalTrips ?? byMode.reduce((s, x) => s + x.count, 0);
  const avgSavings = Math.round((savingsSlice.reduce((s, x) => s + x.value, 0) || 0) / (savingsSlice.length || 1));
  const optimizedRate = summary?.optimizedRate ?? 88; // % of trips auto-optimized

  const lineData = { labels: savingsSlice.map(d => d.month), datasets: [{ data: savingsSlice.map(d => d.value) }] };
  const barData  = { labels: byMode.map(d => d.type), datasets: [{ data: byMode.map(d => d.count) }] };
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (o=1) => `rgba(2, 6, 23, ${o})`,
    labelColor: (o=1) => `rgba(71, 85, 105, ${o})`,
    propsForDots: { r: "3" },
    propsForBackgroundLines: { stroke: "#e2e8f0", strokeDasharray: "6 6" },
  };

  return (
    <View>
      <Text style={styles.subHeader}>Plan My Trip {loading ? "…" : ""}</Text>

      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} activeOpacity={0.9}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}>
            <Text style={[styles.periodTxt, period === p.key && styles.periodTxtActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statRow}>
        <StatCard gradient={["#ecfeff", "#dbeafe"]} icon="git-branch-outline" title="Total Trips" value={String(totalTrips)} subtitle="Selected period"/>
        <StatCard gradient={["#f0fdf4", "#dcfce7"]} icon="leaf" title="Avg Savings" value={`৳${avgSavings}`} subtitle="Optimized routes"/>
        <StatCard gradient={["#fdf2f8", "#e6f0ff"]} icon="sparkles" title="Optimized Trips" value={`${optimizedRate}%`} subtitle="Auto-optimized share"/>
      </View>

      <Card title="Estimated Savings by Month" icon="trending-up">
        <LineChart width={CHART_W} height={220} data={lineData} chartConfig={chartConfig} bezier style={styles.chart} fromZero yAxisLabel="৳"/>
        <Text style={styles.cardNote}>Savings from multimodal route optimization.</Text>
      </Card>

      <Card title="Trips by Mode" icon="stats-chart">
        <BarChart width={CHART_W} height={220} data={barData} chartConfig={chartConfig} style={styles.chart} fromZero showValuesOnTopOfBars />
        <Text style={styles.cardNote}>Bus / Train / Ride / Bike / Ferry distribution.</Text>
      </Card>
    </View>
  );
}

function StatCard({ gradient, icon, title, value, subtitle }) {
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIcon}><Ionicons name={icon} size={18} color="#0f172a" /></View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub}>{subtitle}</Text>
    </LinearGradient>
  );
}

function Card({ title, icon, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderIcon}><Ionicons name={icon} size={18} color="#0f172a" /></View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { fontSize: 18, fontWeight: "900", marginBottom: 8, color: "#0f172a" },

  periodRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  periodChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  periodChipActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  periodTxt: { fontWeight: "700", color: "#334155" },
  periodTxtActive: { color: "#1d4ed8" },

  statRow: { flexDirection: "row", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  statCard: { flexGrow: 1, minWidth: "48%", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  statHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  statIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center", marginRight: 8 },
  statTitle: { fontWeight: "800", color: "#0f172a" },
  statValue: { fontSize: 22, fontWeight: "900", color: "#0f172a", marginTop: 2 },
  statSub: { color: "#64748b", marginTop: 2 },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: CARD_PAD, marginBottom: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardHeaderIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginRight: 8 },
  cardTitle: { fontWeight: "900", color: "#0f172a", fontSize: 16 },
  cardNote: { color: "#64748b", marginTop: -4 },
  chart: { borderRadius: 12, marginTop: 4 },
});
