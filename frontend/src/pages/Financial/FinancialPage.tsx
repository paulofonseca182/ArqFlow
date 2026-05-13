import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  XCircle
} from "lucide-react";
import { ActionIconButton } from "../../components/ui/ActionIconButton";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { StatCard } from "../../components/ui/StatCard";
import { Table } from "../../components/ui/Table";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ApiError } from "../../services/api";
import {
  cancelPayment,
  createPayment,
  generateInstallments,
  getFinancialMeta,
  getFinancialSummary,
  listPayments,
  registerPayment,
  updatePayment
} from "../../services/financial";
import { listProjects } from "../../services/projects";
import type { PaginationMeta } from "../../types/api";
import type {
  FinancialMeta,
  GenerateInstallmentsInput,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentUpdateInput,
  PaymentWriteInput,
  RegisterPaymentInput
} from "../../types/financial";
import { paymentMethodValues, paymentStatusValues } from "../../types/financial";
import type { Project } from "../../types/project";
import { GenerateInstallmentsModal } from "./GenerateInstallmentsModal";
import { PaymentFormModal } from "./PaymentFormModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";

const pageSize = 20;
const actionIconClassName = "h-4 w-4 shrink-0";
const actionIconStrokeWidth = 1.75;
const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1
};
const emptySummary = {
  revenueMonth: "0",
  revenueYear: "0",
  receivableAmount: "0",
  receivedAmount: "0",
  overdueAmount: "0",
  dueSoonAmount: "0",
  overdueCount: 0,
  dueSoonCount: 0,
  approvedBudgets: 0,
  refusedBudgets: 0,
  averageProjectTicket: "0"
};
const fallbackFinancialMeta: FinancialMeta = {
  statuses: paymentStatusValues.map((value) => ({ value, label: value })),
  methods: paymentMethodValues.map((value) => ({ value, label: value }))
};

