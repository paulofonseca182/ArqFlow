import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Search, Send, Trash2, XCircle } from "lucide-react";
import { ActionIconButton } from "../../components/ui/ActionIconButton";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ApiError } from "../../services/api";
import { approveBudget, createBudget, deleteBudget, getBudgetsMeta, listBudgets, sendBudget, updateBudget } from "../../services/budgets";
import { listClients } from "../../services/clients";
import { getProjectsMeta } from "../../services/projects";
import type { PaginationMeta } from "../../types/api";
import type { Budget, BudgetApproveInput, BudgetOption, BudgetStatus, BudgetWriteInput } from "../../types/budget";
import { budgetStatusValues } from "../../types/budget";
import type { Client } from "../../types/client";
import type { ProjectOption, ProjectStatus, ProjectType } from "../../types/project";
import { projectStatusValues, projectTypeValues } from "../../types/project";
import { getDateSearchParam, getEnumSearchParam, getStringSearchParam } from "../../utils/searchParams";
import { ApproveBudgetModal } from "./ApproveBudgetModal";
import { BudgetFormModal } from "./BudgetFormModal";

const pageSize = 20;
const actionIconClassName = "h-4 w-4 shrink-0";
const actionIconStrokeWidth = 1.75;
const fallbackStatuses: BudgetOption<BudgetStatus>[] = budgetStatusValues.map((value) => ({ value, label: value }));
const fallbackProjectTypes: ProjectOption<ProjectType>[] = projectTypeValues.map((value) => ({ value, label: value }));
const fallbackProjectStatuses: ProjectOption<ProjectStatus>[] = projectStatusValues.map((value) => ({ value, label: value }));
const budgetScopeValues = ["OPEN_BUDGETS"] as const;
const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1
};
type BudgetScope = (typeof budgetScopeValues)[number];
type BudgetsQuery = {
  search: string;
  scope: BudgetScope | "";
  status: BudgetStatus | "";
  clientId: string;
  createdFrom: string;
  createdTo: string;
};

