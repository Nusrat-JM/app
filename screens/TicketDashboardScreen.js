// screens/TicketDashboardScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, BarChart } from "react-native-chart-kit";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../lib/routing/baseURL";

const PERIODS = [
  { key: "7d",  label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "ytd", label: "Year to Date" },
];

const SCREEN_W = Dimensions.get("window").width;
const CARD_PAD = 12;
const CHART_W = SCREEN_W - 16 * 2 - CARD_PAD * 2;

// Light palette (same vibe as the rest of your app)
const TICKET_GRADS = [
  ["#ecfeff", "#dbeafe"], // cyan → blue-50
  ["#fdf2f8", "#fae8ff"], // pink → fuchsia-50
  ["#e0f2fe", "#f0fdf4"], // sky → green-50
  ["#fef3c7", "#ede9fe"], // amber → indigo-50
  ["#eef2ff", "#fff7ed"], // indigo-50 → orange-50
];

async function getToken() {
  return (await SecureStore.getItemAsync("token")) || (await AsyncStorage.getItem("token"));
}

export default function TicketDashboardScreen() {
  const [period, setPeriod]   = useState("30d");
  const [summary, setSummary] = useState(null);
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(false);

  const demoMonthlySpend = [
    { month: "Jan", value: 300 }, { month: "Feb", value: 340 }, { month: "Mar", value: 380 }, { month: "Apr", value: 320 },
    { month: "May", value: 410 }, { month: "Jun", value: 395 }, { month: "Jul", value: 445 }, { month: "Aug", value: 430 },
    { month: "Sep", value: 470 }, { month: "Oct", value: 490 }, { month: "Nov", value: 515 }, { month: "Dec", value: 560 },
  ];
  const demoByMode = {
    "7d":  { Bus: 3, Train: 1, Plane: 0, Ferry: 0 },
    "30d": { Bus: 10, Train: 4, Plane: 2, Ferry: 1 },
    "90d": { Bus: 28, Train: 12, Plane: 6, Ferry: 3 },
    "ytd": { Bus: 79, Train: 35, Plane: 18, Ferry: 9 },
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) { setSummary(null); setRecent([]); return; }
        const res = await fetch(`${API_BASE}/dashboard/ticket?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (mounted && res.ok) {
          setSummary(data);
          setRecent(Array.isArray(data?.recent) ? data.recent : []);
        } else if (mounted) { setSummary(null); setRecent([]); }
      } catch {
        if (mounted) { setSummary(null); setRecent([]); }
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [period]);

  const spendSlice = useMemo(() => {
    if (summary?.monthlySpend?.length) return summary.monthlySpend;
    const n = period === "7d" ? 2 : period === "30d" ? 4 : period === "90d" ? 6 : demoMonthlySpend.length;
    return demoMonthlySpend.slice(-n);
  }, [period, summary]);

  const byModeObj = summary?.byMode || demoByMode[period] || {};
  const byMode = useMemo(() => Object.entries(byModeObj).map(([type, count]) => ({ type, count })), [byModeObj]);

  const totalTickets   = summary?.totalTickets ?? byMode.reduce((s, x) => s + x.count, 0);
  const avgTicketSpend = Math.round((spendSlice.reduce((s, x) => s + x.value, 0) || 0) / (spendSlice.length || 1));

  const lineData = { labels: spendSlice.map(d => d.month), datasets: [{ data: spendSlice.map(d => d.value) }] };
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
      <Text style={styles.subHeader}>Ticket Booking {loading ? "…" : ""}</Text>

      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            activeOpacity={0.9}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
          >
            <Text style={[styles.periodTxt, period === p.key && styles.periodTxtActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statRow}>
        <StatCard gradient={["#ecfeff", "#dbeafe"]} icon="pricetag" title="Total Tickets"
                  value={String(totalTickets)} subtitle="Selected period" />
        <StatCard gradient={["#f0fdf4", "#dcfce7"]} icon="cash" title="Avg Monthly Spend"
                  value={`৳${avgTicketSpend}`} subtitle={`${spendSlice[0]?.month ?? ""}–${spendSlice.at(-1)?.month ?? ""}`} />
      </View>

      {/* RECENT FIRST */}
      <Card title="Recent Tickets" icon="ticket-outline">
        <FlatList
          data={recent}
          keyExtractor={(item) => String(item.ticket_id ?? item.pnr ?? item.id)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => <RecentItem item={item} idx={index} />}
          ListEmptyComponent={<Text style={{ color: "#64748b" }}>No tickets in this period.</Text>}
        />
      </Card>

      {/* GRAPHS UNDER RECENT */}
      <Card title="Average Ticket Spend by Month" icon="trending-up">
        <LineChart
          width={CHART_W}
          height={220}
          data={lineData}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero
          yAxisLabel="৳"
        />
        <Text style={styles.cardNote}>Total ticket expenditure trend.</Text>
      </Card>

      <Card title="Tickets by Mode" icon="stats-chart">
        <BarChart
          width={CHART_W}
          height={220}
          data={barData}
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
        />
        <Text style={styles.cardNote}>Bus / Train / Plane / Ferry breakdown.</Text>
      </Card>
    </View>
  );
}

/* ---------- Recent Ticket card ---------- */
function RecentItem({ item, idx = 0 }) {
  // Server shape recommended:
  // { ticket_id, pnr, mode, operator_name, class_or_type, from, to, travel_date,
  //   dep_time, arr_time, seats: [], price_per_seat, subtotal, total, currency, status }

  const modeIcon =
    item.mode === "train" ? "train" :
    item.mode === "bus"   ? "bus"   :
    item.mode === "ferry" ? "boat"  :
    item.mode === "plane" ? "airplane" : "bed-outline";

  const dateTxt = formatDate(item.travel_date);
  const timeTxt = item.dep_time && item.arr_time ? `${item.dep_time} → ${item.arr_time}` : "";
  const seatTxt = Array.isArray(item.seats) && item.seats.length ? item.seats.join(", ") : "—";
  const perSeat = Number(item.price_per_seat || 0);
  const total   = Number(item.total || item.subtotal || 0);

  return (
    <Pressable
      onPress={() => {}}
      style={({ pressed }) => [
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 }
      ]}
    >
      <LinearGradient
        colors={TICKET_GRADS[idx % TICKET_GRADS.length]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.recentGrad}
      >
        <View style={styles.recentInner}>
          {/* Top: icon + operator + mode chip */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <View style={styles.recentIcon}>
              <Ionicons name={modeIcon} size={16} color="#0f172a" />
            </View>
            <Text style={styles.recentTitle} numberOfLines={1}>
              {item.operator_name || (item.mode ? item.mode.toUpperCase() : "Ticket")}
            </Text>
            <View style={styles.modeChip}>
              <Text style={styles.modeChipTxt}>{(item.mode || "").toUpperCase()}</Text>
            </View>
          </View>

          {/* Route */}
          <View style={[styles.rowBetween, { marginTop: 2 }]}>
            <Text style={styles.routeTxt} numberOfLines={1}>{item.from}</Text>
            <Ionicons name="arrow-forward" size={16} color="#334155" />
            <Text style={styles.routeTxt} numberOfLines={1}>{item.to}</Text>
          </View>

          {/* When + Seats */}
          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <Text style={styles.recentSub}>
              {dateTxt}{timeTxt ? `  •  ${timeTxt}` : ""}
            </Text>
            <Text style={styles.recentSub}>Seats: {seatTxt}</Text>
          </View>

          {/* Fare + PNR + Status */}
          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <View>
              {!!perSeat && (
                <Text style={styles.recentSub}>Fare (৳{perSeat} × {Array.isArray(item.seats) ? item.seats.length : 0})</Text>
              )}
              {!!item.pnr && (
                <Text style={[styles.recentSub, { color: "#0f172a", fontWeight: "800" }]}>PNR: {item.pnr}</Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.recentAmount}>৳ {total}</Text>
              <Text style={[styles.badge, badgeStyle(item.status)]}>{item.status ?? "UNKNOWN"}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/* ---------- helpers ---------- */
function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function badgeStyle(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return { backgroundColor: "#dcfce7", color: "#065f46" };
  if (s === "PENDING") return { backgroundColor: "#fef9c3", color: "#854d0e" };
  if (s === "CANCELLED") return { backgroundColor: "#fee2e2", color: "#991b1b" };
  return { backgroundColor: "#e2e8f0", color: "#334155" };
}

/* ---------- shared UI ---------- */
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

  // Gradient ticket card
  recentGrad: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  recentInner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  recentTitle: { fontWeight: "900", color: "#0f172a", flex: 1 },
  recentSub: { color: "#334155" },
  recentAmount: { color: "#0f172a", fontWeight: "900", marginTop: 2 },
  recentIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: "#ffffffcc", alignItems: "center", justifyContent: "center", marginRight: 8, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)" },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: "hidden", textAlign: "center", fontSize: 12, fontWeight: "800" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  routeTxt: { color: "#0f172a", fontWeight: "800", maxWidth: "44%" },
  modeChip: { backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginLeft: 8, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  modeChipTxt: { color: "#334155", fontSize: 11, fontWeight: "800" },
});
