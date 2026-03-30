/**
 * ForgeTools — Persistent storage
 * Offline favourites and recent calculations using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedCalc {
  id: string;
  tool: string;
  inputs: Record<string, number | string>;
  result: Record<string, number | string>;
  savedAt: string;
  label?: string;
}

const KEYS = {
  favourites: '@forgetools:favourites',
  recents: '@forgetools:recents',
} as const;

export async function getFavourites(): Promise<SavedCalc[]> {
  const raw = await AsyncStorage.getItem(KEYS.favourites);
  return raw ? JSON.parse(raw) : [];
}

export async function saveFavourite(calc: SavedCalc): Promise<void> {
  const existing = await getFavourites();
  const updated = [calc, ...existing.filter(c => c.id !== calc.id)];
  await AsyncStorage.setItem(KEYS.favourites, JSON.stringify(updated.slice(0, 50)));
}

export async function removeFavourite(id: string): Promise<void> {
  const existing = await getFavourites();
  await AsyncStorage.setItem(
    KEYS.favourites,
    JSON.stringify(existing.filter(c => c.id !== id)),
  );
}

export async function addRecent(calc: Omit<SavedCalc, 'savedAt'>): Promise<void> {
  const entry: SavedCalc = { ...calc, savedAt: new Date().toISOString() };
  const existing = await AsyncStorage.getItem(KEYS.recents);
  const recents: SavedCalc[] = existing ? JSON.parse(existing) : [];
  const updated = [entry, ...recents.filter(c => c.id !== calc.id)].slice(0, 20);
  await AsyncStorage.setItem(KEYS.recents, JSON.stringify(updated));
}

export async function getRecents(): Promise<SavedCalc[]> {
  const raw = await AsyncStorage.getItem(KEYS.recents);
  return raw ? JSON.parse(raw) : [];
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.favourites, KEYS.recents]);
}
