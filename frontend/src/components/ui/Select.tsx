import { clsx } from "clsx";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ className, error, label, children, ...props }: SelectProps) {
  const errorId = error && props.name ? `${props.name}-error` : undefined;

  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-text-secondary">{label}</span> : null}
      <select
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className={clsx(
          "h-10 w-full rounded-ui border border-surface-600 bg-surface-900 px-3 text-sm text-text-primary outline-none transition focus:border-accent-bronze",
          error && "border-status-danger",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="text-xs text-status-danger" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
