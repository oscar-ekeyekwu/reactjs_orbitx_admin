import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Save } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Label,
  Button,
  Spinner,
  Badge,
} from '@/components/ui';
import {
  notificationTemplatesApi,
  type NotificationTemplate,
  type NotificationEventType,
  type UpdateNotificationTemplateDto,
} from '@/services/api';

const EVENT_LABELS: Record<NotificationEventType, string> = {
  order_created: 'Order placed',
  order_accepted: 'Driver accepted order',
  order_picked_up: 'Package picked up',
  order_in_transit: 'Order in transit',
  order_delivered: 'Order delivered',
  order_cancelled: 'Order cancelled',
  payment_success: 'Payment success',
  payment_failed: 'Payment failed',
  new_message: 'New message',
};

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

interface TemplateEditorProps {
  template: NotificationTemplate;
}

function makeFormFromTemplate(template: NotificationTemplate) {
  return {
    title: template.title,
    body: template.body,
    emailSubject: template.emailSubject ?? '',
    emailBody: template.emailBody ?? '',
    smsBody: template.smsBody ?? '',
    isEnabled: template.isEnabled,
  };
}

function TemplateEditor({ template }: TemplateEditorProps) {
  const queryClient = useQueryClient();
  // Reset form during render when the template prop changes (e.g., after a
  // save invalidates the React Query cache and refetched values arrive).
  // This is the React 19 idiom — see https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevTemplate, setPrevTemplate] = useState(template);
  const [form, setForm] = useState(() => makeFormFromTemplate(template));
  if (template !== prevTemplate) {
    setPrevTemplate(template);
    setForm(makeFormFromTemplate(template));
  }

  const mutation = useMutation({
    mutationFn: (data: UpdateNotificationTemplateDto) =>
      notificationTemplatesApi.update(template.eventType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });

  const isDirty =
    form.title !== template.title ||
    form.body !== template.body ||
    form.emailSubject !== (template.emailSubject ?? '') ||
    form.emailBody !== (template.emailBody ?? '') ||
    form.smsBody !== (template.smsBody ?? '') ||
    form.isEnabled !== template.isEnabled;

  const handleSave = () => {
    mutation.mutate({
      title: form.title,
      body: form.body,
      emailSubject: form.emailSubject.trim() === '' ? null : form.emailSubject,
      emailBody: form.emailBody.trim() === '' ? null : form.emailBody,
      smsBody: form.smsBody.trim() === '' ? null : form.smsBody,
      isEnabled: form.isEnabled,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {EVENT_LABELS[template.eventType]}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {template.eventType}
            </CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, isEnabled: e.target.checked }))
              }
            />
            {form.isEnabled ? (
              <Badge variant="success">Enabled</Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>In-app title</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label>SMS body</Label>
            <Input
              value={form.smsBody}
              onChange={(e) =>
                setForm((f) => ({ ...f, smsBody: e.target.value }))
              }
              placeholder="Leave empty to disable SMS"
              maxLength={500}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>In-app body</Label>
          <Textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={2}
            maxLength={2000}
          />
        </div>

        <div className="space-y-2">
          <Label>Email subject</Label>
          <Input
            value={form.emailSubject}
            onChange={(e) =>
              setForm((f) => ({ ...f, emailSubject: e.target.value }))
            }
            placeholder="Leave empty to disable email"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label>Email body</Label>
          <Textarea
            value={form.emailBody}
            onChange={(e) =>
              setForm((f) => ({ ...f, emailBody: e.target.value }))
            }
            rows={4}
            maxLength={5000}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {mutation.isSuccess && !isDirty && (
            <p className="text-sm text-green-600">Saved</p>
          )}
          <Button
            onClick={handleSave}
            disabled={!isDirty || mutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
