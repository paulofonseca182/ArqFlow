import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  XCircle
} from "lucide-react";
import { ActionIconButton } from "../../components/ui/ActionIconButton";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ApiError } from "../../services/api";
import { listClients } from "../../services/clients";
import {
  completeProjectStep,
  generateDefaultProjectSteps,
  getProjectStepsMeta,
  listProjectSteps,
  reopenProjectStep
} from "../../services/projectSteps";
import {
  createProject,
  deleteProject,
  getProjectDeleteImpact,
  getProjectsMeta,
  listProjects,
  updateProject
} from "../../services/projects";
import type { PaginationMeta } from "../../types/api";
import type { Client } from "../../types/client";
import { projectStatusValues, projectTypeValues } from "../../types/project";
import type {
  Project,
  ProjectDeleteImpact,
  ProjectOption,
  ProjectRelationCounts,
  ProjectStatus,
  ProjectType,
  ProjectWriteInput
} from "../../types/project";
import { projectStepStatusValues } from "../../types/projectStep";
import type { ProjectStep, ProjectStepStatus } from "../../types/projectStep";
import { formatCurrency } from "../../utils/currency";
import { ProjectFormModal } from "./ProjectFormModal";

const pageSize = 20;
const actionIconClassName = "h-4 w-4 shrink-0";
const actionIconStrokeWidth = 1.75;
const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1
};
const fallbackStatuses: ProjectOption<ProjectStatus>[] = projectStatusValues.map((value) => ({ value, label: value }));
const fallbackTypes: ProjectOption<ProjectType>[] = projectTypeValues.map((value) => ({ value, label: value }));
const fallbackStepStatuses: ProjectOption<ProjectStepStatus>[] = projectStepStatusValues.map((value) => ({ value, label: value }));

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [statuses, setStatuses] = useState<ProjectOption<ProjectStatus>[]>(fallbackStatuses);
  const [types, setTypes] = useState<ProjectOption<ProjectType>[]>(fallbackTypes);
  const [stepStatuses, setStepStatuses] = useState<ProjectOption<ProjectStepStatus>[]>(fallbackStepStatuses);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState<ProjectStatus | "">("");
  const [draftType, setDraftType] = useState<ProjectType | "">("");
  const [draftClientId, setDraftClientId] = useState("");
  const [query, setQuery] = useState<{ search: string; status: ProjectStatus | ""; type: ProjectType | ""; clientId: string }>({
    search: "",
    status: "",
    type: "",
    clientId: ""
  });
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<ProjectDeleteImpact | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stepsProject, setStepsProject] = useState<Project | null>(null);
  const [steps, setSteps] = useState<ProjectStep[]>([]);
  const [stepsProgress, setStepsProgress] = useState(0);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [stepsGenerating, setStepsGenerating] = useState(false);
  const [stepsActionId, setStepsActionId] = useState<string | null>(null);

  const statusLabelByValue = useMemo(() => new Map(statuses.map((status) => [status.value, status.label])), [statuses]);
  const typeLabelByValue = useMemo(() => new Map(types.map((type) => [type.value, type.label])), [types]);
  const stepStatusLabelByValue = useMemo(
    () => new Map(stepStatuses.map((status) => [status.value, status.label])),
    [stepStatuses]
  );

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listProjects({
        page,
        pageSize,
        search: query.search,
        status: query.status || undefined,
        type: query.type || undefined,
        clientId: query.clientId || undefined
      });

      setProjects(result.data);
      setPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query.clientId, query.search, query.status, query.type]);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const [projectsMeta, clientsResult, projectStepsMeta] = await Promise.all([
          getProjectsMeta(),
          listClients({ page: 1, pageSize: 100 }),
          getProjectStepsMeta()
        ]);

        if (active) {
          setStatuses(projectsMeta.statuses);
          setTypes(projectsMeta.types);
          setStepStatuses(projectStepsMeta.statuses);
          setClients(clientsResult.data);
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
    void loadProjects();
  }, [loadProjects]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery({
      search: draftSearch.trim(),
      status: draftStatus,
      type: draftType,
      clientId: draftClientId
    });
  }

  function handleClearFilters() {
    setDraftSearch("");
    setDraftStatus("");
    setDraftType("");
    setDraftClientId("");
    setPage(1);
    setQuery({ search: "", status: "", type: "", clientId: "" });
  }

  function handleOpenCreate() {
    setFormMode("create");
    setSelectedProject(null);
    setFormError(null);
    setFormOpen(true);
  }

  function handleOpenEdit(project: Project) {
    setFormMode("edit");
    setSelectedProject(project);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSaveProject(payload: ProjectWriteInput) {
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      if (formMode === "create") {
        await createProject(payload);
        setNotice("Projeto cadastrado.");
      } else if (selectedProject) {
        await updateProject(selectedProject.id, payload);
        setNotice("Projeto atualizado.");
      }

      setFormOpen(false);
      setSelectedProject(null);
      await loadProjects();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestDelete(project: Project) {
    setDeleteLoadingId(project.id);
    setError(null);
    setNotice(null);

    try {
      const impact = await getProjectDeleteImpact(project.id);

      if (!impact.exists) {
        setError("Projeto não encontrado.");
        await loadProjects();
        return;
      }

      setDeleteTarget(project);
      setDeleteImpact(impact);
      setDeleteBlocked(impact.hasRelations);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeleteLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteProject(deleteTarget.id);
      setNotice("Projeto excluído.");
      closeDeleteFlow();
      await loadProjects();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.code === "PROJECT_HAS_RELATIONS") {
        setDeleteBlocked(true);
      } else {
        setError(getErrorMessage(requestError));
        closeDeleteFlow();
      }
    } finally {
      setDeleting(false);
    }
  }

  function closeDeleteFlow() {
    setDeleteTarget(null);
    setDeleteImpact(null);
    setDeleteBlocked(false);
  }

  async function loadSteps(projectId: string) {
    setStepsLoading(true);
    setStepsError(null);

    try {
      const result = await listProjectSteps(projectId);
      setSteps(result.data);
      setStepsProgress(result.progress);
    } catch (requestError) {
      setStepsError(getErrorMessage(requestError));
    } finally {
      setStepsLoading(false);
    }
  }

  async function handleOpenSteps(project: Project) {
    setStepsProject(project);
    setSteps([]);
    setStepsProgress(project.progress);
    setStepsError(null);
    await loadSteps(project.id);
  }

  async function handleGenerateSteps() {
    if (!stepsProject) {
      return;
    }

    setStepsGenerating(true);
    setStepsError(null);
    setNotice(null);

    try {
      const result = await generateDefaultProjectSteps(stepsProject.id);
      setSteps(result.data);
      setStepsProgress(result.progress);
      setNotice("Etapas padrão geradas.");
      await loadProjects();
    } catch (requestError) {
      setStepsError(getErrorMessage(requestError));
    } finally {
      setStepsGenerating(false);
    }
  }

  async function handleCompleteStep(step: ProjectStep) {
    setStepsActionId(step.id);
    setStepsError(null);
    setNotice(null);

    try {
      await completeProjectStep(step.id);
      await loadSteps(step.projectId);
      await loadProjects();
      setNotice("Etapa concluída.");
    } catch (requestError) {
      setStepsError(getErrorMessage(requestError));
    } finally {
      setStepsActionId(null);
    }
  }

  async function handleReopenStep(step: ProjectStep) {
    setStepsActionId(step.id);
    setStepsError(null);
    setNotice(null);

    try {
      await reopenProjectStep(step.id);
      await loadSteps(step.projectId);
      await loadProjects();
      setNotice("Etapa reaberta.");
    } catch (requestError) {
      setStepsError(getErrorMessage(requestError));
    } finally {
      setStepsActionId(null);
    }
  }

  function closeStepsFlow() {
    setStepsProject(null);
    setSteps([]);
    setStepsProgress(0);
    setStepsError(null);
  }

  const hasFilters = Boolean(query.search || query.status || query.type || query.clientId);

  return (
    <PageWrapper
      actions={
        <Button disabled={metaLoading || clients.length === 0} onClick={handleOpenCreate} type="button">
          <Plus className="h-4 w-4" />
          Novo projeto
        </Button>
      }
      description="Projetos vinculados aos clientes do escritório."
      title="Projetos"
    >
      <Card>
        <form className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleFilterSubmit}>
          <Input label="Busca" onChange={(event) => setDraftSearch(event.target.value)} placeholder="Projeto, cliente ou endereço" value={draftSearch} />
          <Select label="Status" onChange={(event) => setDraftStatus(event.target.value as ProjectStatus | "")} value={draftStatus}>
            <option value="">Todos</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select label="Tipo" onChange={(event) => setDraftType(event.target.value as ProjectType | "")} value={draftType}>
            <option value="">Todos</option>
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
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
          <div className="flex min-w-0 flex-wrap items-end gap-2 md:col-span-2 xl:col-span-4 xl:justify-end">
            <Button className="min-w-28" title="Buscar projetos" type="submit">
              <Search className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Buscar
            </Button>
            <ActionIconButton ariaLabel="Limpar filtros" label="Limpar filtros" onClick={handleClearFilters} size="control" variant="secondary">
              <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
            <ActionIconButton ariaLabel="Atualizar lista" label="Atualizar lista" onClick={() => void loadProjects()} size="control" variant="secondary">
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

      {loading && projects.length === 0 ? <LoadingState /> : null}

      {!loading && projects.length === 0 ? (
        <EmptyState
          action={
            hasFilters ? (
              <Button onClick={handleClearFilters} type="button" variant="secondary">
                Limpar filtros
              </Button>
            ) : (
              <Button disabled={clients.length === 0} onClick={handleOpenCreate} type="button">
                <Plus className="h-4 w-4" />
                Novo projeto
              </Button>
            )
          }
          description={hasFilters ? "Nenhum projeto encontrado para os filtros atuais." : "Crie o primeiro projeto a partir de um cliente existente."}
          title={hasFilters ? "Sem resultados" : "Nenhum projeto cadastrado"}
        />
      ) : null}

      {projects.length > 0 ? (
        <div className="space-y-3">
          <Table headers={["Projeto", "Cliente", "Tipo", "Status", "Valor", "Progresso", "Entrega", "Ações"]}>
            {projects.map((project) => (
              <tr className="min-w-[980px]" key={project.id}>
                <td className="min-w-60 px-4 py-4 align-top">
                  <div className="font-medium text-text-primary">{project.name}</div>
                  <div className="mt-1 text-xs text-text-muted">{project.workAddress ?? "Endereço não informado"}</div>
                </td>
                <td className="min-w-44 px-4 py-4 align-top text-text-secondary">{project.client.name}</td>
                <td className="px-4 py-4 align-top text-text-secondary">{typeLabelByValue.get(project.type) ?? project.type}</td>
                <td className="px-4 py-4 align-top">
                  <Badge tone={getProjectStatusTone(project.status)}>{statusLabelByValue.get(project.status) ?? project.status}</Badge>
                </td>
                <td className="min-w-36 px-4 py-4 align-top text-text-secondary">{formatCurrency(project.contractedAmount)}</td>
                <td className="min-w-40 px-4 py-4 align-top">
                  <ProgressBar value={project.progress} />
                </td>
                <td className="min-w-36 px-4 py-4 align-top text-text-secondary">{formatDate(project.expectedDeliveryDate)}</td>
                <td className="px-4 py-4 align-top">
                  <div className="flex max-w-full flex-wrap items-center gap-2">
                    <ActionIconButton ariaLabel={`Editar ${project.name}`} label="Editar" onClick={() => handleOpenEdit(project)}>
                      <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                    <ActionIconButton
                      ariaLabel={`Etapas ${project.name}`}
                      label="Etapas"
                      onClick={() => void handleOpenSteps(project)}
                    >
                      <ListChecks className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                    <ActionIconButton
                      ariaLabel={`Excluir ${project.name}`}
                      destructive
                      disabled={deleteLoadingId === project.id}
                      label="Excluir"
                      onClick={() => void handleRequestDelete(project)}
                    >
                      {deleteLoadingId === project.id ? (
                        <RefreshCw className={`${actionIconClassName} animate-spin`} strokeWidth={actionIconStrokeWidth} />
                      ) : (
                        <Trash2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      )}
                    </ActionIconButton>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total} projeto{pagination.total === 1 ? "" : "s"} encontrados
            </span>
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <Button disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button" variant="secondary">
                <ChevronLeft className="h-4 w-4" />
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
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ProjectFormModal
        apiError={formError}
        clients={clients}
        mode={formMode}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleSaveProject}
        open={formOpen}
        project={selectedProject}
        saving={saving}
        statuses={statuses}
        types={types}
      />

      <DeleteModal
        confirming={deleting}
        impact="Esta ação não pode ser desfeita."
        itemName={deleteTarget?.name ?? ""}
        onClose={closeDeleteFlow}
        onConfirm={() => void handleConfirmDelete()}
        open={Boolean(deleteTarget && deleteImpact && !deleteBlocked)}
      />

      <Modal
        footer={
          <Button onClick={closeStepsFlow} type="button" variant="secondary">
            Fechar
          </Button>
        }
        onClose={closeStepsFlow}
        open={Boolean(stepsProject)}
        size="lg"
        title="Etapas do projeto"
      >
        {stepsProject ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-start">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Projeto</p>
                <h4 className="mt-1 truncate text-lg font-semibold text-text-primary">{stepsProject.name}</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  {stepsProject.client.name} - {typeLabelByValue.get(stepsProject.type) ?? stepsProject.type}
                </p>
              </div>
              <ProgressBar label="Progresso real" value={stepsProgress} />
            </div>

            {stepsError ? (
              <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{stepsError}</span>
              </div>
            ) : null}

            {stepsLoading ? <LoadingState /> : null}

            {!stepsLoading && steps.length === 0 ? (
              <EmptyState
                action={
                  <Button disabled={stepsGenerating} onClick={() => void handleGenerateSteps()} type="button">
                    {stepsGenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ListChecks className="h-5 w-5" />}
                    Gerar etapas
                  </Button>
                }
                description="Este projeto ainda não possui etapas. Gere o roteiro padrão pelo tipo do projeto."
                title="Nenhuma etapa gerada"
              />
            ) : null}

            {!stepsLoading && steps.length > 0 ? (
              <div className="max-h-[52vh] overflow-y-auto rounded-ui border border-surface-600">
                {steps.map((step) => {
                  const actionLoading = stepsActionId === step.id;
                  const isClosed = step.status === "COMPLETED" || step.status === "CANCELLED";

                  return (
                    <div
                      className="grid min-w-0 gap-3 border-b border-surface-600 px-4 py-4 last:border-b-0 sm:grid-cols-[48px_minmax(0,1fr)] sm:items-start"
                      key={step.id}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-ui border border-surface-600 bg-surface-900 text-xs text-text-secondary">
                        {step.sortOrder}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-medium text-text-primary">{step.name}</h5>
                          <Badge tone={getProjectStepStatusTone(step.status)}>
                            {stepStatusLabelByValue.get(step.status) ?? step.status}
                          </Badge>
                        </div>
                        {step.description ? <p className="mt-1 text-sm text-text-muted">{step.description}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-muted">
                          <span>Início: {formatDate(step.startsAt)}</span>
                          <span>Prazo: {formatDate(step.dueDate)}</span>
                          <span>Conclusão: {formatDate(step.completedAt)}</span>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-wrap sm:col-span-2 sm:justify-end">
                        {isClosed ? (
                          <Button
                            className="min-w-28"
                            disabled={actionLoading}
                            onClick={() => void handleReopenStep(step)}
                            type="button"
                            variant="secondary"
                          >
                            {actionLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                            Reabrir
                          </Button>
                        ) : (
                          <Button
                            className="min-w-28"
                            disabled={actionLoading}
                            onClick={() => void handleCompleteStep(step)}
                            type="button"
                          >
                            {actionLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        footer={
          <Button onClick={closeDeleteFlow} type="button" variant="secondary">
            Fechar
          </Button>
        }
        onClose={closeDeleteFlow}
        open={Boolean(deleteTarget && deleteImpact && deleteBlocked)}
        title="Exclusão bloqueada"
      >
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
          <div className="space-y-2">
            <p>
              <span className="font-medium text-text-primary">{deleteTarget?.name}</span> possui registros vinculados.
            </p>
            <p className="text-text-muted">{deleteImpact ? formatImpact(deleteImpact.counts) : null}</p>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}

function getProjectStatusTone(status: ProjectStatus) {
  if (status === "FINISHED") {
    return "success";
  }

  if (status === "WAITING_CLIENT_APPROVAL" || status === "DESIGN_3D_IN_DEVELOPMENT" || status === "FINAL_DELIVERY") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "neutral";
}

function getProjectStepStatusTone(status: ProjectStepStatus) {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "IN_PROGRESS" || status === "WAITING_CLIENT" || status === "IN_REVIEW") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "neutral";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function formatImpact(counts: ProjectRelationCounts) {
  const labels: Record<keyof ProjectRelationCounts, string> = {
    steps: "etapas",
    budgets: "orçamentos",
    payments: "pagamentos",
    tasks: "tarefas",
    visits: "visitas"
  };

  const parts = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${labels[key as keyof ProjectRelationCounts]}`);

  return parts.length > 0 ? parts.join(", ") : "Nenhum vínculo encontrado.";
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}
