/**
 * ForgeTools — Troubleshoot Screen
 * Expandable decision trees for common field issues.
 * Placeholder — full implementation in WFD-250.
 */

import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../lib/theme';

export default function TroubleshootScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>🔍 Troubleshoot</Text>
        <Text style={styles.sub}>Motor, VFD, PLC & hydraulic fault trees</Text>
        <Text style={styles.coming}>Coming in next build cycle</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  title: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.sm },
  sub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  coming: { marginTop: Spacing.lg, color: Colors.textMuted, fontStyle: 'italic' },
});
