interface SelectionCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Render in the indeterminate (some-but-not-all) state. */
  indeterminate?: boolean;
  testId?: string;
}

/**
 * Native checkbox for table row selection. Stops click propagation so
 * clicking it inside a row that navigates on click doesn't also open
 * the record.
 */
export function SelectionCheckbox({
  checked,
  onChange,
  label,
  indeterminate = false,
  testId,
}: SelectionCheckboxProps) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-primary"
      checked={checked}
      aria-label={label}
      data-testid={testId}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
