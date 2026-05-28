import { Label } from '@/components/ui';
import type { VehicleEditGraceMode } from '@/services/api';

type Props = {
  id: string;
  value: VehicleEditGraceMode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
};

export function GraceModeOption({
  id,
  value,
  label,
  description,
  checked,
  disabled,
  onChange,
}: Props) {
  return (
    <label
      htmlFor={id}
      data-testid={id}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        id={id}
        type="radio"
        name="vehicleEditGraceMode"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
