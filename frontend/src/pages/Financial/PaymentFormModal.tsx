import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CurrencyInput } from "../../components/ui/CurrencyInput";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { FinancialOption, Payment, PaymentMethod, PaymentUpdateInput, PaymentWriteInput } from "../../types/financial";
import type { Project } from "../../types/project";
import {
  getPaymentFormDefaults,
  normalizePaymentPayload,
  normalizePaymentUpdatePayload,
  paymentFormSchema,
  type PaymentFormFields
} from "./payment-form";

type PaymentFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  payment?: Payment | null;
  projects: Project[];
  methods: FinancialOption<PaymentMethod>[];
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: PaymentWriteInput | PaymentUpdateInput) => Promise<void>;
};

export function PaymentFormModal({
  apiError,
  methods,
  mode,
  onClose,
  onSubmit,
  open,
  payment,
  projects,
  saving
}: PaymentFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PaymentFormFields>({
    defaultValues: getPaymentFormDefaults(payment)
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getPaymentFormDefaults(payment));
    form.clearErrors();
    setFormError(null);
  }, [form, open, payment]);

  async function handleFormSubmit(values: PaymentFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = paymentFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as keyof PaymentFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(mode === "create" ? normalizePaymentPayload(result.data) : normalizePaymentUpdatePayload(result.data));
  }

  const errors = form.formState.errors;
  const title = mode === "create" ? "Nova parcela" : "Editar parcela";

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="payment-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title={title}
    >
      <form className="space-y-5" id="payment-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Select disabled={mode === "edit"} error={errors.projectId?.message} label="Projeto" {...form.register("projectId")}>
            <option value="">Selecione</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Input error={errors.description?.message} label="Descrição" placeholder="Parcela 1/2" {...form.register("description")} />
          <CurrencyInput error={errors.amount?.message} label="Valor" {...form.register("amount")} />
          <Input error={errors.installment?.message} label="Número da parcela" placeholder="1" {...form.register("installment")} />
          <Input error={errors.dueDate?.message} label="Vencimento" type="date" {...form.register("dueDate")} />
          <Select error={errors.paymentMethod?.message} label="Forma de pagamento" {...form.register("paymentMethod")}>
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
