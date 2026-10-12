/**
 * Pulls the human-readable message out of an axios error carrying the
 * backend's `{ success: false, errorCode, message }` envelope, falling
 * back to the generic Error message.
 */
export function errorMessage(err: unknown): string {
  const envelope = (err as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (typeof envelope === 'string') return envelope;
  if (Array.isArray(envelope)) return envelope.join('; ');
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}
