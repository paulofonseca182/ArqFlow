import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { Budget, BudgetApproveInput } from "../../types/budget";
import type { ProjectOption, ProjectStatus, ProjectType } from "../../types/project";
import { approveBudgetFormSchema, getApproveBudgetFormDefaults, normalizeApproveBudgetPayload } from "./approve-budget-form";
import type { ApproveBudgetFormFields } from "./approve-budget-form";

type ApproveBudgetModalProps = {
  open: boolean;
  budget?: Budget | null;
  statuses: ProjectOption<ProjectStatus>[];
  types: ProjectOption<ProjectType>[];
  approving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: BudgetApproveInput) => Promise<void>;
};

export function ApproveBudgetModal({
  apiError,
  approving,
  budget,
  onClose,
  onSubmit,
  open,
  statuses,
  types
}: ApproveBudgetModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ApproveBudgetFormFields>({
    defaultValues: getApproveBudgetFormDefaults(budget)
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getApproveBudgetFormDefaults(budget));
    form.clearErrors();
    setFormError(null);
  }, [budget, form, open]);

  async function handleFormSubmit(values: ApproveBudgetFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = approveBudgetFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ApproveBudgetFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeApproveBudgetPayload(result.data));
  }

  const errors = form.formState.errors;

  return (
    <Modal
      footer={
        <>
          <Button disabled={approving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={approving} form="approve-budget-form" type="submit">
            {approving ? "Convertendo..." : "Aprovar e converter"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title="Aprovar orçamento"
    >
      <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" id="approve-budget-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        {budget ? (
          <div className="rounded-ui border border-surface-600 bg-surface-900/60 px-3 py-2 text-sm text-text-secondary">
            <span className="text-text-primary">{budget.title}</span> será aprovado e vinculado ao novo projeto com valor contratado de{" "}
            <span className="text-text-primary">{formatMoney(budget.finalAmount)}</span>.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input autoFocus error={errors.name?.message} label="Nome do projeto" placeholder="Projeto de interiores" {...form.register("name")} />
          <Select error={errors.type?.message} label="Tipo" {...form.register("type")}>
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Select error={errors.status?.message} label="Status inicial" {...form.register("status")}>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Input error={errors.area?.message} label="Área" placeholder="80" {...form.register("area")} />
          <Input error={errors.startsAt?.message} label="Início" type="date" {...form.register("startsAt")} />
          <Input error={errors.expectedDeliveryDate?.message} label="Entrega prevista" type="date" {...form.register("expectedDeliveryDate")} />
          <Input className="md:col-span-2" error={errors.workAddress?.message} label="Endereço da obra" placeholder="Endereço principal da obra" {...form.register("workAddress")} />
        </div>

        <Textarea error={errors.description?.message} label="Descrição" placeholder="Escopo resumido do projeto" rows={3} {...form.register("description")} />
        <Textarea error={errors.notes?.message} label="Observações" placeholder="Notas internas do projeto" rows={3} {...form.register("notes")} />
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
