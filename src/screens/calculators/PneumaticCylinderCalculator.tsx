/**
 * ForgeTools — Pneumatic Cylinder Force Calculator (WFD-280)
 * Extend/retract force for single and double acting cylinders.
 * Offline capable — no network required.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import { ResultBox } from '../../components/ResultBox';
import { InfoBox } from '../../components/InfoBox';

// Common bore sizes (mm)
const BORE_PRESETS = [20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200];
// Common rod sizes (mm) — typical ratios
const ROD_PRESETS: Record<number, number[]> = {
  20: [8, 10], 25: [10, 12], 32: [12, 16], 40: [16, 20], 50: [20, 25],
  63: [25, 32], 80: [32, 40], 100: [40, 50], 125: [50, 63], 160: [63, 80], 200: [80, 100],
};

type CylType = 'double' | 'single-extend' | 'single-retract';

interface CalcResult {
  extendForceN: number;
  retractForceN: number;
  extendForceKgf: number;
  retractForceKgf: number;
  boreAreaMm2: number;
  annulusAreaMm2: number;
  pressureBarUsed: number;
  frictionNote: string;
}

function calcCylinder(boreMm: number, rodMm: number, pressureBar: number, frictionPct: number, cylType: CylType): CalcResult {
  const boreAreaMm2 = Math.PI * (boreMm / 2) ** 2;
  const rodAreaMm2 = Math.PI * (rodMm / 2) ** 2;
  const annulusAreaMm2 = boreAreaMm2 - rodAreaMm2;

  const pressureMPa = pressureBar * 0.1; // bar → MPa (1 bar = 0.1 MPa = 0.1 N/mm²)
  const fractionLoss = 1 - frictionPct / 100;

  const extendForceN = boreAreaMm2 * pressureMPa * fractionLoss;
  const retractForceN = annulusAreaMm2 * pressureMPa * fractionLoss;

  return {
    extendForceN,
    retractForceN,
    extendForceKgf: extendForceN / 9.81,
    retractForceKgf: retractForceN / 9.81,
    boreAreaMm2,
    annulusAreaMm2,
    pressureBarUsed: pressureBar,
    frictionNote: `${frictionPct}% mechanical friction loss applied`,
  };
}

function ChipPicker({ label, values, selected, onSelect, unit = '' }: {
  label: string; values: number[]; selected: number; onSelect: (v: number) => void; unit?: string;
}) {
  return (
    <View style={styles.pickerGroup}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {values.map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.chip, selected === v && styles.chipActive]}
              onPress={() => onSelect(v)}
            >
              <Text style={[styles.chipText, selected === v && styles.chipTextActive]}>
                {v}{unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function PneumaticCylinderCalculator() {
  const [bore, setBore] = useState(50);
  const [rod, setRod] = useState(20);
  const [pressure, setPressure] = useState(6);
  const [friction, setFriction] = useState(5);

  const result = calcCylinder(bore, rod, pressure, friction, 'double');

  const PRESSURE_OPTIONS = [4, 5, 6, 7, 8, 10];
  const FRICTION_OPTIONS = [0, 5, 10, 15];

  const availableRods = ROD_PRESETS[bore] || [Math.round(bore * 0.4), Math.round(bore * 0.5)];
  const rodSafe = availableRods.includes(rod) ? rod : availableRods[0];

  const handleBoreSelect = useCallback((b: number) => {
    setBore(b);
    const rods = ROD_PRESETS[b] || [Math.round(b * 0.4)];
    setRod(rods[0]);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>💨 Pneumatic Cylinder Calculator</Text>
        <Text style={styles.subtitle}>Extend & retract force for double/single acting cylinders</Text>

        <ChipPicker label="Bore diameter (mm)" values={BORE_PRESETS} selected={bore} onSelect={handleBoreSelect} unit="" />
        <ChipPicker label="Rod diameter (mm)" values={availableRods} selected={rodSafe} onSelect={setRod} unit="" />
        <ChipPicker label="Supply pressure (bar)" values={PRESSURE_OPTIONS} selected={pressure} onSelect={setPressure} unit="" />
        <ChipPicker label="Friction allowance" values={FRICTION_OPTIONS} selected={friction}
          onSelect={setFriction}
          unit="%"
        />

        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Results</Text>
          <View style={styles.resultRow}>
            <ResultBox label="Extend Force" value={`${(result.extendForceN / 1000).toFixed(2)} kN`} />
            <ResultBox label="Retract Force" value={`${(result.retractForceN / 1000).toFixed(2)} kN`} />
          </View>
          <View style={styles.resultRow}>
            <ResultBox label="Extend Force" value={`${result.extendForceKgf.toFixed(0)} kgf`} />
            <ResultBox label="Retract Force" value={`${result.retractForceKgf.toFixed(0)} kgf`} />
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Calculation Details</Text>
          {[
            ['Bore Ø', `${bore} mm`],
            ['Rod Ø', `${rodSafe} mm`],
            ['Bore area', `${result.boreAreaMm2.toFixed(0)} mm²`],
            ['Annulus area (retract)', `${result.annulusAreaMm2.toFixed(0)} mm²`],
            ['Supply pressure', `${pressure} bar (${(pressure * 0.1).toFixed(1)} MPa)`],
            ['Friction deduction', `${friction}%`],
          ].map(([k, v]) => (
            <View key={k} style={styles.statsRow}>
              <Text style={styles.statsKey}>{k}</Text>
              <Text style={styles.statsVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Reference table */}
        <View style={styles.refCard}>
          <Text style={styles.refTitle}>Common Cylinder Sizes @ 6 bar</Text>
          <View style={styles.tableHeader}>
            {['Bore', 'Extend kN', 'Retract kN'].map(h => (
              <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
            ))}
          </View>
          {BORE_PRESETS.map(b => {
            const r = ROD_PRESETS[b]?.[0] || b * 0.4;
            const res = calcCylinder(b, r, 6, 5, 'double');
            return (
              <View key={b} style={styles.tableRow}>
                <Text style={styles.tableCell}>{b} mm</Text>
                <Text style={styles.tableCell}>{(res.extendForceN / 1000).toFixed(2)}</Text>
                <Text style={styles.tableCell}>{(res.retractForceN / 1000).toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        <InfoBox title="About this calculator">
          <Text style={styles.infoText}>
            {'Force = Area × Pressure × (1 − friction%)\n\n'}
            {'Extend stroke: full bore area used\n'}
            {'Retract stroke: annulus area only (bore - rod)\n\n'}
            {'Typical pneumatic friction: 5–15% depending on seal condition, lubrication, and speed.\n\n'}
            {'Formula: F(N) = π/4 × D² × P (Pa)\n'}
            {'where D = bore diameter, P = pressure in Pa (1 bar = 100,000 Pa)'}
          </Text>
        </InfoBox>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.xs },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  pickerGroup: { marginBottom: Spacing.md },
  pickerLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  resultsSection: { marginVertical: Spacing.md },
  resultRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statsCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  statsTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statsKey: { color: Colors.textMuted, fontSize: 13 },
  statsVal: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  refCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  refTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.xs, marginBottom: Spacing.xs },
  tableHeaderCell: { flex: 1, color: Colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 4 },
  tableCell: { flex: 1, color: Colors.text, fontSize: 13 },
  infoText: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
});
