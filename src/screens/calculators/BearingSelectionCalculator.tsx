/**
 * BearingSelectionCalculator.tsx
 * Bearing type selector, number decoder, and load capacity reference.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { colors, typography, spacing, commonStyles } from '../../styles/theme';

type Mode = 'selector' | 'decoder' | 'reference';

const BEARING_INFO: Record<string, {
  strengths: string; limits: string; typical: string; series: string; note: string;
}> = {
  'Deep Groove Ball': {
    strengths: 'Low friction, high speed, handles light axial, available sealed or shielded',
    limits: 'Limited radial capacity vs rollers; max ~30% dynamic rating as axial',
    typical: 'Motors, pumps, fans, gearboxes, appliances',
    series: '6000 (extra light), 6200 (light), 6300 (medium), 6400 (heavy)',
    note: 'Most common bearing globally. Default choice for general applications.',
  },
  'Angular Contact Ball': {
    strengths: 'Handles combined loads; can be paired for bidirectional axial; high speed',
    limits: 'Must be used in pairs for bidirectional axial; pre-load sensitive',
    typical: 'Machine tool spindles, pumps, ball screws',
    series: '7000 series (15°, 25°, 40° contact angle options)',
    note: 'Higher contact angle = more axial capacity but lower speed rating.',
  },
  'Cylindrical Roller': {
    strengths: 'High radial load capacity; handles shock; good medium-high speed',
    limits: 'Limited axial capacity; requires good alignment',
    typical: 'Electric motors, gearboxes, heavy machines',
    series: 'N, NU, NJ, NUP, NH series',
    note: 'Line contact gives 3–5× more radial capacity than equivalent ball bearing.',
  },
  'Tapered Roller': {
    strengths: 'Excellent combined load capacity; adjustable preload; robust',
    limits: 'Generates thrust; must be used in pairs; lower speed than balls',
    typical: 'Wheel hubs, axles, gearboxes, bevel gear drives',
    series: '30000 series',
    note: 'Common in automotive and heavy machinery.',
  },
  'Spherical Roller': {
    strengths: 'Self-aligning (±2–3°); high load capacity; handles shaft deflection',
    limits: 'Larger and heavier; moderate speed; more expensive',
    typical: 'Paper mills, mining, conveyor drives, fans with flexible shafts',
    series: '22000 series (C, CC, E variants)',
    note: 'Go-to when alignment is poor or shaft deflection is expected.',
  },
  'Self-Aligning Ball': {
    strengths: 'Handles misalignment up to ±3°; lighter duty than spherical roller',
    limits: 'Moderate load capacity; lower speed than deep groove',
    typical: 'Agricultural equipment, fans, light conveyor drives',
    series: '1200, 2200 series',
    note: 'Use when misalignment expected but loads are moderate.',
  },
};

const SUFFIX_DECODE: Record<string, string> = {
  '2RS': 'Both sides rubber sealed',
  'RS': 'One side rubber sealed',
  '2Z': 'Both sides metal shielded',
  'ZZ': 'Both sides metal shielded',
  'C3': 'Radial clearance group C3 (greater than normal)',
  'C4': 'Radial clearance group C4 (greater than C3)',
  'P6': 'Tolerance class P6 (ABEC 3)',
  'P5': 'Tolerance class P5 (ABEC 5)',
  'M': 'Brass machined cage',
  'E': 'Enhanced internal design',
  'NR': 'Snap ring groove on outer ring',
};

function decodeBearing(raw: string): {fields: Record<string,string>; error?: string} {
  const n = raw.toUpperCase().replace(/[-/ ]/g, '');

  // Detect prefix
  let prefix = '';
  const prefixes = ['NUP', 'NUJ', 'NU', 'NJ', 'HK', 'RNA', 'NA', 'NK'];
  let remaining = n;
  for (const p of prefixes) {
    if (n.startsWith(p)) {
      prefix = p;
      remaining = n.slice(p.length);
      break;
    }
  }

  if (remaining.length < 4) return { fields: {}, error: 'Number too short — expected 4+ digits (e.g. 6205)' };
  const digits = remaining.match(/^(\d{4})/);
  if (!digits) return { fields: {}, error: 'Could not parse bearing number' };

  const d = digits[1];
  const seriesDigit = d[0];
  const widthDigit = d[1];
  const boreCode = parseInt(d.slice(2), 10);
  const suffix = remaining.slice(4);

  const typeMap: Record<string, string> = {
    '6': 'Deep Groove Ball',
    '7': 'Angular Contact Ball',
    '3': 'Tapered Roller',
    '5': 'Thrust Ball',
  };
  let btype = prefix ? 'Cylindrical Roller' : (typeMap[seriesDigit] ?? 'Unknown');
  if (seriesDigit === '2') {
    btype = widthDigit <= '2' ? 'Self-Aligning Ball' : 'Spherical Roller';
  }

  const widthMap: Record<string, string> = { '0': 'Extra Light', '1': 'Extra Light', '2': 'Light', '3': 'Medium', '4': 'Heavy' };
  const widthStr = widthMap[widthDigit] ?? '?';

  let bore = 0;
  if (boreCode >= 4) bore = boreCode * 5;
  else if (boreCode === 0) bore = 10;
  else if (boreCode === 1) bore = 12;
  else if (boreCode === 2) bore = 15;
  else if (boreCode === 3) bore = 17;

  const decodedSuffixes: string[] = [];
  for (const [code, desc] of Object.entries(SUFFIX_DECODE)) {
    if (suffix.includes(code)) decodedSuffixes.push(`${code}: ${desc}`);
  }

  return {
    fields: {
      'Bearing Type': `${prefix ? prefix + ' ' : ''}${btype}`,
      'Dimension Series': `${widthStr} (${d.slice(0, 2)})`,
      'Bore Diameter': `${bore} mm`,
      ...(suffix ? { Suffixes: decodedSuffixes.length ? decodedSuffixes.join('\n') : `${suffix} — refer to catalogue` } : {}),
    },
  };
}

export default function BearingSelectionCalculator() {
  const [mode, setMode] = useState<Mode>('selector');

  // Selector state
  const [loadType, setLoadType] = useState(0);
  const [speed, setSpeed] = useState('1450');
  const [environment, setEnvironment] = useState(0);
  const [alignment, setAlignment] = useState(0);

  // Decoder state
  const [bearNum, setBearNum] = useState('');
  const [decoded, setDecoded] = useState<{fields: Record<string,string>; error?: string} | null>(null);

  const loadOptions = [
    'Radial only', 'Axial only', 'Combined radial + axial', 'High radial, light axial', 'Light radial, high axial',
  ];
  const envOptions = [
    'Clean — indoor', 'Light contamination', 'Moderate — outdoor', 'Heavy — mining/ag', 'Wet / washdown', 'High temp (>80°C)',
  ];
  const alignOptions = ['Good (±0.01°)', 'Moderate (±0.05°)', 'Poor (±0.5°)', 'Unknown'];

  const getRecommendations = () => {
    const scores: Record<string, number> = {
      'Deep Groove Ball': 0, 'Angular Contact Ball': 0, 'Cylindrical Roller': 0,
      'Tapered Roller': 0, 'Spherical Roller': 0, 'Self-Aligning Ball': 0,
    };
    const lt = loadOptions[loadType];
    const rpm = parseFloat(speed) || 0;

    if (lt === 'Radial only') { scores['Deep Groove Ball'] += 3; scores['Cylindrical Roller'] += 3; }
    else if (lt === 'Axial only') { scores['Angular Contact Ball'] += 4; }
    else if (lt === 'Combined radial + axial') { scores['Angular Contact Ball'] += 3; scores['Tapered Roller'] += 3; scores['Spherical Roller'] += 2; }
    else if (lt === 'High radial, light axial') { scores['Cylindrical Roller'] += 3; scores['Deep Groove Ball'] += 2; }
    else if (lt === 'Light radial, high axial') { scores['Angular Contact Ball'] += 3; }

    if (rpm > 5000) { scores['Deep Groove Ball'] += 2; scores['Angular Contact Ball'] += 1; }
    if (rpm < 500) { scores['Spherical Roller'] += 1; scores['Tapered Roller'] += 1; }

    const env = envOptions[environment];
    if (env.includes('Heavy') || env.includes('mining')) { scores['Spherical Roller'] += 2; scores['Cylindrical Roller'] += 1; }
    if (env.includes('High temp')) { scores['Cylindrical Roller'] += 1; scores['Spherical Roller'] += 1; }

    const align = alignOptions[alignment];
    if (align.includes('Poor') || align.includes('Unknown')) { scores['Spherical Roller'] += 3; scores['Self-Aligning Ball'] += 3; }

    return Object.entries(scores).filter(([,v]) => v > 0).sort(([,a],[,b]) => b-a).slice(0, 3);
  };

  const recs = mode === 'selector' ? getRecommendations() : [];

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={commonStyles.title}>🔵 Bearing Selection</Text>
      <Text style={commonStyles.subtitle}>Type selector, number decoder & reference</Text>

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {(['selector', 'decoder', 'reference'] as Mode[]).map((m) => (
          <TouchableOpacity key={m} style={[styles.modeBtn, mode === m && styles.modeBtnActive]} onPress={() => setMode(m)}>
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'selector' ? '🔵 Select' : m === 'decoder' ? '🔢 Decode' : '📋 Ref'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'selector' && (
        <View>
          {/* Inputs */}
          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>Load & Conditions</Text>
            <Text style={commonStyles.label}>Load Direction</Text>
            {loadOptions.map((opt, i) => (
              <TouchableOpacity key={i} style={[styles.optionBtn, loadType === i && styles.optionBtnActive]} onPress={() => setLoadType(i)}>
                <Text style={[styles.optionText, loadType === i && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <Text style={[commonStyles.label, { marginTop: spacing.md }]}>Operating Speed (RPM)</Text>
            <TextInput style={commonStyles.input} keyboardType="numeric" value={speed} onChangeText={setSpeed} placeholder="1450" placeholderTextColor={colors.textMuted} />
            <Text style={[commonStyles.label, { marginTop: spacing.md }]}>Environment</Text>
            {envOptions.map((opt, i) => (
              <TouchableOpacity key={i} style={[styles.optionBtn, environment === i && styles.optionBtnActive]} onPress={() => setEnvironment(i)}>
                <Text style={[styles.optionText, environment === i && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <Text style={[commonStyles.label, { marginTop: spacing.md }]}>Shaft Alignment Quality</Text>
            {alignOptions.map((opt, i) => (
              <TouchableOpacity key={i} style={[styles.optionBtn, alignment === i && styles.optionBtnActive]} onPress={() => setAlignment(i)}>
                <Text style={[styles.optionText, alignment === i && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recommendations */}
          <Text style={[commonStyles.sectionTitle, { marginTop: spacing.lg }]}>🏆 Recommendations</Text>
          {recs.map(([bearing], idx) => {
            const info = BEARING_INFO[bearing];
            const colors2 = [colors.accent, colors.highlight, colors.textMuted];
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <View key={bearing} style={[commonStyles.resultBox, { borderLeftColor: colors2[idx], borderLeftWidth: 3 }]}>
                <Text style={[styles.bearingName, { color: colors2[idx] }]}>{medals[idx]} {bearing}</Text>
                {info && (
                  <>
                    <Text style={styles.infoLabel}>✅ {info.strengths}</Text>
                    <Text style={[styles.infoLabel, { color: colors.warning }]}>⚠️ {info.limits}</Text>
                    <Text style={styles.infoLabel}>🏭 {info.typical}</Text>
                    <Text style={styles.infoLabel}>📦 {info.series}</Text>
                    <Text style={[styles.infoLabel, { color: colors.highlight, marginTop: 4 }]}>💡 {info.note}</Text>
                  </>
                )}
              </View>
            );
          })}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ Guidance only. Verify with manufacturer datasheets for safety-critical applications.</Text>
          </View>
        </View>
      )}

      {mode === 'decoder' && (
        <View>
          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>Bearing Number Decoder</Text>
            <Text style={commonStyles.label}>Enter bearing number (e.g. 6205, 7210-2RS, 22316)</Text>
            <TextInput
              style={commonStyles.input}
              value={bearNum}
              onChangeText={(t) => { setBearNum(t); setDecoded(null); }}
              placeholder="6205-2RS/C3"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={commonStyles.button} onPress={() => setDecoded(decodeBearing(bearNum))}>
              <Text style={commonStyles.buttonText}>Decode</Text>
            </TouchableOpacity>
          </View>

          {decoded && (
            <View style={commonStyles.card}>
              {decoded.error ? (
                <Text style={styles.errorText}>{decoded.error}</Text>
              ) : (
                <>
                  {Object.entries(decoded.fields).map(([k, v]) => (
                    <View key={k} style={styles.decodedRow}>
                      <Text style={styles.decodedLabel}>{k}:</Text>
                      <Text style={styles.decodedValue}>{v}</Text>
                    </View>
                  ))}
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>💡 Example: 6205-2RS/C3 = Deep Groove Ball, 25mm bore, double sealed, loose clearance</Text>
                  </View>
                </>
              )}
            </View>
          )}

          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>Common Suffixes</Text>
            {Object.entries(SUFFIX_DECODE).map(([code, desc]) => (
              <View key={code} style={styles.decodedRow}>
                <Text style={[styles.decodedLabel, { color: colors.accent }]}>{code}:</Text>
                <Text style={styles.decodedValue}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {mode === 'reference' && (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Deep Groove Ball — 6200/6300 Series</Text>
          <Text style={styles.tableCaption}>Bore | OD | Width | Dyn C | Stat C0 | Max RPM</Text>
          {[
            ['6200', '10', '30', '9', '5.1 kN', '2.36 kN', '24000'],
            ['6203', '17', '40', '12', '9.56 kN', '4.75 kN', '17000'],
            ['6205', '25', '52', '15', '14.0 kN', '7.8 kN', '12000'],
            ['6206', '30', '62', '16', '19.5 kN', '11.2 kN', '10000'],
            ['6208', '40', '80', '18', '29.0 kN', '17.8 kN', '8000'],
            ['6210', '50', '90', '20', '35.0 kN', '23.6 kN', '7000'],
            ['6305', '25', '62', '17', '22.5 kN', '11.4 kN', '10000'],
            ['6308', '40', '90', '23', '40.7 kN', '24.0 kN', '7000'],
          ].map(([no, b, od, w, c, c0, rpm]) => (
            <View key={no} style={styles.tableRow}>
              <Text style={[styles.tableCell, { color: colors.accent, flex: 1.2 }]}>{no}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{b}mm</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{od}mm</Text>
              <Text style={[styles.tableCell, { flex: 0.6 }]}>{w}mm</Text>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{c}</Text>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{c0}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{rpm}</Text>
            </View>
          ))}
          <Text style={[styles.tableCaption, { marginTop: spacing.sm }]}>Dyn C = dynamic load rating. C0 = static. Ratings are representative — verify with manufacturer.</Text>
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
  optionBtn: { padding: spacing.sm, borderRadius: 6, borderWidth: 1, borderColor: colors.border, marginBottom: 4 },
  optionBtnActive: { backgroundColor: `${colors.accent}22`, borderColor: colors.accent },
  optionText: { color: colors.textMuted, fontSize: 13 },
  optionTextActive: { color: colors.accent },
  bearingName: { fontSize: 16, fontWeight: '700', marginBottom: spacing.xs },
  infoLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  warningBox: { backgroundColor: `${colors.warning}22`, borderRadius: 8, padding: spacing.md, marginTop: spacing.md },
  warningText: { color: colors.warning, fontSize: 12 },
  decodedRow: { flexDirection: 'row', marginBottom: spacing.xs, alignItems: 'flex-start' },
  decodedLabel: { color: colors.textSecondary, fontSize: 13, width: 120, fontWeight: '600' },
  decodedValue: { color: colors.text, fontSize: 13, flex: 1 },
  errorText: { color: colors.error, fontSize: 14 },
  tableCaption: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.xs },
  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tableCell: { color: colors.text, fontSize: 11, flex: 1 },
});
