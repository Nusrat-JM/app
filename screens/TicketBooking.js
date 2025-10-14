import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, Animated, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenBg, s } from './_ticketStyles';

function HoverCard({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (v) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 6, tension: 80 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.98)}
      onPressOut={() => animateTo(1)}
      onHoverIn={() => animateTo(1.02)}
      onHoverOut={() => animateTo(1)}
    >
      <Animated.View style={[{ transform: [{ scale }] }, s.card, s.shadow, { gap: 12 }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function TicketBooking({ navigation }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <ScreenBg>
      <SafeAreaView style={s.safe}>
        <View style={[s.wrap, { flex: 1 }]}>
          <Text style={s.header}>Book Tickets</Text>
          <Text style={s.sub}>Today • {dateStr} • {timeStr}</Text>

          <View style={{ marginTop: 18, gap: 14 }}>
            <HoverCard onPress={() => navigation.navigate('TicketSearch', { mode: 'bus' })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff' }}>
                  <MaterialCommunityIcons name="bus" size={24} color="#0f172a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Bus Tickets</Text>
                  <Text style={{ color: '#334155' }}>Intercity & AC/non-AC coaches</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#0f172a" />
              </View>
            </HoverCard>

            <HoverCard onPress={() => navigation.navigate('TicketSearch', { mode: 'train' })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf2f8' }}>
                  <MaterialCommunityIcons name="train" size={24} color="#0f172a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Train Tickets</Text>
                  <Text style={{ color: '#334155' }}>Express & local trains</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#0f172a" />
              </View>
            </HoverCard>

            <HoverCard onPress={() => navigation.navigate('TicketSearch', { mode: 'hotel' })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed' }}>
                  <MaterialCommunityIcons name="office-building-marker" size={24} color="#0f172a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Hotels</Text>
                  <Text style={{ color: '#334155' }}>Stay anywhere, best rates</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#0f172a" />
              </View>
            </HoverCard>
          </View>
        </View>
      </SafeAreaView>
    </ScreenBg>
  );
}
