import React from 'react';
import { SafeAreaView, View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenBg, s } from './_ticketStyles';

const dataByMode = {
  bus: [
    { id: 'B-GL-0700', operator: 'Green Line', dep: '07:00', arr: '12:30', coach: 'AC', price: 1200, seatsLeft: 14, seatMap: '2+2' },
    { id: 'B-SH-0830', operator: 'Shohagh',   dep: '08:30', arr: '14:00', coach: 'Non-AC', price: 800, seatsLeft: 22, seatMap: '2+2' },
    { id: 'B-HN-1000', operator: 'Hanif',     dep: '10:00', arr: '15:40', coach: 'AC', price: 1100, seatsLeft: 6,  seatMap: '2+2' },
  ],
  train: [
    { id: 'T-SB-0700', name: 'Sonar Bangla', dep: '07:00', arr: '12:10', class: 'Snigdha', price: 750, seatsLeft: 52, seatMap: 'chair' },
    { id: 'T-TN-2300', name: 'Turna',        dep: '23:00', arr: '05:30', class: 'Shovon',  price: 350, seatsLeft: 120, seatMap: 'chair' },
    { id: 'T-MG-1430', name: 'Mohanagar',    dep: '14:30', arr: '20:00', class: 'AC Chair',price: 650, seatsLeft: 34, seatMap: 'chair' },
  ],
  hotel: [
    { id: 'H1', name: 'Seabreeze Resort', rating: 4.4, price: 4200, city: 'Cox’s Bazar' },
    { id: 'H2', name: 'Ocean Pearl',      rating: 4.2, price: 3800, city: 'Cox’s Bazar' },
    { id: 'H3', name: 'Beach View Inn',   rating: 4.0, price: 3200, city: 'Cox’s Bazar' },
  ],
};

function RowCard({ children, onPress }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const tween = (v) => Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 6, tension: 80 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={() => tween(0.98)} onPressOut={() => tween(1)} onHoverIn={() => tween(1.02)} onHoverOut={() => tween(1)}>
      <Animated.View style={[s.card, s.shadow, { transform: [{ scale }], gap: 8 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function TicketResults({ route, navigation }) {
  const { mode = 'bus', from, to, date, city, checkIn, checkOut, guests, rooms } = route.params || {};
  const list = dataByMode[mode];

  const subtitle =
    mode === 'hotel'
      ? `${city} • ${new Date(checkIn).toDateString().slice(4)} → ${new Date(checkOut).toDateString().slice(4)} • ${guests} guests · ${rooms} room`
      : `${from} → ${to} • ${new Date(date || Date.now()).toDateString().slice(4)}`;

  const select = (item) => {
    if (mode === 'hotel') {
      navigation.navigate('TicketPayment', { mode, item, meta: { city, checkIn, checkOut, guests, rooms } });
      return;
    }
    // bus/train → seat selection
    const service = mode === 'bus'
      ? { id: item.id, operator: item.operator, dep: item.dep, arr: item.arr, type: item.coach, price: item.price, seatsLeft: item.seatsLeft, seatMap: item.seatMap }
      : { id: item.id, name: item.name, dep: item.dep, arr: item.arr, type: item.class, price: item.price, seatsLeft: item.seatsLeft, seatMap: item.seatMap };
    navigation.navigate('TicketSeat', { mode, service, travel: { from, to, date } });
  };

  return (
    <ScreenBg>
      <SafeAreaView style={s.safe}>
        <View style={s.wrap}>
          <Text style={s.header}>
            {mode === 'bus' ? 'Available Buses' : mode === 'train' ? 'Available Trains' : 'Available Hotels'}
          </Text>
          <Text style={s.sub}>{subtitle}</Text>

          <ScrollView style={{ marginTop: 16 }} contentContainerStyle={{ gap: 12 }}>
            {list.map((it) => (
              <RowCard key={it.id} onPress={() => select(it)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === 'hotel' ? '#fff7ed' : mode === 'train' ? '#fdf2f8' : '#eef2ff' }}>
                      {mode === 'bus' && <MaterialCommunityIcons name="bus" size={18} color="#0f172a" />}
                      {mode === 'train' && <MaterialCommunityIcons name="train" size={18} color="#0f172a" />}
                      {mode === 'hotel' && <MaterialCommunityIcons name="office-building-marker" size={18} color="#0f172a" />}
                    </View>
                    <View>
                      <Text style={{ fontWeight: '800', color: '#0f172a' }}>
                        {mode === 'bus' ? it.operator : mode === 'train' ? it.name : it.name}
                      </Text>
                      {mode !== 'hotel' ? (
                        <Text style={{ color: '#334155' }}>{it.dep} → {it.arr} • {mode === 'bus' ? it.coach : it.class}</Text>
                      ) : (
                        <Text style={{ color: '#334155' }}>{it.city} • {it.rating}★</Text>
                      )}
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '900', color: '#0f172a' }}>৳ {it.price}</Text>
                    {mode !== 'hotel' ? (
                      <Text style={{ color: '#10b981', fontWeight: '700' }}>{it.seatsLeft} seats left</Text>
                    ) : (
                      <Text style={{ color: '#334155' }}>Select</Text>
                    )}
                  </View>
                </View>
              </RowCard>
            ))}
          </ScrollView>

          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Ionicons name="chevron-back" size={18} color="#0f172a" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </SafeAreaView>
    </ScreenBg>
  );
}
