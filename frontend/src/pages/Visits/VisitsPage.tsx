import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  XCircle
} from "lucide-react";
import { PageWrapper } from "../../components/layout/PageWrapper";
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
import { ApiError } from "../../services/api";
import { listClients } from "../../services/clients";
import { listProjects } from "../../services/projects";
import {
  cancelVisit,
  completeVisit,
  createVisit,
  deleteVisit,
  getVisitsMeta,
  listVisits,
  reopenVisit,
  updateVisit
} from "../../services/visits";
import type { PaginationMeta } from "../../types/api";
import type { Client } from "../../types/client";
import type { Project } from "../../types/project";
import type { Visit, VisitOption, VisitStatus, VisitType, VisitWriteInput } from "../../types/visit";
import { visitStatusValues, visitTypeValues } from "../../types/visit";
import { formatDateOnly as formatDateOnlyValue } from "../../utils/date";
import { getDateSearchParam, getEnumSearchParam, getStringSearchParam } from "../../utils/searchParams";
import { VisitFormModal } from "./VisitFormModal";

const pageSize = 20;
const actionIconClassName = "h-4 w-4 shrink-0";
const actionIconStrokeWidth = 1.75;
const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1
};
const fallbackStatuses: VisitOption<VisitStatus>[] = visitStatusValues.map((value) => ({ value, label: value }));
const fallbackTypes: VisitOption<VisitType>[] = visitTypeValues.map((value) => ({ value, label: value }));
const visitScopeValues = ["UPCOMING_VISITS"] as const;
type VisitScope = (typeof visitScopeValues)[number];
type VisitsQuery = {
  search: string;
  clientId: string;
  projectId: string;
  type: VisitType | "";
  status: VisitStatus | "";
  scope: VisitScope | "";
  dateFrom: string;
  dateTo: string;
};

