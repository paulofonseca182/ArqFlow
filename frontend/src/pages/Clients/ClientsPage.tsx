import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  WalletCards,
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
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { ApiError } from "../../services/api";
import {
  createClient,
  deleteClient,
  getClientById,
  getClientDeleteImpact,
  getClientsMeta,
  listClients,
  updateClient
} from "../../services/clients";
import { clientStatusValues } from "../../types/client";
import type {
  Client,
  ClientDeleteImpact,
  ClientDetail,
  ClientRelationCounts,
  ClientStatus,
  ClientStatusOption,
  ClientWriteInput
} from "../../types/client";
import type { PaginationMeta } from "../../types/api";
import { formatCurrency } from "../../utils/currency";
import { formatDateOnly } from "../../utils/date";
import { formatCellphone } from "../../utils/phone";
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

const projectStatusLabels: Record<string, string> = {
  CONTRACT_IN_PROGRESS: "Contrato em andamento",
  CONTRACT_SIGNED: "Contrato assinado",
  SURVEY_IN_PROGRESS: "Levantamento em andamento",
  ANTEPROJECT_IN_DEVELOPMENT: "Anteprojeto em desenvolvimento",
  WAITING_CLIENT_APPROVAL: "Aguardando aprovação do cliente",
  DESIGN_3D_IN_DEVELOPMENT: "Desenho 3D em desenvolvimento",
  EXECUTIVE_PROJECT_IN_DEVELOPMENT: "Projeto executivo em desenvolvimento",
  FINAL_DELIVERY: "Entrega final",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado"
};

const projectTypeLabels: Record<string, string> = {
  RESIDENTIAL: "Residencial",
  INTERIORS: "Interiores",
  RENOVATION: "Reforma",
  COMMERCIAL: "Comercial",
  OTHER: "Outro"
};

const budgetStatusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  NEGOTIATION: "Em negociação",
  APPROVED: "Aprovado",
  REFUSED: "Recusado",
  EXPIRED: "Vencido",
  CANCELLED: "Cancelado"
};

const paymentStatusLabels: Record<string, string> = {
  RECEIVABLE: "A receber",
  PAID: "Pago",
  PARTIALLY_PAID: "Parcialmente pago",
  OVERDUE: "Atrasado",
  CANCELLED: "Cancelado"
};

const visitStatusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada"
};

