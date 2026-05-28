import { Label } from '@/components/ui';

type Props = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  pending: boolean;
  error: boolean;
  success: boolean;
  onToggle: () => void;
};

export function FeatureToggle({
  id,
  label,
  description,
  checked,
  pending,
  error,
  success,
  onToggle,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
        {success && <p className="text-xs text-green-600">Saved</p>}
        {error && (
          <p className="text-xs text-red-500">
            Could not save. Please try again.
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${label}`}
        onClick={onToggle}
        disabled={pending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
