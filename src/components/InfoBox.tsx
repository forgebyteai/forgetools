/**
 * InfoBox — Collapsible info/help section for calculator screens.
 * Mirrors the "ℹ️ About this calculator" expanders on tools.wfdnelson.com.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Colors, Spacing, Radius } from '../lib/theme';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface InfoItem {
  label: string;
  value: string;
}

interface Props {
  title?: string;
  /** Plain text paragraph(s) */
  body?: string;
  /** Key-value pairs displayed as a mini reference table */
  items?: InfoItem[];
  /** Whether to start expanded */
  defaultOpen?: boolean;
}

export default function InfoBox({ title = 'About this calculator', body, items, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={open ? `Collapse ${title}` : `Expand ${title}`}
      >
        <Text style={styles.icon}>ℹ️</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          {body ? <Text style={styles.bodyText}>{body}</Text> : null}
          {items?.map((item, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,212,255,0.04)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  title: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  body: {
    paddingHorizontal: Spacing.sm + 2,
    paddingBottom: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryBorder,
  },
  bodyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  rowAlt: {
    backgroundColor: 'rgba(148,163,184,0.05)',
    borderRadius: 4,
  },
  rowLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  rowValue: {
    flex: 1.5,
    color: Colors.textPrimary,
    fontSize: 12,
  },
});