const visitTypeLabels: Record<string, string> = {
  TECHNICAL_VISIT: "Visita técnica",
  MEASUREMENT: "Levantamento",
  SITE_INSPECTION: "Vistoria",
  CLIENT_MEETING: "Reunião com cliente",
  OTHER: "Outro"
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
  const [detailMode, setDetailMode] = useState<"details" | "relations" | null>(null);
  const [detailTarget, setDetailTarget] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  async function handleOpenClientModal(client: Client, mode: "details" | "relations") {
    setDetailMode(mode);
    setDetailTarget(client);
    setDetailClient(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const loadedClient = await getClientById(client.id);

      setDetailClient(loadedClient);
    } catch (requestError) {
      setDetailError(getErrorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  }

  function handleClientCardKeyDown(event: KeyboardEvent<HTMLDivElement>, client: Client) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void handleOpenClientModal(client, "details");
  }

  function closeClientModal() {
    setDetailMode(null);
    setDetailTarget(null);
    setDetailClient(null);
    setDetailError(null);
    setDetailLoading(false);
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
  const detailModalTitle =
    detailMode === "relations"
      ? `Vínculos de ${detailTarget?.name ?? "cliente"}`
      : `Detalhes de ${detailTarget?.name ?? "cliente"}`;

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
        <form className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px]" onSubmit={handleFilterSubmit}>
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
          <div className="flex min-w-0 flex-wrap items-end gap-2 md:col-span-2 xl:justify-end">
            <Button className="min-w-28" title="Buscar clientes" type="submit">
              <Search className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Buscar
            </Button>
            <ActionIconButton ariaLabel="Limpar filtros" label="Limpar filtros" onClick={handleClearFilters} size="control" variant="secondary">
              <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
            <ActionIconButton ariaLabel="Atualizar lista" label="Atualizar lista" onClick={() => void loadClients()} size="control" variant="secondary">
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
        <div className="space-y-4">
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {clients.map((client) => (
              <Card
                className="group flex min-h-[118px] cursor-pointer flex-col justify-between gap-3 transition hover:border-accent-bronze/60 hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent-bronze/35"
                key={client.id}
                onClick={() => void handleOpenClientModal(client, "details")}
                onKeyDown={(event) => handleClientCardKeyDown(event, client)}
                role="button"
                tabIndex={0}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <h2 className="break-words text-base font-semibold leading-snug text-text-primary">{client.name}</h2>
                    <Badge tone={getClientStatusTone(client.status)}>{statusLabelByValue.get(client.status) ?? client.status}</Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-70 transition group-hover:opacity-100 group-focus-within:opacity-100" onClick={(event) => event.stopPropagation()}>
                    <ActionIconButton ariaLabel={`Editar ${client.name}`} className="border-surface-500 bg-transparent" label="Editar" onClick={() => handleOpenEdit(client)}>
                      <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                    <ActionIconButton
                      ariaLabel={`Excluir ${client.name}`}
                      className="border-surface-500 bg-transparent"
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
                </div>

                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-surface-500/70 pt-3">
                  <button
                    aria-label={`Abrir vínculos de ${client.name}`}
                    className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-surface-500 bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:border-accent-bronze/70 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-bronze/35"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleOpenClientModal(client, "relations");
                    }}
                    type="button"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0" strokeWidth={actionIconStrokeWidth} />
                    <span>{formatRelationTotal(client._count)}</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-ui px-1.5 py-1 text-xs font-medium text-text-muted transition hover:text-accent-bronze focus:outline-none focus:ring-2 focus:ring-accent-bronze/35"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleOpenClientModal(client, "details");
                    }}
                    type="button"
                  >
                    Detalhes
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={actionIconStrokeWidth} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total} cliente{pagination.total === 1 ? "" : "s"} encontrados
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

      <Modal
        footer={
          <Button onClick={closeClientModal} type="button" variant="secondary">
            Fechar
          </Button>
        }
        onClose={closeClientModal}
        open={Boolean(detailMode)}
        size="lg"
        title={detailModalTitle}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {detailLoading ? <LoadingState /> : null}

          {!detailLoading && detailError ? (
            <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{detailError}</span>
            </div>
          ) : null}

          {!detailLoading && !detailError && detailClient && detailMode === "details" ? (
            <ClientDetailsContent client={detailClient} statusLabel={statusLabelByValue.get(detailClient.status) ?? detailClient.status} />
          ) : null}

          {!detailLoading && !detailError && detailClient && detailMode === "relations" ? <ClientRelationsContent client={detailClient} /> : null}
        </div>
      </Modal>

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

function RelationMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function ClientDetailsContent({ client, statusLabel }: { client: ClientDetail; statusLabel: string }) {
  return (
    <div className="space-y-5">
      <div className="rounded-ui border border-surface-500 bg-surface-900 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{client.name}</h3>
            <p className="mt-1 text-sm text-text-muted">{client.source ? `Origem: ${client.source}` : "Origem não informada"}</p>
          </div>
          <Badge tone={getClientStatusTone(client.status)}>{statusLabel}</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailField icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={formatCellphone(client.whatsapp)} />
        <DetailField icon={<Phone className="h-4 w-4" />} label="Telefone" value={formatCellphone(client.phone)} />
        <DetailField icon={<Mail className="h-4 w-4" />} label="E-mail" value={client.email ?? "Não informado"} />
        <DetailField icon={<MapPin className="h-4 w-4" />} label="Local" value={formatLocation(client)} />
        <DetailField label="CPF/CNPJ" value={client.cpfCnpj ?? "Não informado"} />
        <DetailField label="Endereço" value={client.address ?? "Não informado"} />
      </div>

      <div className="rounded-ui border border-surface-500 bg-surface-900 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-text-muted">Observações</div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{client.notes ?? "Nenhuma observação registrada."}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <RelationMiniStat label="Projetos" value={client._count?.projects ?? 0} />
        <RelationMiniStat label="Orçamentos" value={client._count?.budgets ?? 0} />
        <RelationMiniStat label="Financeiro" value={client._count?.payments ?? 0} />
        <RelationMiniStat label="Visitas" value={client._count?.visits ?? 0} />
      </div>
    </div>
  );
}

