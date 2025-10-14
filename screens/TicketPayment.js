import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, s } from './_ticketStyles';
import { payTicket } from './ticketApi';

export default function TicketPayment({ route, navigation }) {
  const { mode, item, meta, ticketId, pnr } = route.params || {};
  const [method, setMethod] = useState('Card');
  const [paying, setPaying] = useState(false);

  const base = mode === 'hotel' ? (item?.price ?? 0) : (meta?.subTotal ?? (item?.price ?? 0));
  const total = base;

  const title = mode === 'hotel' ? item?.name : mode === 'bus' ? item?.operator : item?.name;
  const subtitle =
    mode === 'hotel'
      ? `${meta?.city} • ${new Date(meta?.checkIn).toDateString().slice(4)} → ${new Date(meta?.checkOut).toDateString().slice(4)}`
      : `${meta?.travel?.from} → ${meta?.travel?.to} • ${new Date(meta?.travel?.date).toDateString().slice(4)} • ${item?.dep} → ${item?.arr}`;
  const extra =
    mode === 'hotel'
      ? `${meta?.guests} guests · ${meta?.rooms} room`
      : `${(meta?.seats || []).length} seat(s) · ${item?.type}`;

  const onPay = async () => {
    try {
      setPaying(true);
      await payTicket(ticketId, { method, amount: total, currency: 'BDT' });
      navigation.replace('TicketSuccess', { total, method, ticketId, pnr });
    } catch (e) {
        const msg = e?.data?.message || e?.data?.error || e?.message || 'Please try again.';
        Alert.alert('Payment failed', String(msg));
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScreenBg>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.wrap, { paddingBottom: 32 }]} showsVerticalScrollIndicator={false}>
            {/* Summary */}
            <View style={[s.card, s.shadow]}>
              <Text style={{ fontWeight: '900', color: '#0f172a', marginBottom: 2 }}>{title}</Text>
              {!!pnr && <Text style={{ color: '#10b981', fontWeight: '800' }}>PNR: {pnr}</Text>}
              <Text style={{ color: '#334155' }}>{subtitle}</Text>
              <Text style={{ color: '#334155', marginTop: 4 }}>{extra}</Text>
            </View>

            {/* Fare breakdown */}
            <View style={[s.card, s.shadow, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#334155' }}>Subtotal</Text>
                <Text style={{ color: '#0f172a', fontWeight: '800' }}>৳ {base}</Text>
              </View>
              {mode !== 'hotel' && meta?.perSeat && meta?.seats?.length ? (
                <Text style={{ color: '#334155', marginTop: 6 }}>
                  ({meta.seats.length} × ৳ {meta.perSeat} per seat)
                </Text>
              ) : null}
              <View style={{ borderTopWidth: 1, borderColor: 'rgba(15,23,42,0.06)', marginTop: 10, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '900', color: '#0f172a' }}>Total</Text>
                <Text style={{ fontWeight: '900', color: '#0f172a' }}>৳ {total}</Text>
              </View>
            </View>

            {/* Methods */}
            <View style={{ gap: 10, marginTop: 16 }}>
              {['Cash', 'Card', 'bKash', 'Nagad'].map((m) => (
                <TouchableOpacity key={m} style={[s.card, s.shadow, s.row, { justifyContent: 'space-between' }]} onPress={() => setMethod(m)}>
                  <Text style={{ fontWeight: '800', color: '#0f172a' }}>{m}</Text>
                  <Ionicons name={method === m ? 'radio-button-on' : 'radio-button-off'} size={20} color="#0f172a" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.btn, { marginTop: 18 }]} onPress={onPay} disabled={paying}>
              {paying ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Pay ৳ {total}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ alignSelf: 'center', marginTop: 12 }} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={18} color="#0f172a" />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBg>
  );
}
