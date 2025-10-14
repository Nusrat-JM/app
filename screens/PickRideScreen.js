// screens/PickRideScreen.js
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, Keyboard, Switch
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { searchPlaces, reverseGeocode } from "../lib/geocode";
import { fetchDriving } from "../lib/routing/google";   // UPDATED
import { API_BASE } from "../lib/routing/baseURL";

const DEFAULT_REGION = { latitude: 23.7808875, longitude: 90.2792371, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const EDGE = { top: 120, right: 40, bottom: 260, left: 40 };

// ----- colors
const ALT_COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7"]; // alternatives
const INCIDENT_COLOR = { accident: "#ef4444", fire: "#f59e0b", construction: "#eab308", blocked: "#111827" };

export default function PickRideScreen() {
  const nav = useNavigation();
  const mapRef = useRef(null);

  const [active, setActive] = useState("from");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [qFrom, setQFrom] = useState("");
  const [qTo, setQTo] = useState("");
  const [sugFrom, setSugFrom] = useState([]);
  const [sugTo, setSugTo] = useState([]);
  const [panelH, setPanelH] = useState(168);
  const [qMap, setQMap] = useState("");
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [previewPin, setPreviewPin] = useState(null);

  // layers
  const [routes, setRoutes] = useState([]);  // [{overviewCoords, steps:[{coords, durationTraffic, duration}]}]
  const [events, setEvents] = useState([]);

  const [showTraffic, setShowTraffic] = useState(true);
  const [showAlts, setShowAlts] = useState(true);

  // ---------- helpers ----------
  const fitTo = (coords) => coords?.length && mapRef.current?.fitToCoordinates(coords,{edgePadding:EDGE,animated:true});

  const chooseForField = (which, place) => {
    const picked = { lat: +place.lat, lng: +place.lng, name: place.name || "" };
    if (which === "from") { setFrom(picked); setQFrom(picked.name); setSugFrom([]); setActive("to"); }
    else { setTo(picked); setQTo(picked.name); setSugTo([]); }
    Keyboard.dismiss();
  };

  const onMapLongPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const name = await reverseGeocode(latitude, longitude);
    chooseForField(active, { lat: latitude, lng: longitude, name });
    setMapSuggestions([]); setPreviewPin(null);
  };

  async function resolveTyped(which) {
    const text = which === "from" ? qFrom : qTo;
    if (!text || text.length < 2) return null;
    const results = await searchPlaces(text, { country: "bd" });
    const top = results?.[0];
    if (!top) return null;
    chooseForField(which, top);
    return top;
  }

  // suggestions
  useEffect(() => {
    const t = setTimeout(async () => {
      const txt = qFrom.trim(); if (txt.length < 2) return setSugFrom([]);
      try { setSugFrom(await searchPlaces(txt, { country: "bd" })); } catch { setSugFrom([]); }
    }, 300); return () => clearTimeout(t);
  }, [qFrom]);
  useEffect(() => {
    const t = setTimeout(async () => {
      const txt = qTo.trim(); if (txt.length < 2) return setSugTo([]);
      try { setSugTo(await searchPlaces(txt, { country: "bd" })); } catch { setSugTo([]); }
    }, 300); return () => clearTimeout(t);
  }, [qTo]);
  useEffect(() => {
    const t = setTimeout(async () => {
      const txt = qMap.trim(); if (txt.length < 2) return setMapSuggestions([]);
      try { setMapSuggestions(await searchPlaces(txt, { country: "bd" })); } catch { setMapSuggestions([]); }
    }, 300); return () => clearTimeout(t);
  }, [qMap]);

  function focusMapOnPlace(item) {
    setPreviewPin({ lat: +item.lat, lng: +item.lng, name: item.name || "" });
    setQMap(item.name || ""); setMapSuggestions([]);
    mapRef.current?.animateCamera({ center: { latitude: +item.lat, longitude: +item.lng }, altitude: 1200 }, { duration: 650 });
  }

  // ---------- load routes (with steps) ----------
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!from || !to) return setRoutes([]);
      try {
        const driving = await fetchDriving(from, to);
        if (!cancel) {
          // fastest first (uses durationTraffic if present)
          driving.sort((a,b)=> (a.durationTraffic ?? a.duration) - (b.durationTraffic ?? b.duration));
          setRoutes(driving);
          if (driving[0]?.overviewCoords?.length) fitTo(driving[0].overviewCoords);
        }
      } catch(e) { console.log("routing error:", e.message); }
    })();
    return () => { cancel = true; };
  }, [from, to]);

  // ---------- incidents ----------
  async function loadEventsForViewport(region) {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const south = latitude - latitudeDelta / 2;
    const north = latitude + latitudeDelta / 2;
    const west  = longitude - longitudeDelta / 2;
    const east  = longitude + longitudeDelta / 2;
    try {
      const r = await fetch(`${API_BASE}/road-events?south=${south}&west=${west}&north=${north}&east=${east}`);
      const data = await r.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) { console.log("events error:", e.message); }
  }

  // ---------- coloring helpers ----------
  // traffic ratio on a step (>=1 = slower than free flow)
  const stepRatio = (s) => {
    const base = s.duration || 1;
    const t = s.durationTraffic || base;
    return t / base;
  };
  const ratioToColor = (r) => (r <= 1.1 ? "#16a34a" : r <= 1.4 ? "#f59e0b" : "#ef4444"); // green / yellow / red

  // determine if any incident is close to this step (within ~80m simple check)
  function incidentOnStep(step) {
    if (!events.length || step.coords.length < 2) return null;
    const { latitude: lat0, longitude: lng0 } = step.coords[Math.floor(step.coords.length/2)];
    for (const ev of events) {
      const dLat = (lat0 - Number(ev.lat)) * 111_000;            // rough meters
      const dLng = (lng0 - Number(ev.lng)) * 111_000 * Math.cos(lat0*Math.PI/180);
      const dist = Math.hypot(dLat, dLng);
      if (dist < 80) return ev.type; // 80m threshold
    }
    return null;
  }

  // ---------- UI bits ----------
  const canConfirm = qFrom.trim().length > 0 && qTo.trim().length > 0;
  const legendText = useMemo(() => {
    const best = routes[0];
    if (!best) return "Routes will appear here";
    const mins = Math.round((best.durationTraffic ?? best.duration) / 60);
    const km = (best.distance / 1000).toFixed(1);
    return `Best: ${mins} min • ${km} km`;
  }, [routes]);

  return (
    <View style={{ flex:1 }}>
      <MapView
        ref={mapRef}
        style={{ flex:1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsTraffic={showTraffic}                 // road heat (red/yellow/green)
        onLongPress={onMapLongPress}
        onRegionChangeComplete={loadEventsForViewport}
      >
        {/* pins */}
        {from && <Marker coordinate={{ latitude: from.lat, longitude: from.lng }} title="From" description={from.name} pinColor="#2F80ED" />}
        {to &&   <Marker coordinate={{ latitude: to.lat, longitude: to.lng }} title="To" description={to.name} />}
        {previewPin && <Marker coordinate={{ latitude: previewPin.lat, longitude: previewPin.lng }} title="Place" description={previewPin.name} />}

        {/* ROUTES */}
        {routes.map((rt, idx) => {
          const baseColor = idx === 0 ? "#000000" : ALT_COLORS[(idx-1) % ALT_COLORS.length];
          return (
            <View key={rt.id}>
              {/* base whole-route stroke (fastest black, others colored) */}
              {showAlts && rt.overviewCoords?.length > 1 && (
                <Polyline coordinates={rt.overviewCoords} strokeWidth={idx===0?6:4} strokeColor={baseColor} zIndex={idx===0?5:3} />
              )}

              {/* traffic overlays per-step */}
              {rt.steps.map((s, i) => {
                if (!s.coords?.length) return null;
                const r = stepRatio(s);
                const trafficColor = ratioToColor(r);
                // if incident near this step, overpaint with incident color (thicker)
                const hit = incidentOnStep(s);
                return (
                  <View key={`${rt.id}_s_${i}`}>
                    {/* traffic tint on top of base */}
                    <Polyline coordinates={s.coords} strokeWidth={idx===0?5:3} strokeColor={trafficColor} zIndex={idx===0?8:6} />
                    {/* incident overpaint if any */}
                    {hit && (
                      <Polyline coordinates={s.coords} strokeWidth={idx===0?7:5} strokeColor={INCIDENT_COLOR[hit]} zIndex={10} />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* incident pins (still useful to tap) */}
        {events.map(ev => (
          <Marker
            key={`ev_${ev.id}`}
            coordinate={{ latitude: Number(ev.lat), longitude: Number(ev.lng) }}
            title={ev.type.toUpperCase()}
            description={ev.description || ""}
            pinColor={INCIDENT_COLOR[ev.type] || "#111827"}
          />
        ))}
      </MapView>

      {/* panel */}
      <View style={styles.panel} onLayout={(e)=>setPanelH(e.nativeEvent.layout.height)}>
        <Text style={styles.heading}>Pick your locations</Text>

        <TextInput
          style={[styles.input, active==="from" && styles.inputActive]}
          placeholder="From (type or long-press on map)"
          value={qFrom}
          onChangeText={(t)=>{ setQFrom(t); setActive("from"); }}
          onFocus={()=>setActive("from")}
          returnKeyType="search"
          onSubmitEditing={async()=>{ if (sugFrom[0]) chooseForField("from", sugFrom[0]); else await resolveTyped("from"); }}
        />
        {active==="from" && sugFrom.length>0 && (
          <FlatList data={sugFrom} keyExtractor={(i)=>String(i.id)} keyboardShouldPersistTaps="handled"
            style={styles.suggestionList}
            renderItem={({item})=>(
              <TouchableOpacity style={styles.suggestion} onPress={()=>chooseForField("from", item)}>
                <Text numberOfLines={2} style={styles.suggestionTxt}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <TextInput
          style={[styles.input, active==="to" && styles.inputActive]}
          placeholder="To (type or long-press on map)"
          value={qTo}
          onChangeText={(t)=>{ setQTo(t); setActive("to"); }}
          onFocus={()=>setActive("to")}
          returnKeyType="search"
          onSubmitEditing={async()=>{ if (sugTo[0]) chooseForField("to", sugTo[0]); else await resolveTyped("to"); }}
        />
        {active==="to" && sugTo.length>0 && (
          <FlatList data={sugTo} keyExtractor={(i)=>String(i.id)} keyboardShouldPersistTaps="handled"
            style={styles.suggestionList}
            renderItem={({item})=>(
              <TouchableOpacity style={styles.suggestion} onPress={()=>chooseForField("to", item)}>
                <Text numberOfLines={2} style={styles.suggestionTxt}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity
          disabled={!canConfirm}
          onPress={async ()=>{
            Keyboard.dismiss();
            if (!from) await resolveTyped("from");
            if (!to) await resolveTyped("to");
            if (!from || !to) return Alert.alert("Select locations", "Please set both From and To.");
            nav.navigate("RideSummary", { origin: from, destination: to, driving: routes[0] });
          }}
          style={[styles.confirm, !canConfirm && { opacity:0.6 }]}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmTxt}>Confirm locations</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>{legendText}</Text>

        <View style={styles.toggles}>
          <Row label="Traffic colors" value={showTraffic} onChange={setShowTraffic} />
          <Row label="All alternatives" value={showAlts} onChange={setShowAlts} />
        </View>
      </View>

      {/* map search */}
      <View style={[styles.mapSearchWrap, { top: 12 + panelH + 8 }]}>
        <TextInput
          style={styles.mapSearch}
          placeholder="Search the map (centers view)"
          value={qMap} onChangeText={setQMap} returnKeyType="search"
          onSubmitEditing={()=>{ if (mapSuggestions[0]) focusMapOnPlace(mapSuggestions[0]); }}
        />
        {qMap.trim().length>1 && mapSuggestions.length>0 && (
          <FlatList data={mapSuggestions} keyExtractor={(i)=>String(i.id)} keyboardShouldPersistTaps="handled"
            style={[styles.suggestionList, { marginTop:6 }]}
            renderItem={({item})=>(
              <TouchableOpacity style={styles.suggestion} onPress={()=>focusMapOnPlace(item)}>
                <Text numberOfLines={2} style={styles.suggestionTxt}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

function Row({ label, value, onChange }) {
  return (
    <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
      <Switch value={value} onValueChange={onChange} />
      <Text>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel:{ position:"absolute", left:12, right:12, top:12, backgroundColor:"#fff", padding:12, borderRadius:14, elevation:10, shadowColor:"#000", shadowOpacity:0.15, shadowRadius:8 },
  heading:{ fontSize:16, fontWeight:"700", marginBottom:6 },
  input:{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:10, padding:10, marginTop:8, backgroundColor:"#fff" },
  inputActive:{ borderColor:"#2F80ED" },
  suggestionList:{ maxHeight:160, marginTop:6, borderRadius:10, borderWidth:1, borderColor:"#eee", backgroundColor:"#fff" },
  suggestion:{ padding:10, borderBottomWidth:1, borderBottomColor:"#f2f2f2" },
  suggestionTxt:{ fontSize:13 },
  confirm:{ backgroundColor:"#2F80ED", borderRadius:12, paddingVertical:12, alignItems:"center", marginTop:10 },
  confirmTxt:{ color:"#fff", fontWeight:"700" },
  hint:{ fontSize:12, color:"#374151", marginTop:8 },
  toggles:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginTop:8 },
  mapSearchWrap:{ position:"absolute", left:12, right:12 },
  mapSearch:{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:10, padding:10, backgroundColor:"#fff" },
});
