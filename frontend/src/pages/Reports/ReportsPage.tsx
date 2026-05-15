import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { Table } from "../../components/ui/Table";
import { ApiError } from "../../services/api";
import { getReportsOverview } from "../../services/reports";
import type { ReportStatusCount, ReportsOverview } from "../../types/reports";

export function ReportsPage() {
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setOverview(await getReportsOverview());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <PageWrapper
      actions={
        <Button disabled={loading} onClick={() => void loadReports()} type="button" variant="secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
          Atualizar
        </Button>
      }
      description="Leitura consolidada dos módulos ativos, com dados calculados pelo backend."
      title="Relatórios"
    >
      {error ? (
        <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? <LoadingState /> : null}

      {!loading && !overview ? (
        <EmptyState description="Não foi possível montar a visão consolidada neste momento." title="Relatórios indisponíveis" />
      ) : null}

      {overview ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              badge={<Badge tone="neutral">{overview.clients.total} total</Badge>}
              label="Clientes ativos"
              value={overview.clients.active.toString()}
            />
            <StatCard
              badge={<Badge tone="success">{overview.projects.finished} finalizados</Badge>}
              label="Projetos ativos"
              value={overview.projects.active.toString()}
            />
            <StatCard badge={<Badge tone="success">Ano</Badge>} label="Receita recebida" value={formatMoney(overview.financial.revenueYear)} />
            <StatCard badge={<Badge tone="warning">Aberto</Badge>} label="A receber" value={formatMoney(overview.financial.receivableAmount)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Comercial</h3>
                  <p className="mt-2 text-sm text-text-secondary">Orçamentos e conversão em projetos.</p>
                </div>
                <Badge tone={overview.commercial.conversionRate > 0 ? "success" : "neutral"}>{overview.commercial.conversionRate}% conversão</Badge>
              </div>
              <div className="mt-5">
                <ProgressBar label="Conversão aprovados x recusados" value={overview.commercial.conversionRate} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetricLine label="Aprovados" value={overview.commercial.approvedBudgets.toString()} />
                <MetricLine label="Recusados" value={overview.commercial.refusedBudgets.toString()} />
                <MetricLine label="Abertos" value={overview.commercial.openBudgets.toString()} />
                <MetricLine label="Valor aprovado" value={formatMoney(overview.commercial.approvedAmount)} />
                <MetricLine label="Valor em aberto" value={formatMoney(overview.commercial.openAmount)} />
                <MetricLine label="Total de orçamentos" value={overview.commercial.totalBudgets.toString()} />
              </div>
              <StatusList items={overview.commercial.byStatus} />
            </Card>

            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Projetos</h3>
                  <p className="mt-2 text-sm text-text-secondary">Carteira, progresso médio e valor contratado.</p>
                </div>
                <Badge tone="neutral">{formatMoney(overview.projects.totalContractedAmount)}</Badge>
              </div>
              <div className="mt-5">
                <ProgressBar label="Progresso médio dos ativos" value={overview.projects.averageProgress} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetricLine label="Total" value={overview.projects.total.toString()} />
                <MetricLine label="Ativos" value={overview.projects.active.toString()} />
                <MetricLine label="Finalizados" value={overview.projects.finished.toString()} />
                <MetricLine label="Cancelados" value={overview.projects.cancelled.toString()} />
              </div>
              <StatusList items={overview.projects.byStatus} />
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Operação</h3>
                  <p className="mt-2 text-sm text-text-secondary">Tarefas e visitas técnicas em andamento.</p>
                </div>
                <Badge tone={overview.operations.overdueTasks > 0 ? "warning" : "success"}>Agenda</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetricLine label="Tarefas abertas" value={overview.operations.openTasks.toString()} />
                <MetricLine label="Tarefas atrasadas" value={overview.operations.overdueTasks.toString()} />
                <MetricLine label="Urgentes" value={overview.operations.urgentTasks.toString()} />
                <MetricLine label="Vencem em 7 dias" value={overview.operations.dueSoonTasks.toString()} />
                <MetricLine label="Visitas agendadas" value={overview.operations.scheduledVisits.toString()} />
                <MetricLine label="Visitas em 7 dias" value={overview.operations.visitsNextSevenDays.toString()} />
              </div>
              <StatusList items={overview.operations.byTaskStatus} />
              <StatusList items={overview.operations.byVisitStatus} />
            </Card>

            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Recebíveis por projeto</h3>
                  <p className="mt-2 text-sm text-text-secondary">Projetos com valores pendentes ou atrasados.</p>
                </div>
                <Badge tone="warning">{formatMoney(overview.financial.receivableAmount)}</Badge>
              </div>

              <div className="mt-5">
                {overview.projects.topReceivableProjects.length === 0 ? (
                  <EmptyState description="Nenhum projeto com valor pendente no momento." title="Sem recebíveis em aberto" />
                ) : (
                  <Table headers={["Projeto", "Contratado", "Recebido", "Pendente", "Atrasado"]}>
                    {overview.projects.topReceivableProjects.map((project) => (
                      <tr key={project.id}>
                        <td className="min-w-56 px-4 py-4 align-top">
                          <div className="font-medium text-text-primary">{project.name}</div>
                          <div className="mt-1 text-xs text-text-muted">{project.clientName}</div>
                        </td>
                        <td className="px-4 py-4 align-top text-text-secondary">{formatMoney(project.contractedAmount)}</td>
                        <td className="px-4 py-4 align-top text-text-secondary">{formatMoney(project.receivedAmount)}</td>
                        <td className="px-4 py-4 align-top text-text-secondary">{formatMoney(project.pendingAmount)}</td>
                        <td className="px-4 py-4 align-top text-status-danger">{formatMoney(project.overdueAmount)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </div>
            </Card>
          </section>

          <p className="text-xs text-text-muted">Atualizado em {formatDateTime(overview.generatedAt)}</p>
        </>
      ) : null}
    </PageWrapper>
  );
}

function StatusList({ items }: { items: ReportStatusCount[] }) {
  const visibleItems = items.filter((item) => item.count > 0);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-3">
      {visibleItems.map((item) => (
        <div key={item.status}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-text-secondary">{item.label}</span>
            <span className="shrink-0 text-text-muted">{item.count}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-700">
            <div className="h-full rounded-full bg-accent-bronze" style={{ width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function formatMoney(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível carregar os relatórios.";
}
