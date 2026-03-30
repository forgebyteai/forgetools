/**
 * Laser Focal Point Calculator — ForgeTools
 * Focal point distance for CO2 and fibre lasers.
 * Calculates depth of focus, spot size, Rayleigh length, and kerf width.
 * Includes common lens presets.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';

// Common lens presets (focal length mm, label)
interface LensPreset {
  label: string;
  focal_mm: number;
}

const CO2_LENSES: LensPreset[] = [
  { label: '1.5 inch (38mm)',  focal_mm: 38.1  },
  { label: '2.0 inch (51mm)',  focal_mm: 50.8  },
  { label: '2.5 inch (63mm)',  focal_mm: 63.5  },
  { label: '4.0 inch (102mm)', focal_mm: 101.6 },
  { label: '5.0 inch (127mm)', focal_mm: 127.0 },
  { label: '7.5 inch (190mm)', focal_mm: 190.5 },
  { label: 'Custom',           focal_mm: 0     },
];

const FIBRE_LENSES: LensPreset[] = [
  { label: '100mm focal',  focal_mm: 100 },
  { label: '150mm focal',  focal_mm: 150 },
  { label: '200mm focal',  focal_mm: 200 },
  { label: '254mm focal',  focal_mm: 254 },
  { label: '330mm focal',  focal_mm: 330 },
  { label: 'Custom',       focal_mm: 0   },
];

// Typical beam diameters at lens
const BEAM_DIAMETERS: { label: string; mm: number }[] = [
  { label: '10mm (CO2 small)', mm: 10 },
  { label: '14mm (CO2 mid)',   mm: 14 },
  { label: '18mm (CO2 large)', mm: 18 },
  { label: '25mm (CO2 XL)',    mm: 25 },
  { label: '10mm (Fibre)',     mm: 10 },
  { label: 'Custom',           mm: 0  },
];

// Wavelengths
const CO2_WAVELENGTH = 10.6e-6;   // 10.6 µm
const FIBRE_WAVELENGTH = 1.064e-6; // 1.064 µm

interface FocalResult {
  spot_diameter_um: number;
  depth_of_focus_mm: number;
  rayleigh_mm: number;
  f_number: number;
  kerf_estimate_mm: number;
}

function calcFocal(
  focal_mm: number,
  beam_dia_mm: number,
  wavelength_m: number,
): FocalResult {
  const wavelength_mm = wavelength_m * 1e3;
  const M2 = 1.2; // Realistic beam quality factor
  const f_number = focal_mm / beam_dia_mm;
  // Spot diameter (1/e² radius, Gaussian beam)
  const spot_radius_mm = (M2 * wavelength_mm * focal_mm) / (Math.PI * (beam_dia_mm / 2));
  const spot_dia_mm = 2 * spot_radius_mm;
  const spot_dia_um = spot_dia_mm * 1000;
  // Rayleigh length
  const rayleigh_mm = (Math.PI * Math.pow(spot_radius_mm, 2)) / (M2 * wavelength_mm);
  // Depth of focus (±Rayleigh)
  const dof_mm = 2 * rayleigh_mm;
  // Kerf estimate (typically 1.1-1.3× spot)
  const kerf_mm = Math.round(spot_dia_mm * 1.2 * 100) / 100;

  return {
    spot_diameter_um: Math.round(spot_dia_um * 10) / 10,
    depth_of_focus_mm: Math.round(dof_mm * 1000) / 1000,
    rayleigh_mm: Math.round(rayleigh_mm * 1000) / 1000,
    f_number: Math.round(f_number * 10) / 10,
    kerf_estimate_mm: kerf_mm,
  };
}

export default function LaserFocalCalculator() {
  const [laserType, setLaserType] = useState<'CO2' | 'Fibre'>('CO2');
  const [lensIdx, setLensIdx] = useState(2);   // 2.5in default for CO2
  const [beamIdx, setBeamIdx] = useState(1);   // 14mm default
  const [customFocal, setCustomFocal] = useState('');
  const [customBeam, setCustomBeam] = useState('');
  const [materialThicknessText, setMaterialThicknessText] = useState('3');
  const [showInfo, setShowInfo] = useState(false);

  const lenses = laserType === 'CO2' ? CO2_LENSES : FIBRE_LENSES;
  const safeLensIdx = Math.min(lensIdx, lenses.length - 1);
  const lens = lenses[safeLensIdx];
  const beam = BEAM_DIAMETERS[Math.min(beamIdx, BEAM_DIAMETERS.length - 1)];

  const isCustomLens = lens.focal_mm === 0;
  const isCustomBeam = beam.mm === 0;

  const focal = isCustomLens ? (parseFloat(customFocal) || 0) : lens.focal_mm;
  const beamDia = isCustomBeam ? (parseFloat(customBeam) || 0) : beam.mm;
  const wavelength = laserType === 'CO2' ? CO2_WAVELENGTH : FIBRE_WAVELENGTH;
  const matThickness = parseFloat(materialThicknessText) || 0;

  const result = focal > 0 && beamDia > 0 ? calcFocal(focal, beamDia, wavelength) : null;

  // Ideal material positioning: surface at focal point for cutting
  // Or slightly below surface for deep cutting
  const halfDOF = result ? result.depth_of_focus_mm / 2 : 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.title}>Laser Focal Calculator</Text>
          <Text style={s.subtitle}>Spot size, depth of focus, kerf width</Text>
        </View>

        {/* Laser type */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Laser Type</Text>
          <View style={s.typeRow}>
            {(['CO2', 'Fibre'] as const).map(lt => (
              <TouchableOpacity
                key={lt}
                onPress={() => { setLaserType(lt); setLensIdx(0); }}
                style={[s.typeBtn, laserType === lt && s.typeBtnActive]}
              >
                <Text style={[s.typeBtnText, laserType === lt && s.typeBtnTextActive]}>
                  {lt === 'CO2' ? '🔴 CO2 (10.6µm)' : '🟠 Fibre (1.064µm)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lens selection */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Lens Focal Length</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lenses.map((l, i) => (
              <TouchableOpacity
                key={l.label}
                onPress={() => setLensIdx(i)}
                style={[s.chip, safeLensIdx === i && s.chipActive]}
              >
                <Text style={[s.chipText, safeLensIdx === i && s.chipTextActive]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {isCustomLens && (
            <>
              <Text style={s.label}>Custom focal length (mm)</Text>
              <TextInput style={s.input} value={customFocal} onChangeText={setCustomFocal}
                keyboardType="numeric" placeholderTextColor={Colors.textMuted} placeholder="e.g. 150" />
            </>
          )}
        </View>

        {/* Beam diameter */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Beam Diameter at Lens</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BEAM_DIAMETERS.map((b, i) => (
              <TouchableOpacity
                key={b.label}
                onPress={() => setBeamIdx(i)}
                style={[s.chip, beamIdx === i && s.chipActive]}
              >
                <Text style={[s.chipText, beamIdx === i && s.chipTextActive]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {isCustomBeam && (
            <>
              <Text style={s.label}>Custom beam diameter (mm)</Text>
              <TextInput style={s.input} value={customBeam} onChangeText={setCustomBeam}
                keyboardType="numeric" placeholderTextColor={Colors.textMuted} placeholder="e.g. 14" />
            </>
          )}
        </View>

        {/* Material thickness */}
        <View style={s.card}>
          <Text style={s.label}>Material thickness (mm)</Text>
          <TextInput style={s.input} value={materialThicknessText} onChangeText={setMaterialThicknessText}
            keyboardType="numeric" placeholderTextColor={Colors.textMuted} placeholder="e.g. 3" />
        </View>

        {/* Results */}
        {result ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Results</Text>
            <ResultBox
              label="Spot Diameter (1/e²)"
              value={`${result.spot_diameter_um} µm`}
              sub={`F-number: f/${result.f_number}`}
              status="info"
            />
            <View style={s.grid}>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Depth of Focus</Text>
                <Text style={s.metricValue}>{result.depth_of_focus_mm} mm</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Rayleigh Length</Text>
                <Text style={s.metricValue}>±{result.rayleigh_mm} mm</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Kerf (est.)</Text>
                <Text style={s.metricValue}>{result.kerf_estimate_mm} mm</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.metricLabel}>Focal Length</Text>
                <Text style={s.metricValue}>{focal} mm</Text>
              </View>
            </View>

            {matThickness > 0 && (
              <View style={s.infoBox}>
                <Text style={s.infoTitle}>Positioning for {matThickness}mm material</Text>
                {matThickness <= result.depth_of_focus_mm ? (
                  <Text style={s.infoText}>✅ Material fits within depth of focus ({result.depth_of_focus_mm.toFixed(3)}mm). Focus at surface.</Text>
                ) : (
                  <Text style={s.infoText}>
                    ℹ️ Material ({matThickness}mm) exceeds DOF ({result.depth_of_focus_mm.toFixed(3)}mm).{'\n'}
                    For cutting: position focus {(matThickness * 0.3).toFixed(1)}mm below surface.{'\n'}
                    For engraving: focus at surface.
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.emptyText}>Select lens and beam diameter to calculate.</Text>
          </View>
        )}

        {/* Reference info */}
        <TouchableOpacity style={s.expandBtn} onPress={() => setShowInfo(!showInfo)}>
          <Text style={s.expandBtnText}>{showInfo ? '▲' : '▼'} Lens Selection Guide</Text>
        </TouchableOpacity>
        {showInfo && (
          <View style={s.card}>
            <Text style={s.infoTitle}>Typical lens applications</Text>
            <View style={s.tableRow}>
              <Text style={[s.tableCell, s.tableHeader]}>Lens</Text>
              <Text style={[s.tableCell, s.tableHeader]}>Best for</Text>
            </View>
            {[
              ['1.5–2.5"', 'Engraving, thin sheet (<3mm), detail work'],
              ['2.5–5"',   'General cutting 3–12mm, balance of spot/DOF'],
              ['5"',       'Thick material 10–25mm, wide DOF'],
              ['7.5"',     'Very thick material 20mm+, foam, wood'],
            ].map(([lens, use]) => (
              <View key={lens} style={s.tableRow}>
                <Text style={s.tableCell}>{lens}</Text>
                <Text style={[s.tableCell, { flex: 2, color: '#94a3b8' }]}>{use}</Text>
              </View>
            ))}
            <Text style={[s.infoText, { marginTop: Spacing.sm }]}>
              Smaller focal length → smaller spot, less DOF → better for thin material{'\n'}
              Longer focal length → larger spot, more DOF → better for thick material
            </Text>
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Based on Gaussian beam optics (M²=1.2). Actual values vary by beam quality.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reuse spacing/etc from theme
const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };
const Radius = { sm: 8, md: 12, lg: 16, full: 999 };
const Typography = {
  heading: { fontWeight: '700' as const, fontSize: 20 },
  subheading: { fontWeight: '600' as const, fontSize: 16 },
  body: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12 },
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1a' },
  scroll: { flex: 1, padding: 16 },
  header: { marginBottom: 16 },
  title: { fontWeight: '700', fontSize: 22, color: '#00d4ff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  card: {
    backgroundColor: '#0f1623',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.1)',
  },
  sectionTitle: { fontWeight: '600', fontSize: 16, color: '#e2e8f0', marginBottom: 8 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#0d1520',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    color: '#e2e8f0',
    padding: 10,
    fontSize: 16,
    minHeight: 44,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: '#0d1520',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: '#00d4ff' },
  typeBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  typeBtnTextActive: { color: '#00d4ff', fontWeight: '700' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginRight: 6,
    backgroundColor: '#0d1520',
  },
  chipActive: { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: '#00d4ff' },
  chipText: { color: '#94a3b8', fontSize: 13 },
  chipTextActive: { color: '#00d4ff', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metric: {
    width: '47%',
    backgroundColor: '#0d1520',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  metricLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
  metricValue: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginTop: 2 },
  infoBox: {
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#00d4ff', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  emptyText: { color: '#475569', textAlign: 'center', paddingVertical: 16 },
  expandBtn: { padding: 8, alignItems: 'center', marginBottom: 4 },
  expandBtnText: { color: '#94a3b8', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.1)' },
  tableCell: { flex: 1, color: '#e2e8f0', fontSize: 12 },
  tableHeader: { fontWeight: '700', color: '#00d4ff' },
  footer: { padding: 16, alignItems: 'center', marginBottom: 40 },
  footerText: { color: '#475569', fontSize: 11, textAlign: 'center' },
});
