import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-ui border border-dashed border-surface-600 bg-surface-800 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
