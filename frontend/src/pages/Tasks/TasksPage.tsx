import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ApiError } from "../../services/api";
import { listProjects } from "../../services/projects";
import { cancelTask, completeTask, createTask, deleteTask, getTasksMeta, listTasks, reopenTask, updateTask } from "../../services/tasks";
import type { PaginationMeta } from "../../types/api";
import type { Project } from "../../types/project";
import type { Task, TaskOption, TaskPriority, TaskStatus, TaskWriteInput } from "../../types/task";
import { taskPriorityValues, taskStatusValues } from "../../types/task";
import { getBooleanSearchParam, getDateSearchParam, getEnumSearchParam, getStringSearchParam } from "../../utils/searchParams";
import { TaskFormModal } from "./TaskFormModal";

const pageSize = 20;
const actionIconClassName = "h-4 w-4 shrink-0";
const actionIconStrokeWidth = 1.75;
const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1
};
const taskDeadlineScopeValues = ["OVERDUE_TASKS", "DUE_SOON_TASKS"] as const;
const fallbackStatuses: TaskOption<TaskStatus>[] = taskStatusValues.map((value) => ({ value, label: value }));
const fallbackPriorities: TaskOption<TaskPriority>[] = taskPriorityValues.map((value) => ({ value, label: value }));
type TaskDeadlineScope = (typeof taskDeadlineScopeValues)[number];
type TasksQuery = {
  search: string;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  projectId: string;
  dueFrom: string;
  dueTo: string;
  scope: TaskDeadlineScope | "";
};

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = readTasksSearchParams(searchParams);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [statuses, setStatuses] = useState<TaskOption<TaskStatus>[]>(fallbackStatuses);
  const [priorities, setPriorities] = useState<TaskOption<TaskPriority>[]>(fallbackPriorities);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(initialQuery.search);
  const [draftStatus, setDraftStatus] = useState<TaskStatus | "">(initialQuery.status);
  const [draftPriority, setDraftPriority] = useState<TaskPriority | "">(initialQuery.priority);
  const [draftDeadlineScope, setDraftDeadlineScope] = useState<TaskDeadlineScope | "">(initialQuery.scope);
  const [draftProjectId, setDraftProjectId] = useState(initialQuery.projectId);
  const [draftDueFrom, setDraftDueFrom] = useState(initialQuery.dueFrom);
  const [draftDueTo, setDraftDueTo] = useState(initialQuery.dueTo);
  const [query, setQuery] = useState<TasksQuery>(initialQuery);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusLabelByValue = useMemo(() => new Map(statuses.map((status) => [status.value, status.label])), [statuses]);
  const priorityLabelByValue = useMemo(() => new Map(priorities.map((priority) => [priority.value, priority.label])), [priorities]);
  const searchParamsKey = searchParams.toString();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listTasks({
        page,
        pageSize,
        search: query.search,
        status: query.status || undefined,
        priority: query.priority || undefined,
        projectId: query.projectId || undefined,
        dueFrom: query.dueFrom || undefined,
        dueTo: query.dueTo || undefined,
        scope: query.scope || undefined
      });

      setTasks(result.data);
      setPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query.dueFrom, query.dueTo, query.priority, query.projectId, query.scope, query.search, query.status]);

  useEffect(() => {
    const nextQuery = readTasksSearchParams(searchParams);

    setDraftSearch(nextQuery.search);
    setDraftStatus(nextQuery.status);
    setDraftPriority(nextQuery.priority);
    setDraftDeadlineScope(nextQuery.scope);
    setDraftProjectId(nextQuery.projectId);
    setDraftDueFrom(nextQuery.dueFrom);
    setDraftDueTo(nextQuery.dueTo);
    setPage(1);
    setQuery(nextQuery);
  }, [searchParamsKey]);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const [tasksMeta, projectsResult] = await Promise.all([getTasksMeta(), listProjects({ page: 1, pageSize: 100 })]);

        if (active) {
          setStatuses(tasksMeta.statuses);
          setPriorities(tasksMeta.priorities);
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
    void loadTasks();
  }, [loadTasks]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery({
      search: draftSearch.trim(),
      status: draftStatus,
      priority: draftPriority,
      scope: draftDeadlineScope,
      projectId: draftProjectId,
      dueFrom: draftDueFrom,
      dueTo: draftDueTo
    });
  }

  function handleClearFilters() {
    applyQuery({ search: "", status: "", priority: "", projectId: "", dueFrom: "", dueTo: "", scope: "" });
  }

  function applyQuery(nextQuery: TasksQuery) {
    setDraftSearch(nextQuery.search);
    setDraftStatus(nextQuery.status);
    setDraftPriority(nextQuery.priority);
    setDraftDeadlineScope(nextQuery.scope);
    setDraftProjectId(nextQuery.projectId);
    setDraftDueFrom(nextQuery.dueFrom);
    setDraftDueTo(nextQuery.dueTo);
    setPage(1);
    setQuery(nextQuery);
    setSearchParams(toTasksSearchParams(nextQuery), { replace: true });
  }

  function handleOpenCreate() {
    setFormMode("create");
    setSelectedTask(null);
    setFormError(null);
    setFormOpen(true);
  }

  function handleOpenEdit(task: Task) {
    setFormMode("edit");
    setSelectedTask(task);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSaveTask(payload: TaskWriteInput) {
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      if (formMode === "create") {
        await createTask(payload);
        setNotice("Tarefa cadastrada.");
      } else if (selectedTask) {
        await updateTask(selectedTask.id, payload);
        setNotice("Tarefa atualizada.");
      }

      setFormOpen(false);
      setSelectedTask(null);
      await loadTasks();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleTaskAction(task: Task, action: "complete" | "reopen" | "cancel") {
    setActionLoadingId(task.id);
    setError(null);
    setNotice(null);

    try {
      if (action === "complete") {
        await completeTask(task.id);
        setNotice("Tarefa concluída.");
      } else if (action === "reopen") {
        await reopenTask(task.id);
        setNotice("Tarefa reaberta.");
      } else {
        await cancelTask(task.id);
        setNotice("Tarefa cancelada.");
      }

      await loadTasks();
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
      await deleteTask(deleteTarget.id);
      setNotice("Tarefa excluída.");
      setDeleteTarget(null);
      await loadTasks();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(query.search || query.status || query.priority || query.projectId || query.dueFrom || query.dueTo || query.scope);

  return (
    <PageWrapper
      actions={
        <Button disabled={metaLoading} onClick={handleOpenCreate} type="button">
          <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
          Nova tarefa
        </Button>
      }
      description="Tarefas operacionais com prioridade, status, prazo e vínculo opcional a projeto."
      title="Tarefas"
    >
      <Card>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[minmax(180px,1fr)_140px_140px_170px_minmax(180px,1fr)_145px_145px_auto]" onSubmit={handleFilterSubmit}>
          <Input label="Busca" onChange={(event) => setDraftSearch(event.target.value)} placeholder="Tarefa, responsável, projeto ou cliente" value={draftSearch} />
          <Select label="Status" onChange={(event) => setDraftStatus(event.target.value as TaskStatus | "")} value={draftStatus}>
            <option value="">Todos</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select label="Prioridade" onChange={(event) => setDraftPriority(event.target.value as TaskPriority | "")} value={draftPriority}>
            <option value="">Todas</option>
            {priorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </Select>
          <Select label="Prazo" onChange={(event) => setDraftDeadlineScope(event.target.value as TaskDeadlineScope | "")} value={draftDeadlineScope}>
            <option value="">Todos</option>
            <option value="OVERDUE_TASKS">Atrasadas</option>
            <option value="DUE_SOON_TASKS">Vencem em 7 dias</option>
          </Select>
          <Select label="Projeto" onChange={(event) => setDraftProjectId(event.target.value)} value={draftProjectId}>
            <option value="">Todos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Input label="Prazo de" onChange={(event) => setDraftDueFrom(event.target.value)} type="date" value={draftDueFrom} />
          <Input label="Prazo até" onChange={(event) => setDraftDueTo(event.target.value)} type="date" value={draftDueTo} />
          <div className="flex min-w-max items-end justify-end gap-2 md:col-span-2 xl:col-span-4 2xl:col-span-1">
            <Button className="min-w-28" title="Buscar tarefas" type="submit">
              <Search className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Buscar
            </Button>
            <ActionIconButton ariaLabel="Limpar filtros" label="Limpar filtros" onClick={handleClearFilters} size="control" variant="secondary">
              <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
            <ActionIconButton ariaLabel="Atualizar lista" label="Atualizar lista" onClick={() => void loadTasks()} size="control" variant="secondary">
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

      {loading && tasks.length === 0 ? <LoadingState /> : null}

      {!loading && tasks.length === 0 ? (
        <EmptyState
          action={
            hasFilters ? (
              <Button onClick={handleClearFilters} type="button" variant="secondary">
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={handleOpenCreate} type="button">
                <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                Nova tarefa
              </Button>
            )
          }
          description={hasFilters ? "Nenhuma tarefa encontrada para os filtros atuais." : "Crie tarefas gerais ou vinculadas a projetos em andamento."}
          title={hasFilters ? "Sem resultados" : "Nenhuma tarefa cadastrada"}
        />
      ) : null}

      {tasks.length > 0 ? (
        <div className="space-y-3">
          <Table headers={["Tarefa", "Projeto", "Responsável", "Prioridade", "Status", "Prazo", "Ações"]}>
            {tasks.map((task) => {
              const isActionLoading = actionLoadingId === task.id;

              return (
                <tr className="min-w-[1040px]" key={task.id}>
                  <td className="min-w-64 px-4 py-4 align-top">
                    <div className="font-medium text-text-primary">{task.title}</div>
                    <div className="mt-1 text-xs text-text-muted">{task.description ?? "Sem descrição"}</div>
                  </td>
                  <td className="min-w-56 px-4 py-4 align-top">
                    <div className="text-text-primary">{task.project?.name ?? "Sem projeto vinculado"}</div>
                    <div className="mt-1 text-xs text-text-muted">{task.project?.client.name ?? "Tarefa geral"}</div>
                  </td>
                  <td className="min-w-36 px-4 py-4 align-top text-text-secondary">{task.assignee ?? "Não informado"}</td>
                  <td className="px-4 py-4 align-top">
                    <Badge tone={getTaskPriorityTone(task.priority)}>{priorityLabelByValue.get(task.priority) ?? task.priority}</Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-2">
                      <Badge tone={getTaskStatusTone(task)}>{statusLabelByValue.get(task.status) ?? task.status}</Badge>
                      {task.isOverdue ? <div className="text-xs font-medium text-status-danger">Atrasada</div> : null}
                    </div>
                  </td>
                  <td className="min-w-32 px-4 py-4 align-top text-text-secondary">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <ActionIconButton ariaLabel={`Editar ${task.title}`} label="Editar" onClick={() => handleOpenEdit(task)}>
                        <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      </ActionIconButton>
                      {task.status === "COMPLETED" || task.status === "CANCELLED" ? (
                        <ActionIconButton
                          ariaLabel={`Reabrir ${task.title}`}
                          disabled={isActionLoading}
                          label="Reabrir"
                          onClick={() => void handleTaskAction(task, "reopen")}
                        >
                          {isActionLoading ? (
                            <RefreshCw className={`${actionIconClassName} animate-spin`} strokeWidth={actionIconStrokeWidth} />
                          ) : (
                            <RotateCcw className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                          )}
                        </ActionIconButton>
                      ) : (
                        <ActionIconButton
                          ariaLabel={`Concluir ${task.title}`}
                          disabled={isActionLoading}
                          label="Concluir"
                          onClick={() => void handleTaskAction(task, "complete")}
                        >
                          {isActionLoading ? (
                            <RefreshCw className={`${actionIconClassName} animate-spin`} strokeWidth={actionIconStrokeWidth} />
                          ) : (
                            <CheckCircle2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                          )}
                        </ActionIconButton>
                      )}
                      {task.status !== "COMPLETED" && task.status !== "CANCELLED" ? (
                        <ActionIconButton
                          ariaLabel={`Cancelar ${task.title}`}
                          destructive
                          disabled={isActionLoading}
                          label="Cancelar"
                          onClick={() => void handleTaskAction(task, "cancel")}
                        >
                          <Ban className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                        </ActionIconButton>
                      ) : null}
                      <ActionIconButton ariaLabel={`Excluir ${task.title}`} destructive label="Excluir" onClick={() => setDeleteTarget(task)}>
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
              {pagination.total} tarefa{pagination.total === 1 ? "" : "s"} encontradas
            </span>
            <div className="flex items-center gap-2">
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

      <TaskFormModal
        apiError={formError}
        mode={formMode}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleSaveTask}
        open={formOpen}
        priorities={priorities}
        projects={projects}
        saving={saving}
        statuses={statuses}
        task={selectedTask}
      />

      <DeleteModal
        confirming={deleting}
        impact="A tarefa será removida permanentemente."
        itemName={deleteTarget?.title ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={Boolean(deleteTarget)}
      />
    </PageWrapper>
  );
}

function readTasksSearchParams(searchParams: URLSearchParams): TasksQuery {
  const scope = getEnumSearchParam(searchParams, "scope", taskDeadlineScopeValues);
  const legacyOverdue = getStringSearchParam(searchParams, "scope") === "OVERDUE" || getBooleanSearchParam(searchParams, "overdue");

  return {
    search: getStringSearchParam(searchParams, "search"),
    status: getEnumSearchParam(searchParams, "status", taskStatusValues),
    priority: getEnumSearchParam(searchParams, "priority", taskPriorityValues),
    projectId: getStringSearchParam(searchParams, "projectId"),
    dueFrom: getDateSearchParam(searchParams, "dueFrom"),
    dueTo: getDateSearchParam(searchParams, "dueTo"),
    scope: scope || (legacyOverdue ? "OVERDUE_TASKS" : "")
  };
}

function toTasksSearchParams(query: TasksQuery) {
  const searchParams = new URLSearchParams();

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.status) {
    searchParams.set("status", query.status);
  }

  if (query.priority) {
    searchParams.set("priority", query.priority);
  }

  if (query.projectId) {
    searchParams.set("projectId", query.projectId);
  }

  if (query.dueFrom) {
    searchParams.set("dueFrom", query.dueFrom);
  }

  if (query.dueTo) {
    searchParams.set("dueTo", query.dueTo);
  }

  if (query.scope) {
    searchParams.set("scope", query.scope);
  }

  return searchParams;
}

function getTaskStatusTone(task: Task) {
  if (task.isOverdue) {
    return "danger";
  }

  if (task.status === "COMPLETED") {
    return "success";
  }

  if (task.status === "IN_PROGRESS") {
    return "warning";
  }

  if (task.status === "CANCELLED") {
    return "danger";
  }

  return "neutral";
}

function getTaskPriorityTone(priority: TaskPriority) {
  if (priority === "URGENT") {
    return "danger";
  }

  if (priority === "HIGH") {
    return "warning";
  }

  if (priority === "LOW") {
    return "success";
  }

  return "neutral";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}
