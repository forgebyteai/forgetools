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
import { Colors, Spacing, Radius } from '../../lib/theme';
import ResultBox from '../../components/ResultBox';
import InfoBox from '../../components/InfoBox';

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

        {/* Help */}
        <InfoBox
          body={"Computes focused spot parameters using Gaussian beam optics.\n\nSpot diameter = 2 × (wavelength × focal_length) / (π × beam_diameter)\n\nFibre lasers (1064nm) achieve ~10× smaller spots than CO₂ (10600nm) for the same lens.\n\nDepth of focus = 2 × Rayleigh range. For thick material, use longer focal length for adequate DOF."}
        />

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
  typeRow: { flexDirection: 'row' as const, gap: Spacing.sm },
  typeBtn: {
    flex: 1,
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    alignItems: 'center' as const,
  },
  typeBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  typeBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' as const },
  typeBtnTextActive: { color: Colors.primary, fontWeight: '700' as const },
  chip: {
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    backgroundColor: Colors.bgInput,
  },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: Colors.primary, fontWeight: '600' as const },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm, marginTop: Spacing.sm + 4 },
  metric: {
    width: '47%',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.sm,
    padding: 10,
    alignItems: 'center' as const,
  },
  metricLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' as const },
  metricValue: { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary, marginTop: 2 },
  infoBox: {
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 4,
    marginTop: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  infoTitle: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary, marginBottom: 4 },
  infoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  emptyText: { color: Colors.textMuted, textAlign: 'center' as const, paddingVertical: Spacing.md },
  expandBtn: { padding: Spacing.sm, alignItems: 'center' as const, marginBottom: 4 },
  expandBtnText: { color: Colors.textSecondary, fontSize: 13 },
  tableRow: { flexDirection: 'row' as const, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableCell: { flex: 1, color: Colors.textPrimary, fontSize: 12 },
  tableHeader: { fontWeight: '700' as const, color: Colors.primary },
  footer: { padding: Spacing.md, alignItems: 'center' as const, marginBottom: 40 },
  footerText: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' as const },
});
