/**
 * ForgeTools App Navigation
 * Bottom tabs: Calculators | Converters | Troubleshoot | Favourites
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/theme';

// Placeholder screens — replaced by actual implementations
import HomeScreen from '../screens/HomeScreen';
import TroubleshootScreen from '../screens/TroubleshootScreen';
import FavouritesScreen from '../screens/FavouritesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CalculatorsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgCard },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '600' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: '🔧 ForgeTools' }} />
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
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
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
        <Tab.Screen name="Troubleshoot" component={TroubleshootScreen} />
        <Tab.Screen name="Favourites" component={FavouritesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
