/**
 * Press Brake Tonnage Calculator — ForgeTools
 * Calculate required tonnage for V-die bending.
 * Formula: F = (L × t² × Rm) / (1000 × V)
 * Includes material presets, safety factor, die opening recommendation.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import { saveFavourite, addRecent } from '../../lib/storage';

// Material presets: name, tensile strength (MPa), recommended clearance %
interface MaterialPreset {
  name: string;
  tensile: number;
  clearance_pct: number;
}

const MATERIALS: MaterialPreset[] = [
  { name: 'Mild Steel (soft)',       tensile: 400, clearance_pct: 5  },
  { name: 'Mild Steel (medium)',     tensile: 500, clearance_pct: 5  },
  { name: 'Stainless Steel 304',     tensile: 700, clearance_pct: 6  },
  { name: 'Aluminium 5052-H32',      tensile: 230, clearance_pct: 4  },
  { name: 'Aluminium 6061-T6',       tensile: 310, clearance_pct: 5  },
  { name: 'Copper (soft)',           tensile: 200, clearance_pct: 4  },
  { name: 'Brass (half hard)',       tensile: 350, clearance_pct: 4  },
  { name: 'Custom',                  tensile: 0,   clearance_pct: 5  },
];

const SAFETY_FACTORS = [
  { label: '×1.0 — No margin', value: 1.0 },
  { label: '×1.25 — Standard',  value: 1.25 },
  { label: '×1.5 — Conservative', value: 1.5 },
];

function calcTonnage(
  length_mm: number,
  thickness_mm: number,
  die_opening_mm: number,
  tensile_mpa: number,
  safety: number,
): { tonnes: number; kn: number } | null {
  if (die_opening_mm <= 0 || thickness_mm <= 0 || length_mm <= 0 || tensile_mpa <= 0) return null;
  const kn = (length_mm * Math.pow(thickness_mm, 2) * tensile_mpa) / (1000 * die_opening_mm) * safety;
  const tonnes = kn / 9.81;
  return { tonnes: Math.round(tonnes * 10) / 10, kn: Math.round(kn * 10) / 10 };
}

export default function PressBrakeTonnageCalculator() {
  const [matIdx, setMatIdx] = useState(0);
  const [customTensile, setCustomTensile] = useState('500');
  const [thicknessText, setThicknessText] = useState('3');
  const [lengthText, setLengthText] = useState('1000');
  const [dieText, setDieText] = useState('');        // empty = auto
  const [safetyIdx, setSafetyIdx] = useState(1);
  const [showRefTable, setShowRefTable] = useState(false);

  const mat = MATERIALS[matIdx];
  const isCustom = mat.name === 'Custom';
  const tensile = isCustom ? (parseFloat(customTensile) || 0) : mat.tensile;
  const thickness = parseFloat(thicknessText) || 0;
  const length = parseFloat(lengthText) || 0;
  const safety = SAFETY_FACTORS[safetyIdx].value;

  // Auto die recommendation: 8× thickness (standard for 90° bend)
  const autoDie = Math.round(thickness * 8 * 10) / 10;
  const die = dieText ? parseFloat(dieText) || autoDie : autoDie;

  const result = calcTonnage(length, thickness, die, tensile, safety);

  const handleSave = useCallback(async () => {
    if (!result) return;
    await saveFavourite({
      id: `pb-${Date.now()}`,
      tool: 'Press Brake Tonnage',
      inputs: { material: mat.name, thickness, length, die, tensile, safety },
      result: { tonnes: result.tonnes, kn: result.kn },
      label: `${thickness}mm ${mat.name} · ${length}mm · ${result.tonnes}T`,
    });
    await addRecent({
      id: `pb-${Date.now()}`,
      tool: 'Press Brake Tonnage',
      inputs: { material: mat.name, thickness, length, die },
      result: { tonnes: result.tonnes, kn: result.kn },
      label: `${thickness}mm ${mat.name} → ${result.tonnes}T`,
    });
  }, [result, mat, thickness, length, die, tensile, safety]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.title}>Press Brake Tonnage</Text>
          <Text style={s.subtitle}>V-die bending force calculator</Text>
        </View>

        {/* Material Picker */}
        <View style={s.card}>
          <Text style={s.label}>Material</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
            {MATERIALS.map((m, i) => (
              <TouchableOpacity
                key={m.name}
                onPress={() => setMatIdx(i)}
                style={[s.chip, matIdx === i && s.chipActive]}
              >
                <Text style={[s.chipText, matIdx === i && s.chipTextActive]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isCustom && (
            <View style={s.row}>
              <Text style={s.label}>Tensile strength (MPa)</Text>
              <TextInput
                style={s.input}
                value={customTensile}
                onChangeText={setCustomTensile}
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}
          {!isCustom && (
            <Text style={s.info}>Tensile strength: {tensile} MPa · Die clearance: {mat.clearance_pct}% per side</Text>
          )}
        </View>

        {/* Inputs */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Bend Parameters</Text>

          <Text style={s.label}>Material thickness (mm)</Text>
          <TextInput style={s.input} value={thicknessText} onChangeText={setThicknessText}
            keyboardType="numeric" placeholderTextColor={Colors.textMuted} />

          <Text style={s.label}>Bend length (mm)</Text>
          <TextInput style={s.input} value={lengthText} onChangeText={setLengthText}
            keyboardType="numeric" placeholderTextColor={Colors.textMuted} placeholder="e.g. 1000 (1 metre)" />

          <Text style={s.label}>V-die opening (mm)</Text>
          <TextInput style={s.input} value={dieText} onChangeText={setDieText}
            keyboardType="numeric" placeholderTextColor={Colors.textMuted}
            placeholder={`Auto: ${autoDie}mm (8× thickness)`} />
          <Text style={s.hint}>Leave blank for recommended 8× thickness = {autoDie}mm</Text>

          <Text style={s.label}>Safety factor</Text>
          <View style={s.chipRow}>
            {SAFETY_FACTORS.map((sf, i) => (
              <TouchableOpacity
                key={sf.label}
                onPress={() => setSafetyIdx(i)}
                style={[s.chipSm, safetyIdx === i && s.chipSmActive]}
              >
                <Text style={[s.chipSmText, safetyIdx === i && s.chipSmTextActive]}>{sf.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results */}
        {result ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Results</Text>
            <ResultBox
              label="Required Force"
              value={`${result.tonnes} tonnes`}
              sub={`${result.kn} kN  ·  Safety ×${safety}`}
              status="info"
            />
            <View style={s.metricsRow}>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Die opening used</Text>
                <Text style={s.metricValue}>{die} mm</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.metricLabel}>kN per metre</Text>
                <Text style={s.metricValue}>{Math.round(result.kn / (length / 1000) * 10) / 10}</Text>
              </View>
            </View>

            {result.tonnes > 500 && (
              <View style={s.warningBox}>
                <Text style={s.warningText}>⚠️ High tonnage — verify machine capacity and tooling rating</Text>
              </View>
            )}

            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>💾 Save to Favourites</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.emptyText}>Enter thickness, length, and material to calculate.</Text>
          </View>
        )}

        {/* Reference table */}
        <TouchableOpacity style={s.expandBtn} onPress={() => setShowRefTable(!showRefTable)}>
          <Text style={s.expandBtnText}>{showRefTable ? '▲' : '▼'} Material Reference Table</Text>
        </TouchableOpacity>
        {showRefTable && (
          <View style={s.card}>
            {MATERIALS.filter(m => m.name !== 'Custom').map(m => (
              <View key={m.name} style={s.tableRow}>
                <Text style={[s.tableCell, s.tableCellWide]}>{m.name}</Text>
                <Text style={s.tableCell}>{m.tensile} MPa</Text>
                <Text style={s.tableCell}>{m.clearance_pct}% clr</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Formula: F = (L × t² × Rm) / (1000 × V)</Text>
          <Text style={s.footerText}>L=length(mm), t=thickness(mm), Rm=tensile(MPa), V=die opening(mm)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1a' },
  scroll: { flex: 1, padding: Spacing.md },
  header: { marginBottom: Spacing.md },
  title: { ...Typography.heading, color: '#00d4ff', fontSize: 22 },
  subtitle: { ...Typography.body, color: '#94a3b8', marginTop: 2 },
  card: {
    backgroundColor: '#0f1623',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.1)',
  },
  sectionTitle: { ...Typography.subheading, color: '#e2e8f0', marginBottom: Spacing.sm },
  label: { ...Typography.label, color: '#94a3b8', marginBottom: 4, marginTop: Spacing.sm },
  input: {
    backgroundColor: '#0d1520',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    color: '#e2e8f0',
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 44,
  },
  hint: { ...Typography.caption, color: '#475569', marginTop: 2 },
  info: { ...Typography.caption, color: '#94a3b8', marginTop: Spacing.sm },
  row: { marginTop: Spacing.sm },
  chipScroll: { marginBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginRight: Spacing.xs,
    backgroundColor: '#0d1520',
  },
  chipActive: { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: '#00d4ff' },
  chipText: { color: '#94a3b8', fontSize: 13 },
  chipTextActive: { color: '#00d4ff', fontWeight: '600' },
  chipRow: { flexDirection: 'column', gap: Spacing.xs, marginTop: Spacing.xs },
  chipSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: '#0d1520',
  },
  chipSmActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: '#ff6b35' },
  chipSmText: { color: '#94a3b8', fontSize: 13 },
  chipSmTextActive: { color: '#ff6b35', fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: '#0d1520',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  metricLabel: { ...Typography.caption, color: '#94a3b8' },
  metricValue: { ...Typography.subheading, color: '#e2e8f0', marginTop: 2 },
  warningBox: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  warningText: { color: '#f59e0b', fontSize: 13 },
  saveBtn: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  saveBtnText: { color: '#ff6b35', fontWeight: '600' },
  emptyText: { color: '#475569', textAlign: 'center', paddingVertical: Spacing.md },
  expandBtn: {
    padding: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  expandBtnText: { color: '#94a3b8', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.1)' },
  tableCell: { flex: 1, color: '#94a3b8', fontSize: 12 },
  tableCellWide: { flex: 2, color: '#e2e8f0' },
  footer: { padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.xl },
  footerText: { color: '#475569', fontSize: 11, textAlign: 'center' },
});
