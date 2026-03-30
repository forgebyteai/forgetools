/**
 * ComingSoonScreen — Placeholder for calculators not yet implemented
 */

import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../lib/theme';

interface Props {
  title?: string;
  emoji?: string;
  [key: string]: any;
}

export function ComingSoonScreen({ title = 'Calculator', emoji = '🔧' }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.icon}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Coming in the next build cycle</Text>
        <Text style={styles.note}>This calculator is part of the active build roadmap.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  icon: { fontSize: 48, marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.primary, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  note: { marginTop: Spacing.md, color: Colors.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
});