function ClientRelationsContent({ client }: { client: ClientDetail }) {
  return (
    <div className="space-y-4">
      <RelationSection
        count={client.projects.length}
        icon={<BriefcaseBusiness className="h-4 w-4" />}
        title="Projetos"
      >
        {client.projects.length > 0 ? (
          client.projects.map((project) => (
            <RelationItem
              key={project.id}
              meta={`${projectTypeLabels[project.type] ?? project.type} · ${project.expectedDeliveryDate ? `Entrega ${formatDateOnly(project.expectedDeliveryDate)}` : "Entrega não informada"}`}
              status={projectStatusLabels[project.status] ?? project.status}
              title={project.name}
              value={`${project._count.tasks} tarefas · ${project._count.visits} visitas`}
            />
          ))
        ) : (
          <RelationEmpty message="Nenhum projeto vinculado." />
        )}
      </RelationSection>

      <RelationSection count={client.budgets.length} icon={<ClipboardList className="h-4 w-4" />} title="Orçamentos">
        {client.budgets.length > 0 ? (
          client.budgets.map((budget) => (
            <RelationItem
              key={budget.id}
              meta={`Criado em ${formatDateOnly(budget.createdAt)}`}
              status={budgetStatusLabels[budget.status] ?? budget.status}
              title={budget.title}
              value={formatCurrency(budget.finalAmount)}
            />
          ))
        ) : (
          <RelationEmpty message="Nenhum orçamento vinculado." />
        )}
      </RelationSection>

      <RelationSection count={client.payments.length} icon={<WalletCards className="h-4 w-4" />} title="Financeiro">
        {client.payments.length > 0 ? (
          client.payments.map((payment) => (
            <RelationItem
              key={payment.id}
              meta={`${payment.project.name} · Vencimento ${formatDateOnly(payment.dueDate)}`}
              status={paymentStatusLabels[payment.status] ?? payment.status}
              title={payment.description}
              value={formatCurrency(payment.amount)}
            />
          ))
        ) : (
          <RelationEmpty message="Nenhum lançamento financeiro vinculado." />
        )}
      </RelationSection>

      <RelationSection count={client.visits.length} icon={<CalendarDays className="h-4 w-4" />} title="Visitas">
        {client.visits.length > 0 ? (
          client.visits.map((visit) => (
            <RelationItem
              key={visit.id}
              meta={`${visit.project?.name ?? "Sem projeto"} · ${formatDateOnly(visit.date)}${visit.time ? ` às ${visit.time}` : ""}`}
              status={visitStatusLabels[visit.status] ?? visit.status}
              title={visitTypeLabels[visit.type] ?? visit.type}
              value={visit.amount ? formatCurrency(visit.amount) : "Sem valor"}
            />
          ))
        ) : (
          <RelationEmpty message="Nenhuma visita vinculada." />
        )}
      </RelationSection>
    </div>
  );
}

function DetailField({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-ui border border-surface-500 bg-surface-900 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-muted">
        {icon ? <span className="text-accent-bronze">{icon}</span> : null}
        {label}
      </div>
      <div className="mt-2 break-words text-sm text-text-primary">{value}</div>
    </div>
  );
}

function RelationSection({ children, count, icon, title }: { children: ReactNode; count: number; icon: ReactNode; title: string }) {
  return (
    <section className="rounded-ui border border-surface-500 bg-surface-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-accent-bronze">{icon}</span>
          <h3 className="font-semibold text-text-primary">{title}</h3>
        </div>
        <Badge>{count}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function RelationItem({ meta, status, title, value }: { meta: string; status: string; title: string; value: string }) {
  return (
    <div className="rounded-ui border border-surface-500 bg-surface-elevated p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="break-words font-medium text-text-primary">{title}</div>
          <div className="mt-1 break-words text-xs text-text-muted">{meta}</div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge tone={getRelationStatusTone(status)}>{status}</Badge>
          <span className="text-sm font-medium text-text-secondary">{value}</span>
        </div>
      </div>
    </div>
  );
}

function RelationEmpty({ message }: { message: string }) {
  return <div className="rounded-ui border border-dashed border-surface-500 px-3 py-4 text-sm text-text-muted">{message}</div>;
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

function getRelationStatusTone(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("aprov") || normalized.includes("pago") || normalized.includes("conclu") || normalized.includes("assinado")) {
    return "success";
  }

  if (normalized.includes("atras") || normalized.includes("cancel") || normalized.includes("recus")) {
    return "danger";
  }

  if (normalized.includes("aguard") || normalized.includes("negocia") || normalized.includes("enviado") || normalized.includes("receber")) {
    return "warning";
  }

  return "neutral";
}

function formatLocation(client: Pick<Client, "city" | "state">) {
  if (client.city && client.state) {
    return `${client.city}/${client.state}`;
  }

  return client.city ?? client.state ?? "Não informado";
}

function formatRelationTotal(counts?: ClientRelationCounts) {
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
    visits: "visitas"
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
