/**
 * Wire Gauge Selector — ForgeTools
 * Recommend minimum conductor size for given current, distance, and drop limit.
 * Based on AS/NZS 3008.1.1 — copper and aluminium, single and 3-phase.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Switch,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import { WIRE_DATA, calcVoltageDrop } from '../../lib/calculations';
import { saveFavourite, addRecent } from '../../lib/storage';

const VOLTAGES = [12, 24, 48, 120, 230, 240, 415, 440, 480];

interface GaugeRecommendation {
  mm2: number;
  drop_v: number;
  drop_pct: number;
  max_amps: number;
  current_ok: boolean;
}

function recommendWireGauge(
  current: number,
  length: number,
  voltage: number,
  phase: 'single' | '3phase',
  conductor: 'copper' | 'aluminium',
  maxDropPct: number,
): GaugeRecommendation[] {
  const results: GaugeRecommendation[] = [];
  for (const wire of WIRE_DATA) {
    const r = calcVoltageDrop(wire.mm2, length, current, voltage, phase, conductor, maxDropPct);
    if (!r) continue;
    results.push({
      mm2: wire.mm2,
      drop_v: r.drop_v,
      drop_pct: r.drop_pct,
      max_amps: r.max_amps,
      current_ok: r.current_ok,
    });
  }
  return results;
}

export default function WireGaugeCalculator() {
  const [currentText, setCurrentText] = useState('20');
  const [lengthText, setLengthText] = useState('30');
  const [voltageIdx, setVoltageIdx] = useState(6);     // 415V default
  const [isThreePhase, setIsThreePhase] = useState(true);
  const [isAluminium, setIsAluminium] = useState(false);
  const [maxDropText, setMaxDropText] = useState('5');

  const current = parseFloat(currentText) || 0;
  const length = parseFloat(lengthText) || 0;
  const voltage = VOLTAGES[voltageIdx];
  const maxDrop = parseFloat(maxDropText) || 5;

  const allResults = useMemo(() => {
    if (!current || !length || !voltage) return [];
    return recommendWireGauge(
      current, length, voltage,
      isThreePhase ? '3phase' : 'single',
      isAluminium ? 'aluminium' : 'copper',
      maxDrop,
    );
  }, [current, length, voltage, isThreePhase, isAluminium, maxDrop]);

  // Minimum gauge that passes both current capacity AND drop limit
  const recommended = allResults.find(r => r.current_ok && r.drop_pct <= maxDrop);

  const handleSave = useCallback(async () => {
    if (!recommended) return;
    const calc = {
      id: `wg-${Date.now()}`,
      tool: 'Wire Gauge',
      inputs: { current, length, voltage, phase: isThreePhase ? '3P' : '1P', conductor: isAluminium ? 'Al' : 'Cu', maxDrop },
      result: { mm2: recommended.mm2, drop_pct: recommended.drop_pct },
      label: `${current}A · ${length}m · ${voltage}V`,
    };
    await saveFavourite(calc);
    await addRecent(calc);
  }, [recommended, current, length, voltage, isThreePhase, isAluminium, maxDrop]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🔌</Text>
          <Text style={styles.title}>Wire Gauge Selector</Text>
          <Text style={styles.subtitle}>Find minimum conductor size · AS/NZS 3008.1.1</Text>
        </View>

        {/* Inputs */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Load Current (A)</Text>
              <TextInput
                style={styles.input}
                value={currentText}
                onChangeText={setCurrentText}
                keyboardType="decimal-pad"
                placeholder="20"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Load current in amperes"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Run Length (m)</Text>
              <TextInput
                style={styles.input}
                value={lengthText}
                onChangeText={setLengthText}
                keyboardType="decimal-pad"
                placeholder="30"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Cable run length in metres"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Max Drop (%)</Text>
              <TextInput
                style={styles.input}
                value={maxDropText}
                onChangeText={setMaxDropText}
                keyboardType="decimal-pad"
                placeholder="5"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Maximum acceptable voltage drop"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Conductor</Text>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, !isAluminium && { color: Colors.primary }]}>Cu</Text>
                <Switch
                  value={isAluminium}
                  onValueChange={setIsAluminium}
                  trackColor={{ false: Colors.primaryBorder, true: Colors.secondaryBorder }}
                  thumbColor={isAluminium ? Colors.secondary : Colors.primary}
                />
                <Text style={[styles.toggleLabel, isAluminium && { color: Colors.secondary }]}>Al</Text>
              </View>
            </View>
          </View>

          <View style={styles.phaseRow}>
            <Text style={styles.label}>Phase</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, !isThreePhase && { color: Colors.primary }]}>Single</Text>
              <Switch
                value={isThreePhase}
                onValueChange={setIsThreePhase}
                trackColor={{ false: Colors.primaryBorder, true: Colors.primaryBorder }}
                thumbColor={Colors.primary}
              />
              <Text style={[styles.toggleLabel, isThreePhase && { color: Colors.primary }]}>3-Phase</Text>
            </View>
          </View>
        </View>

        {/* Voltage Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>System Voltage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {VOLTAGES.map((v, i) => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, voltageIdx === i && styles.chipActive]}
                onPress={() => setVoltageIdx(i)}
                accessibilityLabel={`${v} volts`}
              >
                <Text style={[styles.chipText, voltageIdx === i && styles.chipTextActive]}>
                  {v}V
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recommendation */}
        {allResults.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.sectionTitle}>Recommendation</Text>
            {recommended ? (
              <>
                <View style={styles.recommendedBox}>
                  <Text style={styles.recommendedLabel}>Minimum Suitable Size</Text>
                  <Text style={styles.recommendedValue}>{recommended.mm2} mm²</Text>
                  <Text style={styles.recommendedSub}>
                    {recommended.drop_pct}% drop · {recommended.max_amps}A rated
                  </Text>
                </View>
                <ResultBox label="Voltage Drop" value={`${recommended.drop_pct}%`} variant="pass" />
                <ResultBox label="Current Rating" value={recommended.max_amps} unit="A" variant="info" />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} accessibilityRole="button">
                  <Text style={styles.saveBtnText}>★ Save to Favourites</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ⚠️ No suitable conductor found within AS/NZS 3008.1.1 table for these parameters.
                  Check current, length, and drop limit.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Full Table */}
        {allResults.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>All Sizes</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHead]}>Size</Text>
              <Text style={[styles.tableCell, styles.tableHead]}>Rating</Text>
              <Text style={[styles.tableCell, styles.tableHead]}>Drop</Text>
              <Text style={[styles.tableCell, styles.tableHead]}>Status</Text>
            </View>
            {allResults.map(r => {
              const pass = r.current_ok && r.drop_pct <= maxDrop;
              const isRec = r.mm2 === recommended?.mm2;
              return (
                <View
                  key={r.mm2}
                  style={[styles.tableRow, isRec && styles.tableRowHighlight]}
                >
                  <Text style={[styles.tableCell, isRec && { color: Colors.primary, fontWeight: '700' }]}>
                    {r.mm2}mm²
                  </Text>
                  <Text style={[styles.tableCell, !r.current_ok && styles.fail]}>
                    {r.max_amps}A
                  </Text>
                  <Text style={[styles.tableCell, r.drop_pct > maxDrop && styles.fail]}>
                    {r.drop_pct}%
                  </Text>
                  <Text style={[styles.tableCell, pass ? styles.pass : styles.fail]}>
                    {pass ? (isRec ? '✓ MIN' : '✓') : '✗'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Reference */}
        <View style={[styles.card, styles.refCard]}>
          <Text style={styles.refTitle}>📋 Notes</Text>
          <Text style={styles.refText}>• Ratings: PVC insulation, 30°C ambient, in conduit</Text>
          <Text style={styles.refText}>• AS/NZS 3008.1.1 max drop: 5% sub-circuit, 3% preferred</Text>
          <Text style={styles.refText}>• Derate for bundled cables, high ambient temp, or direct burial</Text>
          <Text style={styles.refText}>• Always verify with your licensed electrician for final design</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  icon: { fontSize: 32, marginBottom: 4 },
  title: { ...Typography.h1, color: Colors.primary },
  subtitle: { ...Typography.caption, marginTop: 2, textAlign: 'center' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  label: { ...Typography.label, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  inputGroup: { flex: 1 },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 16,
    minHeight: 44,
  },
  phaseRow: { marginTop: Spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, minHeight: 44 },
  toggleLabel: { ...Typography.label, color: Colors.textMuted },
  chipRow: { flexDirection: 'row', marginTop: 4 },
  chip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    backgroundColor: Colors.bgInput,
    minWidth: 44,
    alignItems: 'center',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  chipText: { ...Typography.caption, color: Colors.textMuted },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  results: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h2, marginBottom: Spacing.sm },
  recommendedBox: {
    backgroundColor: Colors.successDim,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recommendedLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  recommendedValue: { fontSize: 48, fontWeight: '700', color: '#86efac' },
  recommendedSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  alertBox: {
    backgroundColor: Colors.dangerDim,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    padding: Spacing.md,
  },
  alertText: { color: '#fca5a5', fontSize: 13, lineHeight: 20 },
  saveBtn: {
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tableHead: { color: Colors.textMuted, fontWeight: '600', fontSize: 12 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableRowHighlight: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.sm,
    borderBottomColor: 'transparent',
    marginBottom: 1,
  },
  tableCell: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  pass: { color: '#86efac', fontWeight: '600' },
  fail: { color: '#fca5a5' },
  refCard: { backgroundColor: Colors.bgInput },
  refTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.xs },
  refText: { ...Typography.caption, marginBottom: 3, lineHeight: 18 },
});
