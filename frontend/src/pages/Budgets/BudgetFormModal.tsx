import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { ActionIconButton } from "../../components/ui/ActionIconButton";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { Budget, BudgetOption, BudgetStatus, BudgetWriteInput } from "../../types/budget";
import type { Client } from "../../types/client";
import { budgetFormSchema, getBudgetFormDefaults, getEmptyBudgetItem, normalizeBudgetPayload } from "./budget-form";
import type { BudgetFormFields } from "./budget-form";

type BudgetFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  budget?: Budget | null;
  clients: Client[];
  statuses: BudgetOption<BudgetStatus>[];
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: BudgetWriteInput) => Promise<void>;
};

const formIconClassName = "h-4 w-4 shrink-0";
const formIconStrokeWidth = 1.75;

export function BudgetFormModal({
  apiError,
  budget,
  clients,
  mode,
  onClose,
  onSubmit,
  open,
  saving,
  statuses
}: BudgetFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<BudgetFormFields>({
    defaultValues: getBudgetFormDefaults(budget)
  });
  const itemFields = useFieldArray({
    control: form.control,
    name: "items"
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getBudgetFormDefaults(budget));
    form.clearErrors();
    setFormError(null);
  }, [budget, form, open]);

  async function handleFormSubmit(values: BudgetFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = budgetFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") as keyof BudgetFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeBudgetPayload(result.data));
  }

  const errors = form.formState.errors;
  const title = mode === "create" ? "Novo orçamento" : "Editar orçamento";

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="budget-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title={title}
    >
      <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" id="budget-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input autoFocus error={errors.title?.message} label="Título" placeholder="Proposta de interiores" {...form.register("title")} />
          <Select error={errors.clientId?.message} label="Cliente" {...form.register("clientId")}>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Input error={errors.serviceType?.message} label="Tipo de serviço" placeholder="Interiores" {...form.register("serviceType")} />
          <Select error={errors.status?.message} label="Status" {...form.register("status")}>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Input error={errors.discount?.message} label="Desconto" placeholder="0,00" {...form.register("discount")} />
          <Input error={errors.expiresAt?.message} label="Validade" type="date" {...form.register("expiresAt")} />
          <Input className="md:col-span-2" error={errors.paymentMethod?.message} label="Forma de pagamento" placeholder="Pix, transferência ou parcelado" {...form.register("paymentMethod")} />
        </div>

        <Textarea error={errors.description?.message} label="Descrição" placeholder="Escopo resumido da proposta" rows={3} {...form.register("description")} />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-medium text-text-primary">Itens do orçamento</h4>
            <Button onClick={() => itemFields.append(getEmptyBudgetItem())} type="button" variant="secondary">
              <Plus className={formIconClassName} strokeWidth={formIconStrokeWidth} />
              Adicionar item
            </Button>
          </div>

          <div className="space-y-3">
            {itemFields.fields.map((field, index) => (
              <div className="grid gap-3 rounded-ui border border-surface-600 bg-surface-900/60 p-3 md:grid-cols-[1fr_120px_150px_auto]" key={field.id}>
                <Input
                  error={errors.items?.[index]?.description?.message}
                  label="Descrição"
                  placeholder="Etapa ou serviço"
                  {...form.register(`items.${index}.description` as const)}
                />
                <Input
                  error={errors.items?.[index]?.quantity?.message}
                  label="Quantidade"
                  placeholder="1"
                  {...form.register(`items.${index}.quantity` as const)}
                />
                <Input
                  error={errors.items?.[index]?.unitAmount?.message}
                  label="Valor unitário"
                  placeholder="2500,00"
                  {...form.register(`items.${index}.unitAmount` as const)}
                />
                <div className="flex items-end">
                  <ActionIconButton
                    ariaLabel={`Remover item ${index + 1}`}
                    disabled={itemFields.fields.length <= 1}
                    label="Remover item"
                    onClick={() => itemFields.remove(index)}
                  >
                    <Trash2 className={formIconClassName} strokeWidth={formIconStrokeWidth} />
                  </ActionIconButton>
                </div>
              </div>
            ))}
          </div>

          {typeof errors.items?.message === "string" ? <p className="text-xs text-status-danger">{errors.items.message}</p> : null}
        </div>
      </form>
    </Modal>
  );
}
