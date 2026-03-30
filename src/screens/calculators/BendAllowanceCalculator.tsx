/**
 * Bend Allowance & K-Factor Calculator — ForgeTools
 * Sheet metal flat pattern development.
 * Calculates: Bend Allowance (BA), Bend Deduction (BD), Blank Length.
 * Based on standard Gaussian bend formula with K-factor.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Switch,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import InfoBox from '../../components/InfoBox';
import { calcBendAllowance } from '../../lib/calculations';
import { saveFavourite, addRecent } from '../../lib/storage';

interface MaterialPreset {
  name: string;
  k_factor: number;
  min_radius_ratio: number;  // min inside radius / thickness
  note: string;
}

const MATERIALS: MaterialPreset[] = [
  { name: 'Mild Steel\nSoft',      k_factor: 0.33, min_radius_ratio: 0.5, note: 'Soft / annealed' },
  { name: 'Mild Steel\nMedium',    k_factor: 0.40, min_radius_ratio: 1.0, note: 'Medium / cold-rolled' },
  { name: 'Stainless\n304',        k_factor: 0.45, min_radius_ratio: 1.5, note: 'High springback' },
  { name: 'Aluminium\n5052',       k_factor: 0.38, min_radius_ratio: 1.0, note: 'H32 temper' },
  { name: 'Aluminium\n6061',       k_factor: 0.40, min_radius_ratio: 1.5, note: 'T6 — crack risk' },
  { name: 'Copper\nSoft',          k_factor: 0.33, min_radius_ratio: 0.5, note: 'Very formable' },
  { name: 'Brass\nHalf-hard',      k_factor: 0.35, min_radius_ratio: 0.8, note: 'Good formability' },
  { name: 'Custom',                k_factor: 0.40, min_radius_ratio: 0.0, note: 'Set your own' },
];

const SPRINGBACK: Record<string, { deg: number; tip: string }> = {
  'Mild Steel\nSoft':   { deg: 1, tip: 'Minimal springback' },
  'Mild Steel\nMedium': { deg: 2, tip: 'Slight springback — overbend 1-2°' },
  'Stainless\n304':     { deg: 4, tip: 'High springback — overbend 3-5°' },
  'Aluminium\n5052':    { deg: 3, tip: 'Moderate springback — overbend 2-3°' },
  'Aluminium\n6061':    { deg: 5, tip: 'Very high springback — overbend 4-6°' },
  'Copper\nSoft':       { deg: 1, tip: 'Low springback' },
  'Brass\nHalf-hard':   { deg: 2, tip: 'Low-moderate springback' },
};

export default function BendAllowanceCalculator() {
  const [matIdx, setMatIdx] = useState(0);
  const [customK, setCustomK] = useState('0.40');
  const [thicknessText, setThicknessText] = useState('2');
  const [angleText, setAngleText] = useState('90');
  const [radiusText, setRadiusText] = useState('2');
  const [legAText, setLegAText] = useState('50');
  const [legBText, setLegBText] = useState('50');
  const [showFormulas, setShowFormulas] = useState(false);
  const [showKTable, setShowKTable] = useState(false);

  const mat = MATERIALS[matIdx];
  const isCustom = mat.name === 'Custom';
  const k = isCustom ? (parseFloat(customK) || 0.40) : mat.k_factor;

  const thickness = parseFloat(thicknessText) || 0;
  const angle = parseFloat(angleText) || 0;
  const insideRadius = parseFloat(radiusText) || 0;
  const legA = parseFloat(legAText) || 0;
  const legB = parseFloat(legBText) || 0;

  // Core calculations
  const valid = thickness > 0 && angle > 0 && angle <= 180;

  const bendAllowance = valid ? calcBendAllowance(thickness, angle, insideRadius, k) : 0;

  const angleRad = (angle * Math.PI) / 180;
  const outsideSetback = valid ? Math.tan(angleRad / 2) * (insideRadius + thickness) : 0;
  const bendDeduction = valid ? 2 * outsideSetback - bendAllowance : 0;
  const blankLength = valid ? legA + bendAllowance + legB : 0;
  const outsideRadius = insideRadius + thickness;
  const neutralRadius = insideRadius + k * thickness;

  const minSafeRadius = thickness * mat.min_radius_ratio;
  const radiusWarning = insideRadius < minSafeRadius && mat.min_radius_ratio > 0;
  const springback = SPRINGBACK[mat.name];

  const handleSave = useCallback(async () => {
    if (!valid) return;
    await saveFavourite({
      id: `ba-${Date.now()}`,
      tool: 'Bend Allowance',
      inputs: { material: mat.name, thickness, angle, insideRadius, k, legA, legB },
      result: { bendAllowance: Math.round(bendAllowance * 1000) / 1000, blankLength: Math.round(blankLength * 100) / 100 },
      label: `${thickness}mm ${mat.name.replace('\n', ' ')} ${angle}° — BA: ${(Math.round(bendAllowance * 100) / 100)}mm`,
    });
    await addRecent({
      id: `ba-${Date.now()}`,
      tool: 'Bend Allowance',
      inputs: { material: mat.name.replace('\n', ' '), thickness, angle, insideRadius },
      result: { bendAllowance: Math.round(bendAllowance * 1000) / 1000 },
      label: `${thickness}mm ${angle}° → BA ${(Math.round(bendAllowance * 100) / 100)}mm`,
    });
  }, [valid, mat, thickness, angle, insideRadius, k, legA, legB, bendAllowance, blankLength]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.title}>Bend Allowance</Text>
          <Text style={s.subtitle}>Sheet metal flat pattern calculator</Text>
        </View>

        {/* Help */}
        <InfoBox
          body={"Calculates bend allowance (BA), bend deduction (BD), and developed flat length for sheet metal forming.\n\nBA = (π/180) × angle × (inside_radius + K × thickness)\nBD = 2 × OSSB − BA\n\nK-factor: position of neutral axis (0.33 = soft/annealed, 0.40–0.45 = hard). Die opening recommendation: 8–10× material thickness."}
        />

        {/* Material */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Material</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

          {!isCustom && (
            <View style={s.matInfo}>
              <Text style={s.infoText}>K = {mat.k_factor}  ·  {mat.note}</Text>
            </View>
          )}

          {isCustom && (
            <>
              <Text style={s.label}>K-Factor (0.25–0.50)</Text>
              <TextInput
                style={s.input} value={customK} onChangeText={setCustomK}
                keyboardType="numeric" placeholderTextColor="#475569" placeholder="0.33–0.50" />
              <Text style={s.hint}>0.33 = inside bias · 0.50 = midpoint · Use 0.33 for most soft metals</Text>
            </>
          )}
        </View>

        {/* Inputs */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Bend Parameters</Text>

          <Text style={s.label}>Material thickness (mm)</Text>
          <TextInput style={s.input} value={thicknessText} onChangeText={setThicknessText}
            keyboardType="numeric" placeholderTextColor="#475569" />

          <Text style={s.label}>Bend angle (°)</Text>
          <TextInput style={s.input} value={angleText} onChangeText={setAngleText}
            keyboardType="numeric" placeholderTextColor="#475569" placeholder="90" />

          <Text style={s.label}>Inside bend radius (mm)</Text>
          <TextInput style={s.input} value={radiusText} onChangeText={setRadiusText}
            keyboardType="numeric" placeholderTextColor="#475569"
            placeholder={thickness > 0 ? `Min ~${(thickness * mat.min_radius_ratio).toFixed(1)}mm` : '0'} />
          {thickness > 0 && (
            <Text style={s.hint}>Recommended minimum: {(thickness * (mat.min_radius_ratio || 0.5)).toFixed(1)}mm for this material</Text>
          )}
        </View>

        {/* Leg lengths */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Leg Lengths (for blank size)</Text>
          <View style={s.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Leg A (mm)</Text>
              <TextInput style={s.input} value={legAText} onChangeText={setLegAText}
                keyboardType="numeric" placeholderTextColor="#475569" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Leg B (mm)</Text>
              <TextInput style={s.input} value={legBText} onChangeText={setLegBText}
                keyboardType="numeric" placeholderTextColor="#475569" />
            </View>
          </View>
        </View>

        {/* Results */}
        {valid ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Results</Text>

            <ResultBox
              label="Bend Allowance (BA)"
              value={`${(Math.round(bendAllowance * 1000) / 1000).toFixed(3)} mm`}
              sub="Arc length of material at neutral axis"
              status="info"
            />

            <View style={s.grid}>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Bend Deduction</Text>
                <Text style={s.metricValue}>{(Math.round(bendDeduction * 1000) / 1000).toFixed(3)} mm</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Outside Setback</Text>
                <Text style={s.metricValue}>{(Math.round(outsideSetback * 1000) / 1000).toFixed(3)} mm</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Outside Radius</Text>
                <Text style={s.metricValue}>{(Math.round(outsideRadius * 100) / 100).toFixed(2)} mm</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Neutral Radius</Text>
                <Text style={s.metricValue}>{(Math.round(neutralRadius * 1000) / 1000).toFixed(3)} mm</Text>
              </View>
            </View>

            {(legA > 0 || legB > 0) && (
              <View style={s.blankBox}>
                <Text style={s.blankLabel}>Blank (Developed) Length</Text>
                <Text style={s.blankValue}>{(Math.round(blankLength * 100) / 100).toFixed(2)} mm</Text>
                <Text style={s.blankSub}>{legA} + {(Math.round(bendAllowance * 100) / 100).toFixed(2)} + {legB} = {(Math.round(blankLength * 100) / 100).toFixed(2)}</Text>
              </View>
            )}

            {radiusWarning && (
              <View style={s.warnBox}>
                <Text style={s.warnText}>⚠️ Inside radius ({insideRadius}mm) is below minimum recommendation ({minSafeRadius.toFixed(1)}mm) for {mat.name.replace('\n', ' ')}. Risk of cracking.</Text>
              </View>
            )}

            {springback && angle !== 90 && (
              <View style={s.springBox}>
                <Text style={s.springTitle}>Springback: ~{springback.deg}°</Text>
                <Text style={s.springText}>{springback.tip}</Text>
              </View>
            )}

            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>💾 Save to Favourites</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.emptyText}>Enter thickness, angle, and radius to calculate.</Text>
          </View>
        )}

        {/* K-Factor table */}
        <TouchableOpacity style={s.expandBtn} onPress={() => setShowKTable(!showKTable)}>
          <Text style={s.expandBtnText}>{showKTable ? '▲' : '▼'} K-Factor Reference Table</Text>
        </TouchableOpacity>
        {showKTable && (
          <View style={s.card}>
            {MATERIALS.filter(m => m.name !== 'Custom').map(m => (
              <View key={m.name} style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 2, color: '#e2e8f0' }]}>{m.name.replace('\n', ' ')}</Text>
                <Text style={s.tableCell}>K = {m.k_factor}</Text>
                <Text style={[s.tableCell, { flex: 2, color: '#94a3b8', fontSize: 11 }]}>{m.note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Formulas */}
        <TouchableOpacity style={s.expandBtn} onPress={() => setShowFormulas(!showFormulas)}>
          <Text style={s.expandBtnText}>{showFormulas ? '▲' : '▼'} Formulas</Text>
        </TouchableOpacity>
        {showFormulas && (
          <View style={s.card}>
            <Text style={s.formulaText}>BA = π/180 × A × (R + K × t)</Text>
            <Text style={s.formulaText}>OSSB = tan(A/2) × (R + t)</Text>
            <Text style={s.formulaText}>BD = (2 × OSSB) − BA</Text>
            <Text style={s.formulaText}>L_blank = Leg_A + BA + Leg_B</Text>
            <Text style={[s.formulaText, { marginTop: 8, color: '#94a3b8' }]}>
              A = angle (°), R = inside radius, t = thickness, K = K-factor
            </Text>
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Verify with applicable standards and your press brake manufacturer.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, padding: Spacing.md },
  header: { marginBottom: Spacing.md },
  title: { fontWeight: '700', fontSize: 22, color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  sectionTitle: { fontWeight: '600', fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.sm },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    padding: 10,
    fontSize: 16,
    minHeight: 44,
  },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    backgroundColor: Colors.bgInput,
    alignItems: 'center' as const,
  },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center' as const },
  chipTextActive: { color: Colors.primary, fontWeight: '600' as const },
  matInfo: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  infoText: { fontSize: 13, color: Colors.textSecondary },
  rowInputs: { flexDirection: 'row' as const },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm, marginTop: Spacing.sm + 4 },
  metric: {
    width: '47%',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    padding: 10,
    alignItems: 'center' as const,
  },
  metricLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' as const },
  metricValue: { fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary, marginTop: 2 },
  blankBox: {
    backgroundColor: Colors.secondaryDim,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 4,
    marginTop: Spacing.sm + 4,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.secondaryBorder,
  },
  blankLabel: { fontSize: 12, color: Colors.secondary, marginBottom: 4 },
  blankValue: { fontSize: 28, fontWeight: '700' as const, color: Colors.secondary },
  blankSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  warnBox: {
    backgroundColor: Colors.warningDim,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 4,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  warnText: { fontSize: 13, color: Colors.warning },
  springBox: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 4,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  springTitle: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  springText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.secondaryDim,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 4,
    alignItems: 'center' as const,
    marginTop: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.secondaryBorder,
  },
  saveBtnText: { color: Colors.secondary, fontWeight: '600' as const },
  emptyText: { color: Colors.textMuted, textAlign: 'center' as const, paddingVertical: Spacing.md },
  expandBtn: { padding: Spacing.sm, alignItems: 'center' as const, marginBottom: 4 },
  expandBtnText: { color: Colors.textSecondary, fontSize: 13 },
  tableRow: { flexDirection: 'row' as const, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableCell: { flex: 1, color: Colors.textSecondary, fontSize: 12 },
  formulaText: { fontFamily: 'monospace', fontSize: 13, color: Colors.primary, paddingVertical: 3 },
  footer: { padding: Spacing.md, alignItems: 'center' as const, marginBottom: 40 },
  footerText: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' as const },
});
