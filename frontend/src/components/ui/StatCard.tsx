import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string;
  badge?: ReactNode;
  to?: string;
  title?: string;
};

export function StatCard({ badge, label, title, to, value }: StatCardProps) {
  const card = (
    <Card className={to ? "h-full transition hover:border-accent-bronze hover:bg-surface-elevated" : undefined}>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <div className="mt-3 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <strong className="min-w-0 whitespace-nowrap text-xl font-semibold leading-tight text-text-primary xl:text-2xl">{value}</strong>
        {badge ? <span className="shrink-0">{badge}</span> : null}
      </div>
    </Card>
  );

  if (!to) {
    return card;
  }

  return (
    <Link className="block h-full rounded-ui outline-none focus-visible:ring-2 focus-visible:ring-accent-bronze/70" title={title ?? `Abrir ${label}`} to={to}>
      {card}
    </Link>
  );
}
