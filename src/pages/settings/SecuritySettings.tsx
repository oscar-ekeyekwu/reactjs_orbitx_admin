import { Header } from '@/components/layout';
import { Breadcrumb } from '@/components/ui';
import { ChangePasswordCard } from './security/ChangePasswordCard';
import { SessionsCard } from './security/SessionsCard';

export function SecuritySettingsPage() {
  return (
    <div>
      <Header
        title="Security"
        subtitle="Change your password and manage active sessions"
      />

      <div className="p-6">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Security' },
          ]}
        />

        <div className="max-w-2xl space-y-6">
          <ChangePasswordCard />
          <SessionsCard />
        </div>
      </div>
    </div>
  );
}
