import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CurrencyInput } from "../../components/ui/CurrencyInput";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import type {
  FinancialOption,
  Payment,
  PaymentMethod,
  ReorganizeInstallmentsInput
} from "../../types/financial";
import { formatCurrency, parseCurrencyInput, toCurrencyInputValue } from "../../utils/currency";

type ReorganizeProjectSummary = {
  id: string;
  name: string;
  contractedAmount: string | null;
};

type ReorganizeRow = {
  localId: string;
  id?: string;
  description: string;
  amount: string;
  installment: string;
  dueDate: string;
  paymentMethod: PaymentMethod | "";
  notes: string;
  paidAmount: number;
  locked: boolean;
};

type ReorganizeInstallmentsModalProps = {
  open: boolean;
  project: ReorganizeProjectSummary | null;
  payments: Payment[];
  methods: FinancialOption<PaymentMethod>[];
  loading: boolean;
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: ReorganizeInstallmentsInput) => Promise<void>;
};

const maxInstallmentCount = 12;

export function ReorganizeInstallmentsModal({
  apiError,
  loading,
  methods,
  onClose,
  onSubmit,
  open,
  payments,
  project,
  saving
}: ReorganizeInstallmentsModalProps) {
  const [rows, setRows] = useState<ReorganizeRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setRows(createRowsFromPayments(payments));
    setFormError(null);
  }, [open, payments]);

  const contractedAmount = Number(project?.contractedAmount ?? 0);
  const plannedAmount = useMemo(() => sumRows(rows), [rows]);
  const difference = roundMoney(contractedAmount - plannedAmount);
  const isBalanced = toCents(difference) === 0;

  function updateRow(localId: string, field: keyof ReorganizeRow, value: string) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.localId !== localId || row.locked) {
          return row;
        }

        return {
          ...row,
          [field]: value
        };
      })
    );
  }

  function addRow() {
    setFormError(null);

    if (rows.length >= maxInstallmentCount) {
      setFormError(`O plano financeiro pode ter no máximo ${maxInstallmentCount} parcelas.`);
      return;
    }

    const nextInstallment = rows.length + 1;
    const defaultAmount = Math.max(difference, 0);

    setRows((currentRows) => [
      ...currentRows,
      {
        localId: createLocalId(),
        description: `${project?.name ?? "Projeto"} - parcela ${nextInstallment}`,
        amount: defaultAmount > 0 ? toCurrencyInputValue(defaultAmount) : "",
        installment: nextInstallment.toString(),
        dueDate: getNextDueDate(currentRows),
        paymentMethod: "",
        notes: "",
        paidAmount: 0,
        locked: false
      }
    ]);
  }

  function removeRow(localId: string) {
    setFormError(null);
    const row = rows.find((item) => item.localId === localId);

    if (!row) {
      return;
    }

    if (row.paidAmount > 0 || row.locked) {
      setFormError("Parcela com pagamento registrado não pode ser removida do plano.");
      return;
    }

    setRows((currentRows) => currentRows.filter((item) => item.localId !== localId));
  }

  async function handleSubmit() {
    setFormError(null);

    const validationError = validateRows(rows, contractedAmount);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    await onSubmit({
      installments: rows.map((row) => ({
        id: row.id,
        description: row.description.trim(),
        amount: parseCurrencyInput(row.amount),
        installment: Number(row.installment),
        dueDate: row.dueDate,
        paymentMethod: row.paymentMethod || undefined,
        notes: row.notes.trim() || undefined
      }))
    });
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving || loading} onClick={() => void handleSubmit()} type="button">
            {saving ? "Salvando..." : "Salvar novo plano"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title="Reorganizar parcelas"
    >
      <div className="space-y-4">
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3">
          <div className="font-medium text-text-primary">{project?.name ?? "Projeto não selecionado"}</div>
          <div className="mt-2 grid gap-2 text-xs text-text-secondary sm:grid-cols-3">
            <span>Contratado: {formatCurrency(contractedAmount)}</span>
            <span>Planejado: {formatCurrency(plannedAmount)}</span>
            <span className={isBalanced ? "text-status-success" : "text-status-danger"}>
              Diferença: {formatCurrency(difference)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-muted">
            Parcelas pagas ficam bloqueadas. Parcelas parcialmente pagas precisam preservar o valor já recebido.
          </p>
          <Button disabled={loading || saving || rows.length >= maxInstallmentCount} onClick={addRow} type="button" variant="secondary">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Adicionar parcela
          </Button>
        </div>

        {loading ? <div className="rounded-ui border border-surface-600 px-4 py-6 text-center text-text-muted">Carregando parcelas...</div> : null}

        {!loading && rows.length === 0 ? (
          <div className="rounded-ui border border-dashed border-surface-600 px-4 py-6 text-center text-text-muted">
            Nenhuma parcela ativa encontrada para este projeto.
          </div>
        ) : null}

        {!loading && rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div className="rounded-ui border border-surface-600 bg-surface-950/40 p-3" key={row.localId}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-text-primary">Parcela {index + 1}</span>
                    {row.locked ? <Badge tone="success">Paga</Badge> : null}
                    {!row.locked && row.paidAmount > 0 ? <Badge tone="warning">Parcialmente paga</Badge> : null}
                  </div>
                  <Button
                    className="h-8 px-2"
                    disabled={saving || row.locked || row.paidAmount > 0}
                    onClick={() => removeRow(row.localId)}
                    title={row.paidAmount > 0 || row.locked ? "Parcela com pagamento registrado não pode ser removida" : "Remover parcela"}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    disabled={row.locked}
                    label="Descrição"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(row.localId, "description", event.target.value)}
                    value={row.description}
                  />
                  <CurrencyInput
                    disabled={row.locked}
                    label="Valor"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(row.localId, "amount", event.target.value)}
                    value={row.amount}
                  />
                  <Input
                    disabled={row.locked}
                    inputMode="numeric"
                    label="Número"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(row.localId, "installment", event.target.value)}
                    value={row.installment}
                  />
                  <Input
                    disabled={row.locked}
                    label="Vencimento"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateRow(row.localId, "dueDate", event.target.value)}
                    type="date"
                    value={row.dueDate}
                  />
                  <Select
                    className="md:col-span-2"
                    disabled={row.locked}
                    label="Forma de pagamento"
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      updateRow(row.localId, "paymentMethod", event.target.value)
                    }
                    value={row.paymentMethod}
                  >
                    <option value="">Não informada</option>
                    {methods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {row.paidAmount > 0 ? (
                  <p className="mt-3 text-xs text-text-muted">Já recebido nesta parcela: {formatCurrency(row.paidAmount)}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function createRowsFromPayments(payments: Payment[]): ReorganizeRow[] {
  return [...payments]
    .filter((payment) => payment.source === "PROJECT" && payment.storedStatus !== "CANCELLED")
    .sort((first, second) => {
      const firstInstallment = first.installment ?? Number.MAX_SAFE_INTEGER;
      const secondInstallment = second.installment ?? Number.MAX_SAFE_INTEGER;

      if (firstInstallment !== secondInstallment) {
        return firstInstallment - secondInstallment;
      }

      return first.dueDate.localeCompare(second.dueDate);
    })
    .map((payment) => {
      const amount = Number(payment.amount);
      const paidAmount = Number(payment.paidAmount);

      return {
        localId: payment.id,
        id: payment.id,
        description: payment.description,
        amount: toCurrencyInputValue(payment.amount),
        installment: payment.installment?.toString() ?? "",
        dueDate: payment.dueDate.slice(0, 10),
        paymentMethod: payment.paymentMethod ?? "",
        notes: payment.notes ?? "",
        paidAmount,
        locked: payment.status === "PAID" || (paidAmount > 0 && paidAmount >= amount)
      };
    });
}

function validateRows(rows: ReorganizeRow[], contractedAmount: number) {
  if (rows.length === 0) {
    return "Informe pelo menos uma parcela.";
  }

  if (rows.length > maxInstallmentCount) {
    return `O plano financeiro pode ter no máximo ${maxInstallmentCount} parcelas.`;
  }

  for (const row of rows) {
    const amount = parseCurrencyInput(row.amount);
    const installment = Number(row.installment);

    if (row.description.trim().length < 2) {
      return "Todas as parcelas precisam de descrição.";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Todas as parcelas precisam ter valor maior que zero.";
    }

    if (!Number.isInteger(installment) || installment <= 0) {
      return "Todas as parcelas precisam de um número válido.";
    }

    if (!row.dueDate) {
      return "Todas as parcelas precisam de vencimento.";
    }

    if (row.paidAmount > 0 && amount < row.paidAmount) {
      return "Parcela com pagamento registrado não pode ficar com valor menor do que já foi recebido.";
    }
  }

  if (toCents(sumRows(rows)) !== toCents(contractedAmount)) {
    return "A soma das parcelas precisa ser igual ao valor contratado do projeto.";
  }

  return null;
}

function sumRows(rows: ReorganizeRow[]) {
  return roundMoney(rows.reduce((total, row) => total + parseCurrencyInput(row.amount), 0));
}

function getNextDueDate(rows: ReorganizeRow[]) {
  const lastDueDate = [...rows]
    .map((row) => row.dueDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!lastDueDate) {
    return "";
  }

  const date = new Date(`${lastDueDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);

  return date.toISOString().slice(0, 10);
}

function createLocalId() {
  return `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
