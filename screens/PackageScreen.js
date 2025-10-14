// screens/PackageScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Modal, Pressable, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../lib/theme';

export default function PackageScreen({ navigation }) {
  const [mode, setMode] = useState('send'); // 'send' | 'deliver'
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [slot, setSlot] = useState('Today, Anytime');
  const [slotOpen, setSlotOpen] = useState(false);

  const canContinue = pickup.trim().length > 2 && drop.trim().length > 2;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#e6f0ff', '#f8e8ff', '#fff4e6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="chevron-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>Send a Package</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Segmented */}
        <View style={styles.segment}>
          <Pressable onPress={() => setMode('send')} style={[styles.segBtn, mode==='send' && styles.segActive]}>
            <Ionicons name="paper-plane" size={16} color={mode==='send' ? '#0f172a':'#334155'} />
            <Text style={[styles.segText, mode==='send' && styles.segTextActive]}>Send</Text>
          </Pressable>
          <Pressable onPress={() => setMode('deliver')} style={[styles.segBtn, mode==='deliver' && styles.segActive]}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={16} color={mode==='deliver' ? '#0f172a':'#334155'} />
            <Text style={[styles.segText, mode==='deliver' && styles.segTextActive]}>Deliver</Text>
          </Pressable>
        </View>

        {/* Illustration (pure RN shapes to avoid assets) */}
        <View style={styles.illustration}>
          <View style={[styles.box, { backgroundColor: '#c7d2fe', left: 10, top: 14 }]} />
          <View style={[styles.box, { backgroundColor: '#fbcfe8', left: 70, top: -6, width: 76, height: 54 }]} />
          <View style={[styles.box, { backgroundColor: '#a7f3d0', left: 0, top: -20, width: 84, height: 54 }]} />
          <View style={[styles.box, { backgroundColor: '#e9d5ff', left: 52, top: -48, width: 64, height: 44 }]} />
          <View style={styles.plantPot} />
        </View>

        {/* Inputs */}
        <View style={styles.inputRow}>
          <Ionicons name="location-outline" size={18} color="#334155" style={styles.inputIcon} />
          <TextInput
            placeholder="Pickup Address"
            placeholderTextColor="#6b7280"
            value={pickup} onChangeText={setPickup}
            style={styles.input}
          />
        </View>
        <View style={styles.inputRow}>
          <Ionicons name="flag-outline" size={18} color="#334155" style={styles.inputIcon} />
          <TextInput
            placeholder="Destination Address"
            placeholderTextColor="#6b7280"
            value={drop} onChangeText={setDrop}
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={() => setSlotOpen(true)} activeOpacity={0.9} style={styles.inputRow}>
          <Ionicons name="time-outline" size={18} color="#334155" style={styles.inputIcon} />
          <Text style={[styles.input, { color: '#111827' }]}>{slot}</Text>
          <Ionicons name="chevron-down" size={18} color="#334155" />
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!canContinue}
          onPress={() =>
            navigation.navigate('PackageBoxes', {
              pickup, drop, slot, mode
            })
          }
          style={[styles.cta, { opacity: canContinue ? 1 : 0.5 }]}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Slot picker (lightweight Modal choices) */}
      <Modal visible={slotOpen} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setSlotOpen(false)}>
          <View style={styles.sheet}>
            {['Today, Anytime', 'Today, 6–8 PM', 'Tomorrow Morning', 'Tomorrow Evening'].map(opt => (
              <Pressable key={opt} onPress={() => { setSlot(opt); setSlotOpen(false); }} style={styles.sheetItem}>
                <Ionicons name={opt===slot ? 'radio-button-on':'radio-button-off'} size={18} color="#0f172a" />
                <Text style={styles.sheetText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing.md, paddingBottom: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  circleBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)'
  },
  title: { fontSize: theme.typography.h2, fontWeight: '800', color: '#0f172a' },

  segment: {
    flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.06)', borderRadius: 14, padding: 4, marginTop: 10
  },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  segActive: { backgroundColor: '#fff' },
  segText: { fontWeight: '700', color: '#334155' },
  segTextActive: { color: '#0f172a' },

  illustration: {
    height: 150, marginVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(15,23,42,0.06)',
    backgroundColor: '#fff', overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center'
  },
  box: { position: 'relative', width: 72, height: 56, borderRadius: 10 },
  plantPot: { width: 42, height: 18, backgroundColor: '#fca5a5', borderRadius: 10, marginBottom: 8 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(15,23,42,0.08)'
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#111827', fontSize: 16 },

  cta: { backgroundColor: '#0f172a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#fff', fontWeight: '900', letterSpacing: 0.3 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', padding: 14, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  sheetText: { fontWeight: '700', color: '#0f172a' },
});
