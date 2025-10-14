import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenBg, s } from './_ticketStyles';

// Demo booked seats
const demoBooked = new Set(['1B','2D','3A','4C','6D','7A','8B','10C','11E','12F']);

export default function TicketSeat({ route, navigation }) {
  const { mode, service, travel } = route.params || {};
  const [selected, setSelected] = useState(new Set());

  const layout = useMemo(() => {
    if (mode === 'bus') {
      return { rows: 10, left: ['A','B'], right: ['C','D'] }; // 2+aisle+2
    }
    return { rows: 12, cols: ['A','B','C','D','E','F'] }; // Train 6 across
  }, [mode]);

  const toggle = (code) => {
    if (demoBooked.has(code)) return;
    const next = new Set(selected);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelected(next);
  };

  const Seat = ({ code }) => {
    const taken = demoBooked.has(code);
    const active = selected.has(code);
    return (
      <TouchableOpacity
        onPress={() => toggle(code)}
        style={{
          width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: 'rgba(15,23,42,0.08)',
          backgroundColor: taken ? '#e5e7eb' : active ? '#111827' : '#fff',
          marginHorizontal: 3,
        }}
      >
        <Text style={{ color: active ? '#fff' : '#0f172a', fontWeight: '800', fontSize: 12 }}>{code}</Text>
      </TouchableOpacity>
    );
  };

  const perSeat = service?.price ?? 0;
  const count = selected.size;
  const subTotal = perSeat * count;

  const continueConfirm = () => {
    navigation.navigate('TicketConfirm', {
      mode,
      service,
      travel,
      seats: Array.from(selected),
      perSeat,
      subTotal,
    });
  };

  return (
    <ScreenBg>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={[s.wrap, { paddingBottom: 32 }]} showsVerticalScrollIndicator={false}>
          <Text style={s.header}>Select Seats</Text>
          <Text style={s.sub}>
            {mode === 'bus' ? service?.operator : service?.name} · {service?.dep} → {service?.arr} · {service?.type}
          </Text>
          <Text style={[s.sub, { marginTop: 4 }]}>{new Date(travel?.date || Date.now()).toDateString().slice(4)}</Text>

          {/* Seat grid */}
          <View style={{ marginTop: 16, gap: 10 }}>
            {Array.from({ length: layout.rows }).map((_, r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                {mode === 'bus' ? (
                  <>
                    {/* Left pair */}
                    {layout.left.map((label) => <Seat key={`${r+1}${label}`} code={`${r+1}${label}`} />)}
                    {/* Aisle gap */}
                    <View style={{ width: 18 }} />
                    {/* Right pair */}
                    {layout.right.map((label) => <Seat key={`${r+1}${label}`} code={`${r+1}${label}`} />)}
                  </>
                ) : (
                  /* Train row A..F */
                  layout.cols.map((label) => <Seat key={`${r+1}${label}`} code={`${r+1}${label}`} />)
                )}
              </View>
            ))}
          </View>

          <View style={[s.card, s.shadow, { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={{ fontWeight: '900', color: '#0f172a' }}>
              {count} seat{count !== 1 ? 's' : ''} · Subtotal ৳ {subTotal}
            </Text>
            <TouchableOpacity style={s.pill} onPress={() => setSelected(new Set())}>
              <Text style={{ fontWeight: '700', color: '#0f172a' }}>Clear</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity disabled={!count} style={[s.btn, { marginTop: 14, opacity: count ? 1 : 0.5 }]} onPress={continueConfirm}>
            <Text style={s.btnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ScreenBg>
  );
}
