import { apiClient } from './client';

// Wire shapes mirror the backend C2/B1/B3 contracts. Kept narrow —
// only the fields the Approvals queue actually renders.

export type DriverVerificationStatus =
  | 'setup_required'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'rejected'
  | 'suspended_docs_expired'
  | 'suspended_admin';

export interface PendingDriver {
  id: string;
  userId: string;
  accountType: 'individual' | 'company_owner' | 'company_employee';
  verificationStatus: DriverVerificationStatus;
  companyId: string | null;
  user: {
    id: string;
    email: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
  company: { id: string; legalName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type VehicleStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'rejected'
  | 'suspended'
  | 'retired';

export interface PendingVehicle {
  id: string;
  type: string;
  plate: string;
  color: string | null;
  status: VehicleStatus;
  owner: { type: 'individual_driver' | 'company'; id: string };
  createdAt: string;
  updatedAt: string;
}

export type CompanyStatus = 'pending' | 'approved' | 'suspended';

export interface PendingCompany {
  id: string;
  legalName: string;
  cacNumber: string | null;
  tin: string | null;
  address: string | null;
  status: CompanyStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type DocumentOwnerType = 'user' | 'vehicle' | 'company';

export interface PendingDocument {
  id: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  type: string;
  fileUrl: string;
  fileKey: string | null;
  expiryDate: string | null;
  status: DocumentStatus;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingViewUrlResponse {
  viewUrl: string;
}

export interface ListEnvelope<T> {
  items: T[];
  total: number;
}

export const approvalsApi = {
  // ────────────────────────────────── Drivers
  listPendingDrivers: async (): Promise<ListEnvelope<PendingDriver>> => {
    const res = await apiClient.get<ListEnvelope<PendingDriver>>(
      '/drivers/admin/pending',
    );
    return res.data;
  },
  approveDriver: async (id: string, reason?: string) => {
    const res = await apiClient.patch<PendingDriver>(
      `/drivers/${id}/verification`,
      { status: 'approved', reason },
    );
    return res.data;
  },
  rejectDriver: async (id: string, reason: string) => {
    const res = await apiClient.patch<PendingDriver>(
      `/drivers/${id}/verification`,
      { status: 'rejected', reason },
    );
    return res.data;
  },

  // ────────────────────────────────── Vehicles
  listPendingVehicles: async (): Promise<ListEnvelope<PendingVehicle>> => {
    const res = await apiClient.get<ListEnvelope<PendingVehicle>>('/vehicles', {
      params: { status: 'pending_approval' },
    });
    return res.data;
  },
  approveVehicle: async (id: string, reason?: string) => {
    // F1 — admin status route moved to /status to free PATCH /:id for
    // the owner self-service edit endpoint.
    const res = await apiClient.patch<PendingVehicle>(
      `/vehicles/${id}/status`,
      { status: 'approved', reason },
    );
    return res.data;
  },
  rejectVehicle: async (id: string, reason: string) => {
    const res = await apiClient.patch<PendingVehicle>(
      `/vehicles/${id}/status`,
      { status: 'rejected', reason },
    );
    return res.data;
  },

  // ────────────────────────────────── Companies
  listPendingCompanies: async (): Promise<ListEnvelope<PendingCompany>> => {
    const res = await apiClient.get<ListEnvelope<PendingCompany>>('/companies', {
      params: { status: 'pending' },
    });
    return res.data;
  },
  approveCompany: async (id: string, reason?: string) => {
    const res = await apiClient.patch<PendingCompany>(`/companies/${id}`, {
      status: 'approved',
      reason,
    });
    return res.data;
  },
  // Companies don't have a "rejected" terminal state — admins suspend
  // instead. The Approvals queue surfaces this as "Reject" in the UI
  // but maps to the suspended transition under the hood.
  suspendCompany: async (id: string, reason: string) => {
    const res = await apiClient.patch<PendingCompany>(`/companies/${id}`, {
      status: 'suspended',
      reason,
    });
    return res.data;
  },

  // ────────────────────────────────── Documents
  listPendingDocuments: async (): Promise<PendingDocument[]> => {
    const res = await apiClient.get<PendingDocument[]>('/documents', {
      params: { status: 'pending' },
    });
    return res.data;
  },
  approveDocument: async (id: string, reason?: string) => {
    const res = await apiClient.patch<PendingDocument>(`/documents/${id}`, {
      status: 'approved',
      reason,
    });
    return res.data;
  },
  rejectDocument: async (id: string, reason: string) => {
    const res = await apiClient.patch<PendingDocument>(`/documents/${id}`, {
      status: 'rejected',
      reason,
    });
    return res.data;
  },
  getDocumentViewUrl: async (id: string): Promise<string> => {
    const res = await apiClient.get<PendingViewUrlResponse>(
      `/documents/${id}/view-url`,
    );
    return res.data.viewUrl;
  },
};

export default approvalsApi;
