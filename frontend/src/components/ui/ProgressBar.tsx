type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ label, value }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{label ?? "Progresso"}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-700">
        <div className="h-full rounded-full bg-accent-bronze" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
