// screens/PackageDashboardScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, DeviceEventEmitter } from "react-native";
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

export default function PackageDashboardScreen() {
  const [period, setPeriod] = useState("30d");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Demo fallbacks
  const demoMonthlyFees = [
    { month: "Jan", value: 85 }, { month: "Feb", value: 92 }, { month: "Mar", value: 110 }, { month: "Apr", value: 97 },
    { month: "May", value: 120 }, { month: "Jun", value: 108 }, { month: "Jul", value: 132 }, { month: "Aug", value: 125 },
    { month: "Sep", value: 140 }, { month: "Oct", value: 146 }, { month: "Nov", value: 152 }, { month: "Dec", value: 160 },
  ];
  const demoBySize = {
    "7d":  { Small: 5, Medium: 3, Large: 1, Fragile: 1 },
    "30d": { Small: 18, Medium: 11, Large: 6, Fragile: 4 },
    "90d": { Small: 51, Medium: 35, Large: 19, Fragile: 12 },
    "ytd": { Small: 140, Medium: 101, Large: 58, Fragile: 34 },
  };

  const fetchSummary = async (p = period) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) { setSummary(null); return; }
      const res = await fetch(`${API_BASE}/dashboard/package?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSummary(data); else setSummary(null);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(period); }, [period]);

  // Auto-refresh when a new shipment is created in the app
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SHIPMENT_CREATED', () => {
      fetchSummary(period);
    });
    return () => sub.remove();
  }, [period]);

  const feesSlice = useMemo(() => {
    if (summary?.monthlyFees?.length) return summary.monthlyFees;
    const n = period === "7d" ? 2 : period === "30d" ? 4 : period === "90d" ? 6 : demoMonthlyFees.length;
    return demoMonthlyFees.slice(-n);
  }, [period, summary]);

  const bySize = useMemo(() => {
    const obj = summary?.bySize || demoBySize[period] || {};
    return Object.entries(obj).map(([type, count]) => ({ type, count }));
  }, [period, summary]);

  const totalPkgs = summary?.totalPackages ?? bySize.reduce((s, x) => s + x.count, 0);
  const onTimeRate = summary?.onTimeRate ?? 94; // %
  const avgFee = Math.round((feesSlice.reduce((s, x) => s + x.value, 0) || 0) / (feesSlice.length || 1));

  const lineData = { labels: feesSlice.map(d => d.month), datasets: [{ data: feesSlice.map(d => d.value) }] };
  const barData  = { labels: bySize.map(d => d.type), datasets: [{ data: bySize.map(d => d.count) }] };
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
      <Text style={styles.subHeader}>Send Package {loading ? "…" : ""}</Text>

      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} activeOpacity={0.9}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}>
            <Text style={[styles.periodTxt, period === p.key && styles.periodTxtActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statRow}>
        <StatCard gradient={["#e0f2fe", "#fff1f2"]} icon="cube" title="Total Packages" value={String(totalPkgs)} subtitle="Selected period"/>
        <StatCard gradient={["#f0fdf4", "#dcfce7"]} icon="checkmark-done" title="On-time Rate" value={`${onTimeRate}%`} subtitle="Deliveries on schedule"/>
        <StatCard gradient={["#ecfeff", "#dbeafe"]} icon="cash" title="Avg Fee" value={`৳${avgFee}`} subtitle="Per package"/>
      </View>

      <Card title="Average Delivery Fees by Month" icon="trending-up">
        <LineChart width={CHART_W} height={220} data={lineData} chartConfig={chartConfig} bezier style={styles.chart} fromZero yAxisLabel="৳" />
        <Text style={styles.cardNote}>Average package delivery fee across months.</Text>
      </Card>

      <Card title="Packages by Size/Type" icon="stats-chart">
        <BarChart width={CHART_W} height={220} data={barData} chartConfig={chartConfig} style={styles.chart} fromZero showValuesOnTopOfBars />
        <Text style={styles.cardNote}>Breakdown of packages (Small / Medium / Large / Fragile).</Text>
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
