import { useId, useState } from "react";
import type { ButtonHTMLAttributes, FocusEvent, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { Button } from "./Button";

type TooltipPosition = {
  left: number;
  top: number;
};

type ActionIconButtonSize = "compact" | "control";
type ActionIconButtonVariant = "primary" | "secondary" | "ghost";

const sizeClassNames: Record<ActionIconButtonSize, string> = {
  compact: "h-6 w-6",
  control: "h-10 w-10"
};

type ActionIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  ariaLabel?: string;
  children: ReactNode;
  destructive?: boolean;
  label: string;
  size?: ActionIconButtonSize;
  variant?: ActionIconButtonVariant;
};

export function ActionIconButton({
  ariaLabel,
  children,
  className,
  destructive = false,
  label,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  size = "compact",
  variant = "ghost",
  ...props
}: ActionIconButtonProps) {
  const tooltipId = useId();
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  function showTooltip(target: HTMLButtonElement) {
    const rect = target.getBoundingClientRect();

    setTooltipPosition({
      left: rect.left + rect.width / 2,
      top: rect.top - 8
    });
  }

  function handleMouseEnter(event: MouseEvent<HTMLButtonElement>) {
    showTooltip(event.currentTarget);
    onMouseEnter?.(event);
  }

  function handleMouseLeave(event: MouseEvent<HTMLButtonElement>) {
    setTooltipPosition(null);
    onMouseLeave?.(event);
  }

  function handleFocus(event: FocusEvent<HTMLButtonElement>) {
    showTooltip(event.currentTarget);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    setTooltipPosition(null);
    onBlur?.(event);
  }

  return (
    <>
      <Button
        aria-describedby={tooltipPosition ? tooltipId : undefined}
        aria-label={ariaLabel ?? label}
        className={clsx(
          sizeClassNames[size],
          "px-0 text-text-secondary hover:text-text-primary",
          destructive && "text-status-danger hover:text-status-danger",
          className
        )}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={label}
        type="button"
        variant={variant}
        {...props}
      >
        {children}
      </Button>

      {tooltipPosition
        ? createPortal(
            <span
              className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full rounded-ui border border-surface-600 bg-surface-900 px-2 py-1 text-xs font-medium text-text-primary shadow-subtle"
              id={tooltipId}
              role="tooltip"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top
              }}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
