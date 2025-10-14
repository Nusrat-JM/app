// screens/PackageBoxesScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';

const SIZE_META = {
  S: { label: 'Small', note: 'Docs & gifts up to 2 kg' },
  M: { label: 'Medium', note: 'Shoe box / 5 kg' },
  L: { label: 'Large', note: 'Big box / 10 kg' },
};

export default function PackageBoxesScreen({ navigation, route }) {
  const { pickup, drop, slot, mode } = route.params || {};
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const est = useMemo(() => {
    const base = 79; // BDT base
    const sizeBump = size === 'S' ? 0 : size === 'M' ? 30 : 60;
    return base + sizeBump + (qty - 1) * 20;
  }, [size, qty]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={['#e6f0ff', '#f8e8ff', '#fff4e6']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="chevron-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>Boxes</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Route Summary pill */}
        <View style={styles.pill}>
          <Ionicons name="swap-vertical" size={16} color="#0f172a" />
          <Text style={styles.pillText} numberOfLines={1}>{pickup || 'Pickup'}</Text>
          <Ionicons name="arrow-forward" size={16} color="#0f172a" />
          <Text style={styles.pillText} numberOfLines={1}>{drop || 'Drop-off'}</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="time" size={16} color="#0f172a" />
          <Text style={styles.pillText}>{slot}</Text>
        </View>

        {/* Size selector */}
        <Text style={styles.sectionTitle}>Select size</Text>
        <View style={styles.sizeRow}>
          {(['S','M','L']).map(k => (
            <TouchableOpacity key={k} onPress={() => setSize(k)} activeOpacity={0.9}>
              <LinearGradient
                colors={k===size ? ['#ffffff','#e7f0ff'] : ['#ffffff','#ffffff']}
                style={[styles.sizeCard, k===size && styles.sizeActive]}
                start={{x:0,y:0}} end={{x:1,y:1}}
              >
                <Ionicons name="cube-outline" size={22} color="#0f172a" />
                <Text style={styles.sizeLabel}>{SIZE_META[k].label}</Text>
                <Text style={styles.sizeNote}>{SIZE_META[k].note}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity */}
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => setQty(Math.max(1, qty-1))} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
          <Text style={styles.qty}>{qty}</Text>
          <TouchableOpacity onPress={() => setQty(qty+1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Delivery notes (optional)</Text>
        <View style={styles.notesBox}>
          <TextInput
            value={notes} onChangeText={setNotes}
            placeholder="Call before arrival / fragile / leave at gate…"
            placeholderTextColor="#6b7280" style={{ minHeight: 60, textAlignVertical: 'top', color:'#111827' }}
            multiline
          />
        </View>

        {/* Estimate card */}
        <LinearGradient colors={['#f0fdf4','#ecfeff']} style={styles.estimateCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.estimateTitle}>Estimated fare</Text>
            <Text style={styles.estimateAmt}>৳ {est}</Text>
          </View>
          <Text style={styles.estimateNote}>Final price may vary with distance, time & waiting.</Text>
        </LinearGradient>

        <TouchableOpacity
          onPress={() => navigation.navigate('PackageConfirm', { pickup, drop, slot, mode, size, qty, notes, est })}
          activeOpacity={0.9}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing.md, paddingBottom: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circleBtn: { width: 36, height: 36, borderRadius: 18, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(15,23,42,0.06)' },
  title: { fontSize: theme.typography.h2, fontWeight: '800', color: '#0f172a' },

  pill: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#fff', padding:10, borderRadius:12, borderWidth:1, borderColor:'rgba(15,23,42,0.08)', marginTop:12 },
  pillText: { maxWidth: 120, fontWeight:'700', color:'#0f172a' },

  sectionTitle: { marginTop: 16, marginBottom: 8, fontWeight:'800', color:'#0f172a', fontSize: 16 },

  sizeRow: { flexDirection:'row', gap:10 },
  sizeCard: { width: 110, borderRadius:14, padding:12, borderWidth:1, borderColor:'rgba(15,23,42,0.08)', backgroundColor:'#fff' },
  sizeActive: { borderColor:'#0f172a' },
  sizeLabel: { fontWeight:'800', color:'#0f172a', marginTop:6 },
  sizeNote: { color:'#475569', fontSize:12, marginTop:2 },

  qtyRow: { flexDirection:'row', alignItems:'center', gap:14 },
  qtyBtn: { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center', backgroundColor:'#fff', borderWidth:1, borderColor:'rgba(15,23,42,0.08)' },
  qtyBtnText: { fontWeight:'900', fontSize:18, color:'#0f172a' },
  qty: { fontSize:18, fontWeight:'900', color:'#0f172a' },

  notesBox: { backgroundColor:'#fff', borderRadius:14, borderWidth:1, borderColor:'rgba(15,23,42,0.08)', padding:12 },

  estimateCard: { marginTop: 14, borderRadius:14, padding:12, borderWidth:1, borderColor:'rgba(15,23,42,0.08)', backgroundColor:'#fff' },
  estimateTitle: { fontWeight:'800', color:'#052e16' },
  estimateAmt: { fontWeight:'900', color:'#052e16', fontSize:18 },
  estimateNote: { color:'#065f46', fontSize:12, marginTop:4 },

  cta: { backgroundColor:'#0f172a', borderRadius:14, paddingVertical:14, alignItems:'center', marginTop: 14 },
  ctaText: { color:'#fff', fontWeight:'900' },
});
