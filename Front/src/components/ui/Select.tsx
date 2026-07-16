import { useId, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ label, error, id, className = "", children, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={selectId}
        className={`rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-ink focus:border-brand ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
