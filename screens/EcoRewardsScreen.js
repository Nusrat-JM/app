// screens/EcoRewardsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';
import { API_BASE } from "../lib/routing/baseURL";

export default function EcoRewardsScreen({ route, navigation }) {
  const userId = route?.params?.userId;
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/rewards/summary/${userId}`);
      const j = await r.json();
      setData(j);
    } catch (e) {
      Alert.alert('Error', 'Failed to load rewards.');
    } finally { setLoading(false); }
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  const applyOffer = async () => {
    try {
      const r = await fetch(`${API_BASE}/rewards/apply-offer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const j = await r.json();
      navigation.navigate('Voucher', { voucher: j.voucher, badge: j.badge });
    } catch {
      Alert.alert('Error', 'Could not create voucher');
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator /></View>;
  if (!data)   return <View style={s.center}><Text>Nothing to show</Text></View>;

  const trees = Math.max(0, Math.round((data.co2SavedKg / 21))); // ≈ kg per tree/yr

  return (
    <LinearGradient colors={['#e6f0ff', '#f8e8ff', '#fff4e6']} style={s.fill}>
      <View style={s.box}>
        <View style={s.row}>
          <Text style={s.h1}>Eco Rewards</Text>
          <View style={s.pill}><Ionicons name="leaf" size={14} color="#064e3b"/><Text style={s.pillText}>{data.tier}</Text></View>
        </View>

        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statBig}>{data.points}</Text>
            <Text style={s.statLabel}>Points</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statBig}>{data.co2SavedKg}</Text>
            <Text style={s.statLabel}>kg CO₂ saved</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statBig}>{trees}</Text>
            <Text style={s.statLabel}>≈ trees/yr</Text>
          </View>
        </View>

        <View style={{marginTop:16}}>
          <Text style={s.sub}>Current Offer</Text>
          <Text style={s.offer}>{data.offer.pct}% OFF • {data.offer.badge}</Text>
        </View>

        <TouchableOpacity onPress={applyOffer} activeOpacity={0.9} style={s.cta}>
          <Text style={s.ctaText}>Get My Voucher</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  fill:{flex:1,padding:16},
  center:{flex:1,justifyContent:'center',alignItems:'center'},
  box:{backgroundColor:'rgba(255,255,255,0.8)',borderRadius:16,padding:16,borderWidth:1,borderColor:'rgba(15,23,42,0.06)'},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  h1:{fontSize:20,fontWeight:'800',color:'#0f172a'},
  pill:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(16,185,129,0.12)',paddingHorizontal:10,paddingVertical:6,borderRadius:999},
  pillText:{fontWeight:'800',color:'#064e3b',fontSize:12},
  statRow:{flexDirection:'row',marginTop:12},
  stat:{flex:1,alignItems:'center',paddingVertical:12},
  statBig:{fontSize:22,fontWeight:'900',color:'#0f172a'},
  statLabel:{color:'#334155',marginTop:4},
  sub:{fontWeight:'800',color:'#0f172a'},
  offer:{marginTop:6,fontSize:16,fontWeight:'900',color:'#0f172a'},
  cta:{marginTop:16,backgroundColor:'#111827',borderRadius:12,paddingVertical:12,alignItems:'center'},
  ctaText:{color:'#fff',fontWeight:'900',letterSpacing:0.4}
});
