import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("min-w-0 rounded-ui border border-surface-600 bg-surface-900 p-4 shadow-subtle", className)}
      {...props}
    />
  );
}
