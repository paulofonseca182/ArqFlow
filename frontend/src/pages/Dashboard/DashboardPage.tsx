import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, CalendarDays, RefreshCw } from "lucide-react";
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
import type { DashboardAlert, DashboardAlertSeverity, DashboardSummary } from "../../types/dashboard";
import { formatCurrency } from "../../utils/currency";
import { formatDateOnly } from "../../utils/date";

const emptyDashboard: DashboardSummary = {
  alerts: [],
  details: {
    criticalTasks: [],
    dueSoonPayments: [],
    overduePayments: [],
    upcomingVisits: []
  },
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
  operations: {
    openBudgets: 0,
    openTasks: 0,
    overdueTasks: 0,
    scheduledVisits: 0,
    tasksDueSoon: 0,
    tasksTotal: 0,
    visitsNextSevenDays: 0,
    visitsToday: 0
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
  const shortcuts = getDashboardShortcuts();

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
        <StatCard
          badge={<Badge tone="danger">Crítico</Badge>}
          label="Atrasados"
          title="Abrir pagamentos atrasados"
          to={shortcuts.financialOverdue}
          value={summary.metrics.overduePayments.toString()}
        />
        <StatCard
          badge={<Badge tone="warning">7 dias</Badge>}
          label="Vencem em 7 dias"
          title="Abrir pagamentos vencendo"
          to={shortcuts.financialDueSoon}
          value={summary.metrics.dueSoonPayments.toString()}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard badge={<Badge tone="success">Mês</Badge>} label="Receita do mês" value={formatMoney(summary.financial.revenueMonth)} />
        <StatCard badge={<Badge tone="neutral">Ano</Badge>} label="Receita do ano" value={formatMoney(summary.financial.revenueYear)} />
        <StatCard
          badge={<Badge tone="warning">Aberto</Badge>}
          label="A receber"
          title="Abrir financeiro"
          to="/financial"
          value={formatMoney(summary.financial.receivableAmount)}
        />
        <StatCard badge={<Badge tone="neutral">Médio</Badge>} label="Ticket por projeto" value={formatMoney(summary.financial.averageProjectTicket)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          badge={<Badge tone="warning">{summary.operations.tasksDueSoon} em 7 dias</Badge>}
          label="Tarefas abertas"
          title="Abrir tarefas"
          to="/tasks"
          value={summary.operations.openTasks.toString()}
        />
        <StatCard
          badge={<Badge tone={summary.operations.overdueTasks > 0 ? "danger" : "success"}>Prazo</Badge>}
          label="Tarefas atrasadas"
          title="Abrir tarefas atrasadas"
          to={shortcuts.tasksOverdue}
          value={summary.operations.overdueTasks.toString()}
        />
        <StatCard
          badge={<Badge tone="neutral">{summary.operations.visitsToday} hoje</Badge>}
          label="Visitas agendadas"
          title="Abrir visitas próximas"
          to={shortcuts.visitsUpcoming}
          value={summary.operations.scheduledVisits.toString()}
        />
        <StatCard
          badge={<Badge tone="warning">Comercial</Badge>}
          label="Orçamentos abertos"
          title="Abrir orçamentos abertos"
          to="/budgets?scope=OPEN_BUDGETS"
          value={summary.operations.openBudgets.toString()}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardDetailCard
          emptyMessage="Nenhuma parcela atrasada."
          items={summary.details.overduePayments.map((payment) => ({
            description: `${payment.clientName} - ${payment.projectName}`,
            id: payment.id,
            meta: `Vencimento ${formatDate(payment.dueDate)}`,
            title: payment.description,
            to: buildPath("/financial", { projectId: payment.projectId, status: "OVERDUE" }),
            value: formatMoney(payment.remainingAmount)
          }))}
          title="Pagamentos atrasados"
          to={shortcuts.financialOverdue}
          tone="danger"
        />
        <DashboardDetailCard
          emptyMessage="Nenhuma parcela vencendo nos próximos 7 dias."
          items={summary.details.dueSoonPayments.map((payment) => ({
            description: `${payment.clientName} - ${payment.projectName}`,
            id: payment.id,
            meta: `Vencimento ${formatDate(payment.dueDate)}`,
            title: payment.description,
            to: buildPath("/financial", { dueFrom: todayDateParam(), dueTo: addDaysDateParam(new Date(), 7), projectId: payment.projectId }),
            value: formatMoney(payment.remainingAmount)
          }))}
          title="Pagamentos vencendo"
          to={shortcuts.financialDueSoon}
          tone="warning"
        />
        <DashboardDetailCard
          emptyMessage="Nenhuma tarefa crítica."
          items={summary.details.criticalTasks.map((task) => ({
            description: task.projectName ?? "Tarefa geral",
            id: task.id,
            meta: task.dueDate ? `${task.criticalReason} - ${formatDate(task.dueDate)}` : task.criticalReason,
            title: task.title,
            to: task.criticalReason === "Atrasada" ? shortcuts.tasksOverdue : shortcuts.tasksUrgent,
            value: task.priorityLabel
          }))}
          title="Tarefas críticas"
          to={shortcuts.tasksOverdue}
          tone="warning"
        />
        <DashboardDetailCard
          emptyMessage="Nenhuma visita próxima."
          items={summary.details.upcomingVisits.map((visit) => ({
            description: `${visit.clientName}${visit.projectName ? ` - ${visit.projectName}` : ""}`,
            id: visit.id,
            meta: `${formatDate(visit.date)}${visit.time ? ` às ${visit.time}` : ""}`,
            title: visit.typeLabel,
            to: shortcuts.visitsUpcoming,
            value: visit.statusLabel
          }))}
          title="Visitas próximas"
          to={shortcuts.visitsUpcoming}
          tone="neutral"
        />
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
              summary.alerts.map((alert) => <DashboardAlertItem alert={alert} key={alert.id} shortcuts={shortcuts} />)
            )}
          </div>
        </Card>
      </section>
    </PageWrapper>
  );
}

