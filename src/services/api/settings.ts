import apiClient from "./client";
import type {
  PriceSettings,
  FAQ,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  PaginatedResponse,
  DashboardStats,
  DashboardTimeseries,
} from "@/types";

// Dashboard
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>(
      "/admin/dashboard/stats",
    );
    return response.data;
  },

  getTimeseries: async (): Promise<DashboardTimeseries> => {
    const response = await apiClient.get<DashboardTimeseries>(
      "/admin/dashboard/timeseries",
    );
    return response.data;
  },
};

export type ExportResource = "users" | "orders" | "transactions";

export const exportApi = {
  download: async (resource: ExportResource): Promise<void> => {
    const response = await apiClient.get<string>(
      `/admin/export/${resource}`,
      { responseType: "text", transformResponse: (v) => v },
    );
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `${resource}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// Price Settings
export interface UpdatePriceSettingsDto {
  baseFare?: number;
  perKmRate?: number;
  smallPackageMultiplier?: number;
  mediumPackageMultiplier?: number;
  largePackageMultiplier?: number;
  insuranceFeeFixed?: number;
  insuranceFeePercent?: number;
}

export const priceSettingsApi = {
  get: async (): Promise<PriceSettings> => {
    const response = await apiClient.get<PriceSettings>(
      "/config/pricing-settings",
    );
    return response.data;
  },

  update: async (data: UpdatePriceSettingsDto): Promise<PriceSettings> => {
    const response = await apiClient.put<PriceSettings>(
      "/config/pricing-settings",
      data,
    );
    return response.data;
  },
};

// Feature Flags
export type VehicleEditGraceMode = 'continue' | 'lock';

export interface FeatureFlags {
  useMapView: boolean;
  // F3 — toggles the F2 lock-mode gate in OrdersService.acceptOrder.
  vehicleEditGraceMode: VehicleEditGraceMode;
  // Phase 3 — when true, customers must attach a screenshot of their
  // bank transfer before marking an order paid.
  orderPaymentProofRequired: boolean;
}

export const featureFlagsApi = {
  get: async (): Promise<FeatureFlags> => {
    const response = await apiClient.get<FeatureFlags>(
      "/config/feature-flags",
    );
    return response.data;
  },

  update: async (data: Partial<FeatureFlags>): Promise<FeatureFlags> => {
    const response = await apiClient.put<FeatureFlags>(
      "/config/feature-flags",
      data,
    );
    return response.data;
  },
};

// FAQs
export interface CreateFAQDto {
  question: string;
  answer: string;
  category: string;
  order?: number;
  isActive?: boolean;
}

export type UpdateFAQDto = Partial<CreateFAQDto>;

export const faqApi = {
  getAll: async (): Promise<FAQ[]> => {
    const response = await apiClient.get<FAQ[]>("/faqs", {
      params: { all: true },
    });
    return response.data;
  },

  getById: async (id: string): Promise<FAQ> => {
    const response = await apiClient.get<FAQ>(`/faqs/${id}`);
    return response.data;
  },

  create: async (data: CreateFAQDto): Promise<FAQ> => {
    const response = await apiClient.post<FAQ>("/faqs", data);
    return response.data;
  },

  update: async (id: string, data: UpdateFAQDto): Promise<FAQ> => {
    const response = await apiClient.patch<FAQ>(`/faqs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/faqs/${id}`);
  },

  reorder: async (orderedIds: string[]): Promise<void> => {
    await apiClient.post("/faqs/reorder", { ids: orderedIds });
  },
};

// Support Contact Info — public-facing values shown in the customer
// Contact Us screen and the driver Support screen. Read by any
// authenticated user; updates restricted to admins by the backend.
export interface SupportContactInfo {
  phone: string;
  email: string;
  whatsapp: string;
  hours: string;
}

export type UpdateSupportInfoDto = Partial<SupportContactInfo>;

export const supportInfoApi = {
  get: async (): Promise<SupportContactInfo> => {
    const response = await apiClient.get<SupportContactInfo>(
      '/config/support-info',
    );
    return response.data;
  },

  update: async (data: UpdateSupportInfoDto): Promise<SupportContactInfo> => {
    const response = await apiClient.put<SupportContactInfo>(
      '/config/support-info',
      data,
    );
    return response.data;
  },
};

// Driver & Order Settings
export interface DriverSettingsDto {
  driverMinBalance?: number;
  orderDeliveryRadiusKm?: number;
  // G5 — platform commission percentage. Range [0, 100]; the backend
  // enforces the bounds + the wallet split helper double-checks them.
  driverCommissionPct?: number;
  // Per-order platform charge held from the driver's prepaid wallet on
  // accept. Mode picks which inputs apply: 'flat' uses driverChargeFlat;
  // 'percentage' uses driverChargePercentage capped by driverChargeCap.
  driverChargeMode?: 'flat' | 'percentage';
  driverChargeFlat?: number;
  driverChargePercentage?: number;
  driverChargeCap?: number;
}

export interface DriverSettings {
  driverMinBalance: number;
  orderDeliveryRadiusKm: number;
  driverCommissionPct: number;
  driverChargeMode: 'flat' | 'percentage';
  driverChargeFlat: number;
  driverChargePercentage: number;
  driverChargeCap: number;
}

export const driverSettingsApi = {
  get: async (): Promise<DriverSettings> => {
    const response = await apiClient.get<DriverSettings>(
      '/config/driver-settings',
    );
    return response.data;
  },

  update: async (data: DriverSettingsDto): Promise<DriverSettings> => {
    const response = await apiClient.put<DriverSettings>(
      '/config/driver-settings',
      data,
    );
    return response.data;
  },
};

// Support Tickets
export interface SupportTicketsQueryParams {
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  search?: string;
}

export interface UpdateSupportTicketDto {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assignedTo?: string;
}

export interface AdminCreateSupportTicketDto {
  userId: string;
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
  orderId?: string;
}

export const supportApi = {
  getAll: async (
    params?: SupportTicketsQueryParams,
  ): Promise<PaginatedResponse<SupportTicket>> => {
    const response = await apiClient.get<PaginatedResponse<SupportTicket>>(
      "/support/tickets",
      { params },
    );
    return response.data;
  },

  adminCreate: async (
    data: AdminCreateSupportTicketDto,
  ): Promise<SupportTicket> => {
    const response = await apiClient.post<SupportTicket>(
      "/support/tickets/admin",
      data,
    );
    return response.data;
  },

  getById: async (id: string): Promise<SupportTicket> => {
    const response = await apiClient.get<SupportTicket>(
      `/support/tickets/${id}`,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateSupportTicketDto,
  ): Promise<SupportTicket> => {
    const response = await apiClient.patch<SupportTicket>(
      `/support/tickets/${id}`,
      data,
    );
    return response.data;
  },

  close: async (id: string): Promise<SupportTicket> => {
    return supportApi.update(id, { status: "closed" as SupportTicketStatus });
  },
};
