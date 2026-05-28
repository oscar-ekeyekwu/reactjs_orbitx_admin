import type { PaymentProviderKind } from '@/services/api';

export interface ProviderFormDraft {
  slug: string;
  kind: PaymentProviderKind;
  displayName: string;
  baseUrl: string;
  publicKey: string;
  preferredBank: string;
  secretKey: string;
  webhookSecret: string;
  enabled: boolean;
}

export const EMPTY_DRAFT: ProviderFormDraft = {
  slug: '',
  kind: 'paystack',
  displayName: '',
  baseUrl: 'https://api.paystack.co',
  publicKey: '',
  preferredBank: '',
  secretKey: '',
  webhookSecret: '',
  enabled: true,
};

export const KINDS: { value: PaymentProviderKind; label: string }[] = [
  { value: 'paystack', label: 'Paystack' },
];

// Paystack-supported DVA banks. Test mode only honours test-bank; live
// mode rejects test-bank. The empty option lets the backend auto-pick
// based on the secret-key prefix.
export const PAYSTACK_BANKS: { value: string; label: string }[] = [
  { value: '', label: 'Auto (recommended)' },
  { value: 'test-bank', label: 'Test Bank (test mode only)' },
  { value: 'wema-bank', label: 'Wema Bank' },
  { value: 'access-bank', label: 'Access Bank' },
  { value: 'titan-paystack', label: 'Titan Bank (via Paystack)' },
];
