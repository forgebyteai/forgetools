/**
 * Converters Screen — ForgeTools
 * Quick-access unit converters for field use.
 * WFD-249: Clipboard copy added. Offline, works without network.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TextInput, TouchableOpacity, Clipboard, Alert, Platform,
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
  { label: 'PSI ↔ Bar',      aUnit: 'PSI',   bUnit: 'Bar',    aToB: psiToBar,            bToA: barToPsi,            category: 'Pressure' },
  { label: 'PSI ↔ kPa',      aUnit: 'PSI',   bUnit: 'kPa',    aToB: psiToKPa,            bToA: kPaToPsi,            category: 'Pressure' },
  { label: 'Bar ↔ kPa',      aUnit: 'Bar',   bUnit: 'kPa',    aToB: v => v * 100,        bToA: v => v / 100,        category: 'Pressure' },
  { label: 'Bar ↔ atm',      aUnit: 'Bar',   bUnit: 'atm',    aToB: v => v / 1.01325,    bToA: v => v * 1.01325,    category: 'Pressure' },
  { label: 'MPa ↔ PSI',      aUnit: 'MPa',   bUnit: 'PSI',    aToB: v => v * 145.038,    bToA: v => v / 145.038,    category: 'Pressure' },
  // Temperature
  { label: '°C ↔ °F',        aUnit: '°C',    bUnit: '°F',     aToB: celsiusToFahrenheit, bToA: fahrenheitToCelsius, category: 'Temperature' },
  { label: '°C ↔ K',         aUnit: '°C',    bUnit: 'K',      aToB: celsiusToKelvin,     bToA: v => v - 273.15,     category: 'Temperature' },
  // Length
  { label: 'mm ↔ inch',      aUnit: 'mm',    bUnit: 'in',     aToB: mmToInch,            bToA: inchToMM,            category: 'Length' },
  { label: 'mm ↔ thou',      aUnit: 'mm',    bUnit: 'thou',   aToB: v => v * 39.3701,    bToA: v => v / 39.3701,    category: 'Length' },
  { label: 'm ↔ ft',         aUnit: 'm',     bUnit: 'ft',     aToB: v => v * 3.28084,    bToA: v => v / 3.28084,    category: 'Length' },
  { label: 'km ↔ miles',     aUnit: 'km',    bUnit: 'mi',     aToB: v => v * 0.621371,   bToA: v => v / 0.621371,   category: 'Length' },
  // Torque
  { label: 'Nm ↔ ft·lb',     aUnit: 'Nm',    bUnit: 'ft·lb',  aToB: nmToFtLb,            bToA: ftLbToNm,            category: 'Torque' },
  { label: 'Nm ↔ in·lb',     aUnit: 'Nm',    bUnit: 'in·lb',  aToB: v => v * 8.85075,    bToA: v => v / 8.85075,    category: 'Torque' },
  { label: 'kgm ↔ Nm',       aUnit: 'kgm',  bUnit: 'Nm',     aToB: v => v * 9.80665,    bToA: v => v / 9.80665,    category: 'Torque' },
  // Flow
  { label: 'L/min ↔ GPM',    aUnit: 'L/min', bUnit: 'GPM',    aToB: lpmToGpm,            bToA: gpmToLpm,            category: 'Flow' },
  { label: 'L/min ↔ m³/h',   aUnit: 'L/min', bUnit: 'm³/h',   aToB: v => v * 0.06,       bToA: v => v / 0.06,       category: 'Flow' },
  { label: 'mL/s ↔ L/min',   aUnit: 'mL/s',  bUnit: 'L/min',  aToB: v => v * 0.06,       bToA: v => v / 0.06,       category: 'Flow' },
  // Power
  { label: 'kW ↔ HP',        aUnit: 'kW',    bUnit: 'HP',     aToB: calcKWtoHP,          bToA: calcHPtoKW,          category: 'Power' },
  { label: 'W ↔ BTU/hr',     aUnit: 'W',     bUnit: 'BTU/hr', aToB: v => v * 3.41214,    bToA: v => v / 3.41214,    category: 'Power' },
  { label: 'kVA ↔ kW',       aUnit: 'kVA',   bUnit: 'kW',     aToB: v => v * 0.8,        bToA: v => v / 0.8,        category: 'Power' },
  // Speed
  { label: 'm/min ↔ SFM',    aUnit: 'm/min', bUnit: 'SFM',    aToB: v => v * 3.28084,    bToA: v => v / 3.28084,    category: 'Speed' },
  { label: 'RPM ↔ rad/s',    aUnit: 'RPM',   bUnit: 'rad/s',  aToB: v => v * Math.PI/30, bToA: v => v * 30/Math.PI, category: 'Speed' },
  { label: 'km/h ↔ m/s',     aUnit: 'km/h',  bUnit: 'm/s',    aToB: v => v / 3.6,        bToA: v => v * 3.6,        category: 'Speed' },
  // Mass
  { label: 'kg ↔ lb',        aUnit: 'kg',    bUnit: 'lb',     aToB: v => v * 2.20462,    bToA: v => v / 2.20462,    category: 'Mass' },
  { label: 'g ↔ oz',         aUnit: 'g',     bUnit: 'oz',     aToB: v => v * 0.035274,   bToA: v => v / 0.035274,   category: 'Mass' },
  { label: 't ↔ kg',         aUnit: 't',     bUnit: 'kg',     aToB: v => v * 1000,       bToA: v => v / 1000,       category: 'Mass' },
];

const CATEGORIES = [...new Set(CONVERTERS.map(c => c.category))];

const CATEGORY_ICONS: Record<string, string> = {
  Pressure: '💨',
  Temperature: '🌡️',
  Length: '📏',
  Torque: '🔩',
  Flow: '💧',
  Power: '⚡',
  Speed: '⚡',
  Mass: '⚖️',
};

function fmt(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (Math.abs(n) < 0.0001) return n.toExponential(4);
  if (Math.abs(n) >= 100000) return n.toFixed(1);
  if (Math.abs(n) >= 1000)   return n.toFixed(2);
  if (Math.abs(n) >= 10)     return n.toFixed(3);
  return n.toFixed(4).replace(/\.?0+$/, '');
}

async function copyToClipboard(value: string, unit: string) {
  try {
    Clipboard.setString(`${value} ${unit}`);
    Alert.alert('Copied!', `${value} ${unit} copied to clipboard`, [{ text: 'OK' }]);
  } catch {
    // Silently fail on platforms without clipboard
  }
}

function ConverterRow({ def }: { def: ConverterDef }) {
  const [aText, setAText] = useState('');
  const [bText, setBText] = useState('');

  function handleA(v: string) {
    setAText(v);
    const n = parseFloat(v);
    setBText(isNaN(n) ? '' : fmt(def.aToB(n)));
  }

  function handleB(v: string) {
    setBText(v);
    const n = parseFloat(v);
    setAText(isNaN(n) ? '' : fmt(def.bToA(n)));
  }

  const aResult = fmt(def.aToB(parseFloat(aText)));
  const bResult = fmt(def.bToA(parseFloat(bText)));

  return (
    <View style={crow.wrap}>
      <Text style={crow.label}>{def.label}</Text>
      <View style={crow.row}>
        {/* A side */}
        <View style={crow.fieldWrap}>
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
          {bText !== '' && (
            <TouchableOpacity
              style={crow.copyBtn}
              onPress={() => copyToClipboard(aText, def.aUnit)}
              accessibilityLabel={`Copy ${aText} ${def.aUnit}`}
            >
              <Text style={crow.copyText}>⎘</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={crow.arrow}>⇄</Text>

        {/* B side */}
        <View style={crow.fieldWrap}>
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
          {aText !== '' && (
            <TouchableOpacity
              style={crow.copyBtn}
              onPress={() => copyToClipboard(bText, def.bUnit)}
              accessibilityLabel={`Copy ${bText} ${def.bUnit}`}
            >
              <Text style={crow.copyText}>⎘</Text>
            </TouchableOpacity>
          )}
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  fieldWrap: { flex: 1 },
  field: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingLeft: Spacing.sm,
    paddingRight: 44,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 44,
  },
  unit: {
    position: 'absolute',
    right: 8,
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  copyBtn: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  copyText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  arrow: { color: Colors.primary, fontSize: 18, fontWeight: '700', marginTop: 12 },
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
                {CATEGORY_ICONS[cat] ?? ''} {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Converters */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {CATEGORY_ICONS[activeCategory] ?? ''} {activeCategory}
          </Text>
          {visible.map(def => (
            <ConverterRow key={def.label} def={def} />
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            💡 Type in either field — auto-converts both ways{'\n'}
            Tap ⎘ to copy result to clipboard
          </Text>
        </View>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>📴 Fully offline — no network required</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: Spacing.xxl },
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBarInner: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    marginRight: Spacing.xs,
    minHeight: 40,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
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
    marginBottom: Spacing.sm,
  },
  tipText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  offlineBadge: {
    marginHorizontal: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.successDim,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
  },
  offlineBadgeText: { color: Colors.success, fontSize: 12, fontWeight: '600' },
});
