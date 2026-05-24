import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  HelpCircle,
  MessageSquare,
  LogOut,
  DollarSign,
  Settings,
  ShieldCheck,
  Banknote,
  Wallet,
  Building2,
  FileText,
  Car,
  History,
  AlertOctagon,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'People',
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Drivers', href: '/drivers', icon: Truck },
      { name: 'Companies', href: '/companies', icon: Building2 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Orders', href: '/orders', icon: Package },
      { name: 'Vehicles', href: '/vehicles', icon: Car },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Approvals', href: '/approvals', icon: ShieldCheck },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      { name: 'Incidents', href: '/incidents', icon: AlertOctagon },
      { name: 'Audit Log', href: '/audit-log', icon: History },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Transfers', href: '/transfers', icon: Banknote },
      { name: 'Disbursements', href: '/payouts', icon: Wallet },
      { name: 'Price Settings', href: '/price-settings', icon: DollarSign },
    ],
  },
  {
    label: 'Help',
    items: [
      { name: 'FAQs', href: '/faqs', icon: HelpCircle },
      { name: 'Support', href: '/support', icon: MessageSquare },
    ],
  },
  {
    label: 'System',
    items: [{ name: 'Settings', href: '/settings', icon: Settings }],
  },
];

const COLLAPSE_STORAGE_KEY = 'orbit:sidebar:collapsed-sections:v1';

function loadCollapsedSections(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function persistCollapsedSections(sections: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      COLLAPSE_STORAGE_KEY,
      JSON.stringify(Array.from(sections)),
    );
  } catch {
    // Quota / private-mode storage failures are non-fatal — the sidebar
    // still renders, it just won't remember collapsed state next reload.
  }
}

function sectionContainsActiveRoute(
  section: NavSection,
  pathname: string,
): boolean {
  return section.items.some(
    (item) => item.href === pathname || pathname.startsWith(item.href + '/'),
  );
}

export function Sidebar() {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    loadCollapsedSections(),
  );

  // Auto-expand whichever section owns the current route so the active
  // link is always visible. Persisted user preference still wins for
  // other sections.
  useEffect(() => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      for (const section of navigation) {
        if (sectionContainsActiveRoute(section, location.pathname)) {
          next.delete(section.label);
        }
      }
      if (next.size === prev.size) return prev;
      persistCollapsedSections(next);
      return next;
    });
  }, [location.pathname]);

  const toggle = (label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      persistCollapsedSections(next);
      return next;
    });
  };

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        // Desktop (md+): always in flow, fixed-width column. Mobile:
        // fixed off-canvas drawer that slides in when sidebarOpen is
        // true. The transform-based animation keeps the sidebar in
        // the DOM so screen readers can still find the nav items.
        'flex h-full w-64 flex-col bg-gray-900',
        'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out md:static md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">OrbitX</span>
          <span className="text-xs text-gray-400">Admin</span>
        </div>
        {/* Mobile-only close button — desktop relies on always-visible
            sidebar, no need for a chrome button there. */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeSidebar}
          className="rounded-md p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation — section labels are clickable headers that toggle
          their items. Collapsed state persists in localStorage; the
          section owning the active route is auto-expanded on every
          navigation so the highlight is never hidden. The scrollbar is
          hidden visually but the nav still scrolls if a tall display
          mode pushes content past the viewport. */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 sidebar-nav">
        {navigation.map((section, idx) => {
          const isCollapsed = collapsed.has(section.label);
          const headingId = `sidebar-section-${section.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}`;
          return (
            <div
              key={section.label}
              className={cn('space-y-1', idx > 0 && 'mt-4')}
            >
              <button
                type="button"
                data-testid={headingId}
                aria-expanded={!isCollapsed}
                onClick={() => toggle(section.label)}
                className="flex w-full items-center justify-between px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
              >
                <span>{section.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    isCollapsed ? '-rotate-90' : 'rotate-0',
                  )}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      end={item.href === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-black'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white">
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
