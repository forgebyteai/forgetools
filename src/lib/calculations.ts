/**
 * ForgeTools — Pure calculation functions
 * All functions are deterministic and have no side effects.
 * Tests can verify these independently.
 */

// ── Wire / Electrical ──────────────────────────────────────────────────────

export interface WireEntry {
  mm2: number;
  res_ohm_km: number;
  cu_amps: number;
  al_amps: number;
}

// AS/NZS 3008.1.1 — copper PVC 30°C ambient
export const WIRE_DATA: WireEntry[] = [
  { mm2: 1.5,   res_ohm_km: 12.1,   cu_amps: 17,  al_amps: 13  },
  { mm2: 2.5,   res_ohm_km: 7.41,   cu_amps: 23,  al_amps: 18  },
  { mm2: 4.0,   res_ohm_km: 4.61,   cu_amps: 31,  al_amps: 24  },
  { mm2: 6.0,   res_ohm_km: 3.08,   cu_amps: 40,  al_amps: 31  },
  { mm2: 10.0,  res_ohm_km: 1.83,   cu_amps: 54,  al_amps: 42  },
  { mm2: 16.0,  res_ohm_km: 1.15,   cu_amps: 73,  al_amps: 57  },
  { mm2: 25.0,  res_ohm_km: 0.727,  cu_amps: 95,  al_amps: 75  },
  { mm2: 35.0,  res_ohm_km: 0.524,  cu_amps: 119, al_amps: 93  },
  { mm2: 50.0,  res_ohm_km: 0.387,  cu_amps: 145, al_amps: 113 },
  { mm2: 70.0,  res_ohm_km: 0.268,  cu_amps: 185, al_amps: 143 },
  { mm2: 95.0,  res_ohm_km: 0.193,  cu_amps: 225, al_amps: 174 },
  { mm2: 120.0, res_ohm_km: 0.153,  cu_amps: 261, al_amps: 202 },
  { mm2: 150.0, res_ohm_km: 0.124,  cu_amps: 299, al_amps: 230 },
  { mm2: 185.0, res_ohm_km: 0.0991, cu_amps: 341, al_amps: 264 },
  { mm2: 240.0, res_ohm_km: 0.0754, cu_amps: 403, al_amps: 311 },
];

export interface VoltageDropResult {
  drop_v: number;
  drop_pct: number;
  pass: boolean;
  max_amps: number;
  current_ok: boolean;
}

export function calcVoltageDrop(
  wire_mm2: number,
  length_m: number,
  current_a: number,
  system_voltage: number,
  phases: 'single' | '3phase' = 'single',
  conductor: 'copper' | 'aluminium' = 'copper',
  max_drop_pct: number = 5,
): VoltageDropResult | null {
  const entry = WIRE_DATA.find(w => w.mm2 === wire_mm2);
  if (!entry) return null;

  const res_per_m = entry.res_ohm_km / 1000;
  const total_res = phases === 'single'
    ? 2 * length_m * res_per_m
    : Math.sqrt(3) * length_m * res_per_m;

  const drop_v = current_a * total_res;
  const drop_pct = (drop_v / system_voltage) * 100;
  const max_amps = conductor === 'copper' ? entry.cu_amps : entry.al_amps;

  return {
    drop_v: Math.round(drop_v * 100) / 100,
    drop_pct: Math.round(drop_pct * 10) / 10,
    pass: drop_pct <= max_drop_pct,
    max_amps,
    current_ok: current_a <= max_amps,
  };
}

// ── Motor / VFD ──────────────────────────────────────────────────────────

export function calcFullLoadAmps(
  power_kw: number,
  voltage_v: number,
  power_factor: number = 0.85,
  efficiency: number = 0.92,
  phases: 'single' | '3phase' = '3phase',
): number {
  if (phases === '3phase') {
    return (power_kw * 1000) / (Math.sqrt(3) * voltage_v * power_factor * efficiency);
  }
  return (power_kw * 1000) / (voltage_v * power_factor * efficiency);
}

export function calcVFDFreqToRPM(
  frequency_hz: number,
  motor_poles: number,
  slip_pct: number = 3,
): number {
  const sync_rpm = (120 * frequency_hz) / motor_poles;
  return sync_rpm * (1 - slip_pct / 100);
}

export function calcHPtoKW(hp: number): number { return hp * 0.7457; }
export function calcKWtoHP(kw: number): number { return kw / 0.7457; }

// ── CNC ─────────────────────────────────────────────────────────────────

export function calcCNCRPM(
  surface_speed_m_min: number,
  tool_dia_mm: number,
): number {
  return (surface_speed_m_min * 1000) / (Math.PI * tool_dia_mm);
}

export function calcFeedRate(
  rpm: number,
  flutes: number,
  chip_load_mm: number,
): number {
  return rpm * flutes * chip_load_mm;
}

// ── Press Brake / Sheet Metal ─────────────────────────────────────────────

export function calcPressBrakeTonnage(
  length_mm: number,
  thickness_mm: number,
  die_opening_mm: number,
  tensile_mpa: number,
): number {
  // Standard formula: F = (L × t² × Rm) / (1000 × V)
  return (length_mm * Math.pow(thickness_mm, 2) * tensile_mpa) / (1000 * die_opening_mm);
}

export function calcBendAllowance(
  thickness_mm: number,
  bend_angle_deg: number,
  inside_radius_mm: number,
  k_factor: number = 0.33,
): number {
  const angle_rad = (bend_angle_deg * Math.PI) / 180;
  return angle_rad * (inside_radius_mm + k_factor * thickness_mm);
}

// ── Unit conversions ─────────────────────────────────────────────────────

export function psiToBar(psi: number): number { return psi * 0.0689476; }
export function barToPsi(bar: number): number { return bar * 14.5038; }
export function psiToKPa(psi: number): number { return psi * 6.89476; }
export function kPaToPsi(kpa: number): number { return kpa / 6.89476; }

export function celsiusToFahrenheit(c: number): number { return c * 9/5 + 32; }
export function fahrenheitToCelsius(f: number): number { return (f - 32) * 5/9; }
export function celsiusToKelvin(c: number): number { return c + 273.15; }

export function mmToInch(mm: number): number { return mm / 25.4; }
export function inchToMM(inch: number): number { return inch * 25.4; }

export function nmToFtLb(nm: number): number { return nm * 0.737562; }
export function ftLbToNm(ftlb: number): number { return ftlb / 0.737562; }

export function lpmToGpm(lpm: number): number { return lpm * 0.264172; }
export function gpmToLpm(gpm: number): number { return gpm / 0.264172; }
