import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useUIStore } from '@/stores/uiStore';

afterEach(() => {
  cleanup();
  // Reset cross-cutting zustand stores so state from one spec can't
  // leak into another (e.g. a leftover open sidebar drawer covering
  // the form a later test is trying to interact with).
  useUIStore.setState({ sidebarOpen: false });
});
