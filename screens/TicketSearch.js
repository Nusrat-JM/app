import React, { useMemo, useState } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, Platform,
  ScrollView, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenBg, s } from './_ticketStyles';

const fmtDate = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function TicketSearch({ route, navigation }) {
  const mode = route?.params?.mode ?? 'bus';

  const [from, setFrom] = useState(mode === 'hotel' ? '' : 'Dhaka');
  const [to, setTo] = useState(mode === 'hotel' ? 'Cox’s Bazar' : 'Chattogram');

  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState(today);
  const [showDate, setShowDate] = useState(false);

  // Hotel only
  const [checkIn, setCheckIn] = useState(new Date());
  const [showIn, setShowIn] = useState(false);
  const defaultOut = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d;
  }, []);
  const [checkOut, setCheckOut] = useState(defaultOut);
  const [showOut, setShowOut] = useState(false);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  const swap = () => {
    if (mode === 'hotel') return;
    setFrom(to);
    setTo(from);
  };

  const go = () => {
    const params =
      mode === 'hotel'
        ? { mode, city: to, checkIn, checkOut, guests, rooms }
        : { mode, from, to, date }; // date only for bus/train
    navigation.navigate('TicketResults', params);
  };

  return (
    <ScreenBg>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.wrap, { paddingBottom: 24 }]} showsVerticalScrollIndicator={false}>
            <Text style={s.header}>
              {mode === 'bus' ? 'Find Buses' : mode === 'train' ? 'Find Trains' : 'Find Hotels'}
            </Text>

            {mode !== 'hotel' ? (
              <View style={{ gap: 12, marginTop: 16 }}>
                <View style={[s.card, s.shadow]}>
                  <Text style={{ color: '#334155', marginBottom: 6 }}>From</Text>
                  <TextInput value={from} onChangeText={setFrom} placeholder="Origin" style={{ fontSize: 16, color: '#0f172a' }} />
                </View>

                <View style={[s.card, s.shadow]}>
                  <Text style={{ color: '#334155', marginBottom: 6 }}>To</Text>
                  <TextInput value={to} onChangeText={setTo} placeholder="Destination" style={{ fontSize: 16, color: '#0f172a' }} />
                </View>

                <TouchableOpacity style={[s.pill, { alignSelf: 'flex-start' }]} onPress={swap}>
                  <Text style={{ fontWeight: '700', color: '#0f172a' }}>Swap</Text>
                </TouchableOpacity>

                {/* Date only */}
                <TouchableOpacity style={[s.card, s.shadow]} onPress={() => setShowDate(true)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: '#334155' }}>Travel Date</Text>
                      <Text style={{ fontWeight: '800', color: '#0f172a' }}>{fmtDate(date)}</Text>
                    </View>
                    <Ionicons name="calendar" size={18} color="#0f172a" />
                  </View>
                </TouchableOpacity>
                {showDate && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(e, d) => { setShowDate(false); if (d) setDate(d); }}
                  />
                )}
              </View>
            ) : (
              // HOTEL UI
              <View style={{ gap: 12, marginTop: 16 }}>
                <View style={[s.card, s.shadow]}>
                  <Text style={{ color: '#334155', marginBottom: 6 }}>City</Text>
                  <TextInput value={to} onChangeText={setTo} placeholder="Where to?" style={{ fontSize: 16, color: '#0f172a' }} />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={[s.card, s.shadow, { flex: 1 }]} onPress={() => setShowIn(true)}>
                    <Text style={{ color: '#334155' }}>Check-in</Text>
                    <Text style={{ fontWeight: '800', color: '#0f172a' }}>{fmtDate(checkIn)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.card, s.shadow, { flex: 1 }]} onPress={() => setShowOut(true)}>
                    <Text style={{ color: '#334155' }}>Check-out</Text>
                    <Text style={{ fontWeight: '800', color: '#0f172a' }}>{fmtDate(checkOut)}</Text>
                  </TouchableOpacity>
                </View>
                {showIn && (
                  <DateTimePicker
                    value={checkIn}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(e, d) => {
                      setShowIn(false);
                      if (d) {
                        setCheckIn(d);
                        if (d >= checkOut) {
                          const nd = new Date(d); nd.setDate(nd.getDate() + 1); setCheckOut(nd);
                        }
                      }
                    }}
                  />
                )}
                {showOut && (
                  <DateTimePicker
                    value={checkOut}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(e, d) => { setShowOut(false); if (d) setCheckOut(d); }}
                  />
                )}

                <View style={[s.card, s.shadow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Text style={{ color: '#0f172a', fontWeight: '800' }}>Guests / Rooms</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity style={s.pill} onPress={() => setGuests(Math.max(1, guests - 1))}><Text>-</Text></TouchableOpacity>
                    <Text style={{ fontWeight: '900', color: '#0f172a' }}>{guests} guests</Text>
                    <TouchableOpacity style={s.pill} onPress={() => setGuests(guests + 1)}><Text>+</Text></TouchableOpacity>

                    <TouchableOpacity style={s.pill} onPress={() => setRooms(Math.max(1, rooms - 1))}><Text>-</Text></TouchableOpacity>
                    <Text style={{ fontWeight: '900', color: '#0f172a' }}>{rooms} room</Text>
                    <TouchableOpacity style={s.pill} onPress={() => setRooms(rooms + 1)}><Text>+</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={[s.btn, { marginTop: 16 }]} onPress={go}>
              <Text style={s.btnText}>Search</Text>
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
