import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/stores/uiStore';

export function AdminLayout() {
  const { sidebarOpen, closeSidebar } = useUIStore();
  const location = useLocation();

  // Close the mobile drawer whenever the route changes so a NavLink
  // tap doesn't leave the drawer hovering over the destination page.
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile backdrop — only renders when the drawer is open. Tap to
          dismiss. Hidden on md+ where the sidebar is permanently in
          the flow. */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <Sidebar />

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
