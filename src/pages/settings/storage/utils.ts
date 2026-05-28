export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { hour12: true });
  } catch {
    return iso;
  }
}

export function extractErrorMessage(err: unknown): string {
  if (!err) return 'Save failed.';
  const apiMsg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMsg) return apiMsg;
  if (err instanceof Error) return err.message;
  return 'Save failed.';
}
