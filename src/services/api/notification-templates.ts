import apiClient from './client';

export type NotificationEventType =
  | 'order_created'
  | 'order_accepted'
  | 'order_picked_up'
  | 'order_in_transit'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_success'
  | 'payment_failed'
  | 'new_message';

export interface NotificationTemplate {
  eventType: NotificationEventType;
  title: string;
  body: string;
  emailSubject: string | null;
  emailBody: string | null;
  smsBody: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationTemplateDto {
  title?: string;
  body?: string;
  emailSubject?: string | null;
  emailBody?: string | null;
  smsBody?: string | null;
  isEnabled?: boolean;
}

export const notificationTemplatesApi = {
  list: async (): Promise<NotificationTemplate[]> => {
    const response = await apiClient.get<NotificationTemplate[]>(
      '/admin/notification-templates',
    );
    return response.data;
  },

  update: async (
    eventType: NotificationEventType,
    data: UpdateNotificationTemplateDto,
  ): Promise<NotificationTemplate> => {
    const response = await apiClient.patch<NotificationTemplate>(
      `/admin/notification-templates/${eventType}`,
      data,
    );
    return response.data;
  },
};
