import React, { useEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, s } from './_ticketStyles';

export default function TicketSuccess({ route, navigation }) {
  const total = route?.params?.total ?? 0;
  const method = route?.params?.method ?? 'Card';

  useEffect(() => {
    const t = setTimeout(() => navigation.navigate('Home'), 1200);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <ScreenBg>
      <SafeAreaView style={s.safe}>
        <View style={[s.wrap, { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
          <Ionicons name="checkmark-circle" size={88} color="#10b981" />
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a' }}>Payment successful</Text>
          <Text style={{ color: '#334155' }}>Paid ৳ {total} via {method}</Text>
        </View>
      </SafeAreaView>
    </ScreenBg>
  );
}
