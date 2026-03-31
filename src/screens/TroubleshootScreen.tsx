/**
 * ForgeTools — Troubleshoot Screen (WFD-250, WFD-279)
 * Expandable decision trees + PixelFlowchart interactive diagrams.
 * Motor, VFD, PLC, Hydraulic fault trees. Searchable + bookmarkable.
 * THE killer feature for field service — works 100% offline.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, Alert, Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, Radius } from '../lib/theme';
import { PixelFlowchart, FlowchartSelector, FLOWCHARTS, FlowchartDef } from '../components/PixelFlowchart';

// ── Types ──────────────────────────────────────────────────────────────────

interface TreeNode {
  question: string;
  answer?: string;           // Leaf: final resolution
  yes?: TreeNode;
  no?: TreeNode;
  check?: TreeNode;          // Single follow-on check (no yes/no branch)
  options?: {               // Multiple choice branch
    label: string;
    next: TreeNode;
  }[];
}

interface TroubleGuide {
  id: string;
  category: string;
  emoji: string;
  title: string;
  summary: string;
  tree: TreeNode;
}

// ── Data ───────────────────────────────────────────────────────────────────

const GUIDES: TroubleGuide[] = [
  {
    id: 'motor-wont-start',
    category: 'Electrical',
    emoji: '⚡',
    title: "Motor Won't Start",
    summary: 'Systematic check for motor starting failures',
    tree: {
      question: 'Is power reaching the motor terminals (L1/L2/L3 present at motor terminals)?',
      yes: {
        question: 'Is the motor humming but not rotating?',
        yes: {
          question: 'Is the motor connected star or delta?',
          options: [
            {
              label: 'Star (Y)',
              next: {
                question: 'Check for single-phasing — is voltage present on ALL 3 terminals?',
                yes: {
                  question: 'Is the motor mechanically jammed (try rotating by hand)?',
                  yes: {
                    answer: '🔧 MECHANICAL LOCK: Remove load and try again. Check bearing, coupling, driven equipment for mechanical bind. May need motor rewind if overheated.',
                  },
                  no: {
                    answer: '📋 OVERLOADED START: Load too heavy for star start. Check motor FLA vs overload setting. Try unloaded start. Consider star-delta or VFD.',
                  },
                },
                no: {
                  answer: '⚡ SINGLE PHASE SUPPLY: Only 2 phases reaching motor. Check fuses, contactors, and upstream protection. A single-phasing motor will hum and overheat — isolate immediately.',
                },
              },
            },
            {
              label: 'Delta (Δ)',
              next: {
                question: 'Is the motor thermally tripped (OL relay tripped)?',
                yes: {
                  answer: '🌡️ THERMAL OVERLOAD TRIPPED: Allow motor to cool 15–30 min. Reset OL relay. Check overload setting vs motor FLA. Investigate root cause of overload (binding, overload, VFD setting).',
                },
                no: {
                  answer: '🔌 CHECK DELTA CONNECTIONS: Verify all 6 motor terminals correctly terminated for delta configuration. Measure resistance phase-to-phase — should be equal.',
                },
              },
            },
          ],
        },
        no: {
          question: 'Is the motor thermal overload indicator showing tripped?',
          yes: {
            answer: '🌡️ THERMAL OVERLOAD TRIPPED: Allow motor to cool (15–30 min). Reset OL relay. Review: OL setting vs motor FLA nameplate, ambient temperature, duty cycle, ventilation.',
          },
          no: {
            question: 'Is the motor wound (resistance between windings, not open circuit)?',
            yes: {
              answer: '📋 MOTOR OK BUT WONT RUN: Control circuit issue. Check: contactor coil voltage, control fuse, stop/start button continuity, interlock relay, PLC output. Trace control circuit from supply to coil.',
            },
            no: {
              answer: '💀 OPEN CIRCUIT WINDING: Motor has a failed winding. Megger test all windings (should be >1 MΩ to earth). Check all winding-to-winding continuity. Motor likely needs rewinding or replacement.',
            },
          },
        },
      },
      no: {
        question: 'Is the supply voltage present at the control panel / MCC?',
        yes: {
          question: 'Is the main circuit breaker or fuse OK?',
          yes: {
            question: 'Is the contactor/starter energised (is the contactor coil pulled in)?',
            yes: {
              answer: '🔌 CONTACTOR CLOSED BUT NO OUTPUT: Check contactor main contacts — may be welded open, burnt, or high resistance. Measure voltage across each contact with contactor energised.',
            },
            no: {
              question: 'Is the contactor coil getting control voltage?',
              yes: {
                answer: '💀 FAILED CONTACTOR COIL: Coil getting voltage but not pulling in. Check coil resistance (should be non-zero). Replace coil or contactor.',
              },
              no: {
                answer: '🔍 CONTROL CIRCUIT FAULT: Coil not getting supply. Check: control fuse, E-stop circuit, interlock relays, PLC output, start button, auxiliary contacts. Use voltmeter to trace through circuit.',
              },
            },
          },
          no: {
            answer: '🔴 UPSTREAM PROTECTION TRIPPED: Check MCB/fuse status. For MCB: reset and monitor for trip reason. For fuse: check with continuity tester, replace with same rating. Investigate trip cause before restarting.',
          },
        },
        no: {
          answer: '⚡ NO SUPPLY VOLTAGE: Check incoming supply at the panel. Verify isolator is on, upstream fuses/breakers not tripped, incoming cable connections secure. Contact electrician if main supply issue.',
        },
      },
    },
  },

  {
    id: 'vfd-fault',
    category: 'Electrical',
    emoji: '🔁',
    title: 'VFD Fault Code',
    summary: 'Diagnose common VFD fault codes',
    tree: {
      question: 'What type of fault is displayed?',
      options: [
        {
          label: 'OC / Overcurrent',
          next: {
            question: 'Did the fault occur at startup or during running?',
            options: [
              {
                label: 'At startup',
                next: {
                  answer: '📋 STARTUP OC: Likely causes: (1) Accel time too short — increase accel ramp, (2) Load too heavy — check mechanical system, (3) Motor wiring fault — check all 3 phases to motor, (4) Current limit set too low — check parameter. For VFDs: Siemens use P1121, AB PowerFlex use Accel Time 1.',
                },
              },
              {
                label: 'During running',
                next: {
                  answer: '⚡ RUN OC: Likely causes: (1) Sudden load increase — check driven equipment for jam, (2) VFD output cable fault — check for ground fault or phase-to-phase short, (3) Motor insulation failure — megger motor, (4) Decel too fast causing regen — add braking resistor or extend decel time.',
                },
              },
              {
                label: 'During decel',
                next: {
                  answer: '🔄 DECEL OC / OV: Bus overvoltage from regeneration. Extend decel time, add dynamic braking resistor, or enable flux braking in VFD parameters.',
                },
              },
            ],
          },
        },
        {
          label: 'OV / Overvoltage',
          next: {
            answer: '⚡ OVERVOLTAGE FAULT: DC bus voltage exceeded. Causes: (1) Mains voltage too high — check supply with meter, (2) Regen from motor during decel — extend decel time, enable dynamic braking, add braking resistor, (3) VFD undervoltage trip threshold incorrect — check parameters.',
          },
        },
        {
          label: 'UV / Undervoltage',
          next: {
            answer: '🔌 UNDERVOLTAGE FAULT: DC bus too low. Causes: (1) Supply voltage dip — check mains voltage quality, (2) Supply fuse/breaker tripped, (3) Input rectifier fault, (4) Power cycling during run. Check incoming supply voltage under load.',
          },
        },
        {
          label: 'OT / Overtemperature',
          next: {
            question: 'Is the VFD heatsink hot to touch?',
            yes: {
              answer: '🌡️ THERMAL OVERLOAD — VFD: Causes: (1) Ambient temperature too high — check enclosure ventilation, (2) Cooling fan failed — check VFD internal fan, (3) VFD running at high continuous load — check output current vs VFD rating, (4) Heatsink fins blocked — clean with compressed air.',
            },
            no: {
              answer: '🌡️ MOTOR TEMP FAULT: If VFD is using motor PTC/thermistor input, motor has overheated. Allow motor to cool. Check: motor load vs nameplate FLA, ambient temp, ventilation, duty cycle.',
            },
          },
        },
        {
          label: 'GF / Ground Fault',
          next: {
            answer: '⚡ GROUND FAULT: Current leaking to earth. Actions: (1) Isolate VFD from motor cable, megger motor (>1 MΩ to earth), (2) Inspect motor cable for damaged insulation, (3) Check motor terminal box for moisture or tracking, (4) Inspect VFD output terminals. Do NOT run with ground fault — fire risk.',
          },
        },
        {
          label: 'PH / Phase Loss',
          next: {
            answer: '🔌 PHASE LOSS FAULT: VFD not seeing all 3 input phases. Check: (1) Input fuses — measure voltage on all 3 phases at VFD input terminals, (2) Input contactor/isolator contacts, (3) Supply cable connections. Note: some VFDs can run single-phase but will fault on phase loss monitoring.',
          },
        },
        {
          label: 'Other/Unknown',
          next: {
            answer: '📖 LOOKUP FAULT CODE: Check your drive manual for exact fault code. Common resources: (1) Siemens SINAMICS — Chapter 8 fault list, F codes vs A codes (A = warning), (2) AB PowerFlex — see Technical Data manual, (3) Danfoss — see Programming Guide. Most faults have Sub-codes for root cause.',
          },
        },
      ],
    },
  },

  {
    id: 'plc-comms',
    category: 'Control',
    emoji: '🖥️',
    title: 'PLC Not Communicating',
    summary: 'Diagnose PLC communication failures',
    tree: {
      question: 'What communication type is being used?',
      options: [
        {
          label: 'Ethernet (EtherNet/IP, Modbus TCP)',
          next: {
            question: 'Can you ping the PLC IP address?',
            yes: {
              question: 'Are you using the correct port and protocol?',
              yes: {
                answer: '🔍 APPLICATION LAYER FAULT: Ping works but comms fail. Check: (1) PLC is in RUN mode — faulted PLCs often stop responding, (2) Firewall blocking port (Modbus TCP: 502, EtherNet/IP: 44818), (3) Connection limit reached — PLCs have max client limit, (4) IP address conflict on network, (5) Incorrect slot/instance number in config.',
              },
              no: {
                answer: '📋 WRONG PROTOCOL CONFIG: Check your software settings. Modbus TCP: Port 502, Function codes. EtherNet/IP: Port 44818, CIP path configuration. Ensure PLC is configured as a server/adapter.',
              },
            },
            no: {
              question: 'Is the Ethernet link light on at the PLC?',
              yes: {
                answer: '🌐 NETWORK/IP ISSUE: Link is up but no ping. Check: (1) IP address and subnet mask — are PC and PLC on same subnet? (2) Try pinging from same subnet, (3) VLAN/routing issue, (4) Duplicate IP address conflict, (5) PLC CPU fault may disable Ethernet module.',
              },
              no: {
                answer: '🔌 PHYSICAL LINK DOWN: No Ethernet link detected. Check: (1) Cable plugged into correct port (some PLCs have multiple ports), (2) Cable integrity — try swapping cable, (3) PLC port may be damaged — try alternate port, (4) Switch port status — check switch interface LEDs.',
              },
            },
          },
        },
        {
          label: 'Serial (Modbus RTU, RS-232/485)',
          next: {
            question: 'Is the RS-485/232 cable correct (2-wire or 4-wire)?',
            yes: {
              question: 'Is the baud rate, parity, stop bits matching on both ends?',
              yes: {
                question: 'Is there a 120Ω termination resistor at each end of the RS-485 bus?',
                yes: {
                  answer: '🔍 PROTOCOL/ADDRESS ISSUE: Physical layer OK. Check: (1) Modbus slave address — must match PLC config, (2) Function code supported by PLC model, (3) Register addressing (0-based vs 1-based), (4) Coil vs holding register type correct.',
                },
                no: {
                  answer: '🔌 MISSING TERMINATION: RS-485 bus requires 120Ω termination at each physical end of the cable. Without this, reflections cause comms errors especially at longer distances or higher baud rates. Add termination resistors.',
                },
              },
              no: {
                answer: '⚙️ BAUD RATE MISMATCH: Serial comms settings MUST match exactly: baud rate, data bits (usually 8), parity (None/Even/Odd), stop bits (1 or 2). Check both master and slave device configuration.',
              },
            },
            no: {
              answer: '🔌 WIRING ISSUE: RS-485 (2-wire): A(+) to A(+), B(-) to B(-). RS-485 (4-wire): TX+/TX- from master to RX+/RX- of slave. RS-232: TX connects to RX. Check for polarity reversal. Measure voltage with meter — RS-485 idle should show ~200mV between A and B.',
            },
          },
        },
        {
          label: 'USB/Proprietary (programming cable)',
          next: {
            answer: '💻 PROGRAMMING CABLE COMMS: Checklist: (1) Install the correct driver for your cable (USB-RS232 adapters need driver), (2) Correct COM port selected in software, (3) Only ONE software instance trying to connect, (4) Cable is for your specific PLC brand (Siemens PROFIBUS ≠ AB DH+), (5) PLC in correct mode for programming (not Run-only locked), (6) Try a different USB port.',
          },
        },
      ],
    },
  },

  {
    id: 'hydraulic-pressure',
    category: 'Hydraulic',
    emoji: '💧',
    title: 'Hydraulic Pressure Low',
    summary: 'Diagnose low hydraulic pressure issues',
    tree: {
      question: 'Is the hydraulic pump running?',
      yes: {
        question: 'Is the pump making unusual noise (cavitation/grinding)?',
        yes: {
          question: 'Is the fluid level in the reservoir low?',
          yes: {
            answer: '💧 LOW FLUID LEVEL: Top up reservoir with correct hydraulic fluid grade. Check system for leaks. Cavitation from low fluid can cause rapid pump wear — do not operate with low level.',
          },
          no: {
            answer: '⚠️ PUMP CAVITATION/WORN: Possible causes: (1) Clogged suction strainer — check and clean, (2) Suction line restriction or collapse, (3) Fluid too viscous (cold climate) — check fluid grade vs ambient temp, (4) Pump worn internally — check for metal particles in filter, measure case drain flow.',
          },
        },
        no: {
          question: 'Is the pressure relief valve set correctly?',
          yes: {
            question: 'Is the system showing flow (actuators moving, even slowly)?',
            yes: {
              answer: '🔧 FLOW BUT LOW PRESSURE: Relief valve may be stuck open or worn. Temporarily increase relief valve setting (within spec) to test — if pressure rises, relief valve needs service. Also check: directional valve spool stuck in neutral, downstream flow control valve.',
            },
            no: {
              answer: '⛔ NO FLOW FROM PUMP: Pump not building pressure or flow. Check: (1) Pump coupling — may have sheared, (2) Pump inlet/outlet check valves, (3) Pump may have seized or lost internal clearance — measure case drain flow (excessive = worn pump), (4) Proportional/servo valve stuck.',
            },
          },
          no: {
            answer: '⚙️ RELIEF VALVE TOO LOW: Set relief valve to correct system pressure (check machine manual). Use calibrated gauge. Set to 10% above maximum working pressure. Ensure no one is in the hazard zone when adjusting.',
          },
        },
      },
      no: {
        question: 'Is the pump motor running?',
        yes: {
          answer: '⚙️ PUMP COUPLING FAILURE: Motor running but pump not turning. Check: (1) Coupling between motor and pump — may be sheared or slipping, (2) Pump shaft key, (3) Pump seized (try rotating by hand — should be smooth with slight resistance).',
        },
        no: {
          answer: '⚡ PUMP MOTOR NOT RUNNING: Return to motor fault tree. Common causes: (1) Thermal overload tripped (hydraulic units overheat easily in summer), (2) Control circuit fault, (3) Emergency stop active, (4) PLC not sending pump start signal — check PLC output.',
        },
      },
    },
  },

  {
    id: 'sensor-fault',
    category: 'Instrumentation',
    emoji: '📡',
    title: 'Sensor / Transmitter Fault',
    summary: 'Diagnose sensor signal failures',
    tree: {
      question: 'What type of sensor output?',
      options: [
        {
          label: '4–20mA Analogue',
          next: {
            question: 'Is the signal reading 0mA (or not present)?',
            yes: {
              question: 'Is the loop power supply voltage correct (typically 24VDC)?',
              yes: {
                question: 'Is the wiring correct (+ to + on transmitter, loop back through AI card)?',
                yes: {
                  answer: '💀 TRANSMITTER FAILED OPEN: 0mA usually means open circuit fault or dead transmitter. Disconnect transmitter and connect a 250Ω resistor — if AI card reads correctly, transmitter has failed. Check transmitter terminal voltage (should be 12–24V).',
                },
                no: {
                  answer: '🔌 WIRING FAULT: For 4-20mA 2-wire: PSU+ → AI+ → transmitter+ → transmitter- → AI-. For 4-wire: PSU to transmitter for power, separate pair for signal. Measure voltage at transmitter terminals.',
                },
              },
              no: {
                answer: '⚡ LOOP SUPPLY ISSUE: Check 24VDC loop supply at terminal. Check supply fuse. Ensure AI card loop supply enabled (some AI cards require parameter enabling the loop supply).',
              },
            },
            no: {
              question: 'Is the signal stuck at 20mA (or above)?',
              yes: {
                answer: '📡 SIGNAL SATURATED: Full-scale output usually means sensor reading above range. Check: (1) Process value is actually within sensor range, (2) Transmitter configuration — zero and span calibration, (3) Sensor element damaged (pressure: blocked or overpressured, temp: RTD open).',
              },
              no: {
                answer: '⚙️ SIGNAL DRIFTING/INACCURATE: Check: (1) Transmitter calibration — compare to reference instrument, (2) Electrical noise — check cable shielding and grounding, (3) Process isolation valve partially closed, (4) Impulse lines blocked or air-bound (pressure transmitters).',
              },
            },
          },
        },
        {
          label: 'Digital (PNP/NPN Proximity)',
          next: {
            question: 'Is 24VDC supply present at sensor (brown wire)?',
            yes: {
              question: 'Is the target within rated sensing range?',
              yes: {
                answer: '🔍 SIGNAL ISSUE: Sensor has power and target in range. Check: (1) PNP vs NPN — output type must match input type on PLC card, (2) Cable damaged — inspect output wire (black for NPN/PNP), (3) Sensor LED status — most have indicator LED on body, (4) Sensor contaminated — clean sensing face, (5) Target material not sensed — inductive sensors only sense metal.',
              },
              no: {
                answer: '📏 TARGET TOO FAR: Move target within the rated sensing distance (shown on sensor body or datasheet). Reduce by 30% for flush mounting. Note: stainless steel reduces inductive sensing distance by ~50%.',
              },
            },
            no: {
              answer: '⚡ NO SUPPLY TO SENSOR: Check: (1) Fuse/circuit breaker for 24VDC sensor supply, (2) Cable from junction box to sensor — check for damage, (3) Measure voltage at the sensor connector with meter.',
            },
          },
        },
        {
          label: 'PT100 / RTD (Temperature)',
          next: {
            question: 'Is the resistance reading open circuit on the AI card?',
            yes: {
              answer: '💀 RTD OPEN CIRCUIT: Measure resistance at sensor head: PT100 should read ~100Ω at 0°C, ~138Ω at 100°C. Open circuit = failed sensor or broken wire. Check cable continuity end-to-end. 3-wire RTDs: all 3 wires must be connected correctly.',
            },
            no: {
              answer: '⚙️ RTD INACCURATE: Check: (1) 2-wire vs 3-wire vs 4-wire configuration — must match AI card setting, (2) Cable resistance adding error (use 3 or 4-wire for long runs), (3) AI card PT100 type selected (vs PT1000 or NTC), (4) Sensor contaminated or air gap between sensor and process, (5) Compare to calibrated reference thermometer.',
            },
          },
        },
      ],
    },
  },
];

const BOOKMARK_KEY = '@forgetools:troubleshoot_bookmarks';

// ── Decision Tree Component ──────────────────────────────────────────────

interface BreadcrumbItem { question: string; answer: string }

function DecisionTree({ tree, onDone }: { tree: TreeNode; onDone: () => void }) {
  const [history, setHistory] = useState<BreadcrumbItem[]>([]);
  const [current, setCurrent] = useState<TreeNode>(tree);
  const [done, setDone] = useState(false);

  const answer = current.answer;

  function choose(next: TreeNode, label: string) {
    setHistory(h => [...h, { question: current.question, answer: label }]);
    if (next.answer) {
      setHistory(h => [...h, { question: current.question, answer: label }]);
      setCurrent(next);
      setDone(true);
    } else {
      setCurrent(next);
    }
  }

  function reset() {
    setHistory([]);
    setCurrent(tree);
    setDone(false);
  }

  async function copyResult() {
    if (!current.answer) return;
    const text = `TROUBLESHOOT RESULT\n\n${current.answer}\n\nSteps:\n${history.map((h, i) => `${i + 1}. ${h.question}\n   → ${h.answer}`).join('\n')}`;
    Clipboard.setString(text);
    Alert.alert('Copied', 'Diagnostic result copied to clipboard');
  }

  return (
    <View>
      {/* Breadcrumb */}
      {history.length > 0 && (
        <View style={tree_styles.breadcrumb}>
          {history.map((h, i) => (
            <View key={i} style={tree_styles.crumbRow}>
              <Text style={tree_styles.crumbQ} numberOfLines={2}>{h.question}</Text>
              <Text style={tree_styles.crumbA}>→ {h.answer}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Current question or answer */}
      <View style={tree_styles.nodeCard}>
        {!done ? (
          <>
            <Text style={tree_styles.question}>{current.question}</Text>

            {/* Options/Multiple choice */}
            {current.options && (
              <View style={tree_styles.optionList}>
                {current.options.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={tree_styles.optionBtn}
                    onPress={() => choose(opt.next, opt.label)}
                    accessibilityRole="button"
                  >
                    <Text style={tree_styles.optionText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Yes/No */}
            {!current.options && (current.yes || current.no) && (
              <View style={tree_styles.yesno}>
                {current.yes && (
                  <TouchableOpacity
                    style={[tree_styles.yesBtn]}
                    onPress={() => choose(current.yes!, 'Yes')}
                    accessibilityRole="button"
                  >
                    <Text style={tree_styles.yesText}>✓ YES</Text>
                  </TouchableOpacity>
                )}
                {current.no && (
                  <TouchableOpacity
                    style={[tree_styles.noBtn]}
                    onPress={() => choose(current.no!, 'No')}
                    accessibilityRole="button"
                  >
                    <Text style={tree_styles.noText}>✗ NO</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={tree_styles.resultLabel}>🔍 DIAGNOSIS</Text>
            <Text style={tree_styles.resultText}>{current.answer}</Text>
            <View style={tree_styles.actionRow}>
              <TouchableOpacity style={tree_styles.copyBtn} onPress={copyResult}>
                <Text style={tree_styles.copyBtnText}>⎘ Copy Result</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tree_styles.resetBtn} onPress={reset}>
                <Text style={tree_styles.resetBtnText}>↺ Start Over</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Back */}
      {history.length > 0 && !done && (
        <TouchableOpacity
          style={tree_styles.backBtn}
          onPress={() => {
            const newHistory = [...history];
            newHistory.pop();
            setHistory(newHistory);
            // Rebuild current by replaying history from tree
            let node = tree;
            for (const h of newHistory) {
              if (h.answer === 'Yes' && node.yes) node = node.yes;
              else if (h.answer === 'No' && node.no) node = node.no;
              else if (node.options) {
                const opt = node.options.find(o => o.label === h.answer);
                if (opt) node = opt.next;
              }
            }
            setCurrent(node);
          }}
        >
          <Text style={tree_styles.backText}>← Back</Text>
        </TouchableOpacity>
      )}

      {done && (
        <TouchableOpacity style={tree_styles.doneBtn} onPress={onDone}>
          <Text style={tree_styles.doneBtnText}>✓ Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const tree_styles = StyleSheet.create({
  breadcrumb: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  crumbRow: { marginBottom: 6 },
  crumbQ: { fontSize: 11, color: Colors.textMuted, lineHeight: 15 },
  crumbA: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  nodeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  question: { ...Typography.body, lineHeight: 22, marginBottom: Spacing.md },
  yesno: { flexDirection: 'row', gap: Spacing.sm },
  yesBtn: {
    flex: 1,
    backgroundColor: Colors.successDim,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  noBtn: {
    flex: 1,
    backgroundColor: Colors.dangerDim,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  yesText: { color: Colors.success, fontWeight: '700', fontSize: 15 },
  noText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
  optionList: { gap: Spacing.sm },
  optionBtn: {
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  optionText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  resultLabel: { color: Colors.secondary, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  resultText: { color: Colors.textPrimary, lineHeight: 22, fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  copyBtn: {
    flex: 1,
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  copyBtnText: { color: Colors.primary, fontWeight: '600' },
  resetBtn: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  resetBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  backBtn: {
    padding: Spacing.sm,
    alignItems: 'flex-start',
  },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  doneBtn: {
    backgroundColor: Colors.successDim,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  doneBtnText: { color: Colors.success, fontWeight: '700', fontSize: 15 },
});

// ── Main Screen ────────────────────────────────────────────────────────────

const CATEGORIES_LIST = ['All', ...new Set(GUIDES.map(g => g.category))];

export default function TroubleshootScreen() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [activeGuide, setActiveGuide] = useState<TroubleGuide | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'text' | 'flowchart'>('text');
  const [activeFlowchart, setActiveFlowchart] = useState<FlowchartDef | null>(null);

  // Load bookmarks on mount
  React.useEffect(() => {
    AsyncStorage.getItem(BOOKMARK_KEY).then(raw => {
      if (raw) setBookmarks(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const toggleBookmark = useCallback(async (id: string) => {
    const updated = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id];
    setBookmarks(updated);
    await AsyncStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
  }, [bookmarks]);

  const filtered = useMemo(() => {
    return GUIDES.filter(g => {
      const matchCat = selectedCat === 'All' || g.category === selectedCat;
      const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase())
        || g.summary.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, selectedCat]);

  if (activeGuide) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <TouchableOpacity style={styles.backHeader} onPress={() => setActiveGuide(null)}>
            <Text style={styles.backHeaderText}>← Back to list</Text>
          </TouchableOpacity>
          <View style={styles.guideHeader}>
            <Text style={styles.guideEmoji}>{activeGuide.emoji}</Text>
            <Text style={styles.guideTitle}>{activeGuide.title}</Text>
            <Text style={styles.guideSummary}>{activeGuide.summary}</Text>
          </View>
          <DecisionTree tree={activeGuide.tree} onDone={() => setActiveGuide(null)} />
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>📴 Offline — works without internet</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Flowchart mode ───────────────────────────────────────────────────────
  if (viewMode === 'flowchart') {
    if (activeFlowchart) {
      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <TouchableOpacity style={styles.backHeader} onPress={() => setActiveFlowchart(null)}>
              <Text style={styles.backHeaderText}>← Back to flowcharts</Text>
            </TouchableOpacity>
            <PixelFlowchart flowchart={activeFlowchart} onBack={() => setActiveFlowchart(null)} />
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>📴 Offline — works without internet</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity style={[styles.modeBtn, styles.modeBtnInactive]} onPress={() => setViewMode('text')}>
              <Text style={styles.modeBtnText}>📋 Text Guide</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, styles.modeBtnActive]}>
              <Text style={[styles.modeBtnText, styles.modeBtnTextActive]}>🎮 Flowchart</Text>
            </TouchableOpacity>
          </View>
          <FlowchartSelector onSelect={fc => setActiveFlowchart(fc)} />
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>📴 All flowcharts work offline</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, styles.modeBtnActive]}>
            <Text style={[styles.modeBtnText, styles.modeBtnTextActive]}>📋 Text Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, styles.modeBtnInactive]} onPress={() => setViewMode('flowchart')}>
            <Text style={styles.modeBtnText}>🎮 Flowchart</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Search troubleshoot guides..."
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel="Search troubleshooting guides"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar} contentContainerStyle={styles.catBarInner}>
          {CATEGORIES_LIST.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catTab, selectedCat === cat && styles.catTabActive]}
              onPress={() => setSelectedCat(cat)}
              accessibilityRole="tab"
            >
              <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Guide list */}
        <View style={styles.list}>
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No guides match your search</Text>
            </View>
          )}
          {filtered.map(g => (
            <View key={g.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => setActiveGuide(g)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${g.title} troubleshoot guide`}
              >
                <Text style={styles.cardEmoji}>{g.emoji}</Text>
                <View style={styles.cardText}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{g.title}</Text>
                    <Text style={styles.cardCat}>{g.category}</Text>
                  </View>
                  <Text style={styles.cardSummary}>{g.summary}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bookmarkBtn}
                onPress={() => toggleBookmark(g.id)}
                accessibilityLabel={`${bookmarks.includes(g.id) ? 'Remove' : 'Add'} ${g.title} bookmark`}
              >
                <Text style={[styles.bookmarkIcon, bookmarks.includes(g.id) && styles.bookmarkActive]}>
                  {bookmarks.includes(g.id) ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>📴 All guides work offline — no internet required</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  modeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  modeBtn: { flex: 1, padding: Spacing.sm, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1 },
  modeBtnActive:   { backgroundColor: Colors.primaryDim, borderColor: Colors.primaryBorder },
  modeBtnInactive: { backgroundColor: Colors.cardBg, borderColor: Colors.border },
  modeBtnText: { fontWeight: '600', fontSize: 13, color: Colors.textMuted },
  modeBtnTextActive: { color: Colors.primary },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  searchWrap: { marginBottom: Spacing.sm },
  search: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 44,
  },
  catBar: { marginBottom: Spacing.sm },
  catBarInner: { paddingRight: Spacing.md, gap: Spacing.xs, flexDirection: 'row' },
  catTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    minHeight: 36,
    justifyContent: 'center',
  },
  catTabActive: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryDim },
  catText: { color: Colors.textMuted, fontWeight: '500', fontSize: 13 },
  catTextActive: { color: Colors.primary, fontWeight: '700' },
  list: { gap: Spacing.sm },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  cardText: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  cardTitle: { ...Typography.h3, flex: 1, marginRight: Spacing.xs },
  cardCat: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  cardSummary: { ...Typography.caption, lineHeight: 16 },
  cardArrow: { color: Colors.primary, fontSize: 22, fontWeight: '700' },
  bookmarkBtn: {
    padding: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkIcon: { fontSize: 22, color: Colors.textMuted },
  bookmarkActive: { color: Colors.secondary },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
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
  // Guide header
  backHeader: { marginBottom: Spacing.sm },
  backHeaderText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  guideHeader: { alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.primaryBorder },
  guideEmoji: { fontSize: 40, marginBottom: 6 },
  guideTitle: { ...Typography.h1, color: Colors.primary, marginBottom: 4 },
  guideSummary: { ...Typography.caption, textAlign: 'center' },
});
