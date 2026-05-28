import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Save } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import {
  notificationTemplatesApi,
  type NotificationEventType,
  type NotificationTemplate,
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

type Props = {
  template: NotificationTemplate;
};

export function TemplateEditor({ template }: Props) {
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
