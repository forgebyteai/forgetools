/**
 * ForgeTools — Home Screen
 * Grid of calculator categories with card navigation.
 * Cards animate in with a stagger entrance on mount.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, Radius } from '../lib/theme';
import { usePressScale } from '../lib/animations';

interface CalcCard {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  screen: string;
  category: 'electrical' | 'cnc' | 'sheet-metal' | 'engineering' | 'general';
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
  { id: 'pneumatic',      emoji: '💨', title: 'Pneumatic Cylinder',   subtitle: 'Extend/retract force',  screen: 'PneumaticCylinderCalculator', category: 'engineering' },
  { id: 'hydraulic',      emoji: '💧', title: 'Hydraulic Cylinder',   subtitle: 'Force, speed, flow',    screen: 'HydraulicCylinderCalculator', category: 'engineering' },
  { id: 'thread-tap',     emoji: '🔩', title: 'Thread & Tap Drill',   subtitle: 'Metric, UNC, UNF, BSP', screen: 'ThreadTapDrillCalculator',    category: 'engineering' },
  { id: 'weld-strength',  emoji: '🔥', title: 'Weld Strength',        subtitle: 'Fillet & butt welds',   screen: 'WeldStrengthCalculator',      category: 'engineering' },
  { id: 'bearing',        emoji: '🔵', title: 'Bearing Selection',    subtitle: 'Type, number decoder',  screen: 'BearingSelectionCalculator',  category: 'engineering' },
  { id: 'thermal',        emoji: '🌡️', title: 'Thermal Expansion',   subtitle: 'ΔL for temp change',    screen: 'ThermalExpansionCalculator',  category: 'engineering' },
];

const CATEGORIES = [
  { id: 'electrical',  label: '⚡ Electrical' },
  { id: 'cnc',         label: '🔩 CNC' },
  { id: 'sheet-metal', label: '📐 Sheet Metal' },
  { id: 'engineering', label: '⚙️ Engineering' },
  { id: 'general',     label: '🔄 General' },
];

// ─── Animated Card ──────────────────────────────────────────────
function CalcCardItem({
  card,
  onPress,
  animOpacity,
  animY,
}: {
  card: CalcCard;
  onPress: () => void;
  animOpacity: Animated.Value;
  animY: Animated.Value;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.93);

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        { opacity: animOpacity, transform: [{ translateY: animY }] },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={1}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityLabel={`${card.title} calculator`}
          accessibilityRole="button"
        >
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardSub}>{card.subtitle}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function HomeScreen() {
  const nav = useNavigation<any>();

  // Build per-card animation values
  const cardAnims = useRef(
    CALCULATORS.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(14),
    }))
  ).current;

  // Header entrance
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    // Header first
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Cards stagger after header
    const staggerAnims = cardAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 220,
          delay: 120 + i * 45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: 0,
          duration: 220,
          delay: 120 + i * 45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(staggerAnims).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Animated header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOpacity, transform: [{ translateY: headerY }] },
          ]}
        >
          <Text style={styles.brand}>⚡ ForgeCore</Text>
          <Text style={styles.title}>Engineering Tools</Text>
          <Text style={styles.subtitle}>Offline calculators for the workshop floor</Text>
        </Animated.View>

        {CATEGORIES.map(cat => {
          const cards = CALCULATORS.filter(c => c.category === cat.id);
          return (
            <View key={cat.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{cat.label}</Text>
              <View style={styles.grid}>
                {cards.map(card => {
                  const idx = CALCULATORS.indexOf(card);
                  return (
                    <CalcCardItem
                      key={card.id}
                      card={card}
                      onPress={() => nav.navigate(card.screen)}
                      animOpacity={cardAnims[idx].opacity}
                      animY={cardAnims[idx].y}
                    />
                  );
                })}
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
  cardWrap: { width: '47%' },
  card: {
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
