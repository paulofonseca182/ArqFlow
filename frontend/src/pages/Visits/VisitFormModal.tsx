import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { Client } from "../../types/client";
import type { Project } from "../../types/project";
import type { Visit, VisitOption, VisitStatus, VisitType, VisitWriteInput } from "../../types/visit";
import { getVisitFormDefaults, normalizeVisitPayload, visitFormSchema, type VisitFormFields } from "./visit-form";

type VisitFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  visit?: Visit | null;
  clients: Client[];
  projects: Project[];
  statuses: VisitOption<VisitStatus>[];
  types: VisitOption<VisitType>[];
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: VisitWriteInput) => Promise<void>;
};

export function VisitFormModal({
  apiError,
  clients,
  mode,
  onClose,
  onSubmit,
  open,
  projects,
  saving,
  statuses,
  types,
  visit
}: VisitFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<VisitFormFields>({
    defaultValues: getVisitFormDefaults(visit)
  });
  const selectedClientId = form.watch("clientId");
  const selectedProjectId = form.watch("projectId");
  const availableProjects = useMemo(() => {
    if (!selectedClientId) {
      return projects;
    }

    return projects.filter((project) => project.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getVisitFormDefaults(visit));
    form.clearErrors();
    setFormError(null);
  }, [form, open, visit]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    const projectStillAvailable = availableProjects.some((project) => project.id === selectedProjectId);

    if (!projectStillAvailable) {
      form.setValue("projectId", "");
    }
  }, [availableProjects, form, selectedProjectId]);

  async function handleFormSubmit(values: VisitFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = visitFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof VisitFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeVisitPayload(result.data));
  }

  const errors = form.formState.errors;
  const title = mode === "create" ? "Nova visita técnica" : "Editar visita técnica";

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="visit-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title={title}
    >
      <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" id="visit-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Select autoFocus error={errors.clientId?.message} label="Cliente" {...form.register("clientId")}>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Select error={errors.projectId?.message} label="Projeto" {...form.register("projectId")}>
            <option value="">Sem projeto vinculado</option>
            {availableProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
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
          <Input error={errors.date?.message} label="Data" type="date" {...form.register("date")} />
          <Input error={errors.time?.message} label="Horário" type="time" {...form.register("time")} />
          <Input error={errors.amount?.message} inputMode="decimal" label="Valor" placeholder="250,00" {...form.register("amount")} />
          <Input error={errors.address?.message} label="Endereço" placeholder="Rua, número, bairro" {...form.register("address")} />
        </div>

        <Textarea error={errors.notes?.message} label="Observações" placeholder="Notas da visita técnica" rows={3} {...form.register("notes")} />
      </form>
    </Modal>
  );
}
