import { Link } from 'react-router-dom';
import {
  Bell,
  Shield,
  Palette,
  Database,
  ChevronRight,
  ToggleLeft,
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
];

export function SettingsPage() {
  return (
    <div>
      <Header title="Settings" subtitle="Manage your application settings" />

      <div className="p-6">
        <div className="max-w-2xl space-y-4">
          {settingsLinks.map((item) => (
            <Link key={item.name} to={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
