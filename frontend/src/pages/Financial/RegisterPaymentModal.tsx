import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import type { Payment, RegisterPaymentInput } from "../../types/financial";
import {
  getRegisterPaymentDefaults,
  normalizeRegisterPaymentPayload,
  registerPaymentFormSchema,
  type RegisterPaymentFormFields
} from "./payment-form";

type RegisterPaymentModalProps = {
  open: boolean;
  payment?: Payment | null;
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: RegisterPaymentInput) => Promise<void>;
};

export function RegisterPaymentModal({ apiError, onClose, onSubmit, open, payment, saving }: RegisterPaymentModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterPaymentFormFields>({
    defaultValues: getRegisterPaymentDefaults(payment)
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getRegisterPaymentDefaults(payment));
    form.clearErrors();
    setFormError(null);
  }, [form, open, payment]);

  async function handleFormSubmit(values: RegisterPaymentFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = registerPaymentFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as keyof RegisterPaymentFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeRegisterPaymentPayload(result.data));
  }

  const errors = form.formState.errors;

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="register-payment-form" type="submit">
            {saving ? "Registrando..." : "Registrar pagamento"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      title="Registrar pagamento"
    >
      <form className="space-y-5" id="register-payment-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3 text-sm text-text-secondary">
          <div className="font-medium text-text-primary">{payment?.description ?? "Parcela"}</div>
          <div className="mt-1">
            Valor: {formatMoney(payment?.amount ?? "0")} · já pago: {formatMoney(payment?.paidAmount ?? "0")}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input autoFocus error={errors.paidAmount?.message} label="Valor pago" placeholder="2500,00" {...form.register("paidAmount")} />
          <Input error={errors.paidAt?.message} label="Data de pagamento" type="date" {...form.register("paidAt")} />
        </div>
      </form>
    </Modal>
  );
}

function formatMoney(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value));
}
