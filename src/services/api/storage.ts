import apiClient from './client';

export type StorageProviderKind = 's3_compatible';

export interface StorageProvider {
  id: string;
  slug: string;
  kind: StorageProviderKind;
  displayName: string;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: {
    masked: string;
    updatedAt: string;
  };
  enabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStorageProviderDto {
  slug: string;
  kind?: StorageProviderKind;
  displayName: string;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface UpdateStorageProviderDto {
  displayName?: string;
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  enabled?: boolean;
}

export interface StorageProviderTestResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * STG-2 — admin-only CRUD for the pluggable storage providers table.
 * Plaintext secrets only flow OUT of the browser (create/update DTOs);
 * the API never echoes them back — every read returns the masked shape.
 */
export const storageProvidersApi = {
  list: async (): Promise<StorageProvider[]> => {
    const response = await apiClient.get<StorageProvider[]>(
      '/admin/storage/providers',
    );
    return response.data;
  },

  create: async (dto: CreateStorageProviderDto): Promise<StorageProvider> => {
    const response = await apiClient.post<StorageProvider>(
      '/admin/storage/providers',
      dto,
    );
    return response.data;
  },

  update: async (
    id: string,
    dto: UpdateStorageProviderDto,
  ): Promise<StorageProvider> => {
    const response = await apiClient.patch<StorageProvider>(
      `/admin/storage/providers/${id}`,
      dto,
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/storage/providers/${id}`);
  },

  test: async (id: string): Promise<StorageProviderTestResult> => {
    const response = await apiClient.post<StorageProviderTestResult>(
      `/admin/storage/providers/${id}/test`,
    );
    return response.data;
  },

  activate: async (id: string): Promise<StorageProvider> => {
    const response = await apiClient.post<StorageProvider>(
      `/admin/storage/providers/${id}/activate`,
    );
    return response.data;
  },
};

export type StorageMigrationStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'completed_with_errors';

export interface StorageMigration {
  id: string;
  fromProviderId: string;
  toProviderId: string;
  status: StorageMigrationStatus;
  dryRun: boolean;
  batchSize: number;
  since: string | null;
  queuedAt: string;
  queuedUntilCreatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  totalDocuments: number;
  migratedCount: number;
  wouldMigrateCount: number;
  failedCount: number;
  skippedCount: number;
  lastDocumentId: string | null;
  startedBy: string | null;
  errorMessage: string | null;
  sourceDeletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StorageMigrationVerificationStatus =
  | 'running'
  | 'completed'
  | 'completed_with_gaps';

export interface StorageMigrationVerification {
  id: string;
  migrationId: string;
  startedAt: string;
  finishedAt: string | null;
  status: StorageMigrationVerificationStatus;
  verifiedCount: number;
  missingAtDestination: number;
  totalChecked: number;
  createdAt: string;
  updatedAt: string;
}

export type StorageMigrationDeletionStatus =
  | 'deleted'
  | 'skipped_missing_at_destination'
  | 'failed';

export interface StorageMigrationDeletion {
  id: string;
  migrationId: string;
  documentId: string;
  status: StorageMigrationDeletionStatus;
  errorMessage: string | null;
  deletedAt: string;
}

export interface StorageMigrationFailureRow {
  id: string;
  documentId: string;
  errorMessage: string;
  attempt: number;
  createdAt: string;
}

export interface QueueStorageMigrationDto {
  fromProviderId: string;
  toProviderId: string;
  dryRun?: boolean;
  batchSize?: number;
  since?: string;
}

export const storageMigrationsApi = {
  list: async (): Promise<StorageMigration[]> => {
    const response = await apiClient.get<StorageMigration[]>(
      '/admin/storage/migrations',
    );
    return response.data;
  },

  findOne: async (id: string): Promise<StorageMigration> => {
    const response = await apiClient.get<StorageMigration>(
      `/admin/storage/migrations/${id}`,
    );
    return response.data;
  },

  failures: async (id: string): Promise<StorageMigrationFailureRow[]> => {
    const response = await apiClient.get<StorageMigrationFailureRow[]>(
      `/admin/storage/migrations/${id}/failures`,
    );
    return response.data;
  },

  start: async (dto: QueueStorageMigrationDto): Promise<StorageMigration> => {
    const response = await apiClient.post<StorageMigration>(
      '/admin/storage/migrate',
      dto,
    );
    return response.data;
  },

  pause: async (id: string): Promise<StorageMigration> => {
    const response = await apiClient.post<StorageMigration>(
      `/admin/storage/migrations/${id}/pause`,
    );
    return response.data;
  },

  resume: async (id: string): Promise<StorageMigration> => {
    const response = await apiClient.post<StorageMigration>(
      `/admin/storage/migrations/${id}/resume`,
    );
    return response.data;
  },

  verify: async (id: string): Promise<StorageMigrationVerification> => {
    const response = await apiClient.post<StorageMigrationVerification>(
      `/admin/storage/migrations/${id}/verify`,
    );
    return response.data;
  },

  verifications: async (
    id: string,
  ): Promise<StorageMigrationVerification[]> => {
    const response = await apiClient.get<StorageMigrationVerification[]>(
      `/admin/storage/migrations/${id}/verifications`,
    );
    return response.data;
  },

  deleteSource: async (
    id: string,
    confirm: string,
  ): Promise<StorageMigration> => {
    const response = await apiClient.post<StorageMigration>(
      `/admin/storage/migrations/${id}/delete-source`,
      { confirm },
    );
    return response.data;
  },

  deletions: async (id: string): Promise<StorageMigrationDeletion[]> => {
    const response = await apiClient.get<StorageMigrationDeletion[]>(
      `/admin/storage/migrations/${id}/deletions`,
    );
    return response.data;
  },
};

/**
 * STG-5 — exact phrase the operator must type to confirm source delete.
 * Mirrors the backend's `expectedConfirmPhrase` helper.
 */
export function expectedDeleteSourcePhrase(
  migratedCount: number,
  sourceSlug: string,
): string {
  return `DELETE ${migratedCount} documents from ${sourceSlug}`;
}
