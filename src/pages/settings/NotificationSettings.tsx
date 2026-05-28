import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Card,
  CardContent,
  Spinner,
} from '@/components/ui';
import { notificationTemplatesApi } from '@/services/api';
import { TemplateEditor } from './notifications/TemplateEditor';

export function NotificationSettingsPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: notificationTemplatesApi.list,
  });

  return (
    <div>
      <Header
        title="Notifications"
        subtitle="Edit the title, body, email, and SMS text for each event"
      />

      <div className="p-6">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Notifications' },
          ]}
        />

        <div className="max-w-3xl">
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-900">
              <p className="font-medium">Template variables</p>
              <p className="mt-1">
                Use double-curly placeholders in any field. The dispatcher
                substitutes them at send time. Common variables:{' '}
                <code className="rounded bg-amber-100 px-1">{'{{orderId}}'}</code>,{' '}
                <code className="rounded bg-amber-100 px-1">{'{{customerName}}'}</code>,{' '}
                <code className="rounded bg-amber-100 px-1">{'{{driverName}}'}</code>,{' '}
                <code className="rounded bg-amber-100 px-1">{'{{amount}}'}</code>,{' '}
                <code className="rounded bg-amber-100 px-1">{'{{recipientName}}'}</code>.
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !templates?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No templates found
            </p>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <TemplateEditor key={template.eventType} template={template} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
