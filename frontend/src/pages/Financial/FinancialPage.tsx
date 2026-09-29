import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  WalletCards,
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
import { StatCard } from "../../components/ui/StatCard";
import { Table } from "../../components/ui/Table";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { ApiError } from "../../services/api";
import {
  cancelExpense,
  createExpense,
  createManualCashMovement,
  deleteExpense,
  generateInstallments,
  getCashFlow,
  getCashSummary,
  getFinancialMeta,
  getFinancialSummary,
  listCashMovements,
  listExpenses,
  listPayments,
  payExpense,
  registerPayment,
  reorganizeInstallments,
  updateExpense,
  updatePayment
} from "../../services/financial";
import { listProjects } from "../../services/projects";
import type { PaginationMeta } from "../../types/api";
import type {
  FinancialMeta,
  GenerateInstallmentsInput,
  CashFlowSummary,
  CashMovement,
  CashSummary,
  Expense,
  ExpenseWriteInput,
  ManualCashMovementInput,
  PayExpenseInput,
  Payment,
  PaymentMethod,
  ReorganizeInstallmentsInput,
  PaymentStatus,
  PaymentUpdateInput,
  PaymentWriteInput,
  RegisterPaymentInput
} from "../../types/financial";
import {
  cashMovementOriginValues,
  cashMovementTypeValues,
  expenseClassificationValues,
  expenseEntryTypeValues,
  expenseStatusValues,
  financialCategoryTypeValues,
  paymentMethodValues,
  paymentStatusValues
} from "../../types/financial";
import { formatDateOnly } from "../../utils/date";
import { getDateSearchParam, getEnumSearchParam, getStringSearchParam } from "../../utils/searchParams";
import type { Project } from "../../types/project";
import { GenerateInstallmentsModal } from "./GenerateInstallmentsModal";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { ExpensePaymentModal } from "./ExpensePaymentModal";
import { ManualCashMovementModal } from "./ManualCashMovementModal";
import { PaymentFormModal } from "./PaymentFormModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import { ReorganizeInstallmentsModal } from "./ReorganizeInstallmentsModal";

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
  expectedRevenueMonth: "0",
  expectedRevenueYear: "0",
  expectedExpenseMonth: "0",
  expectedExpenseYear: "0",
  paidExpenseMonth: "0",
  paidExpenseYear: "0",
  payableExpenseAmount: "0",
  overdueExpenseAmount: "0",
  dueSoonExpenseAmount: "0",
  overdueExpenseCount: 0,
  dueSoonExpenseCount: 0,
  expectedBalanceMonth: "0",
  realizedBalanceMonth: "0",
  cashBalance: "0",
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
  methods: paymentMethodValues.map((value) => ({ value, label: value })),
  expenseStatuses: expenseStatusValues.map((value) => ({ value, label: value })),
  expenseEntryTypes: expenseEntryTypeValues.map((value) => ({ value, label: value })),
  expenseClassifications: expenseClassificationValues.map((value) => ({ value, label: value })),
  categoryTypes: financialCategoryTypeValues.map((value) => ({ value, label: value })),
  cashMovementTypes: cashMovementTypeValues.map((value) => ({ value, label: value })),
  cashMovementOrigins: cashMovementOriginValues.map((value) => ({ value, label: value })),
  cashAccountTypes: [],
  categories: [],
  cashAccounts: []
};
const emptyCashSummary: CashSummary = {
  openingBalance: "0",
  incomeAmount: "0",
  expenseAmount: "0",
  balance: "0"
};
const emptyCashFlow: CashFlowSummary = {
  period: {
    from: "",
    to: ""
  },
  expectedIncome: "0",
  expectedExpense: "0",
  expectedBalance: "0",
  realizedIncome: "0",
  realizedExpense: "0",
  realizedBalance: "0",
  difference: "0",
  overdueReceivablesAmount: "0",
  overdueReceivablesCount: 0,
  overdueExpensesAmount: "0",
  overdueExpensesCount: 0
};
type FinancialQuery = {
  search: string;
  status: PaymentStatus | "";
  projectId: string;
  clientId: string;
  dueFrom: string;
  dueTo: string;
};
type FinancialTab = "overview" | "receivables" | "expenses" | "cash-flow" | "cash";

