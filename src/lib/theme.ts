/**
 * ForgeCore Design System — Dark Theme
 * Used across all ForgeTools screens and components.
 */

export const Colors = {
  // Backgrounds
  bg: '#0a0f1a',
  bgCard: '#0f1623',
  bgInput: '#0d1520',
  bgMuted: 'rgba(14,22,36,0.8)',

  // Primary accent — cyan
  primary: '#00d4ff',
  primaryDim: 'rgba(0,212,255,0.15)',
  primaryBorder: 'rgba(0,212,255,0.3)',

  // Secondary accent — orange
  secondary: '#ff6b35',
  secondaryDim: 'rgba(255,107,53,0.15)',
  secondaryBorder: 'rgba(255,107,53,0.3)',

  // Semantic
  success: '#22c55e',
  successDim: 'rgba(34,197,94,0.12)',
  warning: '#f59e0b',
  warningDim: 'rgba(245,158,11,0.12)',
  danger: '#ef4444',
  dangerDim: 'rgba(239,68,68,0.12)',

  // Text
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  textAccent: '#00d4ff',

  // Borders
  border: 'rgba(148,163,184,0.15)',
  borderStrong: 'rgba(148,163,184,0.3)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: Colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '600' as const, color: Colors.primary },
  h3: { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 15, color: Colors.textPrimary },
  caption: { fontSize: 12, color: Colors.textSecondary },
  label: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' as const },
  result: { fontSize: 28, fontWeight: '700' as const, color: Colors.secondary },
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;
