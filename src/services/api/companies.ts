import apiClient from './client';

export type CompanyStatus = 'pending' | 'approved' | 'suspended';

export interface AdminCompany {
  id: string;
  legalName: string;
  cacNumber: string | null;
  tin: string | null;
  address: string | null;
  status: CompanyStatus;
  createdBy: string;
  createdByUser?: {
    id: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  vehicleCount?: number;
  driverCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListEnvelope {
  items: AdminCompany[];
  total: number;
}

export interface CompaniesQuery {
  status?: CompanyStatus;
  limit?: number;
  offset?: number;
}

export interface UpdateCompanyStatusDto {
  status: CompanyStatus;
  reason?: string;
}

/**
 * H2 — admin companies client. The list endpoint is admin-gated by the
 * backend; the detail endpoint is admin-or-owner. The status PATCH
 * routes through the company state machine and writes an
 * approval_decisions row in the same transaction.
 */
export const adminCompaniesApi = {
  list: async (params?: CompaniesQuery): Promise<CompanyListEnvelope> => {
    const response = await apiClient.get<CompanyListEnvelope | AdminCompany[]>(
      '/companies',
      { params },
    );
    // Backend may return either the envelope or a bare array depending
    // on whether `total` is wired; normalise here.
    if (Array.isArray(response.data)) {
      return { items: response.data, total: response.data.length };
    }
    return response.data;
  },

  findOne: async (id: string): Promise<AdminCompany> => {
    const response = await apiClient.get<AdminCompany>(`/companies/${id}`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    dto: UpdateCompanyStatusDto,
  ): Promise<AdminCompany> => {
    const response = await apiClient.patch<AdminCompany>(
      `/companies/${id}`,
      dto,
    );
    return response.data;
  },
};
