import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenBg, s } from './_ticketStyles';       // <-- adjust path if file is not in /ticket
import { createTicket } from './ticketApi';                 // <-- adjust path if file is not in /ticket

export default function TicketConfirm({ route, navigation }) {
  const { mode, service, travel, seats = [], perSeat = 0, subTotal = 0 } = route.params || {};

  const title = mode === 'bus' ? service?.operator : service?.name;
  const tripLine = `${travel?.from} → ${travel?.to}`;
  const timeLine = `${service?.dep} → ${service?.arr} · ${service?.type}`;
  const dateLine = new Date(travel?.date || Date.now()).toDateString().slice(4);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [posting, setPosting] = useState(false);

  const valid = useMemo(() => {
    const okName = name.trim().length >= 2;
    const okPhone = /^\+?\d{6,15}$/.test(phone.trim());
    return okName && okPhone && agree && seats.length > 0;
  }, [name, phone, agree, seats]);

  const onConfirm = async () => {
    try {
      setPosting(true);
      const payload = {
        mode,
        travel: {
          from: travel?.from,
          to: travel?.to,
          date: new Date(travel?.date).toISOString().slice(0, 10),
          dep_time: service?.dep,
          arr_time: service?.arr,
        },
        service: {
          service_id: service?.id,
          operator: service?.operator || service?.name,
          type: service?.type,
        },
        seats,
        pricing: { perSeat, subtotal: subTotal, currency: 'BDT' },
        passenger: { name: name.trim(), phone: phone.trim(), email: email.trim() || null },
        status: 'PENDING',
      };
      const created = await createTicket(payload); // { ticket_id, pnr, status }
      navigation.navigate('TicketPayment', {
        mode,
        item: service,
        meta: { travel, seats, perSeat, subTotal, passenger: payload.passenger },
        ticketId: created.ticket_id,
        pnr: created.pnr,
      });
    } catch (e) {
        const msg = e?.data?.message || e?.data?.error || e?.message || 'Please try again.';
        Alert.alert('Could not create ticket', String(msg));
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScreenBg>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.wrap, { paddingBottom: 32 }]}
          >
            <Text style={s.header}>Confirm Ticket</Text>

            {/* Trip summary */}
            <View style={[s.card, s.shadow, { marginTop: 12, gap: 4 }]}>
              <Text style={{ fontWeight: '900', color: '#0f172a' }}>{title}</Text>
              <Text style={{ color: '#334155' }}>{tripLine}</Text>
              <Text style={{ color: '#334155' }}>{timeLine}</Text>
              <Text style={{ color: '#334155' }}>{dateLine}</Text>

              <View
                style={{
                  marginTop: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontWeight: '800', color: '#0f172a' }}>
                  Seats ({seats.length})
                </Text>
                <Text style={{ color: '#334155' }}>{seats.join(', ') || '—'}</Text>
              </View>

              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: 'rgba(15,23,42,0.08)',
                  marginTop: 10,
                  paddingTop: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#334155' }}>
                    Fare{seats.length ? ` (${seats.length} × ৳ ${perSeat})` : ''}
                  </Text>
                  <Text style={{ fontWeight: '900', color: '#0f172a' }}>৳ {subTotal}</Text>
                </View>
              </View>
            </View>

            {/* Passenger details */}
            <View style={[s.card, s.shadow, { marginTop: 12, gap: 10 }]}>
              <Text style={{ fontWeight: '900', color: '#0f172a' }}>Passenger Details</Text>

              <View style={{ gap: 6 }}>
                <Text style={{ color: '#334155' }}>Full Name*</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Riham Hasan"
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(15,23,42,0.08)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: '#0f172a',
                  }}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ color: '#334155' }}>Phone (for SMS)*</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g., +8801XXXXXXXXX"
                  keyboardType="phone-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(15,23,42,0.08)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: '#0f172a',
                  }}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ color: '#334155' }}>Email (optional)</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g., you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(15,23,42,0.08)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: '#0f172a',
                  }}
                />
              </View>
            </View>

            {/* Terms */}
            <View
              style={[
                s.card,
                s.shadow,
                { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#0f172a" />
                <Text style={{ color: '#0f172a', fontWeight: '800' }}>
                  I agree to Terms & Refund Policy
                </Text>
              </View>
              <Switch value={agree} onValueChange={setAgree} />
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 8 }}>
              <TouchableOpacity
                style={[s.pill, { flex: 1, alignItems: 'center' }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={{ fontWeight: '800', color: '#0f172a' }}>Edit Seats</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!valid || posting}
                style={[s.btn, { flex: 1, opacity: valid && !posting ? 1 : 0.5 }]}
                onPress={onConfirm}
              >
                {posting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Confirm & Continue</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBg>
  );
}