export function FinancialPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = readFinancialSearchParams(searchParams);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [expensePagination, setExpensePagination] = useState<PaginationMeta>(emptyPagination);
  const [cashPagination, setCashPagination] = useState<PaginationMeta>(emptyPagination);
  const [meta, setMeta] = useState<FinancialMeta>(fallbackFinancialMeta);
  const [summary, setSummary] = useState(emptySummary);
  const [cashSummary, setCashSummary] = useState<CashSummary>(emptyCashSummary);
  const [cashFlow, setCashFlow] = useState<CashFlowSummary>(emptyCashFlow);
  const [activeTab, setActiveTab] = useState<FinancialTab>("overview");
  const [page, setPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [cashPage, setCashPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(initialQuery.search);
  const [draftStatus, setDraftStatus] = useState<PaymentStatus | "">(initialQuery.status);
  const [draftProjectId, setDraftProjectId] = useState(initialQuery.projectId);
  const [draftClientId, setDraftClientId] = useState(initialQuery.clientId);
  const [draftDueFrom, setDraftDueFrom] = useState(initialQuery.dueFrom);
  const [draftDueTo, setDraftDueTo] = useState(initialQuery.dueTo);
  const [query, setQuery] = useState<FinancialQuery>(initialQuery);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [installmentsSaving, setInstallmentsSaving] = useState(false);
  const [installmentsError, setInstallmentsError] = useState<string | null>(null);
  const [registerTarget, setRegisterTarget] = useState<Payment | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [reorganizeOpen, setReorganizeOpen] = useState(false);
  const [reorganizeProject, setReorganizeProject] = useState<Pick<Project, "id" | "name" | "contractedAmount"> | null>(null);
  const [reorganizePayments, setReorganizePayments] = useState<Payment[]>([]);
  const [reorganizeLoading, setReorganizeLoading] = useState(false);
  const [reorganizeSaving, setReorganizeSaving] = useState(false);
  const [reorganizeError, setReorganizeError] = useState<string | null>(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseFormError, setExpenseFormError] = useState<string | null>(null);
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<Set<string>>(new Set());
  const [expensePayTarget, setExpensePayTarget] = useState<Expense | null>(null);
  const [expensePaySaving, setExpensePaySaving] = useState(false);
  const [expensePayError, setExpensePayError] = useState<string | null>(null);
  const [expenseDeleteTarget, setExpenseDeleteTarget] = useState<Expense | null>(null);
  const [expenseDeleting, setExpenseDeleting] = useState(false);
  const [manualCashOpen, setManualCashOpen] = useState(false);
  const [manualCashSaving, setManualCashSaving] = useState(false);
  const [manualCashError, setManualCashError] = useState<string | null>(null);

  const clients = useMemo(() => {
    const clientById = new Map(projects.map((project) => [project.client.id, project.client]));

    return Array.from(clientById.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [projects]);
  const statusLabelByValue = useMemo(() => new Map(meta.statuses.map((status) => [status.value, status.label])), [meta.statuses]);
  const methodLabelByValue = useMemo(() => new Map(meta.methods.map((method) => [method.value, method.label])), [meta.methods]);
  const searchParamsKey = searchParams.toString();

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
        clientId: query.clientId || undefined,
        dueFrom: query.dueFrom || undefined,
        dueTo: query.dueTo || undefined
      });

      setPayments(result.data);
      setPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query.clientId, query.dueFrom, query.dueTo, query.projectId, query.search, query.status]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getFinancialSummary());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      const result = await listExpenses({
        page: expensePage,
        pageSize
      });

      setExpenses(result.data);
      setExpensePagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, [expensePage]);

  const loadCashMovements = useCallback(async () => {
    try {
      const result = await listCashMovements({
        page: cashPage,
        pageSize
      });

      setCashMovements(result.data);
      setCashPagination(result.meta);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, [cashPage]);

  const loadCashOverview = useCallback(async () => {
    try {
      const [nextCashSummary, nextCashFlow] = await Promise.all([getCashSummary(), getCashFlow()]);

      setCashSummary(nextCashSummary);
      setCashFlow(nextCashFlow);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, []);

  useEffect(() => {
    const nextQuery = readFinancialSearchParams(searchParams);

    setDraftSearch(nextQuery.search);
    setDraftStatus(nextQuery.status);
    setDraftProjectId(nextQuery.projectId);
    setDraftClientId(nextQuery.clientId);
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
        const [financialMeta, projectsResult, financialSummary, nextCashSummary, nextCashFlow] = await Promise.all([
          getFinancialMeta(),
          listProjects({ page: 1, pageSize: 100 }),
          getFinancialSummary(),
          getCashSummary(),
          getCashFlow()
        ]);

        if (active) {
          setMeta(financialMeta);
          setProjects(projectsResult.data);
          setSummary(financialSummary);
          setCashSummary(nextCashSummary);
          setCashFlow(nextCashFlow);
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

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    void loadCashMovements();
  }, [loadCashMovements]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery({
      search: draftSearch.trim(),
      status: draftStatus,
      projectId: draftProjectId,
      clientId: draftClientId,
      dueFrom: draftDueFrom,
      dueTo: draftDueTo
    });
  }

  function handleClearFilters() {
    applyQuery({ search: "", status: "", projectId: "", clientId: "", dueFrom: "", dueTo: "" });
  }

  function applyQuery(nextQuery: FinancialQuery) {
    setDraftSearch(nextQuery.search);
    setDraftStatus(nextQuery.status);
    setDraftProjectId(nextQuery.projectId);
    setDraftClientId(nextQuery.clientId);
    setDraftDueFrom(nextQuery.dueFrom);
    setDraftDueTo(nextQuery.dueTo);
    setPage(1);
    setQuery(nextQuery);
    setSearchParams(toFinancialSearchParams(nextQuery), { replace: true });
  }

  function handleOpenEdit(payment: Payment) {
    if (payment.source === "VISIT") {
      setNotice("Lançamentos de visita técnica devem ser editados no módulo de Visitas.");
      return;
    }

    setSelectedPayment(payment);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSavePayment(payload: PaymentWriteInput | PaymentUpdateInput) {
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      const result = selectedPayment ? await updatePayment(selectedPayment.id, payload as PaymentUpdateInput) : null;

      if (result?.alert) {
        setNotice(result.alert.message);
      } else {
        setNotice("Parcela atualizada.");
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

  async function handleOpenReorganize(payment: Payment) {
    if (payment.source === "VISIT") {
      setNotice("Lançamentos de visita técnica devem ser ajustados no módulo de Visitas.");
      return;
    }

    setReorganizeProject({
      id: payment.projectId,
      name: payment.project.name,
      contractedAmount: payment.project.contractedAmount
    });
    setReorganizePayments([]);
    setReorganizeError(null);
    setReorganizeOpen(true);
    setReorganizeLoading(true);

    try {
      const result = await listPayments({
        page: 1,
        pageSize: 100,
        projectId: payment.projectId
      });

      setReorganizePayments(result.data.filter((item) => item.source === "PROJECT" && item.storedStatus !== "CANCELLED"));
    } catch (requestError) {
      setReorganizeError(getErrorMessage(requestError));
    } finally {
      setReorganizeLoading(false);
    }
  }

  async function handleReorganizeInstallments(payload: ReorganizeInstallmentsInput) {
    if (!reorganizeProject) {
      return;
    }

    setReorganizeSaving(true);
    setReorganizeError(null);
    setNotice(null);

    try {
      const result = await reorganizeInstallments(reorganizeProject.id, payload);
      setNotice(
        result.alert?.message ??
          `Plano financeiro reorganizado com ${result.payments.length} parcela${result.payments.length === 1 ? "" : "s"}.`
      );
      setReorganizeOpen(false);
      setReorganizeProject(null);
      setReorganizePayments([]);
      await Promise.all([loadPayments(), loadSummary()]);
    } catch (requestError) {
      setReorganizeError(getErrorMessage(requestError));
    } finally {
      setReorganizeSaving(false);
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

  async function handleSaveExpense(payload: ExpenseWriteInput) {
    setExpenseSaving(true);
    setExpenseFormError(null);
    setNotice(null);

    try {
      if (selectedExpense) {
        await updateExpense(selectedExpense.id, payload);
        setNotice("Despesa atualizada.");
      } else {
        await createExpense(payload);
        setNotice("Despesa cadastrada.");
      }

      setExpenseFormOpen(false);
      setSelectedExpense(null);
      await Promise.all([loadExpenses(), loadSummary(), loadCashOverview()]);
    } catch (requestError) {
      setExpenseFormError(getErrorMessage(requestError));
    } finally {
      setExpenseSaving(false);
    }
  }

  async function handlePayExpense(payload: PayExpenseInput) {
    if (!expensePayTarget) {
      return;
    }

    setExpensePaySaving(true);
    setExpensePayError(null);
    setNotice(null);

    try {
      const result = await payExpense(expensePayTarget.id, payload);
      setNotice(result.expense.status === "PAID" ? "Despesa paga e registrada no caixa." : "Pagamento parcial registrado no caixa.");
      setExpensePayTarget(null);
      await Promise.all([loadExpenses(), loadCashMovements(), loadSummary(), loadCashOverview()]);
    } catch (requestError) {
      setExpensePayError(getErrorMessage(requestError));
    } finally {
      setExpensePaySaving(false);
    }
  }

  function toggleExpenseExpanded(expenseId: string) {
    setExpandedExpenseIds((current) => {
      const next = new Set(current);

      if (next.has(expenseId)) {
        next.delete(expenseId);
      } else {
        next.add(expenseId);
      }

      return next;
    });
  }

  async function handleCancelExpense(expense: Expense) {
    if (!window.confirm("Cancelar esta despesa? Despesas canceladas não entram no fluxo previsto.")) {
      return;
    }

    setNotice(null);

    try {
      await cancelExpense(expense.id);
      setNotice("Despesa cancelada.");
      await Promise.all([loadExpenses(), loadSummary(), loadCashOverview()]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleConfirmDeleteExpense() {
    if (!expenseDeleteTarget) {
      return;
    }

    setExpenseDeleting(true);
    setError(null);
    setNotice(null);

    try {
      await deleteExpense(expenseDeleteTarget.id);
      setNotice("Despesa excluída.");
      setExpenseDeleteTarget(null);
      await Promise.all([loadExpenses(), loadCashMovements(), loadSummary(), loadCashOverview()]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setExpenseDeleteTarget(null);
    } finally {
      setExpenseDeleting(false);
    }
  }

  async function handleCreateManualCashMovement(payload: ManualCashMovementInput) {
    setManualCashSaving(true);
    setManualCashError(null);
    setNotice(null);

    try {
      await createManualCashMovement(payload);
      setNotice("Movimentação manual registrada no caixa.");
      setManualCashOpen(false);
      await Promise.all([loadCashMovements(), loadSummary(), loadCashOverview()]);
    } catch (requestError) {
      setManualCashError(getErrorMessage(requestError));
    } finally {
      setManualCashSaving(false);
    }
  }

  const hasFilters = Boolean(query.search || query.status || query.projectId || query.clientId || query.dueFrom || query.dueTo);

  return (
    <PageWrapper
      actions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setExpenseFormOpen(true)} type="button" variant="secondary">
            <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            Nova despesa
          </Button>
          <Button onClick={() => setManualCashOpen(true)} type="button" variant="secondary">
            <WalletCards className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            Movimento manual
          </Button>
          <Button disabled={metaLoading || projects.length === 0} onClick={() => setInstallmentsOpen(true)} type="button" variant="secondary">
            <CalendarClock className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
            Gerar parcelas
          </Button>
        </div>
      }
      description="Contas a receber, contas a pagar, fluxo de caixa e extrato real do escritório."
      title="Financeiro"
    >
      <div className="flex flex-wrap gap-2 rounded-ui border border-surface-600 bg-surface-900 p-2">
        {[
          { key: "overview", label: "Visão geral" },
          { key: "receivables", label: "Contas a receber" },
          { key: "expenses", label: "Contas a pagar" },
          { key: "cash-flow", label: "Fluxo de caixa" },
          { key: "cash", label: "Caixa / Extrato" }
        ].map((tab) => (
          <Button
            className="h-9"
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FinancialTab)}
            type="button"
            variant={activeTab === tab.key ? "primary" : "ghost"}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard badge={<Badge tone="warning">Previsto</Badge>} label="Receitas previstas no mês" value={formatMoney(summary.expectedRevenueMonth)} />
        <StatCard badge={<Badge tone="success">Realizado</Badge>} label="Receitas recebidas no mês" value={formatMoney(summary.revenueMonth)} />
        <StatCard badge={<Badge tone="warning">Previsto</Badge>} label="Despesas previstas no mês" value={formatMoney(summary.expectedExpenseMonth)} />
        <StatCard badge={<Badge tone="neutral">Caixa</Badge>} label="Saldo atual" value={formatMoney(summary.cashBalance)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard badge={<Badge tone="warning">{summary.dueSoonCount} vencendo</Badge>} label="A receber" value={formatMoney(summary.receivableAmount)} />
        <StatCard badge={<Badge tone="danger">{summary.overdueCount} atrasada(s)</Badge>} label="Recebíveis atrasados" value={formatMoney(summary.overdueAmount)} />
        <StatCard badge={<Badge tone="warning">{summary.dueSoonExpenseCount} vencendo</Badge>} label="A pagar" value={formatMoney(summary.payableExpenseAmount)} />
        <StatCard badge={<Badge tone="danger">{summary.overdueExpenseCount} atrasada(s)</Badge>} label="Despesas atrasadas" value={formatMoney(summary.overdueExpenseAmount)} />
      </section>

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

      {activeTab === "overview" ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h3 className="text-base font-semibold text-text-primary">Fluxo previsto do mês</h3>
            <div className="mt-5 space-y-3">
              <MetricRow label="Entradas previstas" value={formatMoney(cashFlow.expectedIncome)} />
              <MetricRow label="Saídas previstas" value={formatMoney(cashFlow.expectedExpense)} />
              <MetricRow label="Saldo previsto" value={formatMoney(cashFlow.expectedBalance)} />
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-text-primary">Caixa realizado do mês</h3>
            <div className="mt-5 space-y-3">
              <MetricRow label="Entradas realizadas" value={formatMoney(cashFlow.realizedIncome)} />
              <MetricRow label="Saídas realizadas" value={formatMoney(cashFlow.realizedExpense)} />
              <MetricRow label="Saldo realizado" value={formatMoney(cashFlow.realizedBalance)} />
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-text-primary">Extrato</h3>
            <div className="mt-5 space-y-3">
              <MetricRow label="Entradas no caixa" value={formatMoney(cashSummary.incomeAmount)} />
              <MetricRow label="Saídas no caixa" value={formatMoney(cashSummary.expenseAmount)} />
              <MetricRow label="Saldo atual" value={formatMoney(cashSummary.balance)} />
            </div>
          </Card>
        </section>
      ) : null}

      {activeTab === "receivables" ? (
        <>
      <Card>
        <form
          className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
          onSubmit={handleFilterSubmit}
        >
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
          <Input label="De" onChange={(event) => setDraftDueFrom(event.target.value)} type="date" value={draftDueFrom} />
          <Input label="Até" onChange={(event) => setDraftDueTo(event.target.value)} type="date" value={draftDueTo} />
          <div className="flex min-w-0 flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3 xl:justify-end 2xl:col-span-6">
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
              variant="secondary"
            >
              <RefreshCw className={`${actionIconClassName} ${loading ? "animate-spin" : ""}`} strokeWidth={actionIconStrokeWidth} />
            </ActionIconButton>
          </div>
        </form>
      </Card>

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
                  <div className="flex max-w-full flex-wrap items-center gap-2">
                    <ActionIconButton ariaLabel={`Editar ${payment.description}`} label="Editar" onClick={() => handleOpenEdit(payment)}>
                      <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                    </ActionIconButton>
                    {payment.source === "PROJECT" ? (
                      <ActionIconButton
                        ariaLabel={`Reorganizar parcelas de ${payment.project.name}`}
                        label="Reorganizar parcelas"
                        onClick={() => void handleOpenReorganize(payment)}
                      >
                        <SlidersHorizontal className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                      </ActionIconButton>
                    ) : null}
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
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total} parcela{pagination.total === 1 ? "" : "s"} encontradas
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
        </>
      ) : null}

      {activeTab === "expenses" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setExpenseFormOpen(true)} type="button">
              <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Nova despesa
            </Button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState
              action={
                <Button onClick={() => setExpenseFormOpen(true)} type="button">
                  <Plus className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                  Nova despesa
                </Button>
              }
              description="Cadastre despesas administrativas, fornecedores ou custos vinculados a projetos."
              title="Nenhuma despesa cadastrada"
            />
          ) : (
            <>
              <Table headers={["Despesa", "Projeto", "Categoria", "Valor", "Vencimento", "Status", "Ações"]}>
                {expenses.map((expense) => {
                  const isExpanded = expandedExpenseIds.has(expense.id);
                  const isPurchase = expense.entryType === "PURCHASE";

                  return (
                    <Fragment key={expense.id}>
                      <tr>
                        <td className="min-w-64 px-4 py-4 align-top">
                          <div className="flex items-start gap-2">
                            {isPurchase ? (
                              <button
                                aria-label={isExpanded ? "Ocultar parcelas" : "Mostrar parcelas"}
                                className="mt-0.5 rounded-ui border border-surface-500 p-1 text-text-secondary transition hover:border-accent-bronze hover:text-text-primary"
                                onClick={() => toggleExpenseExpanded(expense.id)}
                                type="button"
                              >
                                {isExpanded ? (
                                  <ChevronUp className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                                ) : (
                                  <ChevronDown className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                                )}
                              </button>
                            ) : null}
                            <div>
                              <div className="font-medium text-text-primary">{expense.description}</div>
                              <div className="mt-1 text-xs text-text-muted">
                                {isPurchase ? `${expense.installments.length} parcela${expense.installments.length === 1 ? "" : "s"}` : expense.supplier ?? "Sem fornecedor"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-text-secondary">{expense.project?.name ?? "Sem projeto"}</td>
                        <td className="px-4 py-4 align-top text-text-secondary">{expense.category?.name ?? "Outros"}</td>
                        <td className="px-4 py-4 align-top text-text-secondary">
                          <div>{formatMoney(expense.amount)}</div>
                          <div className="mt-1 text-xs text-text-muted">
                            Pago {formatMoney(expense.paidAmount)} · saldo {formatMoney(expense.pendingAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-text-secondary">{isPurchase ? "Por parcela" : formatDate(expense.dueDate)}</td>
                        <td className="px-4 py-4 align-top">
                          <Badge tone={getExpenseStatusTone(expense.status)}>{getExpenseStatusLabel(expense.status, meta)}</Badge>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex max-w-full flex-wrap items-center gap-2">
                            <ActionIconButton
                              ariaLabel={`Editar ${expense.description}`}
                              label="Editar"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setExpenseFormError(null);
                                setExpenseFormOpen(true);
                              }}
                            >
                              <Pencil className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                            </ActionIconButton>
                            {!isPurchase && canPayExpense(expense) ? (
                              <ActionIconButton
                                ariaLabel={`Pagar ${expense.description}`}
                                label="Registrar pagamento"
                                onClick={() => {
                                  setExpensePayTarget(expense);
                                  setExpensePayError(null);
                                }}
                              >
                                <CheckCircle2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                              </ActionIconButton>
                            ) : null}
                            {expense.status !== "PAID" && expense.status !== "CANCELLED" ? (
                              <ActionIconButton ariaLabel={`Cancelar ${expense.description}`} label="Cancelar" onClick={() => void handleCancelExpense(expense)}>
                                <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                              </ActionIconButton>
                            ) : null}
                            {canDeleteExpense(expense) ? (
                              <ActionIconButton
                                ariaLabel={`Excluir ${expense.description}`}
                                destructive
                                label="Excluir"
                                onClick={() => setExpenseDeleteTarget(expense)}
                              >
                                <Trash2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                              </ActionIconButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {isPurchase && isExpanded
                        ? expense.installments.map((installment) => (
                            <tr className="bg-surface-950/40" key={installment.id}>
                              <td className="min-w-64 px-4 py-3 align-top">
                                <div className="pl-8">
                                  <div className="font-medium text-text-primary">{installment.description}</div>
                                  <div className="mt-1 text-xs text-text-muted">
                                    Parcela {installment.installmentNumber ?? "-"} de {installment.installmentCount ?? expense.installments.length}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-text-secondary">{installment.project?.name ?? "Sem projeto"}</td>
                              <td className="px-4 py-3 align-top text-text-secondary">{installment.category?.name ?? "Outros"}</td>
                              <td className="px-4 py-3 align-top text-text-secondary">
                                <div>{formatMoney(installment.amount)}</div>
                                <div className="mt-1 text-xs text-text-muted">
                                  Pago {formatMoney(installment.paidAmount)} · saldo {formatMoney(installment.pendingAmount)}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-text-secondary">{formatDate(installment.dueDate)}</td>
                              <td className="px-4 py-3 align-top">
                                <Badge tone={getExpenseStatusTone(installment.status)}>{getExpenseStatusLabel(installment.status, meta)}</Badge>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex max-w-full flex-wrap items-center gap-2">
                                  {canPayExpense(installment) ? (
                                    <ActionIconButton
                                      ariaLabel={`Pagar ${installment.description}`}
                                      label="Registrar pagamento"
                                      onClick={() => {
                                        setExpensePayTarget(installment);
                                        setExpensePayError(null);
                                      }}
                                    >
                                      <CheckCircle2 className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                                    </ActionIconButton>
                                  ) : null}
                                  {installment.status !== "PAID" && installment.status !== "CANCELLED" ? (
                                    <ActionIconButton
                                      ariaLabel={`Cancelar ${installment.description}`}
                                      label="Cancelar"
                                      onClick={() => void handleCancelExpense(installment)}
                                    >
                                      <XCircle className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
                                    </ActionIconButton>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))
                        : null}
                    </Fragment>
                  );
                })}
              </Table>
              <Pagination
                label={`${expensePagination.total} despesa${expensePagination.total === 1 ? "" : "s"} encontrada${expensePagination.total === 1 ? "" : "s"}`}
                loading={loading}
                onNext={() => setExpensePage((current) => Math.min(expensePagination.totalPages, current + 1))}
                onPrevious={() => setExpensePage((current) => Math.max(1, current - 1))}
                page={expensePagination.page}
                totalPages={expensePagination.totalPages}
              />
            </>
          )}
        </div>
      ) : null}

      {activeTab === "cash-flow" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold text-text-primary">Previsto</h3>
            <div className="mt-5 space-y-3">
              <MetricRow label="Entradas previstas" value={formatMoney(cashFlow.expectedIncome)} />
              <MetricRow label="Saídas previstas" value={formatMoney(cashFlow.expectedExpense)} />
              <MetricRow label="Saldo previsto" value={formatMoney(cashFlow.expectedBalance)} />
              <MetricRow label="Recebíveis atrasados" value={formatMoney(cashFlow.overdueReceivablesAmount)} />
              <MetricRow label="Despesas atrasadas" value={formatMoney(cashFlow.overdueExpensesAmount)} />
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-text-primary">Realizado</h3>
            <div className="mt-5 space-y-3">
              <MetricRow label="Entradas realizadas" value={formatMoney(cashFlow.realizedIncome)} />
              <MetricRow label="Saídas realizadas" value={formatMoney(cashFlow.realizedExpense)} />
              <MetricRow label="Saldo realizado" value={formatMoney(cashFlow.realizedBalance)} />
              <MetricRow label="Diferença previsto x realizado" value={formatMoney(cashFlow.difference)} />
            </div>
          </Card>
        </section>
      ) : null}

      {activeTab === "cash" ? (
        <div className="space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard badge={<Badge tone="success">Entradas</Badge>} label="Entradas no caixa" value={formatMoney(cashSummary.incomeAmount)} />
            <StatCard badge={<Badge tone="danger">Saídas</Badge>} label="Saídas no caixa" value={formatMoney(cashSummary.expenseAmount)} />
            <StatCard badge={<Badge tone="neutral">Saldo</Badge>} label="Saldo do caixa" value={formatMoney(cashSummary.balance)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setManualCashOpen(true)} type="button">
              <WalletCards className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
              Movimento manual
            </Button>
          </div>
          {cashMovements.length === 0 ? (
            <EmptyState description="Entradas e saídas realizadas aparecerão aqui." title="Nenhuma movimentação de caixa" />
          ) : (
            <>
              <Table headers={["Data", "Tipo", "Descrição", "Valor", "Origem", "Conta"]}>
                {cashMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-4 py-4 align-top text-text-secondary">{formatDate(movement.date)}</td>
                    <td className="px-4 py-4 align-top">
                      <Badge tone={movement.type === "INCOME" ? "success" : "danger"}>{movement.type === "INCOME" ? "Entrada" : "Saída"}</Badge>
                    </td>
                    <td className="min-w-60 px-4 py-4 align-top">
                      <div className="font-medium text-text-primary">{movement.description}</div>
                      <div className="mt-1 text-xs text-text-muted">{movement.project?.name ?? movement.client?.name ?? "Sem vínculo"}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-text-secondary">{formatMoney(movement.amount)}</td>
                    <td className="px-4 py-4 align-top text-text-secondary">{formatCashOrigin(movement.origin)}</td>
                    <td className="px-4 py-4 align-top text-text-secondary">{movement.cashAccount?.name ?? "Caixa principal"}</td>
                  </tr>
                ))}
              </Table>
              <Pagination
                label={`${cashPagination.total} movimentaç${cashPagination.total === 1 ? "ão" : "ões"} encontrada${cashPagination.total === 1 ? "" : "s"}`}
                loading={loading}
                onNext={() => setCashPage((current) => Math.min(cashPagination.totalPages, current + 1))}
                onPrevious={() => setCashPage((current) => Math.max(1, current - 1))}
                page={cashPagination.page}
                totalPages={cashPagination.totalPages}
              />
            </>
          )}
        </div>
      ) : null}

      <PaymentFormModal
        apiError={formError}
        methods={meta.methods}
        mode="edit"
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

      <ReorganizeInstallmentsModal
        apiError={reorganizeError}
        loading={reorganizeLoading}
        methods={meta.methods}
        onClose={() => {
          if (!reorganizeSaving) {
            setReorganizeOpen(false);
          }
        }}
        onSubmit={handleReorganizeInstallments}
        open={reorganizeOpen}
        payments={reorganizePayments}
        project={reorganizeProject}
        saving={reorganizeSaving}
      />

      <ExpenseFormModal
        apiError={expenseFormError}
        cashAccounts={meta.cashAccounts}
        categories={meta.categories}
        expense={selectedExpense}
        methods={meta.methods}
        onClose={() => {
          if (!expenseSaving) {
            setExpenseFormOpen(false);
            setSelectedExpense(null);
          }
        }}
        onSubmit={handleSaveExpense}
        open={expenseFormOpen}
        projects={projects}
        saving={expenseSaving}
      />

      <ExpensePaymentModal
        apiError={expensePayError}
        cashAccounts={meta.cashAccounts}
        expense={expensePayTarget}
        methods={meta.methods}
        onClose={() => {
          if (!expensePaySaving) {
            setExpensePayTarget(null);
          }
        }}
        onSubmit={handlePayExpense}
        open={Boolean(expensePayTarget)}
        saving={expensePaySaving}
      />

      <ManualCashMovementModal
        apiError={manualCashError}
        cashAccounts={meta.cashAccounts}
        categories={meta.categories}
        methods={meta.methods}
        onClose={() => {
          if (!manualCashSaving) {
            setManualCashOpen(false);
          }
        }}
        onSubmit={handleCreateManualCashMovement}
        open={manualCashOpen}
        saving={manualCashSaving}
      />

      <DeleteModal
        confirming={expenseDeleting}
        impact={getExpenseDeleteImpact(expenseDeleteTarget)}
        itemName={expenseDeleteTarget?.description ?? ""}
        onClose={() => {
          if (!expenseDeleting) {
            setExpenseDeleteTarget(null);
          }
        }}
        onConfirm={() => void handleConfirmDeleteExpense()}
        open={Boolean(expenseDeleteTarget)}
      />

    </PageWrapper>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-ui border border-surface-500 bg-surface-elevated px-3 py-2 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function Pagination({
  label,
  loading,
  onNext,
  onPrevious,
  page,
  totalPages
}: {
  label: string;
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  totalPages: number;
}) {
  return (
    <div className="flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
      <span>{label}</span>
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <Button disabled={page <= 1 || loading} onClick={onPrevious} type="button" variant="secondary">
          <ChevronLeft className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
          Anterior
        </Button>
        <span className="min-w-20 text-center">
          {page} / {totalPages}
        </span>
        <Button disabled={page >= totalPages || loading} onClick={onNext} type="button" variant="secondary">
          Próxima
          <ChevronRight className={actionIconClassName} strokeWidth={actionIconStrokeWidth} />
        </Button>
      </div>
    </div>
  );
}

function readFinancialSearchParams(searchParams: URLSearchParams): FinancialQuery {
  const dueFrom = getDateSearchParam(searchParams, "dueFrom");
  const dueTo = getDateSearchParam(searchParams, "dueTo");

  return {
    search: getStringSearchParam(searchParams, "search"),
    status: getEnumSearchParam(searchParams, "status", paymentStatusValues),
    projectId: getStringSearchParam(searchParams, "projectId"),
    clientId: getStringSearchParam(searchParams, "clientId"),
    dueFrom,
    dueTo: dueFrom && dueTo && dueTo < dueFrom ? "" : dueTo
  };
}

function toFinancialSearchParams(query: FinancialQuery) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams;
}

function canRegisterPayment(payment: Payment) {
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

function getExpenseStatusTone(status: Expense["status"]) {
  if (status === "PAID") {
    return "success";
  }

  if (status === "PENDING" || status === "PARTIALLY_PAID") {
    return "warning";
  }

  if (status === "OVERDUE" || status === "CANCELLED") {
    return "danger";
  }

  return "neutral";
}

function getExpenseStatusLabel(status: Expense["status"], meta: FinancialMeta) {
  return meta.expenseStatuses.find((item) => item.value === status)?.label ?? status;
}

function canPayExpense(expense: Expense) {
  return expense.entryType !== "PURCHASE" && !["PAID", "CANCELLED"].includes(expense.status) && Number(expense.pendingAmount) > 0;
}

function canDeleteExpense(expense: Expense) {
  if (expense.parentExpenseId || Number(expense.paidAmount) > 0 || expense.payments.length > 0) {
    return false;
  }

  if (expense.entryType === "PURCHASE") {
    return expense.installments.every((installment) => Number(installment.paidAmount) <= 0 && installment.payments.length === 0);
  }

  return true;
}

function getExpenseDeleteImpact(expense?: Expense | null) {
  if (!expense) {
    return undefined;
  }

  if (expense.entryType === "PURCHASE") {
    const installmentCount = expense.installments.length;

    return `A compra e ${installmentCount} parcela${installmentCount === 1 ? "" : "s"} sem pagamento serão removidas permanentemente.`;
  }

  return "A despesa sem pagamento será removida permanentemente.";
}

function formatCashOrigin(origin: CashMovement["origin"]) {
  const labels: Record<CashMovement["origin"], string> = {
    RECEIVABLE_PAYMENT: "Recebimento",
    EXPENSE_PAYMENT: "Pagamento de despesa",
    VISIT_PAYMENT: "Recebimento de visita",
    MANUAL_ENTRY: "Entrada manual",
    MANUAL_EXIT: "Saída manual"
  };

  return labels[origin] ?? origin;
}

function formatMoney(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value));
}

function formatDate(value?: string | null) {
  return formatDateOnly(value, "Não informada");
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}
