/**
 * ResultBox — Styled result display component
 * Animates in with a subtle scale + fade when it appears.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Spacing, Radius } from '../lib/theme';

type Variant = 'default' | 'pass' | 'fail' | 'warn' | 'info';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  variant?: Variant;
  large?: boolean;
  animDelay?: number;
}

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; valueColor: string }> = {
  default: { bg: Colors.primaryDim,       border: Colors.primaryBorder,    valueColor: Colors.primary       },
  pass:    { bg: Colors.successDim,       border: 'rgba(34,197,94,0.4)',   valueColor: '#86efac'             },
  fail:    { bg: Colors.dangerDim,        border: 'rgba(239,68,68,0.4)',   valueColor: '#fca5a5'             },
  warn:    { bg: Colors.warningDim,       border: 'rgba(245,158,11,0.4)', valueColor: '#fde68a'             },
  info:    { bg: 'rgba(148,163,184,0.08)', border: Colors.border,          valueColor: Colors.textSecondary },
};

export default function ResultBox({ label, value, unit, variant = 'default', large = false, animDelay = 0 }: Props) {
  const v = VARIANT_STYLES[variant];

  // Reveal animation
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay: animDelay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.box,
        { backgroundColor: v.bg, borderColor: v.border },
        { opacity, transform: [{ scale }] },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: v.valueColor, fontSize: large ? 30 : 22 }]}>
        {value}
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </Text>
    </Animated.View>
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
