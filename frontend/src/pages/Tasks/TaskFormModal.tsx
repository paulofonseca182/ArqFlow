import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { Project } from "../../types/project";
import type { Task, TaskOption, TaskPriority, TaskStatus, TaskWriteInput } from "../../types/task";
import { getTaskFormDefaults, normalizeTaskPayload, taskFormSchema, type TaskFormFields } from "./task-form";

type TaskFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  task?: Task | null;
  projects: Project[];
  statuses: TaskOption<TaskStatus>[];
  priorities: TaskOption<TaskPriority>[];
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: TaskWriteInput) => Promise<void>;
};

export function TaskFormModal({
  apiError,
  mode,
  onClose,
  onSubmit,
  open,
  priorities,
  projects,
  saving,
  statuses,
  task
}: TaskFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TaskFormFields>({
    defaultValues: getTaskFormDefaults(task)
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getTaskFormDefaults(task));
    form.clearErrors();
    setFormError(null);
  }, [form, open, task]);

  async function handleFormSubmit(values: TaskFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = taskFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof TaskFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeTaskPayload(result.data));
  }

  const errors = form.formState.errors;
  const title = mode === "create" ? "Nova tarefa" : "Editar tarefa";

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="task-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title={title}
    >
      <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" id="task-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input autoFocus error={errors.title?.message} label="Título" placeholder="Revisar layout" {...form.register("title")} />
          <Select error={errors.projectId?.message} label="Projeto" {...form.register("projectId")}>
            <option value="">Sem projeto vinculado</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Input error={errors.assignee?.message} label="Responsável" placeholder="Paulo" {...form.register("assignee")} />
          <Input error={errors.dueDate?.message} label="Prazo" type="date" {...form.register("dueDate")} />
          <Select error={errors.priority?.message} label="Prioridade" {...form.register("priority")}>
            {priorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
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
        </div>

        <Textarea error={errors.description?.message} label="Descrição" placeholder="Detalhe o que precisa ser feito" rows={3} {...form.register("description")} />
        <Textarea error={errors.notes?.message} label="Observações" placeholder="Notas internas da tarefa" rows={3} {...form.register("notes")} />
      </form>
    </Modal>
  );
}
