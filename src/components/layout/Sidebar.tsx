import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

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

export function Sidebar() {
  const { logout, user } = useAuthStore();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">OrbitX</span>
          <span className="text-xs text-gray-400">Admin</span>
        </div>
      </div>

      {/* Navigation — sections give the admin a mental map of where
          things live. Section headers are non-interactive labels; the
          list scrolls vertically if it overflows on shorter viewports. */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((section, idx) => (
          <div
            key={section.label}
            className={cn('space-y-1', idx > 0 && 'mt-6')}
          >
            <p
              data-testid={`sidebar-section-${section.label
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')}`}
              className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              {section.label}
            </p>
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
        ))}
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
    </div>
  );
}
