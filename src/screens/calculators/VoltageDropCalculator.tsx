/**
 * Voltage Drop Calculator — ForgeTools
 * AS/NZS 3008.1.1 / NEC compliant
 * Supports single-phase and 3-phase, copper and aluminium conductors.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Switch, Platform,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import { calcVoltageDrop, WIRE_DATA } from '../../lib/calculations';
import { saveFavourite, addRecent } from '../../lib/storage';

const WIRE_SIZES = WIRE_DATA.map(w => w.mm2);
const VOLTAGES = [12, 24, 48, 120, 230, 240, 415, 440, 480];

export default function VoltageDropCalculator() {
  // Inputs
  const [wireIdx, setWireIdx] = useState(2);           // 4mm² default
  const [lengthText, setLengthText] = useState('20');
  const [currentText, setCurrentText] = useState('10');
  const [voltageIdx, setVoltageIdx] = useState(6);     // 415V default
  const [isThreePhase, setIsThreePhase] = useState(true);
  const [isAluminium, setIsAluminium] = useState(false);
  const [maxDropText, setMaxDropText] = useState('5');

  const length = parseFloat(lengthText) || 0;
  const current = parseFloat(currentText) || 0;
  const voltage = VOLTAGES[voltageIdx];
  const wireSize = WIRE_SIZES[wireIdx];
  const maxDrop = parseFloat(maxDropText) || 5;

  const result = calcVoltageDrop(
    wireSize, length, current, voltage,
    isThreePhase ? '3phase' : 'single',
    isAluminium ? 'aluminium' : 'copper',
    maxDrop,
  );

  const handleSave = useCallback(async () => {
    if (!result) return;
    const calc = {
      id: `vd-${Date.now()}`,
      tool: 'Voltage Drop',
      inputs: { wireSize, length, current, voltage, phase: isThreePhase ? '3P' : '1P', conductor: isAluminium ? 'Al' : 'Cu' },
      result: { drop_v: result.drop_v, drop_pct: result.drop_pct, pass: result.pass ? 'PASS' : 'FAIL' },
      label: `${wireSize}mm² · ${length}m · ${current}A`,
    };
    await saveFavourite(calc);
    await addRecent(calc);
  }, [result, wireSize, length, current, voltage, isThreePhase, isAluminium]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.title}>Voltage Drop</Text>
          <Text style={styles.subtitle}>AS/NZS 3008.1.1 · Single & 3-Phase</Text>
        </View>

        {/* Wire Size Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Conductor Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {WIRE_SIZES.map((size, i) => (
              <TouchableOpacity
                key={size}
                style={[styles.chip, wireIdx === i && styles.chipActive]}
                onPress={() => setWireIdx(i)}
                accessibilityLabel={`${size} mm² wire`}
              >
                <Text style={[styles.chipText, wireIdx === i && styles.chipTextActive]}>
                  {size}mm²
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* System Voltage Selector */}
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

        {/* Numeric Inputs */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Run Length (m)</Text>
              <TextInput
                style={styles.input}
                value={lengthText}
                onChangeText={setLengthText}
                keyboardType="decimal-pad"
                placeholder="20"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Cable run length in metres"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current (A)</Text>
              <TextInput
                style={styles.input}
                value={currentText}
                onChangeText={setCurrentText}
                keyboardType="decimal-pad"
                placeholder="10"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Load current in amperes"
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
                accessibilityLabel="Maximum acceptable voltage drop percentage"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Conductor</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{isAluminium ? 'Aluminium' : 'Copper'}</Text>
                <Switch
                  value={isAluminium}
                  onValueChange={setIsAluminium}
                  trackColor={{ false: Colors.primaryBorder, true: Colors.secondaryBorder }}
                  thumbColor={isAluminium ? Colors.secondary : Colors.primary}
                />
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

        {/* Results */}
        {result && (
          <View style={styles.results}>
            <Text style={styles.sectionTitle}>Results</Text>
            <ResultBox
              label="Voltage Drop"
              value={result.drop_v}
              unit="V"
              variant={result.pass ? 'pass' : 'fail'}
              large
            />
            <ResultBox
              label="Drop Percentage"
              value={`${result.drop_pct}%`}
              variant={result.pass ? 'pass' : 'fail'}
            />
            <ResultBox
              label="Compliance"
              value={result.pass ? `✓ PASS (≤${maxDrop}%)` : `✗ FAIL (>${maxDrop}%)`}
              variant={result.pass ? 'pass' : 'fail'}
            />
            <ResultBox
              label="Cable Current Rating"
              value={result.max_amps}
              unit="A"
              variant={result.current_ok ? 'info' : 'fail'}
            />
            {!result.current_ok && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ⚠️ Current ({current}A) exceeds conductor rating ({result.max_amps}A). Increase cable size.
                </Text>
              </View>
            )}
            {!result.pass && result.current_ok && (
              <View style={[styles.alertBox, styles.warnBox]}>
                <Text style={styles.alertText}>
                  ⚠️ Voltage drop exceeds limit. Try a larger conductor or shorter run.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} accessibilityRole="button">
              <Text style={styles.saveBtnText}>★ Save to Favourites</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reference */}
        <View style={[styles.card, styles.refCard]}>
          <Text style={styles.refTitle}>📋 Quick Reference</Text>
          <Text style={styles.refText}>• AS/NZS 3008.1.1: max 5% drop final sub-circuit, 3% preferred</Text>
          <Text style={styles.refText}>• Single-phase: resistance × 2 (go + return)</Text>
          <Text style={styles.refText}>• 3-phase: resistance × √3 (balanced load)</Text>
          <Text style={styles.refText}>• Ratings are for PVC insulation, 30°C ambient, in conduit</Text>
          <Text style={styles.refText}>• Derate for higher temps, bundled cables, or direct burial</Text>
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
  subtitle: { ...Typography.caption, marginTop: 2 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  label: { ...Typography.label, marginBottom: Spacing.xs },
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
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  chipText: { ...Typography.caption, color: Colors.textMuted },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
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
  results: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h2, marginBottom: Spacing.sm },
  alertBox: {
    backgroundColor: Colors.dangerDim,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  warnBox: {
    backgroundColor: Colors.warningDim,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  alertText: { color: '#fca5a5', fontSize: 13 },
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
  refCard: { backgroundColor: Colors.bgInput, marginTop: Spacing.xs },
  refTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.xs },
  refText: { ...Typography.caption, marginBottom: 3, lineHeight: 18 },
});
