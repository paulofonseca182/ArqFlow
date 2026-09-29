import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CurrencyInput } from "../../components/ui/CurrencyInput";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type {
  CashAccount,
  CashMovementType,
  FinancialCategory,
  FinancialOption,
  ManualCashMovementInput,
  PaymentMethod
} from "../../types/financial";
import {
  getManualCashMovementDefaults,
  manualCashMovementFormSchema,
  normalizeManualCashMovementPayload,
  type ManualCashMovementFormFields
} from "./financial-extra-form";

type ManualCashMovementModalProps = {
  apiError?: string | null;
  cashAccounts: CashAccount[];
  categories: FinancialCategory[];
  methods: FinancialOption<PaymentMethod>[];
  onClose: () => void;
  onSubmit: (payload: ManualCashMovementInput) => Promise<void>;
  open: boolean;
  saving: boolean;
};

const movementTypes: Array<{ value: CashMovementType; label: string }> = [
  { value: "INCOME", label: "Entrada" },
  { value: "EXPENSE", label: "Saída" }
];

export function ManualCashMovementModal({
  apiError,
  cashAccounts,
  categories,
  methods,
  onClose,
  onSubmit,
  open,
  saving
}: ManualCashMovementModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ManualCashMovementFormFields>({
    defaultValues: getManualCashMovementDefaults()
  });
  const selectedType = form.watch("type");

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getManualCashMovementDefaults());
    form.clearErrors();
    setFormError(null);
  }, [form, open]);

  async function handleFormSubmit(values: ManualCashMovementFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = manualCashMovementFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as keyof ManualCashMovementFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeManualCashMovementPayload(result.data));
  }

  const errors = form.formState.errors;

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="manual-cash-movement-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title="Movimentação manual"
    >
      <form className="space-y-5" id="manual-cash-movement-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Select error={errors.type?.message} label="Tipo" {...form.register("type")}>
            <option value="">Selecione</option>
            {movementTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Input error={errors.date?.message} label="Data" type="date" {...form.register("date")} />
          <Input error={errors.description?.message} label="Descrição" placeholder="Ajuste de caixa" {...form.register("description")} />
          <CurrencyInput error={errors.amount?.message} label="Valor" {...form.register("amount")} />
          <Select error={errors.categoryId?.message} label="Categoria" {...form.register("categoryId")}>
            <option value="">Categoria padrão</option>
            {categories
              .filter((category) => !selectedType || category.type === (selectedType === "INCOME" ? "REVENUE" : "EXPENSE"))
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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
          <Select error={errors.paymentMethod?.message} label="Forma" {...form.register("paymentMethod")}>
            <option value="">Não informada</option>
            {methods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
        </div>

        <Textarea error={errors.notes?.message} label="Observações" rows={3} {...form.register("notes")} />
      </form>
    </Modal>
  );
}
