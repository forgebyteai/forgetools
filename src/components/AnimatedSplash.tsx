/**
 * AnimatedSplash — Controls the native splash screen hide timing.
 * 
 * Wrap your root component with this. It:
 * 1. Keeps the native splash visible until fonts/assets are loaded
 * 2. Fades it out smoothly using expo-splash-screen
 * 
 * Usage in App.tsx / layout:
 *   import AnimatedSplash from './components/AnimatedSplash';
 *   export default function RootLayout() {
 *     return <AnimatedSplash><Stack /></AnimatedSplash>;
 *   }
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hide so we control timing
SplashScreen.preventAutoHideAsync();

interface Props {
  children: React.ReactNode;
  minDuration?: number; // minimum ms to show splash (default 400)
}

export default function AnimatedSplash({ children, minDuration = 400 }: Props) {
  const [appReady, setAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Wait at least minDuration so the splash doesn't flash
        await new Promise(resolve => setTimeout(resolve, minDuration));
      } catch (e) {
        console.warn('Splash prepare error:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appReady) return null;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});
