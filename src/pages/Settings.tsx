import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui';

const settingsLinks = [
  {
    name: 'Notifications',
    description: 'Manage notification preferences and templates',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    name: 'Security',
    description: 'Security settings and access controls',
    href: '/settings/security',
    icon: Shield,
  },
  {
    name: 'Appearance',
    description: 'Customize the look and feel',
    href: '/settings/appearance',
    icon: Palette,
  },
  {
    name: 'Data Management',
    description: 'Export data and manage backups',
    href: '/settings/data',
    icon: Database,
  },
  {
    name: 'Feature Flags',
    description: 'Toggle product features without releasing a new app build',
    href: '/settings/feature-flags',
    icon: ToggleLeft,
  },
  {
    name: 'Storage Providers',
    description:
      'Add, test, and activate object-storage backends. Swap or onboard a new bucket without a code release.',
    href: '/settings/storage',
    icon: HardDrive,
  },
  {
    name: 'Payment Providers',
    description:
      'Add, test, and activate payment gateways. Rotate Paystack credentials or onboard a new gateway without a redeploy.',
    href: '/settings/payment-providers',
    icon: CreditCard,
  },
  {
    name: 'Privacy',
    description:
      'NDPA data-subject rights — export your data or schedule account deletion.',
    href: '/settings/privacy',
    icon: Lock,
  },
  {
    name: 'Support Contact Info',
    description:
      'Phone, email, WhatsApp, and hours shown to drivers and customers in the mobile apps.',
    href: '/settings/support-info',
    icon: MessageSquare,
  },
  {
    name: 'Fund by Account (Test)',
    description:
      'Non-production tool — credit a driver wallet by virtual account number to rehearse the Paystack DVA funding flow end to end.',
    href: '/settings/wallet-fund-test',
    icon: Wallet,
  },
  {
    name: 'Maps API Key',
    description:
      'Google Maps Platform key used by the customer address autocomplete + geocoding proxy. Rotate any time without an APK rebuild.',
    href: '/settings/maps',
    icon: Map,
  },
];

export function SettingsPage() {
  return (
    <div>
      <Header title="Settings" subtitle="Manage your application settings" />

      <div className="p-4 md:p-6">
        <div className="max-w-2xl space-y-2">
          {settingsLinks.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="group block"
            >
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
      </div>
    </div>
  );
}
