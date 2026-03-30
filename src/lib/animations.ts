/**
 * ForgeTools — Animation Utilities
 * Shared animation hooks and helpers for smooth, consistent UX across screens.
 * Uses React Native's built-in Animated API (no external deps).
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Mount fade-in + slide-up for screen entry
// Usage: const { opacity, translateY } = useScreenEntrance();
// Apply as: style={[styles.container, { opacity, transform: [{ translateY }] }]}
// ─────────────────────────────────────────────────────────────
export function useScreenEntrance(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, translateY };
}

// ─────────────────────────────────────────────────────────────
// Staggered card entrance for lists/grids
// Returns array of animated values — one per item
// Usage: const anims = useStaggerEntrance(items.length);
// Apply each as: style={[card, { opacity: anims[i].opacity, transform: [{ translateY: anims[i].y }] }]}
// ─────────────────────────────────────────────────────────────
export function useStaggerEntrance(count: number, baseDelay = 60) {
  const animations = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(12),
    }))
  ).current;

  useEffect(() => {
    const anims = animations.slice(0, count).map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 240,
          delay: i * baseDelay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: 0,
          duration: 240,
          delay: i * baseDelay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(anims).start();
  }, [count]);

  return animations;
}

// ─────────────────────────────────────────────────────────────
// Result reveal animation — used when calculation output appears
// Usage: const { opacity, scale } = useResultReveal(hasResult);
// hasResult = boolean that flips when result becomes available
// ─────────────────────────────────────────────────────────────
export function useResultReveal(hasResult: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (hasResult) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.95);
    }
  }, [hasResult]);

  return { opacity, scale };
}

// ─────────────────────────────────────────────────────────────
// Press feedback — scale pulse on button press
// Usage: const { scale, onPressIn, onPressOut } = usePressScale();
// Apply: style={{ transform: [{ scale }] }}, onPressIn, onPressOut on TouchableOpacity
// ─────────────────────────────────────────────────────────────
export function usePressScale(downTo = 0.95) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: downTo,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();

  return { scale, onPressIn, onPressOut };
}

// ─────────────────────────────────────────────────────────────
// Pulse glow — subtle looping scale for accent elements
// Usage: const pulseScale = usePulse();
// Apply to a decorative element: style={{ transform: [{ scale: pulseScale }] }}
// ─────────────────────────────────────────────────────────────
export function usePulse(min = 0.97, max = 1.03, duration = 1800) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: max,
          duration,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: min,
          duration,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return scale;
}

// ─────────────────────────────────────────────────────────────
// Tab transition fade — for switching between sections/tabs
// Usage: const tabAnim = useTabFade(activeTab);
// ─────────────────────────────────────────────────────────────
export function useTabFade(activeKey: string) {
  const opacity = useRef(new Animated.Value(1)).current;
  const prevKey = useRef(activeKey);

  useEffect(() => {
    if (prevKey.current !== activeKey) {
      prevKey.current = activeKey;
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [activeKey]);

  return opacity;
}
