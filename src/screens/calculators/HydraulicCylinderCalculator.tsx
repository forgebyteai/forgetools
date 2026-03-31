/**
 * ForgeTools — Hydraulic Cylinder Calculator (WFD-280)
 * Force, speed, and flow rate calcs for hydraulic cylinders.
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

const BORE_PRESETS = [40, 50, 63, 80, 100, 125, 160, 200, 250, 320];
const ROD_MAP: Record<number, number[]> = {
  40: [22, 28], 50: [28, 36], 63: [36, 45], 80: [45, 56],
  100: [56, 70], 125: [70, 90], 160: [90, 110], 200: [110, 140],
  250: [140, 180], 320: [180, 220],
};
const PRESSURE_OPTS = [50, 100, 150, 200, 250, 300, 350];
const SPEED_OPTS = [50, 100, 150, 200, 300, 500];

function ChipPicker({ label, values, selected, onSelect, unit = '' }: {
  label: string; values: number[]; selected: number; onSelect: (v: number) => void; unit?: string;
}) {
  return (
    <View style={styles.pickerGroup}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {values.map(v => (
            <TouchableOpacity key={v} style={[styles.chip, selected === v && styles.chipActive]} onPress={() => onSelect(v)}>
              <Text style={[styles.chipText, selected === v && styles.chipTextActive]}>{v}{unit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function HydraulicCylinderCalculator() {
  const [bore, setBore] = useState(100);
  const [rod, setRod] = useState(56);
  const [pressure, setPressure] = useState(200);
  const [speed, setSpeed] = useState(100);

  const handleBoreSelect = useCallback((b: number) => {
    setBore(b);
    const rods = ROD_MAP[b] || [Math.round(b * 0.56)];
    setRod(rods[0]);
  }, []);

  const availableRods = ROD_MAP[bore] || [Math.round(bore * 0.56)];
  const rodSafe = availableRods.includes(rod) ? rod : availableRods[0];

  // Calculations
  const boreAreaMm2 = Math.PI * (bore / 2) ** 2;
  const rodAreaMm2 = Math.PI * (rodSafe / 2) ** 2;
  const annulusAreaMm2 = boreAreaMm2 - rodAreaMm2;

  // Force: F = A × P (area mm², pressure bar → MPa = bar×0.1 → N/mm²)
  const pressureMPa = pressure * 0.1;
  const extendForceN = boreAreaMm2 * pressureMPa;
  const retractForceN = annulusAreaMm2 * pressureMPa;

  // Speed to flow: Q = A × v (mm²) × (mm/min) → L/min = mm³/min ÷ 1,000,000
  const extendFlowLPM = (boreAreaMm2 * speed) / 1_000_000;
  const retractFlowLPM = (annulusAreaMm2 * speed) / 1_000_000;

  // Pump sizing (add 20% margin)
  const pumpMinLPM = extendFlowLPM * 1.2;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>💧 Hydraulic Cylinder Calculator</Text>
        <Text style={styles.subtitle}>Force, speed, and flow rate for hydraulic cylinders</Text>

        <ChipPicker label="Bore diameter (mm)" values={BORE_PRESETS} selected={bore} onSelect={handleBoreSelect} />
        <ChipPicker label="Rod diameter (mm)" values={availableRods} selected={rodSafe} onSelect={setRod} />
        <ChipPicker label="System pressure (bar)" values={PRESSURE_OPTS} selected={pressure} onSelect={setPressure} />
        <ChipPicker label="Cylinder speed (mm/min)" values={SPEED_OPTS} selected={speed} onSelect={setSpeed} />

        {/* Force results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Force</Text>
          <View style={styles.resultRow}>
            <ResultBox label="Extend Force" value={`${(extendForceN / 1000).toFixed(1)} kN`} />
            <ResultBox label="Retract Force" value={`${(retractForceN / 1000).toFixed(1)} kN`} />
          </View>
          <View style={styles.resultRow}>
            <ResultBox label="Extend" value={`${(extendForceN / 9810).toFixed(0)} kgf`} />
            <ResultBox label="Retract" value={`${(retractForceN / 9810).toFixed(0)} kgf`} />
          </View>
        </View>

        {/* Flow results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Flow Rate at {speed} mm/min</Text>
          <View style={styles.resultRow}>
            <ResultBox label="Extend Flow" value={`${extendFlowLPM.toFixed(1)} L/min`} />
            <ResultBox label="Retract Flow" value={`${retractFlowLPM.toFixed(1)} L/min`} />
          </View>
          <ResultBox label="Min Pump Size (20% margin)" value={`${pumpMinLPM.toFixed(1)} L/min`} />
        </View>

        {/* Details */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Calculation Details</Text>
          {[
            ['Bore Ø', `${bore} mm`],
            ['Rod Ø', `${rodSafe} mm`],
            ['Bore area', `${boreAreaMm2.toFixed(0)} mm²`],
            ['Rod area', `${rodAreaMm2.toFixed(0)} mm²`],
            ['Annulus area', `${annulusAreaMm2.toFixed(0)} mm²`],
            ['Pressure', `${pressure} bar (${pressureMPa.toFixed(1)} MPa)`],
            ['Cylinder speed', `${speed} mm/min`],
          ].map(([k, v]) => (
            <View key={k} style={styles.statsRow}>
              <Text style={styles.statsKey}>{k}</Text>
              <Text style={styles.statsVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Quick reference */}
        <View style={styles.refCard}>
          <Text style={styles.refTitle}>Cylinder sizes @ 200 bar</Text>
          <View style={styles.tableHeader}>
            {['Bore', 'Extend kN', 'Retract kN'].map(h => (
              <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
            ))}
          </View>
          {BORE_PRESETS.map(b => {
            const r = ROD_MAP[b]?.[0] || b * 0.56;
            const bA = Math.PI * (b / 2) ** 2;
            const aA = bA - Math.PI * (r / 2) ** 2;
            return (
              <View key={b} style={styles.tableRow}>
                <Text style={styles.tableCell}>{b}</Text>
                <Text style={styles.tableCell}>{(bA * 20 / 1000).toFixed(0)}</Text>
                <Text style={styles.tableCell}>{(aA * 20 / 1000).toFixed(0)}</Text>
              </View>
            );
          })}
        </View>

        <InfoBox title="About this calculator">
          <Text style={styles.infoText}>
            {'Force: F = A × P  (Area mm² × Pressure N/mm²)\n'}
            {'Flow: Q = A × v  (Area mm² × Speed mm/min → L/min)\n\n'}
            {'Note: Does not include seal friction (~5–10% of force), back pressure on return line, or system losses.\n\n'}
            {'Pump sizing: always add 15–25% margin for losses and startup surge.\n\n'}
            {'Pressure note: 1 bar = 0.1 MPa = 0.1 N/mm²'}
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
  section: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  pickerGroup: { marginBottom: Spacing.md },
  pickerLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
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
