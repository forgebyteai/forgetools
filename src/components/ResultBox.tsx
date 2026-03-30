/**
 * ResultBox — Styled result display component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../lib/theme';

type Variant = 'default' | 'pass' | 'fail' | 'warn' | 'info';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  variant?: Variant;
  large?: boolean;
}

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; valueColor: string }> = {
  default: { bg: Colors.primaryDim,    border: Colors.primaryBorder,    valueColor: Colors.primary    },
  pass:    { bg: Colors.successDim,    border: 'rgba(34,197,94,0.4)',   valueColor: '#86efac'          },
  fail:    { bg: Colors.dangerDim,     border: 'rgba(239,68,68,0.4)',   valueColor: '#fca5a5'          },
  warn:    { bg: Colors.warningDim,    border: 'rgba(245,158,11,0.4)',  valueColor: '#fde68a'          },
  info:    { bg: 'rgba(148,163,184,0.08)', border: Colors.border,       valueColor: Colors.textSecondary},
};

export default function ResultBox({ label, value, unit, variant = 'default', large = false }: Props) {
  const v = VARIANT_STYLES[variant];
  return (
    <View style={[styles.box, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: v.valueColor, fontSize: large ? 30 : 22 }]}>
        {value}
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  label: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  value: { fontWeight: '700' },
  unit: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary },
});
