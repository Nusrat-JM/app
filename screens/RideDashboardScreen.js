// screens/RideDashboardScreen.js
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
const PAGE_PAD = 0; // parent already has padding
const CHART_W = SCREEN_W - 16 * 2 - CARD_PAD * 2; // match your previous math

async function getToken() {
  return (await SecureStore.getItemAsync("token")) || (await AsyncStorage.getItem("token"));
}

export default function RideDashboardScreen() {
  const [period, setPeriod] = useState("30d");

  const demoMonthlySpend = [
    { month: "Jan", value: 120 }, { month: "Feb", value: 135 }, { month: "Mar", value: 158 },
    { month: "Apr", value: 142 }, { month: "May", value: 166 }, { month: "Jun", value: 151 },
    { month: "Jul", value: 177 }, { month: "Aug", value: 163 }, { month: "Sep", value: 172 },
    { month: "Oct", value: 181 }, { month: "Nov", value: 190 }, { month: "Dec", value: 205 },
  ];
  const demoByVehicle = {
    "7d":  { Sedan: 4,  SUV: 3,  CNG: 2, Bike: 1, Transit: 1, Walk: 0 },
    "30d": { Sedan: 12, SUV: 8,  CNG: 7, Bike: 5, Transit: 3, Walk: 2 },
    "90d": { Sedan: 31, SUV: 21, CNG: 18, Bike: 12, Transit: 8, Walk: 4 },
    "ytd": { Sedan: 88, SUV: 63, CNG: 52, Bike: 33, Transit: 21, Walk: 14 },
  };

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) { setSummary(null); return; }
        const res = await fetch(`${API_BASE}/dashboard/summary?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (mounted && res.ok) setSummary(data);
        if (mounted && !res.ok) setSummary(null);
      } catch {
        if (mounted) setSummary(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period]);

  const spendSlice = useMemo(() => {
    if (summary?.monthlySpend?.length) return summary.monthlySpend;
    if (period === "7d" || period === "30d" || period === "90d") {
      const n = period === "7d" ? 2 : period === "30d" ? 4 : 6;
      return demoMonthlySpend.slice(-n);
    }
    return demoMonthlySpend;
  }, [period, summary]);

  const vehicleArr = useMemo(() => {
    const obj = summary?.byVehicle || demoByVehicle[period] || {};
    return Object.entries(obj).map(([type, count]) => ({ type, count }));
  }, [period, summary]);

  const totalRides = summary?.totalRides ?? vehicleArr.reduce((s, x) => s + x.count, 0);
  const avgMonthlySpend = Math.round(
    (spendSlice.reduce((s, x) => s + x.value, 0) || 0) / (spendSlice.length || 1)
  );

  const lineData = { labels: spendSlice.map(d => d.month), datasets: [{ data: spendSlice.map(d => d.value) }] };
  const barData  = { labels: vehicleArr.map(d => d.type),  datasets: [{ data: vehicleArr.map(d => d.count) }] };
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
      <Text style={styles.subHeader}>Ride Overview {loading ? "…" : ""}</Text>

      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            activeOpacity={0.9}
          >
            <Text style={[styles.periodTxt, period === p.key && styles.periodTxtActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statRow}>
        <StatCard gradient={["#ecfeff", "#dbeafe"]} icon="car"  title="Total Rides" value={String(totalRides)} subtitle="Selected period"/>
        <StatCard gradient={["#f0fdf4", "#dcfce7"]} icon="cash" title="Avg Monthly Spend" value={`৳${avgMonthlySpend}`} subtitle={`${spendSlice[0]?.month ?? ""}–${spendSlice.at(-1)?.month ?? ""}`} />
      </View>

      <Card title="Average Spend by Month" icon="trending-up">
        <LineChart width={CHART_W} height={220} data={lineData} chartConfig={chartConfig} bezier style={styles.chart} fromZero yAxisLabel="৳" />
        <Text style={styles.cardNote}>Average spend for each month in the selected period.</Text>
      </Card>

      <Card title="Rides by Vehicle Type" icon="stats-chart">
        <BarChart width={CHART_W} height={220} data={barData} chartConfig={chartConfig} style={styles.chart} fromZero showValuesOnTopOfBars />
        <Text style={styles.cardNote}>Counts of rides by vehicle type.</Text>
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

  statRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
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
