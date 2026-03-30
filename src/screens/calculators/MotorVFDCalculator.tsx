/**
 * Motor & VFD Calculator
 * WFD-246: FLA, VFD RPM, Sync Speed, Motor Slip, HP↔kW
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import {
  calcFullLoadAmps, calcVFDFreqToRPM, calcHPtoKW, calcKWtoHP,
} from '../../lib/calculations';

type Mode = 'fla' | 'vfd-rpm' | 'sync-speed' | 'slip' | 'hp-kw';

const MODES: { id: Mode; label: string }[] = [
  { id: 'fla',        label: 'Full Load Amps' },
  { id: 'vfd-rpm',    label: 'VFD → RPM' },
  { id: 'sync-speed', label: 'Sync Speed' },
  { id: 'slip',       label: 'Motor Slip' },
  { id: 'hp-kw',      label: 'HP ↔ kW' },
];

const POLE_COUNTS = [2, 4, 6, 8, 12];
const SYNC_SPEEDS_50HZ: Record<number, number> = { 2: 3000, 4: 1500, 6: 1000, 8: 750, 12: 500 };
const SYNC_SPEEDS_60HZ: Record<number, number> = { 2: 3600, 4: 1800, 6: 1200, 8: 900, 12: 600 };

export default function MotorVFDCalculator() {
  const [mode, setMode] = useState<Mode>('fla');

  // FLA inputs
  const [power, setPower] = useState('');
  const [powerUnit, setPowerUnit] = useState<'kw' | 'hp'>('kw');
  const [voltage, setVoltage] = useState('415');
  const [pf, setPf] = useState('0.85');
  const [eff, setEff] = useState('0.92');
  const [phases, setPhases] = useState<'single' | '3phase'>('3phase');

  // VFD RPM inputs
  const [freq, setFreq] = useState('50');
  const [poles, setPoles] = useState('4');
  const [slip, setSlip] = useState('3');

  // Motor slip inputs
  const [syncRpm, setSyncRpm] = useState('1500');
  const [actualRpm, setActualRpm] = useState('1450');

  // HP ↔ kW
  const [hpInput, setHpInput] = useState('');
  const [kwInput, setKwInput] = useState('');

  const renderFLA = () => {
    const pw = parseFloat(power);
    const vt = parseFloat(voltage);
    const pfv = parseFloat(pf);
    const effv = parseFloat(eff);
    const kw = powerUnit === 'hp' ? calcHPtoKW(pw) : pw;
    const valid = pw > 0 && vt > 0 && pfv > 0 && effv > 0;
    const fla = valid ? calcFullLoadAmps(kw, vt, pfv, effv, phases) : null;

    return (
      <View>
        <Text style={styles.sectionTitle}>Power</Text>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]}
            keyboardType="numeric" value={power} onChangeText={setPower}
            placeholder="e.g. 5.5" placeholderTextColor={Colors.textMuted} />
          {(['kw', 'hp'] as const).map(u => (
            <TouchableOpacity key={u} style={[styles.toggle, powerUnit === u && styles.toggleActive]}
              onPress={() => setPowerUnit(u)}>
              <Text style={[styles.toggleText, powerUnit === u && styles.toggleTextActive]}>{u.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Phase</Text>
        <View style={styles.row}>
          {(['single', '3phase'] as const).map(p => (
            <TouchableOpacity key={p} style={[styles.toggle, phases === p && styles.toggleActive]}
              onPress={() => setPhases(p)}>
              <Text style={[styles.toggleText, phases === p && styles.toggleTextActive]}>
                {p === 'single' ? '1-Phase' : '3-Phase'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Voltage (V)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={voltage}
          onChangeText={setVoltage} placeholder="415" placeholderTextColor={Colors.textMuted} />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Power Factor</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={pf}
              onChangeText={setPf} placeholder="0.85" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Efficiency</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={eff}
              onChangeText={setEff} placeholder="0.92" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>

        {fla !== null && (
          <View style={styles.results}>
            <ResultBox label="Full Load Amps" value={fla.toFixed(2)} unit="A" large />
            {powerUnit === 'hp' && (
              <ResultBox label="Power (kW equivalent)" value={kw.toFixed(2)} unit="kW" variant="info" />
            )}
            <Text style={styles.hint}>⚠️ Add 25% for motor starting surge. Verify with motor nameplate.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderVFDRPM = () => {
    const fv = parseFloat(freq);
    const pv = parseFloat(poles);
    const sv = parseFloat(slip);
    const valid = fv > 0 && pv > 0 && sv >= 0;
    const rpm = valid ? calcVFDFreqToRPM(fv, pv, sv) : null;
    const syncRpmCalc = valid ? (120 * fv) / pv : null;
    const freqSteps = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60];

    return (
      <View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Frequency (Hz)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={freq}
              onChangeText={setFreq} placeholder="50" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Motor Poles</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={poles}
              onChangeText={setPoles} placeholder="4" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>
        <Text style={styles.label}>Slip % (typical 2–5%)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={slip}
          onChangeText={setSlip} placeholder="3" placeholderTextColor={Colors.textMuted} />

        {rpm !== null && syncRpmCalc !== null && (
          <View style={styles.results}>
            <ResultBox label="Actual RPM (with slip)" value={Math.round(rpm)} unit="RPM" large />
            <ResultBox label="Synchronous RPM" value={Math.round(syncRpmCalc)} unit="RPM" variant="info" />
          </View>
        )}

        <Text style={styles.sectionTitle}>RPM Table ({poles || '4'}-pole, {slip || '3'}% slip)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Hz</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Sync RPM</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>~Actual</Text>
          </View>
          {freqSteps.map(hz => {
            const p = parseFloat(poles) || 4;
            const s = parseFloat(slip) || 3;
            const syncR = (120 * hz) / p;
            const actR = syncR * (1 - s / 100);
            const highlight = hz === (parseFloat(freq) || 0);
            return (
              <View key={hz} style={[styles.tableRow, highlight && styles.tableRowHighlight]}>
                <Text style={[styles.tableCell, highlight && styles.tableCellHighlight]}>{hz}</Text>
                <Text style={[styles.tableCell, highlight && styles.tableCellHighlight]}>{Math.round(syncR)}</Text>
                <Text style={[styles.tableCell, highlight && styles.tableCellHighlight]}>{Math.round(actR)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSyncSpeed = () => (
    <View>
      <Text style={styles.hint}>Standard synchronous speeds — no slip applied</Text>
      {[50, 60].map(hz => (
        <View key={hz} style={{ marginBottom: Spacing.md }}>
          <Text style={styles.sectionTitle}>{hz} Hz Supply</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Poles</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Sync RPM</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>~Actual (3%)</Text>
            </View>
            {POLE_COUNTS.map(p => {
              const speeds = hz === 50 ? SYNC_SPEEDS_50HZ : SYNC_SPEEDS_60HZ;
              const s = speeds[p];
              return (
                <View key={p} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{p}</Text>
                  <Text style={[styles.tableCell, { color: Colors.primary }]}>{s}</Text>
                  <Text style={styles.tableCell}>{Math.round(s * 0.97)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );

  const renderSlip = () => {
    const sync = parseFloat(syncRpm);
    const actual = parseFloat(actualRpm);
    const valid = sync > 0 && actual > 0 && actual <= sync;
    const slipPct = valid ? ((sync - actual) / sync) * 100 : null;
    const slipVariant = slipPct === null ? 'default' :
      slipPct < 2 ? 'pass' : slipPct < 5 ? 'warn' : 'fail';

    return (
      <View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Synchronous RPM</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={syncRpm}
              onChangeText={setSyncRpm} placeholder="1500" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Actual RPM (nameplate)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={actualRpm}
              onChangeText={setActualRpm} placeholder="1450" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>
        {slipPct !== null && (
          <View style={styles.results}>
            <ResultBox label="Motor Slip" value={slipPct.toFixed(2)} unit="%" variant={slipVariant} large />
            <ResultBox label="RPM difference" value={Math.round(sync - actual)} unit="RPM" variant="info" />
            <Text style={styles.hint}>
              {slipPct < 2 ? '✅ Normal range (1–3%)' :
               slipPct < 5 ? '⚠️ Moderate slip — check load / bearings' :
               '🔴 High slip — motor may be overloaded or failing'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHPKW = () => {
    const hp = parseFloat(hpInput);
    const kw = parseFloat(kwInput);
    const fromHP = !isNaN(hp) && hp > 0 ? calcHPtoKW(hp) : null;
    const fromKW = !isNaN(kw) && kw > 0 ? calcKWtoHP(kw) : null;
    const commonSizes = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 50, 75, 100];

    return (
      <View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Horsepower (HP)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={hpInput}
              onChangeText={v => { setHpInput(v); setKwInput(''); }}
              placeholder="e.g. 5" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Kilowatts (kW)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={kwInput}
              onChangeText={v => { setKwInput(v); setHpInput(''); }}
              placeholder="e.g. 3.7" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>
        {fromHP !== null && <ResultBox label={`${hpInput} HP =`} value={fromHP.toFixed(3)} unit="kW" large />}
        {fromKW !== null && <ResultBox label={`${kwInput} kW =`} value={fromKW.toFixed(3)} unit="HP" large />}

        <Text style={styles.sectionTitle}>Common Motor Sizes</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>HP</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>kW</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>FLA @ 415V 3Ø*</Text>
          </View>
          {commonSizes.map(size => {
            const kwVal = calcHPtoKW(size);
            const fla = calcFullLoadAmps(kwVal, 415, 0.85, 0.92, '3phase');
            return (
              <View key={size} style={styles.tableRow}>
                <Text style={styles.tableCell}>{size}</Text>
                <Text style={[styles.tableCell, { color: Colors.primary }]}>{kwVal.toFixed(2)}</Text>
                <Text style={styles.tableCell}>{fla.toFixed(1)} A</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.hint}>* FLA estimates at PF=0.85, η=0.92. Always verify with nameplate.</Text>
      </View>
    );
  };

  const renderContent = () => {
    switch (mode) {
      case 'fla':        return renderFLA();
      case 'vfd-rpm':    return renderVFDRPM();
      case 'sync-speed': return renderSyncSpeed();
      case 'slip':       return renderSlip();
      case 'hp-kw':      return renderHPKW();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🔁 Motor & VFD</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {MODES.map(m => (
            <TouchableOpacity key={m.id} style={[styles.tab, mode === m.id && styles.tabActive]}
              onPress={() => setMode(m.id)}>
              <Text style={[styles.tabText, mode === m.id && styles.tabTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.card}>{renderContent()}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.md },
  tabs: { marginBottom: Spacing.md },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.pill, marginRight: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
    minHeight: 44,
  },
  tabActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  tabText: { ...Typography.caption, fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm },
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
    marginRight: 6, minHeight: 44, justifyContent: 'center',
  },
  toggleActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  toggleText: { color: Colors.textSecondary, fontSize: 14 },
  toggleTextActive: { color: Colors.primary, fontWeight: '600' },
  results: { marginTop: Spacing.md },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm, fontStyle: 'italic' },
  table: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.sm },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 8 },
  tableHeader: { backgroundColor: Colors.bgMuted },
  tableRowHighlight: { backgroundColor: Colors.primaryDim },
  tableCell: { flex: 1, textAlign: 'center', color: Colors.textPrimary, fontSize: 13 },
  tableHeaderText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tableCellHighlight: { color: Colors.primary, fontWeight: '700' },
});
