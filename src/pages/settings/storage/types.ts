import type { StorageProviderTestResult } from '@/services/api';

export type ProviderFormDraft = {
  slug: string;
  displayName: string;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export const EMPTY_PROVIDER_DRAFT: ProviderFormDraft = {
  slug: '',
  displayName: '',
  endpoint: '',
  region: '',
  bucket: '',
  accessKeyId: '',
  secretAccessKey: '',
};

export type MigrateFormDraft = {
  fromProviderId: string;
  toProviderId: string;
  dryRun: boolean;
  batchSize: number;
  since: string;
};

export const EMPTY_MIGRATE_DRAFT: MigrateFormDraft = {
  fromProviderId: '',
  toProviderId: '',
  dryRun: true,
  batchSize: 25,
  since: '',
};

export type RowStatus =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'tested'; result: StorageProviderTestResult }
  | { kind: 'activating' }
  | { kind: 'activated' }
  | { kind: 'deleting' }
  | { kind: 'error'; message: string };
