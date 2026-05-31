import { Link, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Shield,
  Palette,
  Database,
  ChevronRight,
  ToggleLeft,
  HardDrive,
  Lock,
  CreditCard,
  Map,
  MessageSquare,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';

type SettingsLink = {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type SettingsGroup = {
  id: string;
  title: string;
  description: string;
  links: SettingsLink[];
};

const settingsGroups: SettingsGroup[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Dashboard appearance and notification templates.',
    links: [
      {
        name: 'Appearance',
        description: 'Customize the look and feel',
        href: '/settings/appearance',
        icon: Palette,
      },
      {
        name: 'Notifications',
        description: 'Manage notification preferences and templates',
        href: '/settings/notifications',
        icon: Bell,
      },
    ],
  },
  {
    id: 'product',
    title: 'Product',
    description: 'Configuration that affects the customer and driver apps.',
    links: [
      {
        name: 'Feature Flags',
        description: 'Toggle product features without releasing a new app build',
        href: '/settings/feature-flags',
        icon: ToggleLeft,
      },
      {
        name: 'Support Contact Info',
        description:
          'Phone, email, WhatsApp, and hours shown to drivers and customers in the mobile apps.',
        href: '/settings/support-info',
        icon: MessageSquare,
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Third-party providers and API keys. Rotate without a redeploy.',
    links: [
      {
        name: 'Payment Providers',
        description:
          'Add, test, and activate payment gateways. Rotate Paystack credentials or onboard a new gateway without a redeploy.',
        href: '/settings/payment-providers',
        icon: CreditCard,
      },
      {
        name: 'Storage Providers',
        description:
          'Add, test, and activate object-storage backends. Swap or onboard a new bucket without a code release.',
        href: '/settings/storage',
        icon: HardDrive,
      },
      {
        name: 'Maps API Key',
        description:
          'Google Maps Platform key used by the customer address autocomplete + geocoding proxy. Rotate any time without an APK rebuild.',
        href: '/settings/maps',
        icon: Map,
      },
    ],
  },
  {
    id: 'security-data',
    title: 'Security & Data',
    description: 'Access controls, compliance, and data lifecycle.',
    links: [
      {
        name: 'Security',
        description: 'Security settings and access controls',
        href: '/settings/security',
        icon: Shield,
      },
      {
        name: 'Privacy',
        description:
          'NDPA data-subject rights — export your data or schedule account deletion.',
        href: '/settings/privacy',
        icon: Lock,
      },
      {
        name: 'Data Management',
        description: 'Export data and manage backups',
        href: '/settings/data',
        icon: Database,
      },
    ],
  },
  {
    id: 'developer-tools',
    title: 'Developer Tools',
    description: 'Non-production utilities for rehearsing integrations.',
    links: [
      {
        name: 'Fund by Account (Test)',
        description:
          'Non-production tool — credit a driver wallet by virtual account number to rehearse the Paystack DVA funding flow end to end.',
        href: '/settings/wallet-fund-test',
        icon: Wallet,
      },
    ],
  },
];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeGroup =
    settingsGroups.find((g) => g.id === tabParam) ?? settingsGroups[0];

  const selectTab = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage your application settings" />

      <div className="p-4 md:p-6">
        <div className="max-w-2xl">
          <div
            role="tablist"
            aria-label="Settings categories"
            className="-mx-1 mb-4 flex gap-1 overflow-x-auto border-b border-border px-1"
          >
            {settingsGroups.map((group) => {
              const isActive = group.id === activeGroup.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`settings-panel-${group.id}`}
                  id={`settings-tab-${group.id}`}
                  onClick={() => selectTab(group.id)}
                  className={cn(
                    'whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors -mb-px',
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {group.title}
                </button>
              );
            })}
          </div>

          <section
            key={activeGroup.id}
            role="tabpanel"
            id={`settings-panel-${activeGroup.id}`}
            aria-labelledby={`settings-tab-${activeGroup.id}`}
          >
            <p className="mb-3 px-1 text-sm text-muted-foreground">
              {activeGroup.description}
            </p>
            <div className="space-y-2">
              {activeGroup.links.map((item) => (
                <Link key={item.name} to={item.href} className="group block">
                  <Card className="border-transparent bg-white shadow-none transition-all hover:border-border hover:bg-gray-50 focus-within:border-border focus-within:ring-2 focus-within:ring-ring/40">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium leading-tight">
                            {item.name}
                          </h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
