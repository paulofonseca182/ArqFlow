import { clsx } from "clsx";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, error, label, id, ...props }, ref) {
  const inputId = id ?? props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-text-secondary">{label}</span> : null}
      <input
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        id={inputId}
        ref={ref}
        className={clsx(
          "h-10 w-full rounded-ui border border-surface-600 bg-surface-900 px-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent-bronze",
          error && "border-status-danger",
          className
        )}
        {...props}
      />
      {error ? (
        <span className="text-xs text-status-danger" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
});
