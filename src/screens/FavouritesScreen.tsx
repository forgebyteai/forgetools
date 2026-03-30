/**
 * ForgeTools — Favourites Screen (WFD-251)
 * Saved calculations and recent history.
 * SQLite/AsyncStorage backed offline storage. Full delete, copy, and recall.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Clipboard, RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../lib/theme';
import {
  getFavourites, removeFavourite, getRecents, clearAll,
  SavedCalc,
} from '../lib/storage';

// ── Helper ────────────────────────────────────────────────────────────────

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function buildSummary(calc: SavedCalc): string {
  const inputs = Object.entries(calc.inputs).map(([k, v]) => `${k}: ${v}`).join(' · ');
  const results = Object.entries(calc.result).map(([k, v]) => `${k}: ${v}`).join(' · ');
  return `Inputs: ${inputs}\nResults: ${results}`;
}

const TOOL_EMOJIS: Record<string, string> = {
  'Voltage Drop': '⚡',
  'Wire Gauge': '🔌',
  'Motor & VFD': '🔁',
  '3-Phase Power': '3️⃣',
  "Ohm's Law": '🔦',
  'CNC Feed & Speed': '🔩',
  'Punch Tonnage': '🏋️',
  'Press Brake': '📐',
  'Laser Focal': '🔴',
  'Bend Allowance': '📏',
};

function CalcCard({
  calc,
  onDelete,
  onCopy,
}: {
  calc: SavedCalc;
  onDelete: (id: string) => void;
  onCopy: (calc: SavedCalc) => void;
}) {
  const emoji = TOOL_EMOJIS[calc.tool] ?? '🔧';

  return (
    <View style={card.wrap}>
      <View style={card.header}>
        <Text style={card.emoji}>{emoji}</Text>
        <View style={card.headerText}>
          <Text style={card.tool}>{calc.tool}</Text>
          {calc.label && <Text style={card.label}>{calc.label}</Text>}
          {calc.savedAt && (
            <Text style={card.date}>{formatSavedAt(calc.savedAt)}</Text>
          )}
        </View>
        <View style={card.actions}>
          <TouchableOpacity
            style={card.actionBtn}
            onPress={() => onCopy(calc)}
            accessibilityLabel="Copy calculation result"
          >
            <Text style={card.actionIcon}>⎘</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[card.actionBtn, card.deleteBtn]}
            onPress={() => onDelete(calc.id)}
            accessibilityLabel="Delete saved calculation"
          >
            <Text style={card.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inputs */}
      <View style={card.section}>
        <Text style={card.sectionTitle}>Inputs</Text>
        <View style={card.chips}>
          {Object.entries(calc.inputs).map(([k, v]) => (
            <View key={k} style={card.chip}>
              <Text style={card.chipKey}>{k}</Text>
              <Text style={card.chipVal}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Results */}
      <View style={card.section}>
        <Text style={card.sectionTitle}>Results</Text>
        <View style={card.chips}>
          {Object.entries(calc.result).map(([k, v]) => {
            const isPass = String(v).toLowerCase().includes('pass');
            const isFail = String(v).toLowerCase().includes('fail');
            return (
              <View key={k} style={[card.chip, isPass && card.chipPass, isFail && card.chipFail]}>
                <Text style={card.chipKey}>{k}</Text>
                <Text style={[card.chipVal, isPass && card.chipPassText, isFail && card.chipFailText]}>
                  {v}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.sm,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  emoji: { fontSize: 24, marginRight: Spacing.sm, marginTop: 2 },
  headerText: { flex: 1 },
  tool: { ...Typography.h3, fontSize: 15 },
  label: { ...Typography.caption, color: Colors.primary, fontWeight: '600', marginTop: 1 },
  date: { ...Typography.caption, color: Colors.textMuted, marginTop: 2, fontSize: 11 },
  actions: { flexDirection: 'row', gap: Spacing.xs, marginLeft: Spacing.sm },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  deleteBtn: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: Colors.dangerDim },
  deleteIcon: { color: Colors.danger, fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  sectionTitle: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', fontSize: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  chipKey: { fontSize: 10, color: Colors.textMuted },
  chipVal: { fontSize: 11, color: Colors.textPrimary, fontWeight: '600' },
  chipPass: { borderColor: 'rgba(34,197,94,0.4)', backgroundColor: Colors.successDim },
  chipPassText: { color: Colors.success },
  chipFail: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: Colors.dangerDim },
  chipFailText: { color: Colors.danger },
});

// ── Main Screen ────────────────────────────────────────────────────────────

type Tab = 'saved' | 'recent';

export default function FavouritesScreen() {
  const [tab, setTab] = useState<Tab>('saved');
  const [saved, setSaved] = useState<SavedCalc[]>([]);
  const [recents, setRecents] = useState<SavedCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [s, r] = await Promise.all([getFavourites(), getRecents()]);
    setSaved(s);
    setRecents(r);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  async function handleDelete(id: string) {
    Alert.alert(
      'Remove',
      'Remove this saved calculation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFavourite(id);
            load();
          },
        },
      ],
    );
  }

  async function handleCopy(calc: SavedCalc) {
    Clipboard.setString(buildSummary(calc));
    Alert.alert('Copied!', 'Calculation details copied to clipboard');
  }

  function handleClearAll() {
    Alert.alert(
      'Clear All',
      'This will delete all saved and recent calculations. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            load();
          },
        },
      ],
    );
  }

  const displayList = tab === 'saved' ? saved : recents;
  const isEmpty = displayList.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'saved' && styles.tabActive]}
          onPress={() => setTab('saved')}
          accessibilityRole="tab"
        >
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
            ★ Saved ({saved.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'recent' && styles.tabActive]}
          onPress={() => setTab('recent')}
          accessibilityRole="tab"
        >
          <Text style={[styles.tabText, tab === 'recent' && styles.tabTextActive]}>
            🕐 Recent ({recents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Empty state */}
        {isEmpty && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{tab === 'saved' ? '★' : '🕐'}</Text>
            <Text style={styles.emptyTitle}>
              {tab === 'saved' ? 'No saved calculations' : 'No recent calculations'}
            </Text>
            <Text style={styles.emptyBody}>
              {tab === 'saved'
                ? 'Tap "★ Save to Favourites" in any calculator to save results here.'
                : 'Your recent calculations will appear here automatically.'}
            </Text>
          </View>
        )}

        {/* Calc list */}
        {!isEmpty && displayList.map(calc => (
          <CalcCard
            key={calc.id}
            calc={calc}
            onDelete={handleDelete}
            onCopy={handleCopy}
          />
        ))}

        {/* Clear all */}
        {(saved.length > 0 || recents.length > 0) && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Text style={styles.clearBtnText}>⚠️ Clear All Data</Text>
          </TouchableOpacity>
        )}

        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>📴 Stored on-device — fully offline</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.sm },
  emptyBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  clearBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.dangerDim,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearBtnText: { color: Colors.danger, fontWeight: '600', fontSize: 14 },
  offlineBadge: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.successDim,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
  },
  offlineBadgeText: { color: Colors.success, fontSize: 12, fontWeight: '600' },
});
