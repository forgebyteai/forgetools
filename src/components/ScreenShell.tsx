/**
 * ScreenShell — Standard screen wrapper for ForgeTools calculators.
 * Provides consistent safe area, scroll container, and header styling.
 */

import React from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet,
} from 'react-native';
import { Colors, Spacing, Radius } from '../lib/theme';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ScreenShell({ emoji, title, subtitle, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Consistent header */}
        <View style={styles.header}>
          <Text style={styles.icon}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  icon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
});
