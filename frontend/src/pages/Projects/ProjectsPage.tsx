import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
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
import { ProjectFormModal } from "./ProjectFormModal";

const pageSize = 20;
const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1
};
const fallbackStatuses: ProjectOption<ProjectStatus>[] = projectStatusValues.map((value) => ({ value, label: value }));
const fallbackTypes: ProjectOption<ProjectType>[] = projectTypeValues.map((value) => ({ value, label: value }));

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [statuses, setStatuses] = useState<ProjectOption<ProjectStatus>[]>(fallbackStatuses);
  const [types, setTypes] = useState<ProjectOption<ProjectType>[]>(fallbackTypes);
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

  const statusLabelByValue = useMemo(() => new Map(statuses.map((status) => [status.value, status.label])), [statuses]);
  const typeLabelByValue = useMemo(() => new Map(types.map((type) => [type.value, type.label])), [types]);

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
        const [projectsMeta, clientsResult] = await Promise.all([
          getProjectsMeta(),
          listClients({ page: 1, pageSize: 100 })
        ]);

        if (active) {
          setStatuses(projectsMeta.statuses);
          setTypes(projectsMeta.types);
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
        setError("Projeto nao encontrado.");
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
      setNotice("Projeto excluido.");
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

  const hasFilters = Boolean(query.search || query.status || query.type || query.clientId);

  return (
    <PageWrapper
      actions={
        <Button disabled={metaLoading || clients.length === 0} onClick={handleOpenCreate} type="button">
          <Plus className="h-4 w-4" />
          Novo projeto
        </Button>
      }
      description="Projetos vinculados aos clientes do escritorio."
      title="Projetos"
    >
      <Card>
        <form className="grid gap-3 xl:grid-cols-[1fr_190px_170px_220px_auto]" onSubmit={handleFilterSubmit}>
          <Input label="Busca" onChange={(event) => setDraftSearch(event.target.value)} placeholder="Projeto, cliente ou endereco" value={draftSearch} />
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
          <div className="flex items-end gap-2">
            <Button className="min-w-28" type="submit">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
            <Button aria-label="Limpar filtros" className="h-10 w-10 px-0" onClick={handleClearFilters} type="button" variant="secondary">
              <XCircle className="h-4 w-4" />
            </Button>
            <Button aria-label="Atualizar lista" className="h-10 w-10 px-0" onClick={() => void loadProjects()} type="button" variant="ghost">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
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
          <Table headers={["Projeto", "Cliente", "Tipo", "Status", "Progresso", "Entrega", "Acoes"]}>
            {projects.map((project) => (
              <tr className="min-w-[980px]" key={project.id}>
                <td className="min-w-60 px-4 py-4 align-top">
                  <div className="font-medium text-text-primary">{project.name}</div>
                  <div className="mt-1 text-xs text-text-muted">{project.workAddress ?? "Endereco nao informado"}</div>
                </td>
                <td className="min-w-44 px-4 py-4 align-top text-text-secondary">{project.client.name}</td>
                <td className="px-4 py-4 align-top text-text-secondary">{typeLabelByValue.get(project.type) ?? project.type}</td>
                <td className="px-4 py-4 align-top">
                  <Badge tone={getProjectStatusTone(project.status)}>{statusLabelByValue.get(project.status) ?? project.status}</Badge>
                </td>
                <td className="min-w-40 px-4 py-4 align-top">
                  <ProgressBar value={project.progress} />
                </td>
                <td className="min-w-36 px-4 py-4 align-top text-text-secondary">{formatDate(project.expectedDeliveryDate)}</td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <Button aria-label={`Editar ${project.name}`} className="h-9 w-9 px-0" onClick={() => handleOpenEdit(project)} type="button" variant="ghost">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      aria-label={`Excluir ${project.name}`}
                      className="h-9 w-9 px-0 text-status-danger hover:text-status-danger"
                      disabled={deleteLoadingId === project.id}
                      onClick={() => void handleRequestDelete(project)}
                      type="button"
                      variant="ghost"
                    >
                      {deleteLoadingId === project.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total} projeto{pagination.total === 1 ? "" : "s"} encontrados
            </span>
            <div className="flex items-center gap-2">
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
                Proxima
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
        impact="Esta acao nao pode ser desfeita."
        itemName={deleteTarget?.name ?? ""}
        onClose={closeDeleteFlow}
        onConfirm={() => void handleConfirmDelete()}
        open={Boolean(deleteTarget && deleteImpact && !deleteBlocked)}
      />

      <Modal
        footer={
          <Button onClick={closeDeleteFlow} type="button" variant="secondary">
            Fechar
          </Button>
        }
        onClose={closeDeleteFlow}
        open={Boolean(deleteTarget && deleteImpact && deleteBlocked)}
        title="Exclusao bloqueada"
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

  if (status === "WAITING_CLIENT_APPROVAL" || status === "FINAL_DELIVERY") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "neutral";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Nao informada";
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function formatImpact(counts: ProjectRelationCounts) {
  const labels: Record<keyof ProjectRelationCounts, string> = {
    steps: "etapas",
    budgets: "orcamentos",
    payments: "pagamentos",
    tasks: "tarefas",
    visits: "visitas",
    documents: "documentos",
    briefings: "briefings"
  };

  const parts = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${labels[key as keyof ProjectRelationCounts]}`);

  return parts.length > 0 ? parts.join(", ") : "Nenhum vinculo encontrado.";
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Nao foi possivel concluir a acao.";
}
