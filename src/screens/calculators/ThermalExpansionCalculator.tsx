/**
 * ThermalExpansionCalculator.tsx
 * Linear thermal expansion for common engineering materials.
 * Single part calculator, interference fit checker, and material reference table.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { colors, typography, spacing, commonStyles } from '../../styles/theme';

type Mode = 'single' | 'fit' | 'reference';

// Coefficient of linear expansion μm/m·°C
const MATERIALS: Record<string, number> = {
  'Mild Steel (1020)': 11.7,
  'Stainless 304': 17.2,
  'Stainless 316': 16.0,
  'Alloy Steel (4140)': 12.3,
  'Cast Iron': 10.8,
  'Aluminium 6061': 23.6,
  'Aluminium 7075': 23.4,
  'Copper': 17.0,
  'Brass (70/30)': 19.9,
  'Bronze (tin)': 18.0,
  'Titanium (Gr 2)': 8.6,
  'HDPE': 120.0,
  'Nylon PA66': 80.0,
  'PTFE (Teflon)': 112.0,
  'Polycarbonate': 65.0,
  'Acetal (Delrin)': 85.0,
  'Invar (FeNi36)': 1.2,
  'Tungsten Carbide': 5.5,
  'Concrete': 12.0,
};

const MAT_NAMES = Object.keys(MATERIALS);

function calcExpansion(alpha: number, L: number, dT: number) {
  // Returns ΔL in mm
  return (alpha * L * dT) / 1e6;
}

export default function ThermalExpansionCalculator() {
  const [mode, setMode] = useState<Mode>('single');

  // Single part
  const [matIdx, setMatIdx] = useState(0);
  const [L0, setL0] = useState('100');
  const [Tref, setTref] = useState('20');
  const [Top, setTop] = useState('80');

  // Interference fit
  const [shaftMatIdx, setShaftMatIdx] = useState(0);
  const [hubMatIdx, setHubMatIdx] = useState(5); // Al 6061
  const [shaftD, setShaftD] = useState('50');
  const [hubD, setHubD] = useState('49.96');
  const [TrefFit, setTrefFit] = useState('20');
  const [TopFit, setTopFit] = useState('80');

  // Reference filter
  const [refFilter, setRefFilter] = useState<'All' | 'Metals' | 'Plastics' | 'Special'>('All');

  // ── Single calc ───────────────────────────────────────────────────────
  const alpha = MATERIALS[MAT_NAMES[matIdx]];
  const L0num = parseFloat(L0) || 0;
  const TrefNum = parseFloat(Tref) || 0;
  const TopNum = parseFloat(Top) || 0;
  const dT = TopNum - TrefNum;
  const dLmm = calcExpansion(alpha, L0num, dT);
  const dLum = dLmm * 1000;
  const Lfinal = L0num + dLmm;

  // ── Fit calc ─────────────────────────────────────────────────────────
  const shaftAlpha = MATERIALS[MAT_NAMES[shaftMatIdx]];
  const hubAlpha = MATERIALS[MAT_NAMES[hubMatIdx]];
  const shaftDnum = parseFloat(shaftD) || 0;
  const hubDnum = parseFloat(hubD) || 0;
  const dTfit = (parseFloat(TopFit) || 0) - (parseFloat(TrefFit) || 0);
  const shaftAtOp = shaftDnum + calcExpansion(shaftAlpha, shaftDnum, dTfit);
  const hubAtOp = hubDnum + calcExpansion(hubAlpha, hubDnum, dTfit);
  const intfAsm = (shaftDnum - hubDnum) * 1000; // μm
  const intfOp = (shaftAtOp - hubAtOp) * 1000;  // μm

  // ── Reference filter ─────────────────────────────────────────────────
  const filterMats = () => {
    if (refFilter === 'Metals') return MAT_NAMES.filter(m => MATERIALS[m] <= 25 && !['HDPE','Nylon PA66','PTFE (Teflon)','Polycarbonate','Acetal (Delrin)'].includes(m));
    if (refFilter === 'Plastics') return ['HDPE','Nylon PA66','PTFE (Teflon)','Polycarbonate','Acetal (Delrin)'];
    if (refFilter === 'Special') return ['Invar (FeNi36)','Tungsten Carbide','Titanium (Gr 2)','Cast Iron'];
    return MAT_NAMES;
  };

  const filteredMats = filterMats();

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={commonStyles.title}>🌡️ Thermal Expansion</Text>
      <Text style={commonStyles.subtitle}>Linear expansion for engineering materials</Text>

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {(['single', 'fit', 'reference'] as Mode[]).map((m) => (
          <TouchableOpacity key={m} style={[styles.modeBtn, mode === m && styles.modeBtnActive]} onPress={() => setMode(m)}>
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'single' ? '📐 Single' : m === 'fit' ? '🔩 Fit Check' : '📋 Ref'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'single' && (
        <View>
          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>Single Part Expansion</Text>

            <Text style={commonStyles.label}>Material</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              {MAT_NAMES.map((name, i) => (
                <TouchableOpacity key={i} style={[styles.chipBtn, matIdx === i && styles.chipBtnActive]} onPress={() => setMatIdx(i)}>
                  <Text style={[styles.chipText, matIdx === i && styles.chipTextActive]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={commonStyles.label}>Length / Diameter (mm)</Text>
                <TextInput style={commonStyles.input} keyboardType="numeric" value={L0} onChangeText={setL0} placeholderTextColor={colors.textMuted} placeholder="100" />
              </View>
              <View style={styles.halfInput}>
                <Text style={commonStyles.label}>α (μm/m·°C)</Text>
                <View style={[commonStyles.input, styles.readOnly]}>
                  <Text style={{ color: colors.accent }}>{alpha}</Text>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={commonStyles.label}>Reference Temp (°C)</Text>
                <TextInput style={commonStyles.input} keyboardType="numeric" value={Tref} onChangeText={setTref} placeholderTextColor={colors.textMuted} />
              </View>
              <View style={styles.halfInput}>
                <Text style={commonStyles.label}>Operating Temp (°C)</Text>
                <TextInput style={commonStyles.input} keyboardType="numeric" value={Top} onChangeText={setTop} placeholderTextColor={colors.textMuted} />
              </View>
            </View>
          </View>

          {L0num > 0 && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.cardTitle}>Results</Text>
              <View style={styles.resultGrid}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>ΔT</Text>
                  <Text style={styles.resultValue}>{dT > 0 ? '+' : ''}{dT.toFixed(1)} °C</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>ΔL (μm)</Text>
                  <Text style={[styles.resultValue, { color: dT > 0 ? colors.accent : colors.error }]}>
                    {dLum > 0 ? '+' : ''}{Math.abs(dLum).toFixed(2)} μm
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>ΔL (mm)</Text>
                  <Text style={[styles.resultValue, { color: dT > 0 ? colors.accent : colors.error }]}>
                    {dLmm >= 0 ? '+' : ''}{dLmm.toFixed(4)} mm
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Final dim</Text>
                  <Text style={styles.resultValue}>{Lfinal.toFixed(4)} mm</Text>
                </View>
              </View>

              <View style={commonStyles.formulaBox}>
                <Text style={commonStyles.formulaText}>
                  ΔL = α × L × ΔT = {alpha} × {L0num} × {dT} / 1,000,000{'\n'}
                  = {dLmm >= 0 ? '+' : ''}{dLmm.toFixed(4)} mm
                </Text>
              </View>

              {Math.abs(dLum) > 50 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>⚠️ Large {dT > 0 ? 'expansion' : 'contraction'} of {Math.abs(dLum).toFixed(0)} μm. Consider thermal compensation in design.</Text>
                </View>
              )}
              {Math.abs(dLum) > 10 && Math.abs(dLum) <= 50 && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>ℹ️ {Math.abs(dLum).toFixed(1)} μm change — relevant for close-tolerance fits (H7/p6 etc.)</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {mode === 'fit' && (
        <View>
          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>Interference Fit — Thermal Analysis</Text>
            <Text style={styles.helpText}>Check if a press fit loosens or tightens at operating temperature. Typical problem: steel shaft in aluminium housing.</Text>

            <Text style={[commonStyles.label, { color: colors.accent }]}>Shaft Material</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
              {MAT_NAMES.filter(m => !['HDPE','Nylon PA66','PTFE (Teflon)','Polycarbonate','Acetal (Delrin)'].includes(m)).map((name) => {
                const i = MAT_NAMES.indexOf(name);
                return (
                  <TouchableOpacity key={i} style={[styles.chipBtn, shaftMatIdx === i && styles.chipBtnActive]} onPress={() => setShaftMatIdx(i)}>
                    <Text style={[styles.chipText, shaftMatIdx === i && styles.chipTextActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput style={commonStyles.input} keyboardType="numeric" value={shaftD} onChangeText={setShaftD}
              placeholder="Shaft diameter (mm)" placeholderTextColor={colors.textMuted} />

            <Text style={[commonStyles.label, { color: colors.highlight, marginTop: spacing.md }]}>Housing / Hub Material</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
              {MAT_NAMES.filter(m => !['HDPE','Nylon PA66','PTFE (Teflon)','Polycarbonate','Acetal (Delrin)'].includes(m)).map((name) => {
                const i = MAT_NAMES.indexOf(name);
                return (
                  <TouchableOpacity key={i} style={[styles.chipBtn, hubMatIdx === i && styles.chipBtnActive]} onPress={() => setHubMatIdx(i)}>
                    <Text style={[styles.chipText, hubMatIdx === i && styles.chipTextActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput style={commonStyles.input} keyboardType="numeric" value={hubD} onChangeText={setHubD}
              placeholder="Housing bore (mm) — should be < shaft for press fit" placeholderTextColor={colors.textMuted} />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={commonStyles.label}>Assembly Temp (°C)</Text>
                <TextInput style={commonStyles.input} keyboardType="numeric" value={TrefFit} onChangeText={setTrefFit} placeholderTextColor={colors.textMuted} />
              </View>
              <View style={styles.halfInput}>
                <Text style={commonStyles.label}>Operating Temp (°C)</Text>
                <TextInput style={commonStyles.input} keyboardType="numeric" value={TopFit} onChangeText={setTopFit} placeholderTextColor={colors.textMuted} />
              </View>
            </View>
          </View>

          {shaftDnum > 0 && hubDnum > 0 && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.cardTitle}>Results</Text>
              <View style={styles.resultGrid}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Assembly interference</Text>
                  <Text style={[styles.resultValue, { color: intfAsm > 0 ? colors.accent : colors.error }]}>
                    {intfAsm.toFixed(1)} μm
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Operating interference</Text>
                  <Text style={[styles.resultValue, { color: intfOp > 0 ? colors.accent : colors.error }]}>
                    {intfOp.toFixed(1)} μm
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>ΔT change</Text>
                  <Text style={styles.resultValue}>{(intfOp - intfAsm) >= 0 ? '+' : ''}{(intfOp - intfAsm).toFixed(1)} μm</Text>
                </View>
              </View>

              {intfOp < 0 ? (
                <View style={[styles.warningBox, { backgroundColor: `${colors.error}22` }]}>
                  <Text style={[styles.warningText, { color: colors.error }]}>
                    🚨 FIT BECOMES CLEARANCE at operating temp! Will loosen by {Math.abs(intfOp).toFixed(1)} μm. Redesign required.
                  </Text>
                </View>
              ) : intfAsm > 0 && intfOp < intfAsm * 0.5 ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>⚠️ Interference reduces by {((intfAsm - intfOp) / intfAsm * 100).toFixed(0)}% at operating temp. Check if adequate for torque transmission.</Text>
                </View>
              ) : (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>✅ Fit remains interference at operating temp. {intfOp.toFixed(1)} μm interference.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {mode === 'reference' && (
        <View>
          <View style={styles.modeRow}>
            {(['All', 'Metals', 'Plastics', 'Special'] as const).map((f) => (
              <TouchableOpacity key={f} style={[styles.modeBtn, refFilter === f && styles.modeBtnActive]} onPress={() => setRefFilter(f)}>
                <Text style={[styles.modeBtnText, refFilter === f && styles.modeBtnTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>Thermal Expansion Reference</Text>
            <Text style={styles.tableCaption}>Material | α (μm/m·°C) | ΔL per 100mm at ΔT=60°C</Text>
            {filteredMats.sort((a, b) => MATERIALS[a] - MATERIALS[b]).map((mat) => {
              const alpha2 = MATERIALS[mat];
              const dL60 = (alpha2 * 100 * 60 / 1e6 * 1000).toFixed(2);
              const level = alpha2 > 50 ? 'HIGH' : alpha2 > 20 ? 'Med' : alpha2 > 12 ? 'Med' : 'Low';
              const levelColor = alpha2 > 50 ? colors.error : alpha2 > 20 ? colors.warning : alpha2 > 12 ? colors.accent : colors.textMuted;
              return (
                <View key={mat} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2.5 }]}>{mat}</Text>
                  <Text style={[styles.tableCell, { color: colors.accent, flex: 1 }]}>{alpha2}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>{dL60} μm</Text>
                  <Text style={[styles.tableCell, { color: levelColor, flex: 0.8 }]}>{level}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {'💡 Rules of thumb:\n'}
              {'• Plastics expand 5–10× more than metals\n'}
              {'• Al expands ~2× faster than steel\n'}
              {'• Invar has near-zero expansion\n'}
              {'• Per 10°C: steel grows ~0.12mm/m, Al ~0.24mm/m'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.xs },
  modeBtn: { flex: 1, padding: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  modeBtnTextActive: { color: colors.background },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfInput: { flex: 1 },
  chipBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs },
  chipBtnActive: { backgroundColor: `${colors.accent}22`, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextActive: { color: colors.accent },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  resultItem: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderRadius: 8, padding: spacing.sm, alignItems: 'center' },
  resultLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 2 },
  resultValue: { color: colors.text, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  helpText: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.md, lineHeight: 18 },
  warningBox: { backgroundColor: `${colors.warning}22`, borderRadius: 8, padding: spacing.sm, marginTop: spacing.sm },
  warningText: { color: colors.warning, fontSize: 12 },
  infoBox: { backgroundColor: `${colors.accent}11`, borderRadius: 8, padding: spacing.sm, marginTop: spacing.sm },
  infoText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  successBox: { backgroundColor: `${colors.success ?? '#22c55e'}22`, borderRadius: 8, padding: spacing.sm, marginTop: spacing.sm },
  successText: { color: colors.success ?? '#22c55e', fontSize: 12 },
  readOnly: { justifyContent: 'center' },
  tableCaption: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.xs },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tableCell: { color: colors.text, fontSize: 12, flex: 1 },
});