type DashboardShortcutMap = ReturnType<typeof getDashboardShortcuts>;

type DashboardDetailItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  value: string;
  to?: string;
};

function DashboardDetailCard({
  emptyMessage,
  items,
  title,
  to,
  tone
}: {
  emptyMessage: string;
  items: DashboardDetailItem[];
  title: string;
  to: string;
  tone: "danger" | "neutral" | "warning";
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="mt-2 text-sm text-text-secondary">Itens que pedem atenção rápida.</p>
        </div>
        <Badge tone={items.length > 0 ? tone : "neutral"}>{items.length}</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2 text-sm text-text-muted">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const content = (
              <>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text-primary">{item.title}</div>
                    <div className="mt-1 truncate text-xs text-text-muted">{item.description}</div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-text-secondary">{item.value}</span>
                </div>
                <div className="mt-2 text-xs text-text-muted">{item.meta}</div>
              </>
            );

            if (!item.to) {
              return (
                <div className="rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2" key={item.id}>
                  {content}
                </div>
              );
            }

            return (
              <Link
                className="block rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2 transition hover:border-accent-bronze hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bronze/70"
                key={item.id}
                title={`Abrir ${item.title}`}
                to={item.to}
              >
                {content}
              </Link>
            );
          })
        )}
      </div>

      <Link
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-bronze outline-none transition hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-bronze/70"
        to={to}
      >
        Abrir lista completa
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
      </Link>
    </Card>
  );
}

function DashboardAlertItem({ alert, shortcuts }: { alert: DashboardAlert; shortcuts: DashboardShortcutMap }) {
  const to = getAlertTarget(alert, shortcuts);
  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium text-text-primary">{alert.title}</h4>
        <Badge tone={getAlertTone(alert.severity)}>{alert.count ?? (alert.amount ? formatMoney(alert.amount) : "Atenção")}</Badge>
      </div>
      <p className="mt-2 text-sm text-text-secondary">{alert.message}</p>
    </>
  );

  if (!to) {
    return <div className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3">{content}</div>;
  }

  return (
    <Link
      className="block rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3 transition hover:border-accent-bronze hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bronze/70"
      to={to}
    >
      {content}
    </Link>
  );
}

function getAlertTarget(alert: DashboardAlert, shortcuts: DashboardShortcutMap) {
  if (alert.type === "PAYMENT_OVERDUE") {
    return shortcuts.financialOverdue;
  }

  if (alert.type === "PAYMENT_DUE_SOON") {
    return shortcuts.financialDueSoon;
  }

  if (alert.type === "TASK_OVERDUE") {
    return shortcuts.tasksOverdue;
  }

  if (alert.type === "VISIT_DUE_SOON") {
    return shortcuts.visitsUpcoming;
  }

  if (alert.type === "PROJECT_OVER_CONTRACTED" && alert.targetId) {
    return buildPath("/financial", { projectId: alert.targetId });
  }

  return null;
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

function getDashboardShortcuts() {
  return {
    financialDueSoon: buildPath("/financial", {
      dueFrom: todayDateParam(),
      dueTo: addDaysDateParam(new Date(), 7)
    }),
    financialOverdue: "/financial?status=OVERDUE",
    tasksOverdue: "/tasks?scope=OVERDUE_TASKS",
    tasksUrgent: "/tasks?priority=URGENT",
    visitsUpcoming: "/visits?scope=UPCOMING_VISITS"
  };
}

function buildPath(pathname: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function todayDateParam() {
  return toDateInputValue(new Date());
}

function addDaysDateParam(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return toDateInputValue(nextDate);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(value: string) {
  return formatCurrency(value);
}

function formatDate(value?: string | null) {
  return formatDateOnly(value, "Não informada");
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível carregar o dashboard.";
}
