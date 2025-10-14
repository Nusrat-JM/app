import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../lib/theme';

export default function FloatingBar({ navigation }) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.bar}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.label}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color={colors.primary} />
          <Text style={styles.label}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Payments')}>
          <Ionicons name="card-outline" size={22} color={colors.primary} />
          <Text style={styles.label}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Details')}>
          <Ionicons name="stats-chart-outline" size={22} color={colors.primary} />
          <Text style={styles.label}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.sm,
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});