/**
 * ForgeTools — Home Screen
 * Grid of calculator categories with card navigation.
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, Radius } from '../lib/theme';

interface CalcCard {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  screen: string;
  category: 'electrical' | 'cnc' | 'sheet-metal' | 'general';
}

const CALCULATORS: CalcCard[] = [
  { id: 'voltage-drop',   emoji: '⚡', title: 'Voltage Drop',        subtitle: 'AS/NZS 3008 / NEC',     screen: 'VoltageDropCalculator',  category: 'electrical' },
  { id: 'wire-gauge',     emoji: '🔌', title: 'Wire Gauge',           subtitle: 'Current capacity',      screen: 'WireGaugeCalculator',    category: 'electrical' },
  { id: 'motor-vfd',      emoji: '🔁', title: 'Motor & VFD',          subtitle: 'FLA, RPM, HP ↔ kW',    screen: 'MotorVFDCalculator',     category: 'electrical' },
  { id: '3phase',         emoji: '3️⃣', title: '3-Phase Power',        subtitle: 'Star/delta, PF correction', screen: 'ThreePhaseCalculator', category: 'electrical' },
  { id: 'ohms-law',       emoji: '🔦', title: "Ohm's Law",            subtitle: 'V, I, R, P',            screen: 'OhmsLawCalculator',      category: 'electrical' },
  { id: 'cnc-feed-speed', emoji: '🔩', title: 'CNC Feed & Speed',     subtitle: 'RPM, feed, MRR',        screen: 'CNCFeedSpeedCalculator', category: 'cnc' },
  { id: 'punch-tonnage',  emoji: '🏋️', title: 'Punch Tonnage',        subtitle: 'Piercing force',        screen: 'PunchTonnageCalculator', category: 'cnc' },
  { id: 'press-brake',    emoji: '📐', title: 'Press Brake',          subtitle: 'Bending tonnage',       screen: 'PressBrakeCalculator',   category: 'sheet-metal' },
  { id: 'laser-focal',    emoji: '🔴', title: 'Laser Focal Point',    subtitle: 'CO₂ & fibre',           screen: 'LaserFocalCalculator',   category: 'sheet-metal' },
  { id: 'bend-allowance', emoji: '📏', title: 'Bend Allowance',       subtitle: 'K-factor, flat length', screen: 'BendAllowanceCalculator',category: 'sheet-metal' },
  { id: 'units',          emoji: '🔄', title: 'Unit Converter',       subtitle: 'P, T, L, torque, flow', screen: 'UnitConverter',          category: 'general' },
];

const CATEGORIES = [
  { id: 'electrical',  label: '⚡ Electrical' },
  { id: 'cnc',         label: '🔩 CNC' },
  { id: 'sheet-metal', label: '📐 Sheet Metal' },
  { id: 'general',     label: '🔄 General' },
];

export default function HomeScreen() {
  const nav = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brand}>⚡ ForgeCore</Text>
          <Text style={styles.title}>Engineering Tools</Text>
          <Text style={styles.subtitle}>Offline calculators for the workshop floor</Text>
        </View>

        {CATEGORIES.map(cat => {
          const cards = CALCULATORS.filter(c => c.category === cat.id);
          return (
            <View key={cat.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{cat.label}</Text>
              <View style={styles.grid}>
                {cards.map(card => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => nav.navigate(card.screen)}
                    accessibilityLabel={`${card.title} calculator`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cardEmoji}>{card.emoji}</Text>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSub}>{card.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { ...Typography.h1, fontSize: 28, color: Colors.primary },
  subtitle: { ...Typography.caption, marginTop: 4 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: {
    width: '47%',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 90,
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 22, marginBottom: 4 },
  cardTitle: { ...Typography.h3, fontSize: 14, marginBottom: 2 },
  cardSub: { ...Typography.caption, fontSize: 11 },
});
