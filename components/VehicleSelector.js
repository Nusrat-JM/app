import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../lib/theme';


const VEHICLES = ['sedan', 'suv', 'cng', 'bike'];

export default function VehicleSelector({ value, onChange }) {
  return (
    <View style={styles.container}>
      {VEHICLES.map((v) => {
        const active = v === value;
        return (
          <TouchableOpacity key={v} style={[styles.pill, active && styles.pillActive]} onPress={() => onChange(v)}>
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{v.toUpperCase()}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#eee',
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.onPrimary,
  },
});