export function VisitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = readVisitsSearchParams(searchParams);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [statuses, setStatuses] = useState<VisitOption<VisitStatus>[]>(fallbackStatuses);
  const [types, setTypes] = useState<VisitOption<VisitType>[]>(fallbackTypes);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(initialQuery.search);
  const [draftClientId, setDraftClientId] = useState(initialQuery.clientId);
  const [draftProjectId, setDraftProjectId] = useState(initialQuery.projectId);
  const [draftType, setDraftType] = useState<VisitType | "">(initialQuery.type);
  const [draftStatus, setDraftStatus] = useState<VisitStatus | "">(initialQuery.status);
  const [draftScope, setDraftScope] = useState<VisitScope | "">(initialQuery.scope);
  const [query, setQuery] = useState<VisitsQuery>(initialQuery);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Visit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusLabelByValue = useMemo(() => new Map(statuses.map((status) => [status.value, status.label])), [statuses]);
  const typeLabelByValue = useMemo(() => new Map(types.map((type) => [type.value, type.label])), [types]);
  const searchParamsKey = searchParams.toString();
  const filteredProjects = useMemo(() => {
    if (!draftClientId) {
      return projects;
    }

    return projects.filter((project) => project.clientId === draftClientId);
  }, [draftClientId, projects]);

  const loadVisits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listVisits({
        page,
        pageSize,
        search: query.search,
        clientId: query.clientId || undefined,
        projectId: query.projectId || undefined,
        type: query.type || undefined,
        status: query.status || undefined,
        scope: query.scope || undefined,
        dateFrom: query.dateFrom || undefined,
        dateTo: query.dateTo || undefined
      });

      setVisits(result.data);
      setPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query.clientId, query.dateFrom, query.dateTo, query.projectId, query.scope, query.search, query.status, query.type]);

  useEffect(() => {
    const nextQuery = readVisitsSearchParams(searchParams);

    setDraftSearch(nextQuery.search);
    setDraftClientId(nextQuery.clientId);
    setDraftProjectId(nextQuery.projectId);
    setDraftType(nextQuery.type);
    setDraftStatus(nextQuery.status);
    setDraftScope(nextQuery.scope);
    setPage(1);
    setQuery(nextQuery);
  }, [searchParamsKey]);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const [visitsMeta, clientsResult, projectsResult] = await Promise.all([
          getVisitsMeta(),
          listClients({ page: 1, pageSize: 100 }),
          listProjects({ page: 1, pageSize: 100 })
        ]);

        if (active) {
          setStatuses(visitsMeta.statuses);
          setTypes(visitsMeta.types);
          setClients(clientsResult.data);
          setProjects(projectsResult.data);
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
    void loadVisits();
  }, [loadVisits]);

  useEffect(() => {
    if (!draftProjectId || projects.length === 0) {
      return;
    }

    const projectStillAvailable = filteredProjects.some((project) => project.id === draftProjectId);

    if (!projectStillAvailable) {
      setDraftProjectId("");
    }
  }, [draftProjectId, filteredProjects, projects.length]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery({
      search: draftSearch.trim(),
      clientId: draftClientId,
      projectId: draftProjectId,
      type: draftType,
      status: draftStatus,
      scope: draftScope,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo
    });
  }

  function handleClearFilters() {
    applyQuery({ search: "", clientId: "", projectId: "", type: "", status: "", scope: "", dateFrom: "", dateTo: "" });
  }

  function applyQuery(nextQuery: VisitsQuery) {
    setDraftSearch(nextQuery.search);
    setDraftClientId(nextQuery.clientId);
    setDraftProjectId(nextQuery.projectId);
    setDraftType(nextQuery.type);
    setDraftStatus(nextQuery.status);
    setDraftScope(nextQuery.scope);
    setPage(1);
    setQuery(nextQuery);
    setSearchParams(toVisitsSearchParams(nextQuery), { replace: true });
  }

  function handleOpenCreate() {
    setFormMode("create");
    setSelectedVisit(null);
    setFormError(null);
    setFormOpen(true);
  }

  function handleOpenEdit(visit: Visit) {
    setFormMode("edit");
    setSelectedVisit(visit);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSaveVisit(payload: VisitWriteInput) {
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      if (formMode === "create") {
        await createVisit(payload);
        setNotice("Visita técnica cadastrada.");
      } else if (selectedVisit) {
        await updateVisit(selectedVisit.id, payload);
        setNotice("Visita técnica atualizada.");
      }

      setFormOpen(false);
      setSelectedVisit(null);
      await loadVisits();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleVisitAction(visit: Visit, action: "complete" | "reopen" | "cancel") {
    setActionLoadingId(visit.id);
    setError(null);
    setNotice(null);

    try {
      if (action === "complete") {
        await completeVisit(visit.id);
        setNotice("Visita técnica concluída.");
      } else if (action === "reopen") {
        await reopenVisit(visit.id);
        setNotice("Visita técnica reaberta.");
      } else {
        await cancelVisit(visit.id);
        setNotice("Visita técnica cancelada.");
      }

      await loadVisits();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      await deleteVisit(deleteTarget.id);
      setNotice("Visita técnica excluída.");
      setDeleteTarget(null);
      await loadVisits();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(query.search || query.clientId || query.projectId || query.type || query.status || query.scope || query.dateFrom || query.dateTo);

  return (
    <PageWrapper
      actions={
        <Button disabled={metaLoading} onClick={handleOpenCreate} type="button">
          <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
          Nova visita
        </Button>
      }
      description="Visitas técnicas com cliente obrigatório, projeto opcional, agenda, endereço, valor e status."
      title="Visitas técnicas"
    >
      <Card>
        <form
          className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
          onSubmit={handleFilterSubmit}
        >
          <Input
            label="Busca"
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Tipo, endereço, cliente ou projeto"
            value={draftSearch}
          />
          <Select label="Status" onChange={(event) => setDraftStatus(event.target.value as VisitStatus | "")} value={draftStatus}>
            <option value="">Todos</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select label="Tipo" onChange={(event) => setDraftType(event.target.value as VisitType | "")} value={draftType}>
            <option value="">Todos</option>
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Select label="Agenda" onChange={(event) => setDraftScope(event.target.value as VisitScope | "")} value={draftScope}>
            <option value="">Todas</option>
            <option value="UPCOMING_VISITS">Próximos 7 dias</option>
          </Select>
          <Select label="Cliente" onChange={(event) => setDraftClientId(event.target.value)} value={draftClientId}>
            <option value="">Todos</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Select label="Projeto" onChange={(event) => setDraftProjectId(event.target.value)} value={draftProjectId}>
            <option value="">Todos</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <div className="flex min-w-0 flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3 xl:justify-end 2xl:col-span-6">
            <Button className="min-w-28" title="Buscar visitas" type="submit">
              <Search className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Buscar
            </Button>
            <ActionIconButton ariaLabel="Limpar filtros" label="Limpar filtros" onClick={handleClearFilters} size="control" variant="secondary">
              <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
            <ActionIconButton ariaLabel="Atualizar lista" label="Atualizar lista" onClick={() => void loadVisits()} size="control" variant="secondary">
              <RefreshCw className={`${actionIconClassName} ${loading ? "animate-spin" : ""}`} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
          </div>
        </form>
        {query.dateFrom || query.dateTo ? (
          <p className="mt-3 text-xs text-text-muted">
            Período aplicado pelo relatório: {query.dateFrom || "início"} a {query.dateTo || "fim"}.
          </p>
        ) : null}
      </Card>

      {error ? (
        <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? <div className="rounded-ui border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">{notice}</div> : null}

      {loading && visits.length === 0 ? <LoadingState /> : null}

      {!loading && visits.length === 0 ? (
        <EmptyState
          action={
            hasFilters ? (
              <Button onClick={handleClearFilters} type="button" variant="secondary">
                Limpar filtros
              </Button>
            ) : (
              <Button disabled={metaLoading} onClick={handleOpenCreate} type="button">
                <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                Nova visita
              </Button>
            )
          }
          description={
            hasFilters
              ? "Nenhuma visita técnica encontrada para os filtros atuais."
              : "Registre visitas de levantamento, vistoria, reunião ou acompanhamento de obra."
          }
          title={hasFilters ? "Sem resultados" : "Nenhuma visita cadastrada"}
        />
      ) : null}

      {visits.length > 0 ? (
        <div className="space-y-3">
          <Table headers={["Visita", "Cliente", "Projeto", "Data/Hora", "Valor", "Status", "Ações"]}>
            {visits.map((visit) => {
              const isActionLoading = actionLoadingId === visit.id;
              const visitLabel = typeLabelByValue.get(visit.type) ?? visit.type;

              return (
                <tr className="min-w-[1080px]" key={visit.id}>
                  <td className="min-w-64 px-4 py-4 align-top">
                    <div className="flex items-center gap-2 font-medium text-text-primary">
                      <CalendarClock className="h-4 w-4 text-text-muted" strokeWidth={actionIconStrokeWidth} />
                      {visitLabel}
                    </div>
                    <div className="mt-2 flex items-start gap-2 text-xs text-text-muted">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={actionIconStrokeWidth} />
                      <span>{visit.address ?? "Endereço não informado"}</span>
                    </div>
                    {visit.notes ? <div className="mt-1 text-xs text-text-muted">{visit.notes}</div> : null}
                  </td>
                  <td className="min-w-48 px-4 py-4 align-top">
                    <div className="text-text-primary">{visit.client.name}</div>
                    <div className="mt-1 text-xs text-text-muted">{visit.client.whatsapp ?? visit.client.phone ?? visit.client.email ?? "Sem contato"}</div>
                  </td>
                  <td className="min-w-48 px-4 py-4 align-top text-text-secondary">{visit.project?.name ?? "Sem projeto vinculado"}</td>
                  <td className="min-w-32 px-4 py-4 align-top text-text-secondary">{formatDateTime(visit.date, visit.time)}</td>
                  <td className="min-w-28 px-4 py-4 align-top text-text-secondary">{formatMoney(visit.amount)}</td>
                  <td className="px-4 py-4 align-top">
                    <Badge tone={getVisitStatusTone(visit.status)}>{statusLabelByValue.get(visit.status) ?? visit.status}</Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex max-w-full flex-wrap items-center gap-2">
                      <ActionIconButton ariaLabel={`Editar ${visitLabel}`} label="Editar" onClick={() => handleOpenEdit(visit)}>
                        <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      </ActionIconButton>
                      {visit.status === "COMPLETED" || visit.status === "CANCELLED" ? (
                        <ActionIconButton
                          ariaLabel={`Reabrir ${visitLabel}`}
                          disabled={isActionLoading}
                          label="Reabrir"
                          onClick={() => void handleVisitAction(visit, "reopen")}
                        >
                          {isActionLoading ? (
                            <RefreshCw className={`${actionIconClassName} animate-spin`} strokeWidth={actionIconStrokeWidth} />
                          ) : (
                            <RotateCcw className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                          )}
                        </ActionIconButton>
                      ) : (
                        <ActionIconButton
                          ariaLabel={`Concluir ${visitLabel}`}
                          disabled={isActionLoading}
                          label="Concluir"
                          onClick={() => void handleVisitAction(visit, "complete")}
                        >
                          {isActionLoading ? (
                            <RefreshCw className={`${actionIconClassName} animate-spin`} strokeWidth={actionIconStrokeWidth} />
                          ) : (
                            <CheckCircle2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                          )}
                        </ActionIconButton>
                      )}
                      {visit.status !== "COMPLETED" && visit.status !== "CANCELLED" ? (
                        <ActionIconButton
                          ariaLabel={`Cancelar ${visitLabel}`}
                          destructive
                          disabled={isActionLoading}
                          label="Cancelar"
                          onClick={() => void handleVisitAction(visit, "cancel")}
                        >
                          <Ban className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                        </ActionIconButton>
                      ) : null}
                      <ActionIconButton ariaLabel={`Excluir ${visitLabel}`} destructive label="Excluir" onClick={() => setDeleteTarget(visit)}>
                        <Trash2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>

          <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total} visita{pagination.total === 1 ? "" : "s"} encontradas
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

      <VisitFormModal
        apiError={formError}
        clients={clients}
        mode={formMode}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleSaveVisit}
        open={formOpen}
        projects={projects}
        saving={saving}
        statuses={statuses}
        types={types}
        visit={selectedVisit}
      />

      <DeleteModal
        confirming={deleting}
        impact="A visita técnica será removida permanentemente."
        itemName={deleteTarget ? `${typeLabelByValue.get(deleteTarget.type) ?? deleteTarget.type} - ${deleteTarget.client.name}` : ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={Boolean(deleteTarget)}
      />
    </PageWrapper>
  );
}

function readVisitsSearchParams(searchParams: URLSearchParams): VisitsQuery {
  return {
    search: getStringSearchParam(searchParams, "search"),
    clientId: getStringSearchParam(searchParams, "clientId"),
    projectId: getStringSearchParam(searchParams, "projectId"),
    type: getEnumSearchParam(searchParams, "type", visitTypeValues),
    status: getEnumSearchParam(searchParams, "status", visitStatusValues),
    scope: getEnumSearchParam(searchParams, "scope", visitScopeValues),
    dateFrom: getDateSearchParam(searchParams, "dateFrom"),
    dateTo: getDateSearchParam(searchParams, "dateTo")
  };
}

function toVisitsSearchParams(query: VisitsQuery) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams;
}

function getVisitStatusTone(status: VisitStatus) {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "neutral";
}

function formatDateTime(dateValue: string, timeValue?: string | null) {
  const formattedDate = formatDateOnly(dateValue);

  if (!timeValue) {
    return formattedDate;
  }

  return `${formattedDate} às ${timeValue}`;
}

function formatDateOnly(value: string) {
  return formatDateOnlyValue(value);
}

function formatMoney(value?: string | null) {
  if (!value) {
    return "Sem valor";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}
