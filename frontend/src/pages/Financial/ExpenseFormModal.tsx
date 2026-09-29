import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CurrencyInput } from "../../components/ui/CurrencyInput";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type {
  CashAccount,
  Expense,
  ExpenseWriteInput,
  FinancialCategory,
  FinancialOption,
  PaymentMethod
} from "../../types/financial";
import type { Project } from "../../types/project";
import {
  expenseFormSchema,
  buildExpenseInstallmentDefaults,
  getExpenseFormDefaults,
  normalizeExpensePayload,
  type ExpenseFormFields
} from "./financial-extra-form";

type ExpenseFormModalProps = {
  apiError?: string | null;
  cashAccounts: CashAccount[];
  categories: FinancialCategory[];
  expense?: Expense | null;
  methods: FinancialOption<PaymentMethod>[];
  onClose: () => void;
  onSubmit: (payload: ExpenseWriteInput) => Promise<void>;
  open: boolean;
  projects: Project[];
  saving: boolean;
};

export function ExpenseFormModal({
  apiError,
  cashAccounts,
  categories,
  expense,
  methods,
  onClose,
  onSubmit,
  open,
  projects,
  saving
}: ExpenseFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ExpenseFormFields>({
    defaultValues: getExpenseFormDefaults(expense)
  });
  const installments = useFieldArray({
    control: form.control,
    keyName: "fieldId",
    name: "installments"
  });
  const paymentMode = form.watch("paymentMode");

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getExpenseFormDefaults(expense));
    form.clearErrors();
    setFormError(null);
  }, [expense, form, open]);

  async function handleFormSubmit(values: ExpenseFormFields) {
    setFormError(null);
    form.clearErrors();

    const formValues = {
      ...values,
      installments:
        values.paymentMode === "INSTALLMENT_PURCHASE" && (!values.installments || values.installments.length === 0)
          ? installments.fields.map(({ fieldId: _fieldId, ...field }) => field)
          : values.installments
    };
    const result = expenseFormSchema.safeParse(formValues);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as keyof ExpenseFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(
      normalizeExpensePayload(result.data, {
        includeInstallments: !expense && result.data.paymentMode === "INSTALLMENT_PURCHASE"
      })
    );
  }

  const errors = form.formState.errors;
  const canEditInstallments = !expense && paymentMode === "INSTALLMENT_PURCHASE";

  function handleGenerateInstallments() {
    const generatedInstallments = buildExpenseInstallmentDefaults({
      amount: form.getValues("amount"),
      count: Number(form.getValues("installmentCount") || 2),
      firstDueDate: form.getValues("firstDueDate"),
      paymentMethod: form.getValues("paymentMethod"),
      title: form.getValues("description")
    });

    installments.replace(generatedInstallments);
    form.setValue("installments", generatedInstallments, {
      shouldDirty: true,
      shouldValidate: true
    });
    form.clearErrors("installments");
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="expense-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title={expense ? "Editar despesa" : "Nova despesa"}
    >
      <form className="space-y-5" id="expense-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Select disabled={Boolean(expense)} error={errors.paymentMode?.message} label="Tipo de lançamento" {...form.register("paymentMode")}>
            <option value="SINGLE">Pagamento único</option>
            <option value="INSTALLMENT_PURCHASE">Compra parcelada</option>
          </Select>
          <Select error={errors.classification?.message} label="Classificação" {...form.register("classification")}>
            <option value="OPERATIONAL_EXPENSE">Despesa operacional</option>
            <option value="ASSET_PURCHASE">Aquisição de bem / investimento</option>
            <option value="PROJECT_COST">Custo de projeto</option>
            <option value="OTHER">Outra classificação</option>
          </Select>
          <Input error={errors.description?.message} label="Descrição" placeholder="Software, fornecedor, aluguel..." {...form.register("description")} />
          <CurrencyInput error={errors.amount?.message} label="Valor" {...form.register("amount")} />
          {paymentMode === "SINGLE" ? (
            <Input error={errors.dueDate?.message} label="Vencimento" type="date" {...form.register("dueDate")} />
          ) : (
            <Input error={errors.purchaseDate?.message} label="Data da compra" type="date" {...form.register("purchaseDate")} />
          )}
          <Select error={errors.projectId?.message} label="Projeto" {...form.register("projectId")}>
            <option value="">Sem projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select error={errors.categoryId?.message} label="Categoria" {...form.register("categoryId")}>
            <option value="">Outros</option>
            {categories
              .filter((category) => category.type === "EXPENSE")
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
          <Input error={errors.supplier?.message} label="Fornecedor" placeholder="Opcional" {...form.register("supplier")} />
          <Input error={errors.costCenter?.message} label="Centro de custo" placeholder="Administrativo, Projeto..." {...form.register("costCenter")} />
          <Select error={errors.paymentMethod?.message} label="Forma de pagamento" {...form.register("paymentMethod")}>
            <option value="">Não informada</option>
            {methods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
          {paymentMode === "SINGLE" ? (
            <label className="flex items-end gap-3 rounded-ui border border-surface-500 bg-surface-950/40 px-3 py-2 text-sm text-text-secondary">
              <input className="h-4 w-4 accent-accent-bronze" type="checkbox" {...form.register("recurring")} />
              Despesa recorrente
            </label>
          ) : null}
        </div>

        {paymentMode === "INSTALLMENT_PURCHASE" ? (
          <section className="space-y-3 rounded-ui border border-surface-500 bg-surface-950/30 p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Input
                disabled={Boolean(expense)}
                error={errors.installmentCount?.message}
                label="Quantidade de parcelas"
                max={12}
                min={2}
                type="number"
                {...form.register("installmentCount", { valueAsNumber: true })}
              />
              <Input disabled={Boolean(expense)} error={errors.firstDueDate?.message} label="Primeiro vencimento" type="date" {...form.register("firstDueDate")} />
              <Button disabled={saving || Boolean(expense)} onClick={handleGenerateInstallments} type="button" variant="secondary">
                Gerar parcelas
              </Button>
            </div>

            {typeof errors.installments?.message === "string" ? (
              <p className="text-xs text-status-danger">{errors.installments.message}</p>
            ) : null}

            <div className="space-y-2">
              {installments.fields.length === 0 ? (
                <div className="rounded-ui border border-dashed border-surface-500 px-3 py-4 text-sm text-text-muted">
                  Gere as parcelas para revisar valores e vencimentos antes de salvar.
                </div>
              ) : (
                installments.fields.map((field, index) => (
                  <div className="grid gap-3 rounded-ui border border-surface-500 bg-surface-900 p-3 lg:grid-cols-[1.5fr_1fr_1fr]" key={field.fieldId}>
                    <Input
                      disabled={!canEditInstallments}
                      label={`Parcela ${index + 1}`}
                      {...form.register(`installments.${index}.description`)}
                    />
                    <CurrencyInput
                      disabled={!canEditInstallments}
                      label="Valor"
                      {...form.register(`installments.${index}.amount`)}
                    />
                    <Input
                      disabled={!canEditInstallments}
                      label="Vencimento"
                      type="date"
                      {...form.register(`installments.${index}.dueDate`)}
                    />
                  </div>
                ))
              )}
            </div>

            {expense ? (
              <p className="text-xs text-text-muted">
                Para reorganizar parcelas de uma compra já cadastrada, use a ação específica em Contas a pagar.
              </p>
            ) : null}
          </section>
        ) : null}

        <Textarea error={errors.notes?.message} label="Observações" rows={3} {...form.register("notes")} />
      </form>
    </Modal>
  );
}
