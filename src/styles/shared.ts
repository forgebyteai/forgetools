/**
 * Shared calculator styles — ForgeTools design system.
 * Import these into any calculator screen for consistent styling.
 * Override specific values in the local StyleSheet as needed.
 */

import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../lib/theme';

/** Standard card container (glass dark background) */
export const card = {
  backgroundColor: Colors.bgCard,
  borderRadius: Radius.md,
  borderWidth: 1,
  borderColor: Colors.border,
  padding: Spacing.md,
  marginBottom: Spacing.md,
} as const;

/** Section header inside a card */
export const sectionTitle = {
  fontSize: 15,
  fontWeight: '600' as const,
  color: Colors.textPrimary,
  marginBottom: Spacing.sm,
} as const;

/** Input field label */
export const inputLabel = {
  fontSize: 13,
  fontWeight: '500' as const,
  color: Colors.textSecondary,
  marginBottom: 4,
  marginTop: Spacing.sm,
} as const;

/** Input hint / secondary caption */
export const hint = {
  fontSize: 11,
  color: Colors.textMuted,
  marginTop: 2,
} as const;

/** Text input box */
export const textInput = {
  backgroundColor: Colors.bgInput,
  borderRadius: Radius.sm,
  borderWidth: 1,
  borderColor: Colors.borderStrong,
  color: Colors.textPrimary,
  fontSize: 16,
  paddingHorizontal: Spacing.sm,
  paddingVertical: Spacing.sm,
  minHeight: 44,
  marginBottom: Spacing.sm,
} as const;

/** Primary action button */
export const primaryButton = {
  backgroundColor: Colors.primaryDim,
  borderRadius: Radius.md,
  borderWidth: 1,
  borderColor: Colors.primary,
  paddingVertical: 14,
  alignItems: 'center' as const,
  marginTop: Spacing.sm,
  marginBottom: Spacing.sm,
} as const;

export const primaryButtonText = {
  color: Colors.primary,
  fontSize: 16,
  fontWeight: '600' as const,
} as const;

/** Secondary / ghost button (e.g. Save, Reset) */
export const ghostButton = {
  backgroundColor: 'transparent',
  borderRadius: Radius.md,
  borderWidth: 1,
  borderColor: Colors.secondaryBorder,
  paddingVertical: 10,
  alignItems: 'center' as const,
  marginTop: Spacing.xs,
} as const;

export const ghostButtonText = {
  color: Colors.secondary,
  fontSize: 14,
  fontWeight: '600' as const,
} as const;

/** Chip selector item (inactive) */
export const chip = {
  paddingHorizontal: Spacing.sm,
  paddingVertical: Spacing.xs + 2,
  borderRadius: Radius.pill,
  borderWidth: 1,
  borderColor: Colors.border,
  backgroundColor: Colors.bgInput,
  marginRight: Spacing.xs,
} as const;

/** Chip selector item (active) */
export const chipActive = {
  borderColor: Colors.primary,
  backgroundColor: Colors.primaryDim,
} as const;

export const chipText = {
  color: Colors.textSecondary,
  fontSize: 13,
} as const;

export const chipTextActive = {
  color: Colors.primary,
  fontWeight: '600' as const,
} as const;

/** Metric grid cell */
export const metricBox = {
  flex: 1,
  alignItems: 'center' as const,
  paddingVertical: Spacing.sm,
  backgroundColor: Colors.bgInput,
  borderRadius: Radius.sm,
  borderWidth: 1,
  borderColor: Colors.border,
  margin: 3,
} as const;

export const metricLabel = {
  fontSize: 11,
  color: Colors.textSecondary,
  textAlign: 'center' as const,
} as const;

export const metricValue = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: Colors.textPrimary,
  marginTop: 2,
  textAlign: 'center' as const,
} as const;

/** Warning text */
export const warningText = {
  color: Colors.warning,
  fontSize: 13,
  lineHeight: 20,
} as const;

/** Info / helper text */
export const infoText = {
  color: Colors.textSecondary,
  fontSize: 13,
  lineHeight: 20,
} as const;

/** Table cell */
export const tableCell = {
  flex: 1,
  color: Colors.textSecondary,
  fontSize: 12,
  paddingVertical: 4,
  paddingRight: 4,
} as const;

export const tableCellHeader = {
  flex: 1,
  color: Colors.primary,
  fontSize: 12,
  fontWeight: '600' as const,
  paddingVertical: 4,
  paddingRight: 4,
} as const;

/** Collapsible expander header */
export const expandHeader = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: Spacing.sm,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
} as const;

export const expandHeaderText = {
  color: Colors.textSecondary,
  fontSize: 13,
  flex: 1,
} as const;

/** Offline / feature badge */
export const badge = {
  backgroundColor: Colors.primaryDim,
  borderRadius: Radius.pill,
  borderWidth: 1,
  borderColor: Colors.primaryBorder,
  paddingHorizontal: Spacing.sm,
  paddingVertical: 2,
  alignSelf: 'flex-start' as const,
} as const;

export const badgeText = {
  color: Colors.primary,
  fontSize: 11,
  fontWeight: '600' as const,
  letterSpacing: 0.5,
} as const;

/** Standard StyleSheet export — spread these into local StyleSheets */
export const sharedStyles = StyleSheet.create({
  card,
  sectionTitle,
  inputLabel,
  hint,
  textInput,
  primaryButton,
  primaryButtonText,
  ghostButton,
  ghostButtonText,
  chip,
  chipActive,
  chipText,
  chipTextActive,
  metricBox,
  metricLabel,
  metricValue,
  warningText,
  infoText,
  tableCell,
  tableCellHeader,
  expandHeader,
  expandHeaderText,
  badge,
  badgeText,
});
