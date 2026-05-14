import { clsx } from "clsx";
import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, error, label, ...props }, ref) {
  const errorId = error && props.name ? `${props.name}-error` : undefined;

  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-text-secondary">{label}</span> : null}
      <textarea
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        ref={ref}
        className={clsx(
          "min-h-28 w-full rounded-ui border border-surface-500 bg-surface-950/70 px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent-bronze focus:bg-surface-950",
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
