import apiClient from './client';

export type VehicleStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'rejected'
  | 'suspended'
  | 'retired';

export type VehicleOwnerType = 'individual_driver' | 'company';

export interface AdminVehicle {
  id: string;
  type: string;
  plate: string;
  color: string | null;
  photoUrl: string | null;
  status: VehicleStatus;
  owner: { type: VehicleOwnerType; id: string };
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional joined fields the admin list may or may not populate; the
  // page degrades gracefully if absent.
  ownerName?: string | null;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
}

export interface VehicleListEnvelope {
  items: AdminVehicle[];
  total: number;
}

export interface VehiclesQuery {
  status?: VehicleStatus;
  limit?: number;
  offset?: number;
}

export interface UpdateVehicleStatusDto {
  status: VehicleStatus;
  reason?: string;
}

/**
 * H4 — admin vehicles client. List/findOne return the public
 * VehicleResponse shape (polymorphic owner under `.owner`). The status
 * PATCH routes through `vehicleStateMachine` and writes an audit row.
 */
export const adminVehiclesApi = {
  list: async (params?: VehiclesQuery): Promise<VehicleListEnvelope> => {
    const response = await apiClient.get<VehicleListEnvelope>(
      '/vehicles',
      { params },
    );
    return response.data;
  },

  findOne: async (id: string): Promise<AdminVehicle> => {
    const response = await apiClient.get<AdminVehicle>(`/vehicles/${id}`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    dto: UpdateVehicleStatusDto,
  ): Promise<AdminVehicle> => {
    const response = await apiClient.patch<AdminVehicle>(
      `/vehicles/${id}/status`,
      dto,
    );
    return response.data;
  },
};
