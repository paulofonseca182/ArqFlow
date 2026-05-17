import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowUpRight, Download, Filter, RefreshCw } from "lucide-react";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Select } from "../../components/ui/Select";
import { StatCard } from "../../components/ui/StatCard";
import { Table } from "../../components/ui/Table";
import { ApiError } from "../../services/api";
import { listClients } from "../../services/clients";
import { listProjects } from "../../services/projects";
import { getReportsOverview } from "../../services/reports";
import type { Client } from "../../types/client";
import type { Project } from "../../types/project";
import { reportPeriodValues } from "../../types/reports";
import type { ReportPeriodKey, ReportsOverview, ReportsOverviewParams, ReportStatusCount } from "../../types/reports";
import { getDateSearchParam, getEnumSearchParam, getStringSearchParam } from "../../utils/searchParams";
import { buildReportsCsv, createReportExportFilename } from "./reports-export";

const defaultQuery: ReportsOverviewParams = {
  period: "CURRENT_MONTH"
};

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = readReportsSearchParams(searchParams);
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState<ReportsOverviewParams>(initialQuery);
  const [draftPeriod, setDraftPeriod] = useState<ReportPeriodKey>(initialQuery.period);
  const [draftFrom, setDraftFrom] = useState(initialQuery.from ?? "");
  const [draftTo, setDraftTo] = useState(initialQuery.to ?? "");
  const [draftClientId, setDraftClientId] = useState(initialQuery.clientId ?? "");
  const [draftProjectId, setDraftProjectId] = useState(initialQuery.projectId ?? "");
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filteredProjects = useMemo(
    () => (draftClientId ? projects.filter((project) => project.clientId === draftClientId) : projects),
    [draftClientId, projects]
  );
  const shortcuts = overview ? getReportShortcuts(overview, query) : null;
  const searchParamsKey = searchParams.toString();

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setOverview(await getReportsOverview(query));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const nextQuery = readReportsSearchParams(searchParams);

    setDraftPeriod(nextQuery.period);
    setDraftFrom(nextQuery.from ?? "");
    setDraftTo(nextQuery.to ?? "");
    setDraftClientId(nextQuery.clientId ?? "");
    setDraftProjectId(nextQuery.projectId ?? "");
    setQuery(nextQuery);
  }, [searchParamsKey]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);

      try {
        const [clientsResult, projectsResult] = await Promise.all([
          listClients({ page: 1, pageSize: 100 }),
          listProjects({ page: 1, pageSize: 100 })
        ]);

        if (active) {
          setClients(clientsResult.data);
          setProjects(projectsResult.data);
        }
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (active) {
          setOptionsLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (draftPeriod === "CUSTOM" && (!draftFrom || !draftTo)) {
      setError("Informe a data inicial e final para usar intervalo personalizado.");
      return;
    }

    applyQuery({
      period: draftPeriod,
      from: draftPeriod === "CUSTOM" ? draftFrom : undefined,
      to: draftPeriod === "CUSTOM" ? draftTo : undefined,
      clientId: draftClientId || undefined,
      projectId: draftProjectId || undefined
    });
  }

  function handleClearFilters() {
    applyQuery(defaultQuery);
  }

  function handleClientFilterChange(clientId: string) {
    setDraftClientId(clientId);

    if (draftProjectId && clientId) {
      const currentProject = projects.find((project) => project.id === draftProjectId);

      if (currentProject && currentProject.clientId !== clientId) {
        setDraftProjectId("");
      }
    }
  }

  function applyQuery(nextQuery: ReportsOverviewParams) {
    setDraftPeriod(nextQuery.period);
    setDraftFrom(nextQuery.period === "CUSTOM" ? nextQuery.from ?? "" : "");
    setDraftTo(nextQuery.period === "CUSTOM" ? nextQuery.to ?? "" : "");
    setDraftClientId(nextQuery.clientId ?? "");
    setDraftProjectId(nextQuery.projectId ?? "");
    setQuery(nextQuery);
    setSearchParams(toReportsSearchParams(nextQuery), { replace: true });
  }

  function handleExportReports() {
    if (!overview) {
      return;
    }

    const blob = new Blob([`\uFEFF${buildReportsCsv(overview)}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = createReportExportFilename(overview);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageWrapper
      actions={
        <>
          <Button disabled={loading || !overview} onClick={handleExportReports} type="button" variant="secondary">
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Exportar CSV
          </Button>
          <Button disabled={loading} onClick={() => void loadReports()} type="button" variant="secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Atualizar
          </Button>
        </>
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

      <Card>
        <form className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" onSubmit={handleFilterSubmit}>
          <Select label="Período" onChange={(event) => setDraftPeriod(event.target.value as ReportPeriodKey)} value={draftPeriod}>
            <option value="CURRENT_MONTH">Mês atual</option>
            <option value="CURRENT_YEAR">Ano atual</option>
            <option value="CUSTOM">Personalizado</option>
          </Select>
          <Input
            disabled={draftPeriod !== "CUSTOM"}
            label="De"
            onChange={(event) => setDraftFrom(event.target.value)}
            type="date"
            value={draftFrom}
          />
          <Input
            disabled={draftPeriod !== "CUSTOM"}
            label="Até"
            onChange={(event) => setDraftTo(event.target.value)}
            type="date"
            value={draftTo}
          />
          <Select disabled={optionsLoading} label="Cliente" onChange={(event) => handleClientFilterChange(event.target.value)} value={draftClientId}>
            <option value="">Todos</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Select disabled={optionsLoading} label="Projeto" onChange={(event) => setDraftProjectId(event.target.value)} value={draftProjectId}>
            <option value="">Todos</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <div className="flex min-w-0 flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3 xl:justify-end 2xl:col-span-5">
            <Button className="w-full lg:w-auto" disabled={loading} type="submit">
              <Filter className="h-4 w-4" strokeWidth={1.75} />
              Aplicar
            </Button>
            <Button className="w-full lg:w-auto" disabled={loading} onClick={handleClearFilters} type="button" variant="secondary">
              Limpar filtros
            </Button>
          </div>
        </form>
        {overview ? (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-secondary">
            <span>
              Período: <span className="text-text-primary">{overview.period.label}</span> · {formatDate(overview.period.from)} a{" "}
              {formatDate(overview.period.to)}
            </span>
            <span>
              Cliente: <span className="text-text-primary">{overview.filters.clientName ?? "Todos"}</span>
            </span>
            <span>
              Projeto: <span className="text-text-primary">{overview.filters.projectName ?? "Todos"}</span>
            </span>
          </div>
        ) : null}
      </Card>

      {!loading && !overview ? (
        <EmptyState description="Não foi possível montar a visão consolidada neste momento." title="Relatórios indisponíveis" />
      ) : null}

      {overview ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              badge={<Badge tone="neutral">{overview.clients.total} total</Badge>}
              label="Clientes ativos no escopo"
              value={overview.clients.active.toString()}
            />
            <StatCard
              badge={<Badge tone="success">{overview.projects.finished} finalizados</Badge>}
              label="Projetos ativos no escopo"
              value={overview.projects.active.toString()}
            />
            <StatCard
              badge={<Badge tone="success">{overview.financial.paidPayments} pago(s)</Badge>}
              label="Recebido no período"
              value={formatMoney(overview.financial.receivedAmount)}
            />
            <StatCard
              badge={<Badge tone="warning">{overview.financial.receivablePayments} aberta(s)</Badge>}
              label="A receber no período"
              title="Abrir parcelas a receber no Financeiro"
              to={shortcuts?.financialReceivable}
              value={formatMoney(overview.financial.receivableAmount)}
            />
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
                <MetricLine label="Aprovados" to={shortcuts?.budgetsApproved} value={overview.commercial.approvedBudgets.toString()} />
                <MetricLine label="Recusados" to={shortcuts?.budgetsRefused} value={overview.commercial.refusedBudgets.toString()} />
                <MetricLine label="Abertos" to={shortcuts?.budgetsOpen} value={overview.commercial.openBudgets.toString()} />
                <MetricLine label="Valor aprovado" to={shortcuts?.budgetsApproved} value={formatMoney(overview.commercial.approvedAmount)} />
                <MetricLine label="Valor em aberto" to={shortcuts?.budgetsOpen} value={formatMoney(overview.commercial.openAmount)} />
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
                <MetricLine label="Ticket médio" value={formatMoney(overview.financial.averageProjectTicket)} />
                <MetricLine label="Atrasado no período" to={shortcuts?.financialOverdue} value={formatMoney(overview.financial.overdueAmount)} />
              </div>
              <StatusList items={overview.projects.byStatus} />
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <BreakdownCard
              description="Distribuição da carteira por tipo de projeto no período."
              emptyMessage="Nenhum tipo de projeto no período."
              items={overview.projects.byType}
              title="Projetos por tipo"
            />
            <BreakdownCard
              description="Prioridades abertas e concluídas consideradas no período."
              emptyMessage="Nenhuma tarefa no período."
              items={overview.operations.byTaskPriority}
              title="Tarefas por prioridade"
            />
            <BreakdownCard
              description="Tipos de visitas técnicas registrados no período."
              emptyMessage="Nenhuma visita no período."
              items={overview.operations.byVisitType}
              title="Visitas por tipo"
            />
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
                <MetricLine label="Tarefas atrasadas" to={shortcuts?.tasksOverdue} value={overview.operations.overdueTasks.toString()} />
                <MetricLine label="Urgentes" to={shortcuts?.tasksUrgent} value={overview.operations.urgentTasks.toString()} />
                <MetricLine label="Vencem em 7 dias" to={shortcuts?.tasksDueSoon} value={overview.operations.dueSoonTasks.toString()} />
                <MetricLine label="Visitas agendadas" to={shortcuts?.visitsScheduled} value={overview.operations.scheduledVisits.toString()} />
                <MetricLine label="Visitas em 7 dias" to={shortcuts?.visitsUpcoming} value={overview.operations.visitsNextSevenDays.toString()} />
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
                          <Link
                            className="font-medium text-text-primary transition hover:text-accent-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bronze/70"
                            title="Abrir financeiro deste projeto"
                            to={buildPath("/financial", {
                              dueFrom: toDateParam(overview.period.from),
                              dueTo: toDateParam(overview.period.to),
                              projectId: project.id,
                              status: "RECEIVABLE"
                            })}
                          >
                            {project.name}
                          </Link>
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

function BreakdownCard({
  description,
  emptyMessage,
  items,
  title
}: {
  description: string;
  emptyMessage: string;
  items: ReportStatusCount[];
  title: string;
}) {
  const visibleItems = items.filter((item) => item.count > 0);

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
      {visibleItems.length > 0 ? (
        <div className="mt-5 space-y-3">
          {visibleItems.map((item) => (
            <div key={item.status}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-text-secondary">{item.label}</span>
                <span className="shrink-0 text-text-muted">
                  {item.count} · {item.percentage}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-700">
                <div className="h-full rounded-full bg-accent-bronze" style={{ width: `${item.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-text-muted">{emptyMessage}</p>
      )}
    </Card>
  );
}

function MetricLine({ label, to, value }: { label: string; to?: string; value: string }) {
  const content = (
    <>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-text-primary">
        <span>{value}</span>
        {to ? <ArrowUpRight className="h-3.5 w-3.5 text-accent-bronze" strokeWidth={1.75} /> : null}
      </div>
    </>
  );

  if (!to) {
    return <div className="rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2">{content}</div>;
  }

  return (
    <Link
      className="rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2 transition hover:border-accent-bronze hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-bronze/70"
      title={`Abrir ${label}`}
      to={to}
    >
      {content}
    </Link>
  );
}

function getReportShortcuts(overview: ReportsOverview, query: ReportsOverviewParams) {
  const dueFrom = toDateParam(overview.period.from);
  const dueTo = toDateParam(overview.period.to);
  const scopeParams = {
    clientId: query.clientId,
    projectId: query.projectId
  };

  return {
    budgetsApproved: buildPath("/budgets", {
      ...scopeParams,
      status: "APPROVED"
    }),
    budgetsOpen: buildPath("/budgets", {
      ...scopeParams,
      createdFrom: dueFrom,
      createdTo: dueTo,
      scope: "OPEN_BUDGETS"
    }),
    budgetsRefused: buildPath("/budgets", {
      ...scopeParams,
      status: "REFUSED"
    }),
    financialOverdue: buildPath("/financial", {
      ...scopeParams,
      dueFrom,
      dueTo,
      status: "OVERDUE"
    }),
    financialReceivable: buildPath("/financial", {
      ...scopeParams,
      dueFrom,
      dueTo,
      status: "RECEIVABLE"
    }),
    tasksDueSoon: buildPath("/tasks", {
      ...scopeParams,
      dueFrom,
      dueTo,
      scope: "DUE_SOON_TASKS"
    }),
    tasksOverdue: buildPath("/tasks", {
      ...scopeParams,
      dueFrom,
      dueTo,
      scope: "OVERDUE_TASKS"
    }),
    tasksUrgent: buildPath("/tasks", {
      ...scopeParams,
      priority: "URGENT"
    }),
    visitsScheduled: buildPath("/visits", {
      ...scopeParams,
      dateFrom: dueFrom,
      dateTo: dueTo,
      status: "SCHEDULED"
    }),
    visitsUpcoming: buildPath("/visits", {
      ...scopeParams,
      dateFrom: dueFrom,
      dateTo: dueTo,
      scope: "UPCOMING_VISITS"
    })
  };
}

function readReportsSearchParams(searchParams: URLSearchParams): ReportsOverviewParams {
  const period = getEnumSearchParam(searchParams, "period", reportPeriodValues) || defaultQuery.period;

  return {
    period,
    from: period === "CUSTOM" ? getDateSearchParam(searchParams, "from") || undefined : undefined,
    to: period === "CUSTOM" ? getDateSearchParam(searchParams, "to") || undefined : undefined,
    clientId: getStringSearchParam(searchParams, "clientId") || undefined,
    projectId: getStringSearchParam(searchParams, "projectId") || undefined
  };
}

function toReportsSearchParams(query: ReportsOverviewParams) {
  const searchParams = new URLSearchParams();

  searchParams.set("period", query.period);

  if (query.period === "CUSTOM" && query.from) {
    searchParams.set("from", query.from);
  }

  if (query.period === "CUSTOM" && query.to) {
    searchParams.set("to", query.to);
  }

  if (query.clientId) {
    searchParams.set("clientId", query.clientId);
  }

  if (query.projectId) {
    searchParams.set("projectId", query.projectId);
  }

  return searchParams;
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

function toDateParam(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível carregar os relatórios.";
}
