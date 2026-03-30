/**
 * CNC Punch Tonnage Calculator
 * WFD-248: 8 materials, 5 punch shapes, safety factor, die clearance guide
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';

interface Material {
  name: string;
  tensile_mpa: number;
  die_clearance_pct: number;
}

const MATERIALS: Material[] = [
  { name: 'Mild Steel',     tensile_mpa: 400, die_clearance_pct: 15 },
  { name: 'SS 304',         tensile_mpa: 520, die_clearance_pct: 20 },
  { name: 'SS 316',         tensile_mpa: 580, die_clearance_pct: 22 },
  { name: 'Tool Steel',     tensile_mpa: 700, die_clearance_pct: 18 },
  { name: 'Al 5052',        tensile_mpa: 230, die_clearance_pct: 10 },
  { name: 'Al 6061',        tensile_mpa: 310, die_clearance_pct: 12 },
  { name: 'Brass',          tensile_mpa: 380, die_clearance_pct: 15 },
  { name: 'Copper',         tensile_mpa: 250, die_clearance_pct: 12 },
];

type PunchShape = 'round' | 'square' | 'rectangle' | 'oblong' | 'custom';

const SHAPES: { id: PunchShape; label: string; hint: string }[] = [
  { id: 'round',     label: '⭕ Round',     hint: 'a = diameter' },
  { id: 'square',    label: '🟦 Square',    hint: 'a = side length' },
  { id: 'rectangle', label: '▬ Rectangle', hint: 'a = width, b = height' },
  { id: 'oblong',    label: '💊 Oblong',    hint: 'a = width, b = length' },
  { id: 'custom',    label: '✏️ Custom',    hint: 'a = perimeter directly' },
];

function calcPerimeter(shape: PunchShape, a: number, b: number): number {
  switch (shape) {
    case 'round':     return Math.PI * a;
    case 'square':    return 4 * a;
    case 'rectangle': return 2 * (a + b);
    case 'oblong':    return 2 * b + Math.PI * a;
    case 'custom':    return a;
    default:          return 0;
  }
}

export default function PunchTonnageCalculator() {
  const [selMat, setSelMat] = useState<Material>(MATERIALS[0]);
  const [customTensile, setCustomTensile] = useState('');
  const [useCustomTensile, setUseCustomTensile] = useState(false);
  const [thickness, setThickness] = useState('');
  const [shape, setShape] = useState<PunchShape>('round');
  const [dimA, setDimA] = useState('');
  const [dimB, setDimB] = useState('');
  const [safetyFactor, setSafetyFactor] = useState('1.25');

  const t = parseFloat(thickness) || 0;
  const a = parseFloat(dimA) || 0;
  const b = parseFloat(dimB) || 0;
  const tensile = useCustomTensile ? (parseFloat(customTensile) || selMat.tensile_mpa) : selMat.tensile_mpa;
  const sf = parseFloat(safetyFactor) || 1.25;
  const perimeter = calcPerimeter(shape, a, b);
  const valid = perimeter > 0 && t > 0 && tensile > 0;

  // F = P × t × Rm / 1000 kN → metric tonnes
  const rawTonnage = valid ? (perimeter * t * tensile) / (1000 * 9.807) : 0;
  const safeTonnage = rawTonnage * sf;
  const dieClearance = t * (selMat.die_clearance_pct / 100);

  const shapeInfo = SHAPES.find(s => s.id === shape);
  const needsDimB = shape === 'rectangle' || shape === 'oblong';

  const tonnageVariant = safeTonnage <= 0 ? 'default' :
    safeTonnage > 500 ? 'fail' : safeTonnage > 200 ? 'warn' : 'pass';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🏋️ Punch Tonnage</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Material</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
            {MATERIALS.map(m => (
              <TouchableOpacity key={m.name}
                style={[styles.chip, selMat.name === m.name && styles.chipActive]}
                onPress={() => { setSelMat(m); setUseCustomTensile(false); }}>
                <Text style={[styles.chipText, selMat.name === m.name && styles.chipTextActive]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Tensile Strength (MPa)</Text>
              <TextInput style={styles.input} keyboardType="numeric"
                value={useCustomTensile ? customTensile : selMat.tensile_mpa.toString()}
                editable={useCustomTensile}
                onChangeText={setCustomTensile}
                placeholderTextColor={Colors.textMuted} />
            </View>
            <TouchableOpacity style={[styles.toggle, useCustomTensile && styles.toggleActive]}
              onPress={() => { setUseCustomTensile(!useCustomTensile); setCustomTensile(selMat.tensile_mpa.toString()); }}>
              <Text style={[styles.toggleText, useCustomTensile && styles.toggleTextActive]}>
                {useCustomTensile ? 'Custom' : 'Preset'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Material Thickness (mm)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={thickness}
            onChangeText={setThickness} placeholder="e.g. 3" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.label}>Punch Shape</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {SHAPES.map(s => (
              <TouchableOpacity key={s.id} style={[styles.chip, shape === s.id && styles.chipActive]}
                onPress={() => setShape(s.id)}>
                <Text style={[styles.chipText, shape === s.id && styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {shapeInfo && <Text style={styles.hint}>{shapeInfo.hint}</Text>}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: needsDimB ? 8 : 0 }}>
              <Text style={styles.label}>{shape === 'round' ? 'Diameter (mm)' : shape === 'square' ? 'Side (mm)' : shape === 'custom' ? 'Perimeter (mm)' : 'Width (mm)'}</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={dimA}
                onChangeText={setDimA} placeholder="e.g. 20" placeholderTextColor={Colors.textMuted} />
            </View>
            {needsDimB && (
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{shape === 'oblong' ? 'Length (mm)' : 'Height (mm)'}</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={dimB}
                  onChangeText={setDimB} placeholder="e.g. 40" placeholderTextColor={Colors.textMuted} />
              </View>
            )}
          </View>

          {perimeter > 0 && (
            <ResultBox label="Perimeter" value={perimeter.toFixed(2)} unit="mm" variant="info" />
          )}

          <Text style={styles.label}>Safety Factor</Text>
          <View style={styles.row}>
            {['1.0', '1.25', '1.5'].map(sfv => (
              <TouchableOpacity key={sfv}
                style={[styles.toggle, safetyFactor === sfv && styles.toggleActive]}
                onPress={() => setSafetyFactor(sfv)}>
                <Text style={[styles.toggleText, safetyFactor === sfv && styles.toggleTextActive]}>×{sfv}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {valid && (
            <View style={styles.results}>
              <ResultBox label={`Required Tonnage (×${safetyFactor} safety)`}
                value={safeTonnage.toFixed(1)} unit="t" variant={tonnageVariant} large />
              <ResultBox label="Calculated force (no safety)" value={rawTonnage.toFixed(1)} unit="t" variant="info" />
              <ResultBox label="Die clearance per side" value={dieClearance.toFixed(3)} unit={`mm (${selMat.die_clearance_pct}%)`} variant="info" />

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Die Clearance Note</Text>
                <Text style={styles.infoText}>
                  Total: {(dieClearance * 2).toFixed(3)} mm{'\n'}
                  Too tight → burr, tool wear{'\n'}
                  Too loose → rollover, poor edge
                </Text>
              </View>

              <Text style={styles.hint}>
                Formula: F = P × t × Rm / 1000{'\n'}
                ×1.25 safety recommended minimum for production.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { marginTop: Spacing.md }]}>
          <Text style={styles.sectionTitle}>Material Reference</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Material</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Rm (MPa)</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Clearance</Text>
            </View>
            {MATERIALS.map(m => (
              <View key={m.name} style={[styles.tableRow, selMat.name === m.name && styles.tableRowHighlight]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{m.name}</Text>
                <Text style={[styles.tableCell, { color: Colors.primary }]}>{m.tensile_mpa}</Text>
                <Text style={styles.tableCell}>{m.die_clearance_pct}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  label: { ...Typography.label, marginBottom: 4 },
  input: {
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.sm, color: Colors.textPrimary,
    fontSize: 16, minHeight: 44, marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.sm },
  toggle: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    marginRight: 6, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end', marginBottom: Spacing.sm,
  },
  toggleActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  toggleText: { color: Colors.textSecondary, fontSize: 14 },
  toggleTextActive: { color: Colors.primary, fontWeight: '600' },
  chip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgInput,
    marginRight: 6, minHeight: 36, justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  chipText: { color: Colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  results: { marginTop: Spacing.md },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 8, fontStyle: 'italic' },
  infoBox: {
    backgroundColor: Colors.bgInput, borderRadius: Radius.sm, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm,
  },
  infoTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  infoText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  table: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.sm },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 8 },
  tableHeader: { backgroundColor: Colors.bgMuted },
  tableRowHighlight: { backgroundColor: Colors.primaryDim },
  tableCell: { flex: 1, textAlign: 'center', color: Colors.textSecondary, fontSize: 12 },
  tableHeaderText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
