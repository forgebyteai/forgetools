/**
 * ForgeTools App Navigation
 * Bottom tabs: Calculators | Convert | Troubleshoot | Favourites
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/theme';

// Tab screens
import HomeScreen from '../screens/HomeScreen';
import ConvertersScreen from '../screens/ConvertersScreen';
import TroubleshootScreen from '../screens/TroubleshootScreen';
import FavouritesScreen from '../screens/FavouritesScreen';

// Calculator screens — electrical
import VoltageDropCalculator from '../screens/calculators/VoltageDropCalculator';
import WireGaugeCalculator from '../screens/calculators/WireGaugeCalculator';
import MotorVFDCalculator from '../screens/calculators/MotorVFDCalculator';

// Calculator screens — CNC
import CNCFeedSpeedCalculator from '../screens/calculators/CNCFeedSpeedCalculator';
import PunchTonnageCalculator from '../screens/calculators/PunchTonnageCalculator';

// Calculator screens — sheet metal / laser
import PressBrakeTonnageCalculator from '../screens/calculators/PressBrakeTonnageCalculator';
import LaserFocalCalculator from '../screens/calculators/LaserFocalCalculator';
import BendAllowanceCalculator from '../screens/calculators/BendAllowanceCalculator';

// Calculator screens — mechanical / engineering (WFD-280)
import PneumaticCylinderCalculator from '../screens/calculators/PneumaticCylinderCalculator';
import HydraulicCylinderCalculator from '../screens/calculators/HydraulicCylinderCalculator';
import ThreadTapDrillCalculator from '../screens/calculators/ThreadTapDrillCalculator';
import WeldStrengthCalculator from '../screens/calculators/WeldStrengthCalculator';

// Calculator screens — WFD-284, WFD-285
import BearingSelectionCalculator from '../screens/calculators/BearingSelectionCalculator';
import ThermalExpansionCalculator from '../screens/calculators/ThermalExpansionCalculator';

// Placeholder screens for upcoming calculators
import { ComingSoonScreen } from '../screens/ComingSoonScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_HEADER_OPTS = {
  headerStyle: { backgroundColor: Colors.bgCard },
  headerTintColor: Colors.primary,
  headerTitleStyle: { color: Colors.textPrimary, fontWeight: '600' as const },
  headerBackTitleVisible: false,
};

function CalculatorsStack() {
  return (
    <Stack.Navigator screenOptions={NAV_HEADER_OPTS}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '🔧 ForgeTools' }}
      />
      {/* Electrical */}
      <Stack.Screen
        name="VoltageDropCalculator"
        component={VoltageDropCalculator}
        options={{ title: '⚡ Voltage Drop' }}
      />
      <Stack.Screen
        name="WireGaugeCalculator"
        component={WireGaugeCalculator}
        options={{ title: '🔌 Wire Gauge' }}
      />
      {/* Electrical calculators — implemented */}
      <Stack.Screen
        name="MotorVFDCalculator"
        component={MotorVFDCalculator}
        options={{ title: '🔁 Motor & VFD' }}
      />
      {/* CNC calculators — implemented */}
      <Stack.Screen
        name="CNCFeedSpeedCalculator"
        component={CNCFeedSpeedCalculator}
        options={{ title: '🔩 CNC Feed & Speed' }}
      />
      <Stack.Screen
        name="PunchTonnageCalculator"
        component={PunchTonnageCalculator}
        options={{ title: '🏋️ Punch Tonnage' }}
      />
      {/* Coming soon placeholders — WFD-249+ */}
      <Stack.Screen
        name="ThreePhaseCalculator"
        children={(props) => <ComingSoonScreen {...props} title="3-Phase Power Calculator" emoji="3️⃣" />}
        options={{ title: '3️⃣ 3-Phase Power' }}
      />
      <Stack.Screen
        name="OhmsLawCalculator"
        children={(props) => <ComingSoonScreen {...props} title="Ohm's Law Calculator" emoji="🔦" />}
        options={{ title: "🔦 Ohm's Law" }}
      />
      <Stack.Screen
        name="PressBrakeCalculator"
        component={PressBrakeTonnageCalculator}
        options={{ title: '📐 Press Brake Tonnage' }}
      />
      <Stack.Screen
        name="LaserFocalCalculator"
        component={LaserFocalCalculator}
        options={{ title: '🔴 Laser Focal Point' }}
      />
      <Stack.Screen
        name="BendAllowanceCalculator"
        component={BendAllowanceCalculator}
        options={{ title: '📏 Bend Allowance' }}
      />
      <Stack.Screen
        name="UnitConverter"
        component={ConvertersScreen}
        options={{ title: '🔄 Unit Converter' }}
      />
      {/* Engineering calculators — WFD-280 */}
      <Stack.Screen
        name="PneumaticCylinderCalculator"
        component={PneumaticCylinderCalculator}
        options={{ title: '💨 Pneumatic Cylinder' }}
      />
      <Stack.Screen
        name="HydraulicCylinderCalculator"
        component={HydraulicCylinderCalculator}
        options={{ title: '💧 Hydraulic Cylinder' }}
      />
      <Stack.Screen
        name="ThreadTapDrillCalculator"
        component={ThreadTapDrillCalculator}
        options={{ title: '🔩 Thread & Tap Drill' }}
      />
      <Stack.Screen
        name="WeldStrengthCalculator"
        component={WeldStrengthCalculator}
        options={{ title: '🔥 Weld Strength' }}
      />
      {/* WFD-284 */}
      <Stack.Screen
        name="BearingSelectionCalculator"
        component={BearingSelectionCalculator}
        options={{ title: '🔵 Bearing Selection' }}
      />
      {/* WFD-285 */}
      <Stack.Screen
        name="ThermalExpansionCalculator"
        component={ThermalExpansionCalculator}
        options={{ title: '🌡️ Thermal Expansion' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.bgCard,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: 4,
            height: 60,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' as const },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;
            if (route.name === 'Calculators') {
              iconName = focused ? 'calculator' : 'calculator-outline';
            } else if (route.name === 'Convert') {
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
            } else if (route.name === 'Troubleshoot') {
              iconName = focused ? 'warning' : 'warning-outline';
            } else {
              iconName = focused ? 'star' : 'star-outline';
            }
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Calculators" component={CalculatorsStack} />
        <Tab.Screen
          name="Convert"
          component={ConvertersScreen}
          options={{ headerShown: true, headerStyle: { backgroundColor: Colors.bgCard }, headerTintColor: Colors.primary, headerTitleStyle: { color: Colors.textPrimary }, title: '🔄 Converters' }}
        />
        <Tab.Screen
          name="Troubleshoot"
          component={TroubleshootScreen}
          options={{ headerShown: true, headerStyle: { backgroundColor: Colors.bgCard }, headerTintColor: Colors.primary, headerTitleStyle: { color: Colors.textPrimary }, title: '🔍 Troubleshoot' }}
        />
        <Tab.Screen
          name="Favourites"
          component={FavouritesScreen}
          options={{ headerShown: true, headerStyle: { backgroundColor: Colors.bgCard }, headerTintColor: Colors.primary, headerTitleStyle: { color: Colors.textPrimary }, title: '★ Favourites' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