export function BudgetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = readBudgetsSearchParams(searchParams);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [statuses, setStatuses] = useState<BudgetOption<BudgetStatus>[]>(fallbackStatuses);
  const [projectTypes, setProjectTypes] = useState<ProjectOption<ProjectType>[]>(fallbackProjectTypes);
  const [projectStatuses, setProjectStatuses] = useState<ProjectOption<ProjectStatus>[]>(fallbackProjectStatuses);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(initialQuery.search);
  const [draftScope, setDraftScope] = useState<BudgetScope | "">(initialQuery.scope);
  const [draftStatus, setDraftStatus] = useState<BudgetStatus | "">(initialQuery.status);
  const [draftClientId, setDraftClientId] = useState(initialQuery.clientId);
  const [draftCreatedFrom, setDraftCreatedFrom] = useState(initialQuery.createdFrom);
  const [draftCreatedTo, setDraftCreatedTo] = useState(initialQuery.createdTo);
  const [query, setQuery] = useState<BudgetsQuery>(initialQuery);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sendLoadingId, setSendLoadingId] = useState<string | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<Budget | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const statusLabelByValue = useMemo(() => new Map(statuses.map((status) => [status.value, status.label])), [statuses]);
  const searchParamsKey = searchParams.toString();

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listBudgets({
        page,
        pageSize,
        search: query.search,
        scope: query.scope || undefined,
        status: query.status || undefined,
        clientId: query.clientId || undefined,
        createdFrom: query.createdFrom || undefined,
        createdTo: query.createdTo || undefined
      });

      setBudgets(result.data);
      setPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query.clientId, query.createdFrom, query.createdTo, query.scope, query.search, query.status]);

  useEffect(() => {
    const nextQuery = readBudgetsSearchParams(searchParams);

    setDraftSearch(nextQuery.search);
    setDraftScope(nextQuery.scope);
    setDraftStatus(nextQuery.status);
    setDraftClientId(nextQuery.clientId);
    setDraftCreatedFrom(nextQuery.createdFrom);
    setDraftCreatedTo(nextQuery.createdTo);
    setPage(1);
    setQuery(nextQuery);
  }, [searchParamsKey]);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const [budgetsMeta, clientsResult, projectsMeta] = await Promise.all([
          getBudgetsMeta(),
          listClients({ page: 1, pageSize: 100 }),
          getProjectsMeta()
        ]);

        if (active) {
          setStatuses(budgetsMeta.statuses);
          setClients(clientsResult.data);
          setProjectTypes(projectsMeta.types);
          setProjectStatuses(projectsMeta.statuses);
        }
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (active) {
          setMetaLoading(false);
        }
      }
    }

    void loadMeta();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadBudgets();
  }, [loadBudgets]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery({
      search: draftSearch.trim(),
      scope: draftScope,
      status: draftStatus,
      clientId: draftClientId,
      createdFrom: draftCreatedFrom,
      createdTo: draftCreatedTo
    });
  }

  function handleClearFilters() {
    applyQuery({ search: "", scope: "", status: "", clientId: "", createdFrom: "", createdTo: "" });
  }

  function applyQuery(nextQuery: BudgetsQuery) {
    setDraftSearch(nextQuery.search);
    setDraftScope(nextQuery.scope);
    setDraftStatus(nextQuery.status);
    setDraftClientId(nextQuery.clientId);
    setDraftCreatedFrom(nextQuery.createdFrom);
    setDraftCreatedTo(nextQuery.createdTo);
    setPage(1);
    setQuery(nextQuery);
    setSearchParams(toBudgetsSearchParams(nextQuery), { replace: true });
  }

  function handleOpenCreate() {
    setFormMode("create");
    setSelectedBudget(null);
    setFormError(null);
    setFormOpen(true);
  }

  function handleOpenEdit(budget: Budget) {
    setFormMode("edit");
    setSelectedBudget(budget);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSaveBudget(payload: BudgetWriteInput) {
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      if (formMode === "create") {
        await createBudget(payload);
        setNotice("Orçamento cadastrado.");
      } else if (selectedBudget) {
        await updateBudget(selectedBudget.id, payload);
        setNotice("Orçamento atualizado.");
      }

      setFormOpen(false);
      setSelectedBudget(null);
      await loadBudgets();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSendBudget(budget: Budget) {
    setSendLoadingId(budget.id);
    setError(null);
    setNotice(null);

    try {
      await sendBudget(budget.id);
      setNotice("Orçamento enviado.");
      await loadBudgets();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSendLoadingId(null);
    }
  }

  function handleOpenApprove(budget: Budget) {
    setApprovalTarget(budget);
    setApprovalError(null);
  }

  async function handleApproveBudget(payload: BudgetApproveInput) {
    if (!approvalTarget) {
      return;
    }

    setApproving(true);
    setApprovalError(null);
    setNotice(null);

    try {
      const result = await approveBudget(approvalTarget.id, payload);
      setNotice(`Orçamento aprovado e projeto "${result.project.name}" criado.`);
      setApprovalTarget(null);
      await loadBudgets();
    } catch (requestError) {
      setApprovalError(getErrorMessage(requestError));
    } finally {
      setApproving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteBudget(deleteTarget.id);
      setNotice("Orçamento excluído.");
      setDeleteTarget(null);
      await loadBudgets();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(query.search || query.scope || query.status || query.clientId || query.createdFrom || query.createdTo);

  return (
    <PageWrapper
      actions={
        <Button disabled={metaLoading || clients.length === 0} onClick={handleOpenCreate} type="button">
          <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
          Novo orçamento
        </Button>
      }
      description="Propostas comerciais com itens calculados pelo backend."
      title="Orçamentos"
    >
      <Card>
        <form className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" onSubmit={handleFilterSubmit}>
          <Input label="Busca" onChange={(event) => setDraftSearch(event.target.value)} placeholder="Orçamento, cliente, serviço ou item" value={draftSearch} />
          <Select label="Visão" onChange={(event) => setDraftScope(event.target.value as BudgetScope | "")} value={draftScope}>
            <option value="">Todos</option>
            <option value="OPEN_BUDGETS">Orçamentos abertos</option>
          </Select>
          <Select label="Status" onChange={(event) => setDraftStatus(event.target.value as BudgetStatus | "")} value={draftStatus}>
            <option value="">Todos</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select label="Cliente" onChange={(event) => setDraftClientId(event.target.value)} value={draftClientId}>
            <option value="">Todos</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Input label="Criado de" onChange={(event) => setDraftCreatedFrom(event.target.value)} type="date" value={draftCreatedFrom} />
          <Input label="Criado até" onChange={(event) => setDraftCreatedTo(event.target.value)} type="date" value={draftCreatedTo} />
          <div className="flex min-w-0 flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3 xl:justify-end 2xl:col-span-6">
            <Button className="min-w-28" title="Buscar orçamentos" type="submit">
              <Search className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Buscar
            </Button>
            <ActionIconButton ariaLabel="Limpar filtros" label="Limpar filtros" onClick={handleClearFilters} size="control" variant="secondary">
              <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
            <ActionIconButton ariaLabel="Atualizar lista" label="Atualizar lista" onClick={() => void loadBudgets()} size="control" variant="secondary">
              <RefreshCw className={`${actionIconClassName} ${loading ? "animate-spin" : ""}`} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
          </div>
        </form>
      </Card>

      {error ? (
        <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-ui border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
          {notice}
        </div>
      ) : null}

      {loading && budgets.length === 0 ? <LoadingState /> : null}

      {!loading && budgets.length === 0 ? (
        <EmptyState
          action={
            hasFilters ? (
              <Button onClick={handleClearFilters} type="button" variant="secondary">
                Limpar filtros
              </Button>
            ) : (
              <Button disabled={clients.length === 0} onClick={handleOpenCreate} type="button">
                <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                Novo orçamento
              </Button>
            )
          }
          description={hasFilters ? "Nenhum orçamento encontrado para os filtros atuais." : "Crie a primeira proposta vinculada a um cliente."}
          title={hasFilters ? "Sem resultados" : "Nenhum orçamento cadastrado"}
        />
      ) : null}

      {budgets.length > 0 ? (
        <div className="space-y-3">
          <Table headers={["Orçamento", "Cliente", "Serviço", "Status", "Valores", "Validade", "Ações"]}>
            {budgets.map((budget) => (
              <tr className="min-w-[980px]" key={budget.id}>
                <td className="min-w-60 px-4 py-4 align-top">
                  <div className="font-medium text-text-primary">{budget.title}</div>
                  <div className="mt-1 text-xs text-text-muted">{formatItemsCount(budget.items.length)}</div>
                </td>
                <td className="min-w-44 px-4 py-4 align-top text-text-secondary">{budget.client.name}</td>
                <td className="min-w-44 px-4 py-4 align-top text-text-secondary">
                  <div>{budget.serviceType}</div>
                  <div className="mt-1 text-xs text-text-muted">{budget.project?.name ?? "Sem projeto vinculado"}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <Badge tone={getBudgetStatusTone(budget.status)}>{statusLabelByValue.get(budget.status) ?? budget.status}</Badge>
                </td>
                <td className="min-w-44 px-4 py-4 align-top text-text-secondary">
                  <div>{formatMoney(budget.finalAmount)}</div>
                  <div className="mt-1 text-xs text-text-muted">
                    Total {formatMoney(budget.totalAmount)} - desconto {formatMoney(budget.discount)}
                  </div>
                </td>
                <td className="min-w-32 px-4 py-4 align-top text-text-secondary">{formatDate(budget.expiresAt)}</td>
                <td className="px-4 py-4 align-top">
                  <div className="flex max-w-full flex-wrap items-center gap-2">
                    <ActionIconButton ariaLabel={`Editar ${budget.title}`} label="Editar" onClick={() => handleOpenEdit(budget)}>
                      <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                    {canSendBudget(budget) ? (
                      <ActionIconButton
                        ariaLabel={`Enviar ${budget.title}`}
                        disabled={sendLoadingId === budget.id}
                        label="Enviar"
                        onClick={() => void handleSendBudget(budget)}
                      >
                        {sendLoadingId === budget.id ? (
                          <RefreshCw className={`${actionIconClassName} animate-spin`} strokeWidth={actionIconStrokeWidth} />
                        ) : (
                          <Send className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                        )}
                      </ActionIconButton>
                    ) : null}
                    {canApproveBudget(budget) ? (
                      <ActionIconButton
                        ariaLabel={`Aprovar e converter ${budget.title}`}
                        label="Aprovar e converter"
                        onClick={() => handleOpenApprove(budget)}
                      >
                        <CheckCircle2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      </ActionIconButton>
                    ) : null}
                    <ActionIconButton
                      ariaLabel={`Excluir ${budget.title}`}
                      destructive
                      label="Excluir"
                      onClick={() => setDeleteTarget(budget)}
                    >
                      <Trash2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total} orçamento{pagination.total === 1 ? "" : "s"} encontrados
            </span>
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <Button disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button" variant="secondary">
                <ChevronLeft className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                Anterior
              </Button>
              <span className="min-w-20 text-center">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                type="button"
                variant="secondary"
              >
                Próxima
                <ChevronRight className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <BudgetFormModal
        apiError={formError}
        budget={selectedBudget}
        clients={clients}
        mode={formMode}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleSaveBudget}
        open={formOpen}
        saving={saving}
        statuses={statuses}
      />

      <ApproveBudgetModal
        apiError={approvalError}
        approving={approving}
        budget={approvalTarget}
        onClose={() => {
          if (!approving) {
            setApprovalTarget(null);
          }
        }}
        onSubmit={handleApproveBudget}
        open={Boolean(approvalTarget)}
        statuses={projectStatuses}
        types={projectTypes}
      />

      <DeleteModal
        confirming={deleting}
        impact={`${deleteTarget?.items.length ?? 0} item${deleteTarget?.items.length === 1 ? "" : "s"} serão excluídos junto com o orçamento.`}
        itemName={deleteTarget?.title ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={Boolean(deleteTarget)}
      />
    </PageWrapper>
  );
}

function readBudgetsSearchParams(searchParams: URLSearchParams): BudgetsQuery {
  return {
    search: getStringSearchParam(searchParams, "search"),
    scope: getEnumSearchParam(searchParams, "scope", budgetScopeValues),
    status: getEnumSearchParam(searchParams, "status", budgetStatusValues),
    clientId: getStringSearchParam(searchParams, "clientId"),
    createdFrom: getDateSearchParam(searchParams, "createdFrom"),
    createdTo: getDateSearchParam(searchParams, "createdTo")
  };
}

function toBudgetsSearchParams(query: BudgetsQuery) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams;
}

function canSendBudget(budget: Budget) {
  return budget.status === "DRAFT" || budget.status === "NEGOTIATION";
}

function canApproveBudget(budget: Budget) {
  return !budget.projectId && ["DRAFT", "SENT", "NEGOTIATION", "APPROVED"].includes(budget.status);
}

function getBudgetStatusTone(status: BudgetStatus) {
  if (status === "APPROVED") {
    return "success";
  }

  if (status === "SENT" || status === "NEGOTIATION") {
    return "warning";
  }

  if (status === "REFUSED" || status === "EXPIRED" || status === "CANCELLED") {
    return "danger";
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

function formatItemsCount(count: number) {
  return `${count} item${count === 1 ? "" : "s"}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}
