import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-text-primary hover:bg-brand-600",
  secondary: "border border-surface-600 bg-surface-800 text-text-primary hover:bg-surface-700",
  ghost: "text-text-secondary hover:bg-surface-800 hover:text-text-primary"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-ui px-4 text-sm font-medium shadow-subtle outline-none transition focus-visible:ring-2 focus-visible:ring-accent-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}
