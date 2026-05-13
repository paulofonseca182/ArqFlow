import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { ActionIconButton } from "../../components/ui/ActionIconButton";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ApiError } from "../../services/api";
import {
  createClient,
  deleteClient,
  getClientDeleteImpact,
  getClientsMeta,
  listClients,
  updateClient
} from "../../services/clients";
import { clientStatusValues } from "../../types/client";
import type { Client, ClientDeleteImpact, ClientRelationCounts, ClientStatus, ClientStatusOption, ClientWriteInput } from "../../types/client";
import type { PaginationMeta } from "../../types/api";
import { ClientFormModal } from "./ClientFormModal";

const pageSize = 20;
const actionIconClassName = "h-4 w-4 shrink-0";
const actionIconStrokeWidth = 1.75;
const fallbackStatuses: ClientStatusOption[] = clientStatusValues.map((value) => ({ value, label: value }));
const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1
};

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [statuses, setStatuses] = useState<ClientStatusOption[]>(fallbackStatuses);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState<ClientStatus | "">("");
  const [query, setQuery] = useState<{ search: string; status: ClientStatus | "" }>({ search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<ClientDeleteImpact | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusLabelByValue = useMemo(() => new Map(statuses.map((status) => [status.value, status.label])), [statuses]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listClients({
        page,
        pageSize,
        search: query.search,
        status: query.status || undefined
      });

      setClients(result.data);
      setPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query.search, query.status]);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const meta = await getClientsMeta();

        if (active) {
          setStatuses(meta.statuses);
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
    void loadClients();
  }, [loadClients]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery({ search: draftSearch.trim(), status: draftStatus });
  }

  function handleClearFilters() {
    setDraftSearch("");
    setDraftStatus("");
    setPage(1);
    setQuery({ search: "", status: "" });
  }

  function handleOpenCreate() {
    setFormMode("create");
    setSelectedClient(null);
    setFormError(null);
    setFormOpen(true);
  }

  function handleOpenEdit(client: Client) {
    setFormMode("edit");
    setSelectedClient(client);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSaveClient(payload: ClientWriteInput) {
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      if (formMode === "create") {
        await createClient(payload);
        setNotice("Cliente cadastrado.");
      } else if (selectedClient) {
        await updateClient(selectedClient.id, payload);
        setNotice("Cliente atualizado.");
      }

      setFormOpen(false);
      setSelectedClient(null);
      await loadClients();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestDelete(client: Client) {
    setDeleteLoadingId(client.id);
    setError(null);
    setNotice(null);

    try {
      const impact = await getClientDeleteImpact(client.id);

      if (!impact.exists) {
        setError("Cliente não encontrado.");
        await loadClients();
        return;
      }

      setDeleteTarget(client);
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
      await deleteClient(deleteTarget.id);
      setNotice("Cliente excluído.");
      closeDeleteFlow();
      await loadClients();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.code === "CLIENT_HAS_RELATIONS") {
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

  const hasFilters = Boolean(query.search || query.status);

  return (
    <PageWrapper
      actions={
        <Button disabled={metaLoading} onClick={handleOpenCreate} type="button">
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      }
      description="Cadastro e acompanhamento dos clientes do escritório."
      title="Clientes"
    >
      <Card>
        <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]" onSubmit={handleFilterSubmit}>
          <Input
            label="Busca"
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Nome, e-mail, telefone ou WhatsApp"
            value={draftSearch}
          />
          <Select
            label="Status"
            onChange={(event) => setDraftStatus(event.target.value as ClientStatus | "")}
            value={draftStatus}
          >
            <option value="">Todos</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <div className="flex items-end gap-2">
            <Button className="min-w-28" title="Buscar clientes" type="submit">
              <Search className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Buscar
            </Button>
            <ActionIconButton ariaLabel="Limpar filtros" label="Limpar filtros" onClick={handleClearFilters} size="control" variant="secondary">
              <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
            <ActionIconButton ariaLabel="Atualizar lista" label="Atualizar lista" onClick={() => void loadClients()} size="control">
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

      {loading && clients.length === 0 ? <LoadingState /> : null}

      {!loading && clients.length === 0 ? (
        <EmptyState
          action={
            hasFilters ? (
              <Button onClick={handleClearFilters} type="button" variant="secondary">
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={handleOpenCreate} type="button">
                <Plus className="h-4 w-4" />
                Novo cliente
              </Button>
            )
          }
          description={hasFilters ? "Nenhum cliente encontrado para os filtros atuais." : "Comece cadastrando o primeiro cliente."}
          title={hasFilters ? "Sem resultados" : "Nenhum cliente cadastrado"}
        />
      ) : null}

      {clients.length > 0 ? (
        <div className="space-y-3">
          <Table headers={["Cliente", "Status", "Contato", "Local", "Vínculos", "Ações"]}>
            {clients.map((client) => (
              <tr className="min-w-[860px]" key={client.id}>
                <td className="min-w-56 px-4 py-4 align-top">
                  <div className="font-medium text-text-primary">{client.name}</div>
                  <div className="mt-1 text-xs text-text-muted">{client.email ?? "Sem e-mail"}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <Badge tone={getClientStatusTone(client.status)}>{statusLabelByValue.get(client.status) ?? client.status}</Badge>
                </td>
                <td className="min-w-44 px-4 py-4 align-top text-text-secondary">
                  <div>{client.whatsapp ? `WhatsApp ${client.whatsapp}` : "WhatsApp não informado"}</div>
                  <div className="mt-1 text-xs text-text-muted">{client.phone ? `Tel. ${client.phone}` : "Telefone não informado"}</div>
                </td>
                <td className="min-w-36 px-4 py-4 align-top text-text-secondary">{formatLocation(client)}</td>
                <td className="px-4 py-4 align-top text-text-secondary">{formatRelationCount(client._count)}</td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <ActionIconButton ariaLabel={`Editar ${client.name}`} label="Editar" onClick={() => handleOpenEdit(client)}>
                      <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                    <ActionIconButton
                      ariaLabel={`Excluir ${client.name}`}
                      destructive
                      disabled={deleteLoadingId === client.id}
                      label="Excluir"
                      onClick={() => void handleRequestDelete(client)}
                    >
                      {deleteLoadingId === client.id ? (
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
              {pagination.total} cliente{pagination.total === 1 ? "" : "s"} encontrados
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
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ClientFormModal
        apiError={formError}
        client={selectedClient}
        mode={formMode}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleSaveClient}
        open={formOpen}
        saving={saving}
        statuses={statuses}
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

function getClientStatusTone(status: ClientStatus) {
  if (status === "ACTIVE" || status === "RECURRING") {
    return "success";
  }

  if (status === "IN_SERVICE" || status === "BUDGET_SENT") {
    return "warning";
  }

  return "neutral";
}

function formatLocation(client: Client) {
  if (client.city && client.state) {
    return `${client.city}/${client.state}`;
  }

  return client.city ?? client.state ?? "Não informado";
}

function formatRelationCount(counts?: ClientRelationCounts) {
  if (!counts) {
    return "0 vínculos";
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return `${total} vínculo${total === 1 ? "" : "s"}`;
}

function formatImpact(counts: ClientRelationCounts) {
  const labels: Record<keyof ClientRelationCounts, string> = {
    projects: "projetos",
    budgets: "orçamentos",
    payments: "pagamentos",
    visits: "visitas",
    documents: "documentos",
    briefings: "briefings"
  };

  const parts = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${labels[key as keyof ClientRelationCounts]}`);

  return parts.length > 0 ? parts.join(", ") : "Nenhum vínculo encontrado.";
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}
