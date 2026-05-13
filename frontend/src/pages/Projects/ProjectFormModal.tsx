import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { Client } from "../../types/client";
import type { Project, ProjectOption, ProjectStatus, ProjectType, ProjectWriteInput } from "../../types/project";
import { getProjectFormDefaults, normalizeProjectPayload, projectFormSchema } from "./project-form";
import type { ProjectFormFields } from "./project-form";

type ProjectFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  project?: Project | null;
  clients: Client[];
  statuses: ProjectOption<ProjectStatus>[];
  types: ProjectOption<ProjectType>[];
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: ProjectWriteInput) => Promise<void>;
};

export function ProjectFormModal({
  apiError,
  clients,
  mode,
  onClose,
  onSubmit,
  open,
  project,
  saving,
  statuses,
  types
}: ProjectFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ProjectFormFields>({
    defaultValues: getProjectFormDefaults(project)
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getProjectFormDefaults(project));
    form.clearErrors();
    setFormError(null);
  }, [form, open, project]);

  async function handleFormSubmit(values: ProjectFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = projectFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProjectFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeProjectPayload(result.data));
  }

  const errors = form.formState.errors;
  const title = mode === "create" ? "Novo projeto" : "Editar projeto";

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="project-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title={title}
    >
      <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" id="project-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input autoFocus error={errors.name?.message} label="Nome do projeto" placeholder="Apartamento Vila Mariana" {...form.register("name")} />
          <Select error={errors.clientId?.message} label="Cliente" {...form.register("clientId")}>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Select error={errors.type?.message} label="Tipo" {...form.register("type")}>
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Select error={errors.status?.message} label="Status" {...form.register("status")}>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Input error={errors.startsAt?.message} label="Início" type="date" {...form.register("startsAt")} />
          <Input error={errors.expectedDeliveryDate?.message} label="Entrega prevista" type="date" {...form.register("expectedDeliveryDate")} />
          <Input error={errors.contractedAmount?.message} label="Valor contratado" placeholder="42000,00" {...form.register("contractedAmount")} />
          <Input error={errors.area?.message} label="Área" placeholder="80" {...form.register("area")} />
          <Input className="md:col-span-2" error={errors.workAddress?.message} label="Endereço da obra" placeholder="Endereço principal da obra" {...form.register("workAddress")} />
        </div>

        <Textarea error={errors.description?.message} label="Descrição" placeholder="Escopo resumido do projeto" rows={3} {...form.register("description")} />
        <Textarea error={errors.notes?.message} label="Observações" placeholder="Notas visíveis para acompanhamento" rows={3} {...form.register("notes")} />
      </form>
    </Modal>
  );
}
