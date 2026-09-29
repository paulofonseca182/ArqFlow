import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CurrencyInput } from "../../components/ui/CurrencyInput";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { CashAccount, Expense, FinancialOption, PaymentMethod, PayExpenseInput } from "../../types/financial";
import { formatCurrency } from "../../utils/currency";
import {
  getPayExpenseDefaults,
  normalizePayExpensePayload,
  payExpenseFormSchema,
  type PayExpenseFormFields
} from "./financial-extra-form";

type ExpensePaymentModalProps = {
  apiError?: string | null;
  cashAccounts: CashAccount[];
  expense?: Expense | null;
  methods: FinancialOption<PaymentMethod>[];
  onClose: () => void;
  onSubmit: (payload: PayExpenseInput) => Promise<void>;
  open: boolean;
  saving: boolean;
};

export function ExpensePaymentModal({
  apiError,
  cashAccounts,
  expense,
  methods,
  onClose,
  onSubmit,
  open,
  saving
}: ExpensePaymentModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PayExpenseFormFields>({
    defaultValues: getPayExpenseDefaults(expense)
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getPayExpenseDefaults(expense));
    form.clearErrors();
    setFormError(null);
  }, [expense, form, open]);

  async function handleFormSubmit(values: PayExpenseFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = payExpenseFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as keyof PayExpenseFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizePayExpensePayload(result.data));
  }

  const errors = form.formState.errors;

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="pay-expense-form" type="submit">
            {saving ? "Registrando..." : "Registrar pagamento"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      title="Pagar parcela"
    >
      <form className="space-y-5" id="pay-expense-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3 text-sm text-text-secondary">
          <div className="font-medium text-text-primary">{expense?.description ?? "Parcela"}</div>
          <div className="mt-1">
            Valor: {formatCurrency(expense?.amount ?? "0")} · pago: {formatCurrency(expense?.paidAmount ?? "0")} · saldo:{" "}
            {formatCurrency(expense?.pendingAmount ?? "0")}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CurrencyInput autoFocus error={errors.paidAmount?.message} label="Valor pago" {...form.register("paidAmount")} />
          <Input error={errors.paidAt?.message} label="Data de pagamento" type="date" {...form.register("paidAt")} />
          <Select error={errors.paymentMethod?.message} label="Forma de pagamento" {...form.register("paymentMethod")}>
            <option value="">Não informada</option>
            {methods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
          <Select error={errors.cashAccountId?.message} label="Conta" {...form.register("cashAccountId")}>
            <option value="">Caixa principal</option>
            {cashAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>

        <Textarea error={errors.notes?.message} label="Observações" rows={3} {...form.register("notes")} />
      </form>
    </Modal>
  );
}
