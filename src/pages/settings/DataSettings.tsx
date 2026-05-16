import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  Users,
  Package,
  Wallet,
  Download,
} from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui';
import { exportApi, type ExportResource } from '@/services/api';

const RESOURCES: {
  id: ExportResource;
  label: string;
  description: string;
  icon: typeof Users;
}[] = [
  {
    id: 'users',
    label: 'Users',
    description: 'All customers, drivers, and admins',
    icon: Users,
  },
  {
    id: 'orders',
    label: 'Orders',
    description: 'Every order with status, pricing, and timestamps',
    icon: Package,
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'Wallet credits, debits, and commission entries',
    icon: Wallet,
  },
];

export function DataSettingsPage() {
  const [pending, setPending] = useState<ExportResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (resource: ExportResource) => {
    setError(null);
    setPending(resource);
    try {
      await exportApi.download(resource);
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Export failed';
      setError(message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <Header title="Data Management" subtitle="Export data as CSV" />

      <div className="p-6">
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              CSV Exports
            </CardTitle>
            <CardDescription>
              Download a full snapshot of the data. Files include all rows in
              the table — for large datasets this may take a moment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {RESOURCES.map(({ id, label, description, icon: Icon }) => (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExport(id)}
                    disabled={pending !== null}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {pending === id ? 'Exporting...' : 'Download'}
                  </Button>
                </li>
              ))}
            </ul>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
