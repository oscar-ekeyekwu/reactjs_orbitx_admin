import apiClient from './client';

export type DocumentOwnerType = 'user' | 'vehicle' | 'company';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type DocumentType =
  | 'drivers_license'
  | 'nin'
  | 'passport'
  | 'voters_card'
  | 'proof_of_address'
  | 'vehicle_registration'
  | 'vehicle_license'
  | 'vehicle_photo'
  | 'roadworthy'
  | 'insurance'
  // LASDRI / Rider's Card. Slug stays for back-compat; admin UI
  // labels it "Rider's Card (LASDRI)."
  | 'lasaa_permit'
  | 'nipost_license'
  | 'cac_certificate'
  | 'tin_certificate'
  | 'gov_id'
  | 'director_id'
  | 'selfie';

/** Friendly labels shared across admin pages so the same slug
 *  renders identically everywhere. */
export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  drivers_license: "Driver's License",
  nin: 'NIN',
  passport: 'International Passport',
  voters_card: "Voter's Card",
  proof_of_address: 'Proof of Address',
  vehicle_registration: 'Vehicle Registration',
  vehicle_license: 'Vehicle License',
  vehicle_photo: 'Vehicle Photo',
  roadworthy: 'Road Worthiness',
  insurance: 'Insurance',
  lasaa_permit: "Rider's Card (LASDRI)",
  nipost_license: 'NIPOST License',
  cac_certificate: 'CAC Certificate',
  tin_certificate: 'TIN Certificate',
  gov_id: 'Government ID',
  director_id: 'Director ID',
  selfie: 'Selfie',
};

export function documentTypeLabel(type: DocumentType | string): string {
  return DOCUMENT_TYPE_LABEL[type as DocumentType] ?? type;
}

export interface AdminDocument {
  id: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  type: DocumentType;
  fileUrl: string;
  fileKey: string | null;
  expiryDate: string | null;
  status: DocumentStatus;
  uploadedBy: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional joined fields the admin list may populate.
  ownerName?: string | null;
}

export interface DocumentsQuery {
  ownerType?: DocumentOwnerType;
  ownerId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  expiringInDays?: number;
}

export interface ReviewDocumentDto {
  status: 'approved' | 'rejected';
  reason?: string;
}

/**
 * H5 — admin documents client. List returns the raw array (the backend
 * doesn't envelope this resource); ARCH-9 powers the per-document
 * view-url endpoint for the detail modal.
 */
export const adminDocumentsApi = {
  list: async (params?: DocumentsQuery): Promise<AdminDocument[]> => {
    const response = await apiClient.get<AdminDocument[]>('/documents', {
      params,
    });
    return response.data;
  },

  findOne: async (id: string): Promise<AdminDocument> => {
    const response = await apiClient.get<AdminDocument>(`/documents/${id}`);
    return response.data;
  },

  review: async (
    id: string,
    dto: ReviewDocumentDto,
  ): Promise<AdminDocument> => {
    const response = await apiClient.patch<AdminDocument>(
      `/documents/${id}`,
      dto,
    );
    return response.data;
  },

  viewUrl: async (id: string): Promise<{ viewUrl: string }> => {
    const response = await apiClient.get<{ viewUrl: string }>(
      `/documents/${id}/view-url`,
    );
    return response.data;
  },
};

/**
 * H5 — bucket an expiry date into a traffic-light state:
 *   green: > 30 days
 *   amber: 7–30 days
 *   red: < 7 days (but in the future)
 *   gray: already expired (or no expiry)
 */
export type ExpiryBand = 'green' | 'amber' | 'red' | 'gray' | 'none';

export function expiryBand(
  expiryDate: string | null,
  reference: Date = new Date(),
): ExpiryBand {
  if (!expiryDate) return 'none';
  const days = Math.ceil(
    (new Date(expiryDate).getTime() - reference.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return 'gray';
  if (days < 7) return 'red';
  if (days <= 30) return 'amber';
  return 'green';
}
