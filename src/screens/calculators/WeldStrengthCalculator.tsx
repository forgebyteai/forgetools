/**
 * ForgeTools — Weld Joint Strength Calculator (WFD-280, WFD-278)
 * Fillet and butt weld capacity estimation per AWS D1.1 / AS/NZS 1554.
 * Offline capable — no network required.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import InfoBox from '../../components/InfoBox';

// ── Data ───────────────────────────────────────────────────────────────────

const MATERIALS: Record<string, [number, number]> = {
  'Mild Steel 250 MPa':     [250, 410],
  'Mild Steel 350 MPa':     [350, 480],
  'High Strength 460 MPa':  [460, 550],
  'Stainless 304':          [210, 510],
  'Stainless 316':          [170, 485],
  'Aluminium 6061-T6':      [276, 310],
  'Aluminium 5083-H111':    [145, 290],
};

const ELECTRODES: Record<string, number> = {
  'E70/ER70S (mild steel)': 480,
  'E70XX-X (high str.)':    480,
  'E308 (SS304)':            550,
  'E316 (SS316)':            520,
  'ER4043 (aluminium)':      145,
  'ER5356 (aluminium)':      262,
};

type JointType = 'fillet' | 'full-butt' | 'partial-butt';
type LoadDir = 'transverse' | 'longitudinal';

const JOINT_LABELS: Record<JointType, string> = {
  'fillet':       '🔺 Fillet Weld',
  'full-butt':    '▬ Full Pen Butt',
  'partial-butt': '▭ Partial Pen Butt',
};

const SF_OPTS = [1.5, 2.0, 2.5, 3.0];
const LEG_OPTS = [3, 4, 5, 6, 8, 10, 12];
const LEN_OPTS = [50, 100, 150, 200, 300, 500];
const THICK_OPTS = [5, 6, 8, 10, 12, 16, 20, 25];

function ChipPicker<T extends number | string>({ label, values, selected, onSelect, format }: {
  label: string; values: T[]; selected: T; onSelect: (v: T) => void; format?: (v: T) => string;
}) {
  return (
    <View style={styles.pickerGroup}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {values.map(v => (
            <TouchableOpacity key={String(v)} style={[styles.chip, selected === v && styles.chipActive]} onPress={() => onSelect(v)}>
              <Text style={[styles.chipText, selected === v && styles.chipTextActive]}>{format ? format(v) : String(v)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function WeldStrengthCalculator() {
  const [jointType, setJointType] = useState<JointType>('fillet');
  const [material, setMaterial] = useState('Mild Steel 250 MPa');
  const [electrode, setElectrode] = useState('E70/ER70S (mild steel)');
  const [legSize, setLegSize] = useState(6);
  const [weldLen, setWeldLen] = useState(100);
  const [loadDir, setLoadDir] = useState<LoadDir>('transverse');
  const [thickness, setThickness] = useState(10);
  const [throat, setThroat] = useState(8);
  const [sf, setSf] = useState(2.0);

  const [baseYield, baseTensile] = MATERIALS[material];
  const elecTensile = ELECTRODES[electrode];
  const effTensile = Math.min(baseTensile, elecTensile);

  // ── Calculations ─────────────────────────────────────────────────────────

  let nomKN = 0, desKN = 0, shearKN = 0, effThroat = 0;
  let extraInfo = '';

  if (jointType === 'fillet') {
    effThroat = legSize * 0.707;
    const shearCapMPa = 0.3 * elecTensile * (loadDir === 'transverse' ? 1.5 : 1.0);
    const area = effThroat * weldLen;
    nomKN = (shearCapMPa * area) / 1000;
    desKN = nomKN / sf;
    extraInfo = `Effective throat: ${effThroat.toFixed(2)} mm\nShear cap on throat: ${shearCapMPa.toFixed(0)} MPa`;
  } else if (jointType === 'full-butt') {
    const area = thickness * weldLen;
    nomKN = (baseTensile * area) / 1000;
    desKN = nomKN / sf;
    shearKN = (0.6 * baseYield * area) / 1000 / sf;
    extraInfo = `Strength equals base metal when properly executed.`;
  } else {
    const area = throat * weldLen;
    const shearCapMPa = 0.3 * effTensile;
    nomKN = (shearCapMPa * area) / 1000;
    desKN = nomKN / sf;
    extraInfo = `Partial pen not for primary tension members.`;
  }

  const FILLET_GUIDE = [
    ['≤6',   '3',  '3'],
    ['7–12', '4',  '5'],
    ['13–19','5',  '6'],
    ['20–26','6',  '8'],
    ['27–38','8',  '10'],
    ['>38',  '10', '12'],
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🔥 Weld Strength Calculator</Text>
        <Text style={styles.subtitle}>Fillet and butt weld capacity (AWS D1.1 / AS/NZS 1554)</Text>

        {/* Joint type */}
        <Text style={styles.pickerLabel}>Joint Type</Text>
        <View style={styles.jointRow}>
          {(Object.keys(JOINT_LABELS) as JointType[]).map(jt => (
            <TouchableOpacity key={jt} style={[styles.jointBtn, jointType === jt && styles.jointBtnActive]} onPress={() => setJointType(jt)}>
              <Text style={[styles.jointBtnText, jointType === jt && styles.jointBtnTextActive]}>{JOINT_LABELS[jt]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Material / electrode */}
        <ChipPicker label="Base Material" values={Object.keys(MATERIALS)} selected={material} onSelect={(v: string) => setMaterial(v)} />
        <ChipPicker label="Electrode / Filler" values={Object.keys(ELECTRODES)} selected={electrode} onSelect={(v: string) => setElectrode(v)} />
        <ChipPicker label="Weld Length (mm)" values={LEN_OPTS} selected={weldLen} onSelect={(v: number) => setWeldLen(v)} />

        {/* Joint-specific inputs */}
        {jointType === 'fillet' && (
          <>
            <ChipPicker label="Leg Size (mm)" values={LEG_OPTS} selected={legSize} onSelect={(v: number) => setLegSize(v)} />
            <View style={styles.pickerGroup}>
              <Text style={styles.pickerLabel}>Load Direction</Text>
              <View style={styles.chipRow}>
                {(['transverse', 'longitudinal'] as LoadDir[]).map(d => (
                  <TouchableOpacity key={d} style={[styles.chip, loadDir === d && styles.chipActive]} onPress={() => setLoadDir(d)}>
                    <Text style={[styles.chipText, loadDir === d && styles.chipTextActive]}>
                      {d === 'transverse' ? '⊥ Transverse' : '∥ Longitudinal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
        {jointType === 'full-butt' && (
          <ChipPicker label="Plate Thickness (mm)" values={THICK_OPTS} selected={thickness} onSelect={(v: number) => setThickness(v)} />
        )}
        {jointType === 'partial-butt' && (
          <ChipPicker label="Effective Throat (mm)" values={LEG_OPTS} selected={throat} onSelect={(v: number) => setThroat(v)} />
        )}

        <ChipPicker label="Safety Factor" values={SF_OPTS} selected={sf} onSelect={(v: number) => setSf(v)} format={v => `×${v}`} />

        {/* Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Results</Text>
          <View style={styles.resultRow}>
            <ResultBox label="Nominal Capacity" value={`${nomKN.toFixed(1)} kN`} />
            <ResultBox label={`Design Cap. (×${sf})`} value={`${desKN.toFixed(1)} kN`} />
          </View>
          {jointType === 'full-butt' && shearKN > 0 && (
            <ResultBox label="Design Shear Capacity" value={`${shearKN.toFixed(1)} kN`} />
          )}
          {extraInfo ? (
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>{extraInfo}</Text>
            </View>
          ) : null}
        </View>

        {/* Fillet weld reference */}
        {jointType === 'fillet' && (
          <View style={styles.refCard}>
            <Text style={styles.refTitle}>Min Fillet Size Guide (AS/NZS 1554)</Text>
            <View style={styles.tableHeader}>
              {['Plate t (mm)', 'Min (mm)', 'Typical (mm)'].map(h => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {FILLET_GUIDE.map(([pt, mn, typ]) => (
              <View key={pt} style={styles.tableRow}>
                <Text style={styles.tableCell}>{pt}</Text>
                <Text style={styles.tableCell}>{mn}</Text>
                <Text style={styles.tableCell}>{typ}</Text>
              </View>
            ))}
          </View>
        )}

        <InfoBox title="About this calculator">
          <Text style={styles.infoText}>
            {'Fillet weld (AWS D1.1):\n'}
            {'Throat = 0.707 × leg. Shear on throat = 0.3 × electrode tensile.\n'}
            {'Transverse fillets are ~50% stronger than longitudinal.\n\n'}
            {'Full penetration butt weld: strength = base metal (with correct prep + preheat)\n\n'}
            {'Partial penetration: calculated on effective throat (treat as shear). Not for primary tension.\n\n'}
            {'Safety factors:\n'}
            {'• 1.5: Non-structural, low consequence\n'}
            {'• 2.0: General structural (AWS ASD approach)\n'}
            {'• 2.5–3.0: Dynamic / lifting / pressure\n\n'}
            {'Standards: AS/NZS 1554 · AWS D1.1 · AS/NZS 3992'}
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
  subtitle: { color: Colors.textMuted, fontSize: 13, marginBottom: Spacing.md },
  pickerGroup: { marginBottom: Spacing.md },
  pickerLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xs },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  chipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  jointRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' },
  jointBtn: { flex: 1, minWidth: 100, padding: Spacing.sm, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  jointBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  jointBtnText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  jointBtnTextActive: { color: Colors.primary },
  section: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  resultRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoNote: { backgroundColor: Colors.cardBg, borderRadius: Radius.sm, padding: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.primary, marginTop: Spacing.xs },
  infoNoteText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  refCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  refTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.xs, marginBottom: Spacing.xs },
  tableHeaderCell: { flex: 1, color: Colors.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 4 },
  tableCell: { flex: 1, color: Colors.text, fontSize: 12 },
  infoText: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
});
