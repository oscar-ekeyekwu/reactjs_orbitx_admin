import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AccentOption {
  id: string;
  name: string;
  hsl: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'green', name: 'Green', hsl: '110 95% 56%' },
  { id: 'blue', name: 'Blue', hsl: '217 91% 60%' },
  { id: 'purple', name: 'Purple', hsl: '262 83% 58%' },
  { id: 'orange', name: 'Orange', hsl: '25 95% 53%' },
  { id: 'pink', name: 'Pink', hsl: '330 81% 60%' },
  { id: 'teal', name: 'Teal', hsl: '173 80% 40%' },
];

const DEFAULT_ACCENT_ID = 'green';

interface ThemeState {
  accentId: string;
  setAccent: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accentId: DEFAULT_ACCENT_ID,
      setAccent: (id) => set({ accentId: id }),
    }),
    { name: 'admin-theme' },
  ),
);

export function applyTheme(accentId: string): void {
  const root = document.documentElement;
  const accent =
    ACCENT_OPTIONS.find((a) => a.id === accentId) ??
    ACCENT_OPTIONS.find((a) => a.id === DEFAULT_ACCENT_ID)!;
  root.style.setProperty('--primary', accent.hsl);
  root.style.setProperty('--ring', accent.hsl);
}
