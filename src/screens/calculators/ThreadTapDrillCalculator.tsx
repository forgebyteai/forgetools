/**
 * ForgeTools — Thread & Tap Drill Calculator (WFD-280)
 * Metric coarse/fine, UNC, UNF, BSP reference with tap drill sizes.
 * Offline capable — no network required.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import { ResultBox } from '../../components/ResultBox';
import { InfoBox } from '../../components/InfoBox';

// ── Thread Data ─────────────────────────────────────────────────────────────
// {name: [major_mm, pitch_mm, tap_drill_mm]}
const METRIC_COARSE: Record<string, [number, number, number]> = {
  'M3':    [3.0,  0.50, 2.5],  'M4':    [4.0,  0.70, 3.3],
  'M5':    [5.0,  0.80, 4.2],  'M6':    [6.0,  1.00, 5.0],
  'M8':    [8.0,  1.25, 6.75], 'M10':   [10.0, 1.50, 8.5],
  'M12':   [12.0, 1.75, 10.2], 'M14':   [14.0, 2.00, 12.0],
  'M16':   [16.0, 2.00, 14.0], 'M18':   [18.0, 2.50, 15.5],
  'M20':   [20.0, 2.50, 17.5], 'M22':   [22.0, 2.50, 19.5],
  'M24':   [24.0, 3.00, 21.0], 'M27':   [27.0, 3.00, 24.0],
  'M30':   [30.0, 3.50, 26.5], 'M36':   [36.0, 4.00, 32.0],
  'M42':   [42.0, 4.50, 37.5], 'M48':   [48.0, 5.00, 43.0],
};

const METRIC_FINE: Record<string, [number, number, number]> = {
  'M6×0.75':  [6.0,  0.75, 5.25], 'M8×1.0':   [8.0,  1.00, 7.0],
  'M10×1.0':  [10.0, 1.00, 9.0],  'M10×1.25': [10.0, 1.25, 8.75],
  'M12×1.25': [12.0, 1.25, 10.75],'M12×1.5':  [12.0, 1.50, 10.5],
  'M14×1.5':  [14.0, 1.50, 12.5], 'M16×1.5':  [16.0, 1.50, 14.5],
  'M18×1.5':  [18.0, 1.50, 16.5], 'M20×1.5':  [20.0, 1.50, 18.5],
  'M20×2.0':  [20.0, 2.00, 18.0], 'M24×2.0':  [24.0, 2.00, 22.0],
};

const UNC: Record<string, [number, number, number]> = {
  '#4-40':   [2.845, 0.635, 2.1],  '#6-32':   [3.505, 0.794, 2.65],
  '#8-32':   [4.166, 0.794, 3.3],  '#10-24':  [4.826, 1.058, 3.7],
  '#10-32':  [4.826, 0.794, 3.99], '1/4"-20': [6.35,  1.270, 5.1],
  '5/16"-18':[7.938, 1.411, 6.5],  '3/8"-16': [9.525, 1.587, 7.94],
  '7/16"-14':[11.11, 1.814, 9.3],  '1/2"-13': [12.70, 1.954, 10.72],
  '5/8"-11': [15.88, 2.309, 13.5], '3/4"-10': [19.05, 2.540, 16.5],
  '7/8"-9':  [22.23, 2.822, 19.45],'1"-8':    [25.40, 3.175, 22.25],
};

const UNF: Record<string, [number, number, number]> = {
  '#4-48':   [2.845, 0.529, 2.26], '#6-40':   [3.505, 0.635, 2.9],
  '#8-36':   [4.166, 0.705, 3.51], '#10-32':  [4.826, 0.794, 3.99],
  '1/4"-28': [6.35,  0.907, 5.61], '5/16"-24':[7.938, 1.058, 7.04],
  '3/8"-24': [9.525, 1.058, 8.73], '7/16"-20':[11.11, 1.270, 10.0],
  '1/2"-20': [12.70, 1.270, 11.6], '5/8"-18': [15.88, 1.411, 14.5],
  '3/4"-16': [19.05, 1.587, 17.5], '7/8"-14': [22.23, 1.814, 20.5],
  '1"-12':   [25.40, 2.117, 23.25],
};

const BSP: Record<string, [number, number, number]> = {
  '1/8" BSP': [9.73,  0.907, 8.8],  '1/4" BSP': [13.16, 1.337, 11.8],
  '3/8" BSP': [16.66, 1.337, 15.25],'1/2" BSP': [20.96, 1.814, 18.6],
  '3/4" BSP': [26.44, 1.814, 24.3], '1" BSP':   [33.25, 2.309, 30.5],
  '1.25" BSP':[41.91, 2.309, 39.0], '1.5" BSP': [47.80, 2.309, 44.9],
  '2" BSP':   [59.61, 2.309, 56.7],
};

type System = 'Metric Coarse' | 'Metric Fine' | 'UNC' | 'UNF' | 'BSP';

const DATA: Record<System, Record<string, [number, number, number]>> = {
  'Metric Coarse': METRIC_COARSE,
  'Metric Fine':   METRIC_FINE,
  'UNC':           UNC,
  'UNF':           UNF,
  'BSP':           BSP,
};

const SYSTEMS: System[] = ['Metric Coarse', 'Metric Fine', 'UNC', 'UNF', 'BSP'];
const ENGAGEMENT_OPTS = [50, 75, 100, 150];

export default function ThreadTapDrillCalculator() {
  const [system, setSystem] = useState<System>('Metric Coarse');
  const [selectedThread, setSelectedThread] = useState('M6');
  const [engagement, setEngagement] = useState(75);
  const [search, setSearch] = useState('');

  const data = DATA[system];
  const threadNames = Object.keys(data);
  const currentThread = data[selectedThread] ? selectedThread : threadNames[0];
  const [major, pitch, tapDrill] = data[currentThread] || [0, 0, 0];

  const minor = major - 1.0825 * pitch;
  const engagementLen = major * (engagement / 100);

  const filtered = useMemo(() =>
    threadNames.filter(t => !search || t.toLowerCase().includes(search.toLowerCase())),
    [threadNames, search]);

  const handleSystemChange = (s: System) => {
    setSystem(s);
    setSelectedThread(Object.keys(DATA[s])[0]);
    setSearch('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🔩 Thread & Tap Drill</Text>
        <Text style={styles.subtitle}>Tap drill sizes for Metric, UNC, UNF, and BSP threads</Text>

        {/* System selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          <View style={styles.tabRow}>
            {SYSTEMS.map(s => (
              <TouchableOpacity key={s} style={[styles.tab, system === s && styles.tabActive]} onPress={() => handleSystemChange(s)}>
                <Text style={[styles.tabText, system === s && styles.tabTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Thread search */}
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${system} threads...`}
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />

        {/* Thread grid */}
        <View style={styles.threadGrid}>
          {filtered.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.threadChip, currentThread === t && styles.threadChipActive]}
              onPress={() => setSelectedThread(t)}
            >
              <Text style={[styles.threadChipText, currentThread === t && styles.threadChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Engagement */}
        <View style={styles.pickerGroup}>
          <Text style={styles.pickerLabel}>Thread engagement (%)</Text>
          <View style={styles.chipRow}>
            {ENGAGEMENT_OPTS.map(e => (
              <TouchableOpacity key={e} style={[styles.chip, engagement === e && styles.chipActive]} onPress={() => setEngagement(e)}>
                <Text style={[styles.chipText, engagement === e && styles.chipTextActive]}>{e}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultRow}>
          <ResultBox label="Tap Drill" value={`${tapDrill.toFixed(2)} mm`} />
          <ResultBox label="Thread Engagement" value={`${engagementLen.toFixed(1)} mm`} />
        </View>
        <View style={styles.resultRow}>
          <ResultBox label="Major Diameter" value={`${major.toFixed(3)} mm`} />
          <ResultBox label="Minor Diameter" value={`${minor.toFixed(3)} mm`} />
        </View>
        <ResultBox label="Pitch" value={`${pitch.toFixed(3)} mm${pitch < 1 ? ` (${(25.4/pitch).toFixed(0)} TPI)` : ''}`} />

        {/* Full table */}
        <View style={styles.refCard}>
          <Text style={styles.refTitle}>Full {system} Reference</Text>
          <View style={styles.tableHeader}>
            {['Thread', 'Major', 'Pitch', 'Tap Drill'].map(h => (
              <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
            ))}
          </View>
          {threadNames.map(t => {
            const [maj, pit, drill] = data[t];
            const isSelected = t === currentThread;
            return (
              <TouchableOpacity key={t} style={[styles.tableRow, isSelected && styles.tableRowActive]} onPress={() => setSelectedThread(t)}>
                <Text style={[styles.tableCell, styles.tableCellBold, isSelected && styles.tableCellActive]}>{t}</Text>
                <Text style={[styles.tableCell, isSelected && styles.tableCellActive]}>{maj.toFixed(2)}</Text>
                <Text style={[styles.tableCell, isSelected && styles.tableCellActive]}>{pit.toFixed(3)}</Text>
                <Text style={[styles.tableCell, isSelected && styles.tableCellActive]}>{drill.toFixed(2)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <InfoBox title="About this calculator">
          <Text style={styles.infoText}>
            {'Tap drill formula: D_tap = D_major - pitch (approx 75% engagement)\n\n'}
            {'Thread engagement:\n'}
            {'• Steel→steel: 1× major diameter minimum\n'}
            {'• Aluminium: 2× major diameter\n'}
            {'• Cast iron/bronze: 1.5× major diameter\n\n'}
            {'BSP note: 55° Whitworth thread form. NOT compatible with NPT (60°).\n\n'}
            {'UNC/UNF drill sizes: for 75% thread engagement (standard for steel).'}
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
  tabBar: { marginBottom: Spacing.sm },
  tabRow: { flexDirection: 'row', gap: Spacing.xs },
  tab: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  tabText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  search: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, color: Colors.text, fontSize: 14, marginBottom: Spacing.sm },
  threadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  threadChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  threadChipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  threadChipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  threadChipTextActive: { color: Colors.primary },
  pickerGroup: { marginBottom: Spacing.md },
  pickerLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  resultRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  refCard: { backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.md },
  refTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.xs, marginBottom: Spacing.xs },
  tableHeaderCell: { flex: 1, color: Colors.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderRadius: Radius.sm },
  tableRowActive: { backgroundColor: Colors.primaryDim },
  tableCell: { flex: 1, color: Colors.text, fontSize: 12 },
  tableCellBold: { fontWeight: '700' },
  tableCellActive: { color: Colors.primary },
  infoText: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
});
