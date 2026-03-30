/**
 * CNC Feed & Speed Calculator
 * WFD-247: Material presets, RPM, feed rate, MRR, favourites, custom materials
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import { calcCNCRPM, calcFeedRate } from '../../lib/calculations';
import { saveItem, loadItem } from '../../lib/storage';

interface MaterialPreset {
  name: string;
  vcm: number;
  chip_load_per_mm: number;
  notes?: string;
}

const BUILTIN_MATERIALS: MaterialPreset[] = [
  { name: 'Aluminium',       vcm: 300, chip_load_per_mm: 0.004, notes: '6061 / 7075' },
  { name: 'Brass',           vcm: 120, chip_load_per_mm: 0.003 },
  { name: 'Mild Steel',      vcm: 60,  chip_load_per_mm: 0.002, notes: 'A36/1018' },
  { name: 'Stainless 304',   vcm: 40,  chip_load_per_mm: 0.0015 },
  { name: 'Stainless 316',   vcm: 30,  chip_load_per_mm: 0.0012 },
  { name: 'Tool Steel',      vcm: 25,  chip_load_per_mm: 0.001 },
  { name: 'Cast Iron',       vcm: 80,  chip_load_per_mm: 0.002 },
  { name: 'Titanium',        vcm: 20,  chip_load_per_mm: 0.001, notes: 'Ti-6Al-4V' },
  { name: 'MDF/Wood',        vcm: 400, chip_load_per_mm: 0.006 },
  { name: 'Acrylic',         vcm: 250, chip_load_per_mm: 0.005 },
  { name: 'HDPE',            vcm: 350, chip_load_per_mm: 0.006 },
  { name: 'Carbon Fibre',    vcm: 150, chip_load_per_mm: 0.002, notes: 'Use diamond/carbide' },
];

interface FavSetup {
  id: string;
  label: string;
  rpm: number;
  feed: number;
}

export default function CNCFeedSpeedCalculator() {
  const [selMat, setSelMat] = useState<MaterialPreset>(BUILTIN_MATERIALS[0]);
  const [diaMm, setDiaMm] = useState('6');
  const [flutes, setFlutes] = useState('2');
  const [chipLoad, setChipLoad] = useState('');
  const [customVc, setCustomVc] = useState('');
  const [useCustomVc, setUseCustomVc] = useState(false);
  const [favs, setFavs] = useState<FavSetup[]>([]);
  const [customMats, setCustomMats] = useState<MaterialPreset[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatVc, setNewMatVc] = useState('');
  const [newMatChip, setNewMatChip] = useState('');
  const [tab, setTab] = useState<'calc' | 'favs' | 'materials'>('calc');

  useEffect(() => {
    loadItem<FavSetup[]>('cnc_favourites').then(v => { if (v) setFavs(v); });
    loadItem<MaterialPreset[]>('cnc_custom_materials').then(v => { if (v) setCustomMats(v); });
  }, []);

  const allMaterials = [...BUILTIN_MATERIALS, ...customMats];
  const dia = parseFloat(diaMm) || 0;
  const fl = parseInt(flutes) || 2;
  const vc = useCustomVc ? (parseFloat(customVc) || selMat.vcm) : selMat.vcm;
  const cl = parseFloat(chipLoad) || (selMat.chip_load_per_mm * Math.max(dia, 1));
  const rpm = dia > 0 ? calcCNCRPM(vc, dia) : 0;
  const feed = fl > 0 ? calcFeedRate(rpm, fl, cl) : 0;
  const mrr = feed * (dia / 10) * (dia / 10) * 0.5;

  const saveFav = async () => {
    if (rpm <= 0) return;
    const entry: FavSetup = {
      id: Date.now().toString(),
      label: `${selMat.name} Ø${diaMm}mm ${flutes}fl`,
      rpm: Math.round(rpm),
      feed: Math.round(feed),
    };
    const updated = [entry, ...favs].slice(0, 20);
    setFavs(updated);
    await saveItem('cnc_favourites', updated);
    Alert.alert('Saved', `${entry.label} saved to Favourites`);
  };

  const addCustomMaterial = async () => {
    if (!newMatName || !newMatVc || !newMatChip) return;
    const mat: MaterialPreset = {
      name: newMatName,
      vcm: parseFloat(newMatVc),
      chip_load_per_mm: parseFloat(newMatChip),
    };
    const updated = [...customMats, mat];
    setCustomMats(updated);
    await saveItem('cnc_custom_materials', updated);
    setNewMatName(''); setNewMatVc(''); setNewMatChip('');
    setShowCustomForm(false);
    Alert.alert('Added', `${mat.name} added`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🔩 CNC Feed & Speed</Text>

        <View style={styles.tabRow}>
          {([['calc', 'Calculator'], ['favs', 'Favourites'], ['materials', 'Materials']] as const).map(([id, label]) => (
            <TouchableOpacity key={id} style={[styles.tab, tab === id && styles.tabActive]}
              onPress={() => setTab(id)}>
              <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'calc' && (
          <View style={styles.card}>
            <Text style={styles.label}>Material</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              {allMaterials.map(m => (
                <TouchableOpacity key={m.name}
                  style={[styles.chip, selMat.name === m.name && styles.chipActive]}
                  onPress={() => { setSelMat(m); setUseCustomVc(false); setChipLoad(''); }}>
                  <Text style={[styles.chipText, selMat.name === m.name && styles.chipTextActive]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selMat.notes && <Text style={styles.hint}>ℹ️ {selMat.notes}</Text>}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Vc (m/min)</Text>
                <TextInput style={styles.input} keyboardType="numeric"
                  value={useCustomVc ? customVc : selMat.vcm.toString()}
                  editable={useCustomVc}
                  onChangeText={setCustomVc}
                  placeholderTextColor={Colors.textMuted} />
              </View>
              <TouchableOpacity style={[styles.toggle, useCustomVc && styles.toggleActive]}
                onPress={() => { setUseCustomVc(!useCustomVc); setCustomVc(selMat.vcm.toString()); }}>
                <Text style={[styles.toggleText, useCustomVc && styles.toggleTextActive]}>
                  {useCustomVc ? 'Custom' : 'Preset'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Tool Ø (mm)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={diaMm}
                  onChangeText={setDiaMm} placeholder="6" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Flutes</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={flutes}
                  onChangeText={setFlutes} placeholder="2" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <Text style={styles.label}>Chip Load (mm/tooth) — blank for auto</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={chipLoad}
              onChangeText={setChipLoad}
              placeholder={`Auto: ${(selMat.chip_load_per_mm * Math.max(dia, 1)).toFixed(4)}`}
              placeholderTextColor={Colors.textMuted} />

            {rpm > 0 && (
              <View style={styles.results}>
                <ResultBox label="Spindle Speed" value={Math.round(rpm).toLocaleString()} unit="RPM"
                  variant={rpm > 20000 ? 'warn' : 'pass'} large />
                <ResultBox label="Feed Rate" value={Math.round(feed).toLocaleString()} unit="mm/min" />
                <ResultBox label="Chip Load Used" value={cl.toFixed(4)} unit="mm/tooth" variant="info" />
                <ResultBox label="Est. MRR" value={mrr.toFixed(1)} unit="cm³/min" variant="info" />
                <Text style={styles.hint}>
                  💡 Rough cut: reduce feed 25–30%. Finish cut: full speed, reduce DOC.
                </Text>
                <TouchableOpacity style={styles.saveBtn} onPress={saveFav}>
                  <Text style={styles.saveBtnText}>⭐ Save to Favourites</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {tab === 'favs' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Saved Setups</Text>
            {favs.length === 0 ? (
              <Text style={styles.hint}>No favourites yet. Calculate something and tap Save.</Text>
            ) : (
              favs.map(fav => (
                <View key={fav.id} style={styles.favCard}>
                  <Text style={styles.favLabel}>{fav.label}</Text>
                  <Text style={{ color: Colors.primary, fontSize: 13 }}>
                    {fav.rpm.toLocaleString()} RPM · {fav.feed.toLocaleString()} mm/min
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'materials' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Material Database</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Material</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText]}>Vc m/min</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText]}>Chip mm</Text>
              </View>
              {allMaterials.map(m => (
                <View key={m.name} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{m.name}</Text>
                  <Text style={[styles.tableCell, { color: Colors.primary }]}>{m.vcm}</Text>
                  <Text style={styles.tableCell}>{m.chip_load_per_mm.toFixed(4)}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowCustomForm(!showCustomForm)}>
              <Text style={styles.saveBtnText}>+ Add Custom Material</Text>
            </TouchableOpacity>
            {showCustomForm && (
              <View style={{ marginTop: Spacing.md }}>
                <TextInput style={[styles.input, { marginBottom: 8 }]} value={newMatName}
                  onChangeText={setNewMatName} placeholder="Material name"
                  placeholderTextColor={Colors.textMuted} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} keyboardType="numeric"
                    value={newMatVc} onChangeText={setNewMatVc} placeholder="Vc (m/min)"
                    placeholderTextColor={Colors.textMuted} />
                  <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric"
                    value={newMatChip} onChangeText={setNewMatChip} placeholder="Chip load (mm)"
                    placeholderTextColor={Colors.textMuted} />
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={addCustomMaterial}>
                  <Text style={styles.saveBtnText}>Save Material</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.md },
  tabRow: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  tab: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, minHeight: 44, justifyContent: 'center',
  },
  tabActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  tabText: { color: Colors.textSecondary, fontSize: 13 },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
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
    marginLeft: 8, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end', marginBottom: Spacing.sm,
  },
  toggleActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  toggleText: { color: Colors.textSecondary, fontSize: 14 },
  toggleTextActive: { color: Colors.primary, fontWeight: '600' },
  chip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgInput,
    marginRight: 6, minHeight: 32, justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  chipText: { color: Colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  results: { marginTop: Spacing.md },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm, fontStyle: 'italic' },
  saveBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.secondaryDim, borderWidth: 1,
    borderColor: Colors.secondaryBorder, borderRadius: Radius.sm,
    paddingVertical: Spacing.sm, alignItems: 'center', minHeight: 44, justifyContent: 'center',
  },
  saveBtnText: { color: Colors.secondary, fontWeight: '600' },
  favCard: {
    backgroundColor: Colors.bgInput, borderRadius: Radius.sm, padding: Spacing.sm,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  favLabel: { color: Colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  table: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.sm },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 8 },
  tableHeader: { backgroundColor: Colors.bgMuted },
  tableCell: { flex: 1, textAlign: 'center', color: Colors.textSecondary, fontSize: 12 },
  tableHeaderText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
