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
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-3xl font-semibold text-text-primary">{value}</strong>
        {badge}
      </div>
    </Card>
  );
}
