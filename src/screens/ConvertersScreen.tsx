/**
 * Converters Screen — ForgeTools
 * Quick-access unit converters for field use.
 * Detailed converter implementations are in UnitConverter calculator.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TextInput, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../lib/theme';
import {
  psiToBar, barToPsi, psiToKPa, kPaToPsi,
  celsiusToFahrenheit, fahrenheitToCelsius, celsiusToKelvin,
  mmToInch, inchToMM,
  nmToFtLb, ftLbToNm,
  lpmToGpm, gpmToLpm,
  calcHPtoKW, calcKWtoHP,
} from '../lib/calculations';

interface ConverterDef {
  label: string;
  aUnit: string;
  bUnit: string;
  aToB: (v: number) => number;
  bToA: (v: number) => number;
  category: string;
}

const CONVERTERS: ConverterDef[] = [
  // Pressure
  { label: 'PSI ↔ Bar',      aUnit: 'PSI',  bUnit: 'Bar',   aToB: psiToBar,             bToA: barToPsi,             category: 'Pressure' },
  { label: 'PSI ↔ kPa',      aUnit: 'PSI',  bUnit: 'kPa',   aToB: psiToKPa,             bToA: kPaToPsi,             category: 'Pressure' },
  { label: 'Bar ↔ kPa',      aUnit: 'Bar',  bUnit: 'kPa',   aToB: v => v * 100,         bToA: v => v / 100,         category: 'Pressure' },
  // Temperature
  { label: '°C ↔ °F',        aUnit: '°C',   bUnit: '°F',    aToB: celsiusToFahrenheit,   bToA: fahrenheitToCelsius,  category: 'Temperature' },
  { label: '°C ↔ K',         aUnit: '°C',   bUnit: 'K',     aToB: celsiusToKelvin,       bToA: v => v - 273.15,      category: 'Temperature' },
  // Length
  { label: 'mm ↔ inch',      aUnit: 'mm',   bUnit: 'inch',  aToB: mmToInch,              bToA: inchToMM,             category: 'Length' },
  { label: 'm ↔ ft',         aUnit: 'm',    bUnit: 'ft',    aToB: v => v * 3.28084,      bToA: v => v / 3.28084,     category: 'Length' },
  { label: 'km ↔ miles',     aUnit: 'km',   bUnit: 'mi',    aToB: v => v * 0.621371,     bToA: v => v / 0.621371,    category: 'Length' },
  // Torque
  { label: 'Nm ↔ ft·lb',     aUnit: 'Nm',   bUnit: 'ft·lb', aToB: nmToFtLb,              bToA: ftLbToNm,             category: 'Torque' },
  { label: 'Nm ↔ in·lb',     aUnit: 'Nm',   bUnit: 'in·lb', aToB: v => v * 8.85075,     bToA: v => v / 8.85075,     category: 'Torque' },
  // Flow
  { label: 'L/min ↔ GPM',    aUnit: 'L/min',bUnit: 'GPM',   aToB: lpmToGpm,              bToA: gpmToLpm,             category: 'Flow' },
  { label: 'L/min ↔ m³/h',   aUnit: 'L/min',bUnit: 'm³/h',  aToB: v => v * 0.06,        bToA: v => v / 0.06,        category: 'Flow' },
  // Power
  { label: 'kW ↔ HP',        aUnit: 'kW',   bUnit: 'HP',    aToB: calcKWtoHP,            bToA: calcHPtoKW,           category: 'Power' },
  { label: 'W ↔ BTU/hr',     aUnit: 'W',    bUnit: 'BTU/hr',aToB: v => v * 3.41214,     bToA: v => v / 3.41214,     category: 'Power' },
  // Speed
  { label: 'm/min ↔ SFM',    aUnit: 'm/min',bUnit: 'SFM',   aToB: v => v * 3.28084,     bToA: v => v / 3.28084,     category: 'Speed' },
  { label: 'RPM ↔ rad/s',    aUnit: 'RPM',  bUnit: 'rad/s', aToB: v => v * Math.PI/30,  bToA: v => v * 30/Math.PI,  category: 'Speed' },
  // Mass
  { label: 'kg ↔ lb',        aUnit: 'kg',   bUnit: 'lb',    aToB: v => v * 2.20462,     bToA: v => v / 2.20462,     category: 'Mass' },
  { label: 'g ↔ oz',         aUnit: 'g',    bUnit: 'oz',    aToB: v => v * 0.035274,    bToA: v => v / 0.035274,    category: 'Mass' },
];

const CATEGORIES = [...new Set(CONVERTERS.map(c => c.category))];

function fmt(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (Math.abs(n) < 0.001) return n.toExponential(4);
  if (Math.abs(n) >= 10000) return n.toFixed(1);
  if (Math.abs(n) >= 100)  return n.toFixed(2);
  return n.toFixed(4).replace(/\.?0+$/, '');
}

function ConverterRow({ def }: { def: ConverterDef }) {
  const [aText, setAText] = useState('');
  const [bText, setBText] = useState('');
  const [dir, setDir] = useState<'ab' | 'ba'>('ab');

  function handleA(v: string) {
    setAText(v);
    setDir('ab');
    const n = parseFloat(v);
    setBText(isNaN(n) ? '' : fmt(def.aToB(n)));
  }
  function handleB(v: string) {
    setBText(v);
    setDir('ba');
    const n = parseFloat(v);
    setAText(isNaN(n) ? '' : fmt(def.bToA(n)));
  }

  return (
    <View style={crow.wrap}>
      <Text style={crow.label}>{def.label}</Text>
      <View style={crow.row}>
        <View style={crow.field}>
          <TextInput
            style={crow.input}
            value={aText}
            onChangeText={handleA}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel={`Input in ${def.aUnit}`}
          />
          <Text style={crow.unit}>{def.aUnit}</Text>
        </View>
        <Text style={crow.arrow}>⇄</Text>
        <View style={crow.field}>
          <TextInput
            style={crow.input}
            value={bText}
            onChangeText={handleB}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel={`Input in ${def.bUnit}`}
          />
          <Text style={crow.unit}>{def.bUnit}</Text>
        </View>
      </View>
    </View>
  );
}

const crow = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  field: { flex: 1, position: 'relative' },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingLeft: Spacing.sm,
    paddingRight: 48,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 44,
  },
  unit: {
    position: 'absolute',
    right: 8,
    top: '50%',
    // marginTop: -8,
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  arrow: { color: Colors.primary, fontSize: 18, fontWeight: '700' },
});

export default function ConvertersScreen() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  const visible = CONVERTERS.filter(c => c.category === activeCategory);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={styles.scroll}>
        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarInner}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.tabActive]}
              onPress={() => setActiveCategory(cat)}
              accessibilityLabel={`${cat} converters`}
              accessibilityRole="tab"
            >
              <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Converters */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{activeCategory} Converters</Text>
          {visible.map(def => (
            <ConverterRow key={def.label} def={def} />
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            💡 Tap either field to type — it auto-converts in both directions
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: Spacing.xxl },
  tabBar: { backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBarInner: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    marginRight: Spacing.xs,
    minHeight: 40,
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primaryBorder },
  tabText: { color: Colors.textMuted, fontWeight: '500', fontSize: 13 },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: Colors.bgCard,
    margin: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  sectionTitle: { ...Typography.h2, marginBottom: Spacing.md },
  tip: {
    marginHorizontal: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  tipText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
});
