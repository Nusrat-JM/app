// screens/VoucherScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export default function VoucherScreen({ route }) {
  const { voucher, badge } = route.params || {};
  const copy = () => Clipboard.setStringAsync(voucher?.code || '');

  if (!voucher) return <View style={s.center}><Text>No voucher</Text></View>;

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Your {badge} Voucher</Text>
      <View style={s.card}>
        <Text style={s.code}>{voucher.code}</Text>
        <Text style={s.meta}>{voucher.pct_off}% OFF • Expires {new Date(voucher.expires_at).toLocaleString()}</Text>
        <TouchableOpacity onPress={copy} style={s.copyBtn}>
          <Ionicons name="copy" size={16} color="#111827" />
          <Text style={s.copyText}>Copy code</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.help}>Apply this code at checkout. One active voucher per user.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  wrap:{flex:1,padding:16},
  center:{flex:1,justifyContent:'center',alignItems:'center'},
  title:{fontSize:20,fontWeight:'800',color:'#0f172a',marginBottom:12},
  card:{borderWidth:1,borderColor:'rgba(15,23,42,0.06)',borderRadius:16,padding:16,backgroundColor:'rgba(255,255,255,0.85)'},
  code:{fontSize:22,fontWeight:'900',letterSpacing:1,color:'#0f172a'},
  meta:{marginTop:8,color:'#334155'},
  copyBtn:{marginTop:12,alignSelf:'flex-start',flexDirection:'row',gap:6,backgroundColor:'rgba(15,23,42,0.06)',paddingHorizontal:10,paddingVertical:8,borderRadius:10},
  copyText:{fontWeight:'800',color:'#111827'}
});
