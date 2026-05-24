import { create } from 'zustand';

/**
 * Cross-cutting UI state shared by AdminLayout, Sidebar, and Header.
 * Currently just the mobile sidebar drawer; widen this as more
 * cross-component UI bits appear (toasts, command palette, etc.).
 */
interface UIState {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
