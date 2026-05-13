import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { FinancialOption, GenerateInstallmentsInput, PaymentMethod } from "../../types/financial";
import type { Project } from "../../types/project";
import {
  generateInstallmentsFormSchema,
  getGenerateInstallmentsDefaults,
  normalizeGenerateInstallmentsPayload,
  type GenerateInstallmentsFormFields
} from "./payment-form";

type GenerateInstallmentsModalProps = {
  open: boolean;
  projects: Project[];
  methods: FinancialOption<PaymentMethod>[];
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: GenerateInstallmentsInput) => Promise<void>;
};

export function GenerateInstallmentsModal({
  apiError,
  methods,
  onClose,
  onSubmit,
  open,
  projects,
  saving
}: GenerateInstallmentsModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<GenerateInstallmentsFormFields>({
    defaultValues: getGenerateInstallmentsDefaults()
  });
  const selectedProjectId = form.watch("projectId");
  const selectedInstallments = form.watch("installments");
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getGenerateInstallmentsDefaults());
    form.clearErrors();
    setFormError(null);
  }, [form, open]);

  async function handleFormSubmit(values: GenerateInstallmentsFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = generateInstallmentsFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as keyof GenerateInstallmentsFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeGenerateInstallmentsPayload(result.data));
  }

  const errors = form.formState.errors;
  const contractAmount = selectedProject?.contractedAmount ? Number(selectedProject.contractedAmount) : 0;
  const previewAmount = contractAmount > 0 ? contractAmount / Number(selectedInstallments) : 0;

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="generate-installments-form" type="submit">
            {saving ? "Gerando..." : "Gerar parcelas"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title="Gerar parcelas"
    >
      <form
        className="space-y-5"
        id="generate-installments-form"
        noValidate
        onSubmit={form.handleSubmit(handleFormSubmit)}
      >
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Select error={errors.projectId?.message} label="Projeto" {...form.register("projectId")}>
            <option value="">Selecione</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select error={errors.installments?.message} label="Parcelamento" {...form.register("installments")}>
            <option value="1">À vista</option>
            <option value="2">2x</option>
            <option value="3">3x</option>
          </Select>
          <Input error={errors.firstDueDate?.message} label="Primeiro vencimento" type="date" {...form.register("firstDueDate")} />
          <Select error={errors.paymentMethod?.message} label="Forma de pagamento" {...form.register("paymentMethod")}>
            <option value="">Não informada</option>
            {methods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
          <Input
            className="md:col-span-2"
            error={errors.description?.message}
            label="Descrição base"
            placeholder="Honorários do projeto"
            {...form.register("description")}
          />
        </div>

        <div className="rounded-ui border border-surface-600 bg-surface-900/70 px-4 py-3 text-sm text-text-secondary">
          <div className="font-medium text-text-primary">{selectedProject?.name ?? "Selecione um projeto"}</div>
          <div className="mt-1">
            Contratado: {formatMoney(selectedProject?.contractedAmount ?? "0")} · previsão média: {formatMoney(previewAmount.toString())}
          </div>
        </div>

        <Textarea error={errors.notes?.message} label="Observações" rows={3} {...form.register("notes")} />
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
