import type { ReactNode } from "react";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string;
  badge?: ReactNode;
};

export function StatCard({ badge, label, value }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <div className="mt-3 flex min-w-0 items-end justify-between gap-3">
        <strong className="min-w-0 break-words text-2xl font-semibold leading-tight text-text-primary">{value}</strong>
        {badge ? <span className="shrink-0">{badge}</span> : null}
      </div>
    </Card>
  );
}
