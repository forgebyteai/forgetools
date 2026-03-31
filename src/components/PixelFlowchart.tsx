/**
 * ForgeTools — PixelFlowchart Component (WFD-279)
 * Canvas-style pixel art decision flowchart renderer for React Native.
 * Renders troubleshooting decision trees with ForgeCore cyber aesthetic.
 * Nodes: cyan process boxes, orange decision diamonds, green/red terminal nodes.
 * No external dependencies — pure React Native Views + Text.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../lib/theme';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'decision' | 'process' | 'terminal-ok' | 'terminal-warn' | 'terminal-alert';
  yes?: string;   // id of yes-branch node
  no?: string;    // id of no-branch node
  next?: string;  // id of single-path next node
  yesLabel?: string;
  noLabel?: string;
}

export interface FlowchartDef {
  id: string;
  title: string;
  emoji: string;
  nodes: FlowNode[];
  startId: string;
}

// ── Flowchart Data ─────────────────────────────────────────────────────────

export const FLOWCHARTS: FlowchartDef[] = [
  {
    id: 'motor',
    title: "Motor Won't Start",
    emoji: '⚡',
    startId: 'start',
    nodes: [
      { id: 'start',       type: 'start',         label: 'Motor Won\'t Start', next: 'q1' },
      { id: 'q1',          type: 'decision',       label: 'Power at motor terminals?\n(L1/L2/L3 present)', yes: 'q2', no: 'a_nopower', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q2',          type: 'decision',       label: 'Motor humming but not rotating?', yes: 'q3', no: 'q4', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q3',          type: 'decision',       label: 'All 3 phases present at terminals?', yes: 'q3b', no: 'a_single_phase', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q3b',         type: 'decision',       label: 'Motor jammed mechanically?\n(Try turning by hand)', yes: 'a_mech_jam', no: 'a_overload_start', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q4',          type: 'decision',       label: 'OL relay / thermal overload tripped?', yes: 'a_thermal', no: 'q5', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q5',          type: 'decision',       label: 'Contactor energising?\n(Listen/feel for click)', yes: 'q6', no: 'q7', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q6',          type: 'decision',       label: 'Voltage present on contactor output?', yes: 'a_winding', no: 'a_contactor', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q7',          type: 'decision',       label: 'Control voltage present at coil?', yes: 'a_coil', no: 'a_control', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'a_nopower',   type: 'terminal-alert', label: '🔴 NO SUPPLY\nCheck MCB/fuses upstream, main switch, cable continuity to motor' },
      { id: 'a_single_phase', type: 'terminal-alert', label: '⚡ SINGLE PHASING\nIsolate immediately — only 2 phases present. Check fuses, contactor contacts, upstream protection' },
      { id: 'a_mech_jam',  type: 'terminal-warn',  label: '🔧 MECHANICAL LOCK\nRemove load, check bearings/coupling/driven equipment. May need rewind if overheated' },
      { id: 'a_overload_start', type: 'terminal-warn', label: '📋 OVERLOADED START\nLoad too heavy. Check FLA vs OL setting. Try unloaded start. Consider VFD.' },
      { id: 'a_thermal',   type: 'terminal-warn',  label: '🌡️ THERMAL TRIP\nCool 15–30 min, reset OL. Check OL setpoint vs motor FLA. Find overload root cause.' },
      { id: 'a_winding',   type: 'terminal-alert', label: '🔌 WINDING FAULT\nCheck motor windings for open circuit, ground fault. Megger test recommended.' },
      { id: 'a_contactor', type: 'terminal-warn',  label: '🔶 CONTACTOR FAULT\nContactor coil energised but contacts not making. Check contact wear, replace contactor.' },
      { id: 'a_coil',      type: 'terminal-warn',  label: '🔌 COIL FAULT\nControl voltage present but coil not pulling in. Replace contactor coil.' },
      { id: 'a_control',   type: 'terminal-alert', label: '🎛️ CONTROL CIRCUIT\nNo control voltage at coil. Check interlocks, E-stops, selector switch, control fuse, PLC output.' },
    ],
  },
  {
    id: 'vfd',
    title: 'VFD Fault Diagnosis',
    emoji: '🔄',
    startId: 'start',
    nodes: [
      { id: 'start',        type: 'start',         label: 'VFD Fault Active', next: 'q1' },
      { id: 'q1',           type: 'decision',       label: 'Is it an Overcurrent fault?\n(OC, OCC, OCA, F0001)', yes: 'q_oc1', no: 'q2', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q_oc1',        type: 'decision',       label: 'Fault on start or during run?', yes: 'a_oc_start', no: 'a_oc_run', yesLabel: 'ON START', noLabel: 'DURING RUN' },
      { id: 'q2',           type: 'decision',       label: 'Is it Overvoltage?\n(OV, OVF, F0002)', yes: 'a_ov', no: 'q3', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q3',           type: 'decision',       label: 'Is it Overtemperature?\n(OH, OHF, Temp fault)', yes: 'a_temp', no: 'q4', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q4',           type: 'decision',       label: 'Is it Phase Loss?\n(PH, Ph-Loss, Input phase)', yes: 'a_phase', no: 'q5', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q5',           type: 'decision',       label: 'Is it a Communication fault?\n(Comms, LOC, timeout)', yes: 'a_comms', no: 'a_other', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'a_oc_start',   type: 'terminal-warn',  label: '⚡ OC ON START\nAccel time too short (increase P1-06). Motor leads shorted. VFD output IGBT fault. Reduce boost.' },
      { id: 'a_oc_run',     type: 'terminal-warn',  label: '⚡ OC DURING RUN\nMechanical overload. Check load. Increase decel time. Check motor windings for turn-turn fault.' },
      { id: 'a_ov',         type: 'terminal-warn',  label: '📈 OVERVOLTAGE\nIncrease decel time. Enable dynamic braking / braking resistor. Check supply voltage quality.' },
      { id: 'a_temp',       type: 'terminal-alert', label: '🌡️ OVERTEMPERATURE\nCheck VFD cooling fans/heatsink. Clean fins. Verify ambient temp. Check enclosure ventilation. Reduce carrier frequency.' },
      { id: 'a_phase',      type: 'terminal-alert', label: '⚠️ PHASE LOSS\nCheck all 3 input phases at VFD terminals. Check upstream fuses, MCB. Inspect input cables.' },
      { id: 'a_comms',      type: 'terminal-warn',  label: '📡 COMMS FAULT\nCheck fieldbus cable (Modbus/Profibus/EtherNet/IP). Verify node address, baud rate, termination resistor. Check PLC comms settings.' },
      { id: 'a_other',      type: 'terminal-warn',  label: '📖 OTHER FAULT\nConsult VFD manual fault table. Common codes: GF=Ground Fault, UV=Undervoltage, SC=Short Circuit. Check event log for sequence.' },
    ],
  },
  {
    id: 'plc',
    title: 'PLC Not Communicating',
    emoji: '🎛️',
    startId: 'start',
    nodes: [
      { id: 'start',    type: 'start',        label: 'PLC Comms Failure', next: 'q1' },
      { id: 'q1',       type: 'decision',     label: 'Ethernet or Serial (RS-232/RS-485)?', yes: 'q_eth1', no: 'q_ser1', yesLabel: 'ETHERNET', noLabel: 'SERIAL' },
      { id: 'q_eth1',   type: 'decision',     label: 'Ethernet link light on PLC port?', yes: 'q_eth2', no: 'a_eth_phy', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q_eth2',   type: 'decision',     label: 'Can you PING the PLC IP?', yes: 'q_eth3', no: 'a_ip_config', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q_eth3',   type: 'decision',     label: 'Correct port/protocol in software?\n(Modbus TCP 502, EtherNet/IP 44818)', yes: 'a_eth_app', no: 'a_protocol', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q_ser1',   type: 'decision',     label: 'Is baud rate/parity/stop bits correct?\n(Match PLC manual settings)', yes: 'q_ser2', no: 'a_ser_settings', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q_ser2',   type: 'decision',     label: 'Correct TX/RX wiring?\n(RS-485: A/B polarity, RS-232: TX→RX cross)', yes: 'q_ser3', no: 'a_wiring', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q_ser3',   type: 'decision',     label: 'RS-485 termination resistor fitted?\n(120Ω at both ends of bus)', yes: 'a_ser_app', no: 'a_termination', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'a_eth_phy',   type: 'terminal-alert', label: '🔌 PHYSICAL LINK\nNo link light. Check cable (try replacement). Verify switch port active. Check PLC Ethernet module health.' },
      { id: 'a_ip_config', type: 'terminal-warn',  label: '🌐 IP CONFIG\nPLC IP may be wrong subnet or duplicate. Use vendor tool (RSLinx/TIA Portal) to set correct IP. Check PC subnet mask.' },
      { id: 'a_protocol',  type: 'terminal-warn',  label: '⚙️ PROTOCOL MISMATCH\nPort/protocol not matching. Check PLC configured protocol. Disable firewall on PC. Try ping again.' },
      { id: 'a_eth_app',   type: 'terminal-ok',    label: '✅ PHYSICAL OK — APP LAYER\nPhysical and IP OK. Issue is application layer. Check: unit ID/slave ID, function codes, register addressing (0-based vs 1-based).' },
      { id: 'a_ser_settings', type: 'terminal-warn', label: '⚙️ SERIAL SETTINGS\nBaud rate mismatch. Check PLC comms port config. Common defaults: 9600/19200 baud, 8-N-1, no flow control.' },
      { id: 'a_wiring',    type: 'terminal-alert', label: '🔌 WIRING ERROR\nRS-232: TX on one device must connect to RX on other (cross). RS-485: A(+) to A(+), B(-) to B(-). Common to swap.' },
      { id: 'a_termination', type: 'terminal-warn', label: '🔚 TERMINATION MISSING\n120Ω resistor required at each end of RS-485 bus. Without it: reflections cause comms errors at higher speeds/cable lengths.' },
      { id: 'a_ser_app',   type: 'terminal-ok',    label: '✅ PHYSICAL OK — SOFTWARE\nHardware settings correct. Check: Modbus slave address, register offset (HR40001=address 0 or 1 depending on driver). Try lower baud rate.' },
    ],
  },
  {
    id: 'hydraulic',
    title: 'Low Hydraulic Pressure',
    emoji: '💧',
    startId: 'start',
    nodes: [
      { id: 'start',    type: 'start',        label: 'Low Hydraulic Pressure', next: 'q1' },
      { id: 'q1',       type: 'decision',     label: 'Is fluid level in reservoir correct?', yes: 'q2', no: 'a_fluid', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q2',       type: 'decision',     label: 'Is the suction filter clean/not blocked?', yes: 'q3', no: 'a_filter', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q3',       type: 'decision',     label: 'Is the pump making unusual noise?\n(Cavitation whine, knocking)', yes: 'a_pump_noise', no: 'q4', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q4',       type: 'decision',     label: 'Does pressure rise when blocking all actuators\n(system unloaded)?', yes: 'a_actuator', no: 'q5', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q5',       type: 'decision',     label: 'Is main relief valve set correctly?\n(Check manual for setpoint)', yes: 'q6', no: 'a_relief', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'q6',       type: 'decision',     label: 'Is pump pressure output correct\n(test at pump outlet port)?', yes: 'a_downstream', no: 'a_pump_worn', yesLabel: 'YES', noLabel: 'NO' },
      { id: 'a_fluid',      type: 'terminal-alert', label: '⚠️ LOW FLUID\nTop up with correct grade hydraulic oil. Check for external leaks. Low fluid causes cavitation and pump damage.' },
      { id: 'a_filter',     type: 'terminal-warn',  label: '🔴 BLOCKED SUCTION FILTER\nReplace suction strainer/filter. A blocked suction causes cavitation, air ingestion, low pressure. Check return filter too.' },
      { id: 'a_pump_noise', type: 'terminal-alert', label: '🔊 CAVITATION/PUMP FAULT\nCavitation: check suction for restrictions, air leaks on suction line, low fluid. Knocking: pump failure — replace pump. Do not run cavitating pump.' },
      { id: 'a_actuator',   type: 'terminal-warn',  label: '🔩 ACTUATOR BYPASS\nPressure OK when blocked = actuator/valve bypassing. Check: cylinder seals (bypass test), directional valve spool, cartridge valves for wear.' },
      { id: 'a_relief',     type: 'terminal-warn',  label: '🎚️ RELIEF VALVE SETTING\nRelief valve set too low or stuck open. Adjust setpoint per spec (requires gauge & caution). May be contaminated — try cycling or replacing.' },
      { id: 'a_downstream', type: 'terminal-ok',    label: '✅ PUMP OK — DOWNSTREAM FAULT\nPump pressure correct. Pressure loss is downstream: check pressure-reducing valves, counterbalance valves, load sensing lines.' },
      { id: 'a_pump_worn',  type: 'terminal-alert', label: '🔧 PUMP WORN/FAILED\nPump not making pressure. Gear pump: inspect for worn gears/housing. Piston pump: check case drain flow (high = worn). Replace pump.' },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  flowchart: FlowchartDef;
  onBack?: () => void;
}

type NodeMap = Record<string, FlowNode>;

function buildNodeMap(nodes: FlowNode[]): NodeMap {
  const map: NodeMap = {};
  nodes.forEach(n => { map[n.id] = n; });
  return map;
}

export const PixelFlowchart: React.FC<Props> = ({ flowchart, onBack }) => {
  const nodeMap = buildNodeMap(flowchart.nodes);
  const [currentId, setCurrentId] = useState<string>(flowchart.startId);
  const [history, setHistory] = useState<string[]>([]);

  const current = nodeMap[currentId];

  const navigate = (nextId: string) => {
    setHistory(prev => [...prev, currentId]);
    setCurrentId(nextId);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setCurrentId(prev);
    } else if (onBack) {
      onBack();
    }
  };

  const restart = () => {
    setHistory([]);
    setCurrentId(flowchart.startId);
  };

  const isTerminal = current.type.startsWith('terminal');

  const getNodeStyle = () => {
    switch (current.type) {
      case 'start':         return styles.nodeStart;
      case 'decision':      return styles.nodeDecision;
      case 'terminal-ok':   return styles.nodeOk;
      case 'terminal-warn': return styles.nodeWarn;
      case 'terminal-alert':return styles.nodeAlert;
      default:              return styles.nodeProcess;
    }
  };

  const getNodeTextStyle = () => {
    switch (current.type) {
      case 'terminal-ok':   return styles.textOk;
      case 'terminal-warn': return styles.textWarn;
      case 'terminal-alert':return styles.textAlert;
      default:              return styles.textNode;
    }
  };

  const getNodeIcon = () => {
    switch (current.type) {
      case 'start':          return flowchart.emoji;
      case 'decision':       return '◆';
      case 'terminal-ok':    return '✅';
      case 'terminal-warn':  return '⚠️';
      case 'terminal-alert': return '🔴';
      default:               return '▶';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{flowchart.emoji} {flowchart.title}</Text>
        <Text style={styles.stepCounter}>
          Step {history.length + 1}{isTerminal ? ' — Done' : ''}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min((history.length / 8) * 100, 100)}%` }]} />
      </View>

      {/* Node card */}
      <View style={[styles.nodeCard, getNodeStyle()]}>
        <Text style={styles.nodeIcon}>{getNodeIcon()}</Text>
        <Text style={[styles.nodeLabel, getNodeTextStyle()]}>{current.label}</Text>
      </View>

      {/* Actions */}
      {current.type === 'start' && current.next && (
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigate(current.next!)}>
          <Text style={styles.btnPrimaryText}>▶  Start Diagnosis</Text>
        </TouchableOpacity>
      )}

      {current.type === 'decision' && (
        <View style={styles.decisionRow}>
          {current.yes && (
            <TouchableOpacity style={[styles.btnDecision, styles.btnYes]} onPress={() => navigate(current.yes!)}>
              <Text style={styles.btnDecisionText}>{current.yesLabel || 'YES ✓'}</Text>
            </TouchableOpacity>
          )}
          {current.no && (
            <TouchableOpacity style={[styles.btnDecision, styles.btnNo]} onPress={() => navigate(current.no!)}>
              <Text style={styles.btnDecisionText}>{current.noLabel || 'NO ✗'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {current.type === 'process' && current.next && (
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigate(current.next!)}>
          <Text style={styles.btnPrimaryText}>Continue →</Text>
        </TouchableOpacity>
      )}

      {isTerminal && (
        <TouchableOpacity style={[styles.btnPrimary, styles.btnRestart]} onPress={restart}>
          <Text style={styles.btnPrimaryText}>🔄  Start Over</Text>
        </TouchableOpacity>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {(history.length > 0 || onBack) && (
          <TouchableOpacity style={styles.btnBack} onPress={goBack}>
            <Text style={styles.btnBackText}>← Back</Text>
          </TouchableOpacity>
        )}
        {history.length > 0 && (
          <TouchableOpacity style={styles.btnReset} onPress={restart}>
            <Text style={styles.btnResetText}>↺ Restart</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Breadcrumb */}
      {history.length > 0 && (
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>
            Path: {history.map(id => {
              const n = nodeMap[id];
              return n?.type === 'start' ? 'Start' : '◆';
            }).join(' → ')} → {current.type === 'decision' ? '◆' : '■'}
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Flowchart Selector ─────────────────────────────────────────────────────

export const FlowchartSelector: React.FC<{
  onSelect: (f: FlowchartDef) => void;
}> = ({ onSelect }) => (
  <View>
    <Text style={styles.selectorTitle}>🎯 Interactive Pixel Flowcharts</Text>
    <Text style={styles.selectorSubtitle}>Tap a flowchart to start step-by-step diagnosis</Text>
    {FLOWCHARTS.map(fc => (
      <TouchableOpacity key={fc.id} style={styles.selectorCard} onPress={() => onSelect(fc)}>
        <Text style={styles.selectorEmoji}>{fc.emoji}</Text>
        <View style={styles.selectorText}>
          <Text style={styles.selectorName}>{fc.title}</Text>
          <Text style={styles.selectorCount}>{fc.nodes.filter(n => n.type === 'decision').length} decision points</Text>
        </View>
        <Text style={styles.selectorArrow}>▶</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.primary,
    flex: 1,
  },
  stepCounter: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  progressBg: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  // Node cards
  nodeCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'center',
  },
  nodeStart: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primaryBorder,
  },
  nodeDecision: {
    backgroundColor: 'rgba(251,146,60,0.1)',
    borderColor: 'rgba(251,146,60,0.4)',
  },
  nodeProcess: {
    backgroundColor: Colors.cardBg,
    borderColor: Colors.border,
  },
  nodeOk: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.4)',
  },
  nodeWarn: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.4)',
  },
  nodeAlert: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  nodeIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  nodeLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  textNode: { color: Colors.text },
  textOk:   { color: '#22c55e' },
  textWarn: { color: '#fbbf24' },
  textAlert:{ color: '#ef4444' },
  // Buttons
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  btnPrimaryText: {
    color: '#0a0a0a',
    fontWeight: '700',
    fontSize: 15,
  },
  btnRestart: {
    backgroundColor: 'rgba(251,146,60,0.2)',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  btnDecision: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnYes: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor: 'rgba(34,197,94,0.5)',
  },
  btnNo: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.5)',
  },
  btnDecisionText: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.text,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btnBack: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnBackText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  btnReset: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnResetText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  breadcrumb: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
  },
  breadcrumbText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  // Selector
  selectorTitle: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  selectorSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  selectorEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  selectorText:  { flex: 1 },
  selectorName:  { color: Colors.text, fontWeight: '700', fontSize: 15 },
  selectorCount: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  selectorArrow: { color: Colors.primary, fontSize: 20, fontWeight: '700' },
});

export default PixelFlowchart;