export function FinancialPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [meta, setMeta] = useState<FinancialMeta>(fallbackFinancialMeta);
  const [summary, setSummary] = useState(emptySummary);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState<PaymentStatus | "">("");
  const [draftProjectId, setDraftProjectId] = useState("");
  const [draftClientId, setDraftClientId] = useState("");
  const [query, setQuery] = useState<{ search: string; status: PaymentStatus | ""; projectId: string; clientId: string }>({
    search: "",
    status: "",
    projectId: "",
    clientId: ""
  });
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [installmentsSaving, setInstallmentsSaving] = useState(false);
  const [installmentsError, setInstallmentsError] = useState<string | null>(null);
  const [registerTarget, setRegisterTarget] = useState<Payment | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const clients = useMemo(() => {
    const clientById = new Map(projects.map((project) => [project.client.id, project.client]));

    return Array.from(clientById.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [projects]);
  const statusLabelByValue = useMemo(() => new Map(meta.statuses.map((status) => [status.value, status.label])), [meta.statuses]);
  const methodLabelByValue = useMemo(() => new Map(meta.methods.map((method) => [method.value, method.label])), [meta.methods]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listPayments({
        page,
        pageSize,
        search: query.search,
        status: query.status || undefined,
        projectId: query.projectId || undefined,
        clientId: query.clientId || undefined
      });

      setPayments(result.data);
      setPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query.clientId, query.projectId, query.search, query.status]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getFinancialSummary());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const [financialMeta, projectsResult, financialSummary] = await Promise.all([
          getFinancialMeta(),
          listProjects({ page: 1, pageSize: 100 }),
          getFinancialSummary()
        ]);

        if (active) {
          setMeta(financialMeta);
          setProjects(projectsResult.data);
          setSummary(financialSummary);
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
    void loadPayments();
  }, [loadPayments]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery({
      search: draftSearch.trim(),
      status: draftStatus,
      projectId: draftProjectId,
      clientId: draftClientId
    });
  }

  function handleClearFilters() {
    setDraftSearch("");
    setDraftStatus("");
    setDraftProjectId("");
    setDraftClientId("");
    setPage(1);
    setQuery({ search: "", status: "", projectId: "", clientId: "" });
  }

  function handleOpenCreate() {
    setFormMode("create");
    setSelectedPayment(null);
    setFormError(null);
    setFormOpen(true);
  }

  function handleOpenEdit(payment: Payment) {
    setFormMode("edit");
    setSelectedPayment(payment);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSavePayment(payload: PaymentWriteInput | PaymentUpdateInput) {
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      const result =
        formMode === "create"
          ? await createPayment(payload as PaymentWriteInput)
          : selectedPayment
            ? await updatePayment(selectedPayment.id, payload as PaymentUpdateInput)
            : null;

      if (result?.alert) {
        setNotice(result.alert.message);
      } else {
        setNotice(formMode === "create" ? "Parcela cadastrada." : "Parcela atualizada.");
      }

      setFormOpen(false);
      setSelectedPayment(null);
      await Promise.all([loadPayments(), loadSummary()]);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateInstallments(payload: GenerateInstallmentsInput) {
    setInstallmentsSaving(true);
    setInstallmentsError(null);
    setNotice(null);

    try {
      const result = await generateInstallments(payload);
      setNotice(result.alert?.message ?? `${result.payments.length} parcela${result.payments.length === 1 ? "" : "s"} gerada${result.payments.length === 1 ? "" : "s"}.`);
      setInstallmentsOpen(false);
      await Promise.all([loadPayments(), loadSummary()]);
    } catch (requestError) {
      setInstallmentsError(getErrorMessage(requestError));
    } finally {
      setInstallmentsSaving(false);
    }
  }

  async function handleRegisterPayment(payload: RegisterPaymentInput) {
    if (!registerTarget) {
      return;
    }

    setRegistering(true);
    setRegisterError(null);
    setNotice(null);

    try {
      const result = await registerPayment(registerTarget.id, payload);
      setNotice(result.payment.status === "PAID" ? "Pagamento registrado." : "Pagamento parcial registrado.");
      setRegisterTarget(null);
      await Promise.all([loadPayments(), loadSummary()]);
    } catch (requestError) {
      setRegisterError(getErrorMessage(requestError));
    } finally {
      setRegistering(false);
    }
  }

  async function handleCancelPayment() {
    if (!cancelTarget) {
      return;
    }

    setCancelling(true);
    setError(null);
    setNotice(null);

    try {
      await cancelPayment(cancelTarget.id);
      setNotice("Parcela cancelada.");
      setCancelTarget(null);
      await Promise.all([loadPayments(), loadSummary()]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  }

  const hasFilters = Boolean(query.search || query.status || query.projectId || query.clientId);

  return (
    <PageWrapper
      actions={
        <div className="flex flex-wrap gap-2">
          <Button disabled={metaLoading || projects.length === 0} onClick={() => setInstallmentsOpen(true)} type="button" variant="secondary">
            <CalendarClock className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            Gerar parcelas
          </Button>
          <Button disabled={metaLoading || projects.length === 0} onClick={handleOpenCreate} type="button">
            <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            Nova parcela
          </Button>
        </div>
      }
      description="Parcelas, pagamentos e alertas financeiros vinculados aos projetos."
      title="Financeiro"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard badge={<Badge tone="success">Mês</Badge>} label="Receita do mês" value={formatMoney(summary.revenueMonth)} />
        <StatCard badge={<Badge tone="neutral">Ano</Badge>} label="Receita do ano" value={formatMoney(summary.revenueYear)} />
        <StatCard badge={<Badge tone="warning">{summary.dueSoonCount} vencendo</Badge>} label="A receber" value={formatMoney(summary.receivableAmount)} />
        <StatCard badge={<Badge tone="danger">{summary.overdueCount} atrasada(s)</Badge>} label="Atrasado" value={formatMoney(summary.overdueAmount)} />
      </section>

      <Card>
        <form className="grid gap-3 xl:grid-cols-[1fr_180px_220px_220px_auto]" onSubmit={handleFilterSubmit}>
          <Input label="Busca" onChange={(event) => setDraftSearch(event.target.value)} placeholder="Parcela, projeto ou cliente" value={draftSearch} />
          <Select label="Status" onChange={(event) => setDraftStatus(event.target.value as PaymentStatus | "")} value={draftStatus}>
            <option value="">Todos</option>
            {meta.statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select label="Projeto" onChange={(event) => setDraftProjectId(event.target.value)} value={draftProjectId}>
            <option value="">Todos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
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
            <Button className="min-w-28" title="Buscar parcelas" type="submit">
              <Search className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Buscar
            </Button>
            <ActionIconButton ariaLabel="Limpar filtros" label="Limpar filtros" onClick={handleClearFilters} size="control" variant="secondary">
              <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
            <ActionIconButton
              ariaLabel="Atualizar financeiro"
              label="Atualizar financeiro"
              onClick={() => void Promise.all([loadPayments(), loadSummary()])}
              size="control"
            >
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

      {loading && payments.length === 0 ? <LoadingState /> : null}

      {!loading && payments.length === 0 ? (
        <EmptyState
          action={
            hasFilters ? (
              <Button onClick={handleClearFilters} type="button" variant="secondary">
                Limpar filtros
              </Button>
            ) : (
              <Button disabled={projects.length === 0} onClick={() => setInstallmentsOpen(true)} type="button">
                <CalendarClock className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                Gerar parcelas
              </Button>
            )
          }
          description={hasFilters ? "Nenhuma parcela encontrada para os filtros atuais." : "Gere parcelas a partir de um projeto com valor contratado."}
          title={hasFilters ? "Sem resultados" : "Nenhuma parcela cadastrada"}
        />
      ) : null}

      {payments.length > 0 ? (
        <div className="space-y-3">
          <Table headers={["Parcela", "Projeto", "Valor", "Pago", "Vencimento", "Status", "Método", "Ações"]}>
            {payments.map((payment) => (
              <tr className="min-w-[1040px]" key={payment.id}>
                <td className="min-w-56 px-4 py-4 align-top">
                  <div className="font-medium text-text-primary">{payment.description}</div>
                  <div className="mt-1 text-xs text-text-muted">{payment.installment ? `Parcela ${payment.installment}` : "Sem número"}</div>
                </td>
                <td className="min-w-56 px-4 py-4 align-top">
                  <div className="text-text-primary">{payment.project.name}</div>
                  <div className="mt-1 text-xs text-text-muted">{payment.client.name}</div>
                </td>
                <td className="px-4 py-4 align-top text-text-secondary">{formatMoney(payment.amount)}</td>
                <td className="px-4 py-4 align-top text-text-secondary">
                  <div>{formatMoney(payment.paidAmount)}</div>
                  <div className="mt-1 text-xs text-text-muted">{formatDate(payment.paidAt)}</div>
                </td>
                <td className="px-4 py-4 align-top text-text-secondary">{formatDate(payment.dueDate)}</td>
                <td className="px-4 py-4 align-top">
                  <Badge tone={getPaymentStatusTone(payment.status)}>{statusLabelByValue.get(payment.status) ?? payment.status}</Badge>
                </td>
                <td className="px-4 py-4 align-top text-text-secondary">
                  {payment.paymentMethod ? methodLabelByValue.get(payment.paymentMethod) ?? payment.paymentMethod : "Não informada"}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <ActionIconButton ariaLabel={`Editar ${payment.description}`} label="Editar" onClick={() => handleOpenEdit(payment)}>
                      <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                    {canRegisterPayment(payment) ? (
                      <ActionIconButton
                        ariaLabel={`Registrar pagamento ${payment.description}`}
                        label="Registrar pagamento"
                        onClick={() => {
                          setRegisterTarget(payment);
                          setRegisterError(null);
                        }}
                      >
                        <CheckCircle2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      </ActionIconButton>
                    ) : null}
                    {canCancelPayment(payment) ? (
                      <ActionIconButton
                        ariaLabel={`Cancelar ${payment.description}`}
                        destructive
                        label="Cancelar parcela"
                        onClick={() => setCancelTarget(payment)}
                      >
                        <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      </ActionIconButton>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total} parcela{pagination.total === 1 ? "" : "s"} encontradas
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

      <PaymentFormModal
        apiError={formError}
        methods={meta.methods}
        mode={formMode}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleSavePayment}
        open={formOpen}
        payment={selectedPayment}
        projects={projects}
        saving={saving}
      />

      <GenerateInstallmentsModal
        apiError={installmentsError}
        methods={meta.methods}
        onClose={() => {
          if (!installmentsSaving) {
            setInstallmentsOpen(false);
          }
        }}
        onSubmit={handleGenerateInstallments}
        open={installmentsOpen}
        projects={projects}
        saving={installmentsSaving}
      />

      <RegisterPaymentModal
        apiError={registerError}
        onClose={() => {
          if (!registering) {
            setRegisterTarget(null);
          }
        }}
        onSubmit={handleRegisterPayment}
        open={Boolean(registerTarget)}
        payment={registerTarget}
        saving={registering}
      />

      <Modal
        footer={
          <>
            <Button disabled={cancelling} onClick={() => setCancelTarget(null)} type="button" variant="secondary">
              Fechar
            </Button>
            <Button className="bg-status-danger hover:bg-status-danger/80" disabled={cancelling} onClick={() => void handleCancelPayment()} type="button">
              {cancelling ? "Cancelando..." : "Cancelar parcela"}
            </Button>
          </>
        }
        onClose={() => setCancelTarget(null)}
        open={Boolean(cancelTarget)}
        title="Cancelar parcela"
      >
        <div className="flex gap-3">
          <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
          <div className="space-y-2">
            <p>
              Confirme o cancelamento de <span className="font-medium text-text-primary">{cancelTarget?.description}</span>.
            </p>
            <p className="text-text-muted">Parcelas canceladas deixam de entrar nos indicadores de recebimento e atraso.</p>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}

function canRegisterPayment(payment: Payment) {
  return payment.status !== "PAID" && payment.status !== "CANCELLED";
}

function canCancelPayment(payment: Payment) {
  return payment.status !== "PAID" && payment.status !== "CANCELLED";
}

function getPaymentStatusTone(status: PaymentStatus) {
  if (status === "PAID") {
    return "success";
  }

  if (status === "RECEIVABLE" || status === "PARTIALLY_PAID") {
    return "warning";
  }

  if (status === "OVERDUE" || status === "CANCELLED") {
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

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}
