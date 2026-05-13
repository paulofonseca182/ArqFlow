import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarDays, RefreshCw } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { ApiError } from "../../services/api";
import { getDashboardSummary } from "../../services/dashboard";
import type { DashboardAlertSeverity, DashboardSummary } from "../../types/dashboard";

const emptyDashboard: DashboardSummary = {
  alerts: [],
  financial: {
    approvedBudgets: 0,
    averageProjectTicket: "0",
    dueSoonAmount: "0",
    dueSoonCount: 0,
    overdueAmount: "0",
    overdueCount: 0,
    receivableAmount: "0",
    receivedAmount: "0",
    refusedBudgets: 0,
    revenueMonth: "0",
    revenueYear: "0"
  },
  generatedAt: "",
  metrics: {
    activeProjects: 0,
    clientsTotal: 0,
    dueSoonPayments: 0,
    overduePayments: 0,
    projectsInProgress: 0
  },
  projects: {
    active: 0,
    averageProgress: 0,
    byStatus: [],
    cancelled: 0,
    finished: 0,
    nextDeliveries: [],
    total: 0
  }
};

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setSummary(await getDashboardSummary());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <PageWrapper
      actions={
        <Button disabled={loading} onClick={() => void loadDashboard()} type="button" variant="secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
          Atualizar
        </Button>
      }
      description="Resumo real do escritório com projetos, financeiro e alertas."
      title="Dashboard"
    >
      {error ? (
        <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? <LoadingState /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard badge={<Badge tone="neutral">Total</Badge>} label="Clientes" value={summary.metrics.clientsTotal.toString()} />
        <StatCard badge={<Badge tone="success">Ativos</Badge>} label="Projetos ativos" value={summary.metrics.activeProjects.toString()} />
        <StatCard badge={<Badge tone="danger">Crítico</Badge>} label="Atrasados" value={summary.metrics.overduePayments.toString()} />
        <StatCard badge={<Badge tone="warning">7 dias</Badge>} label="Vencem em 7 dias" value={summary.metrics.dueSoonPayments.toString()} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard badge={<Badge tone="success">Mês</Badge>} label="Receita do mês" value={formatMoney(summary.financial.revenueMonth)} />
        <StatCard badge={<Badge tone="neutral">Ano</Badge>} label="Receita do ano" value={formatMoney(summary.financial.revenueYear)} />
        <StatCard badge={<Badge tone="warning">Aberto</Badge>} label="A receber" value={formatMoney(summary.financial.receivableAmount)} />
        <StatCard badge={<Badge tone="neutral">Médio</Badge>} label="Ticket por projeto" value={formatMoney(summary.financial.averageProjectTicket)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Próximas entregas</h3>
              <p className="mt-2 text-sm text-text-secondary">Projetos ativos ordenados pela data prevista.</p>
            </div>
            <Badge tone="neutral">{summary.projects.total} projetos</Badge>
          </div>

          <div className="mt-5">
            <ProgressBar label="Progresso médio" value={summary.projects.averageProgress} />
          </div>

          <div className="mt-5 space-y-3">
            {summary.projects.nextDeliveries.length === 0 ? (
              <EmptyState description="Nenhum projeto ativo com entrega futura." title="Sem próximas entregas" />
            ) : (
              summary.projects.nextDeliveries.map((delivery) => (
                <div className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3" key={delivery.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-text-primary">{delivery.name}</div>
                      <div className="mt-1 text-xs text-text-muted">{delivery.clientName}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                      {formatDate(delivery.expectedDeliveryDate)}
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={delivery.progress} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Alertas</h3>
              <p className="mt-2 text-sm text-text-secondary">Sinais que precisam de atenção operacional.</p>
            </div>
            <Badge tone={summary.alerts.length > 0 ? "warning" : "success"}>{summary.alerts.length}</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {summary.alerts.length === 0 ? (
              <p className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3 text-sm text-text-secondary">
                Nenhum alerta crítico no momento.
              </p>
            ) : (
              summary.alerts.map((alert) => (
                <div className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3" key={alert.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-medium text-text-primary">{alert.title}</h4>
                    <Badge tone={getAlertTone(alert.severity)}>{alert.count ?? alert.amount ?? "Atenção"}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </PageWrapper>
  );
}

function getAlertTone(severity: DashboardAlertSeverity) {
  if (severity === "danger") {
    return "danger";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "neutral";
}

function formatMoney(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value));
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível carregar o dashboard.";
}
