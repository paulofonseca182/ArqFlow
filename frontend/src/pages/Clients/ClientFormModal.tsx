import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import type { Client, ClientStatusOption, ClientWriteInput } from "../../types/client";
import { clientFormSchema, getClientFormDefaults, normalizeClientPayload } from "./client-form";
import type { ClientFormFields } from "./client-form";

type ClientFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  client?: Client | null;
  statuses: ClientStatusOption[];
  saving: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSubmit: (payload: ClientWriteInput) => Promise<void>;
};

export function ClientFormModal({
  apiError,
  client,
  mode,
  onClose,
  onSubmit,
  open,
  saving,
  statuses
}: ClientFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ClientFormFields>({
    defaultValues: getClientFormDefaults(client)
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getClientFormDefaults(client));
    form.clearErrors();
    setFormError(null);
  }, [client, form, open]);

  async function handleFormSubmit(values: ClientFormFields) {
    setFormError(null);
    form.clearErrors();

    const result = clientFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ClientFormFields | undefined;

        if (field) {
          form.setError(field, { message: issue.message });
        } else {
          setFormError(issue.message);
        }
      }

      return;
    }

    await onSubmit(normalizeClientPayload(result.data));
  }

  const errors = form.formState.errors;
  const title = mode === "create" ? "Novo cliente" : "Editar cliente";

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} form="client-form" type="submit">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="lg"
      title={title}
    >
      <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" id="client-form" noValidate onSubmit={form.handleSubmit(handleFormSubmit)}>
        {formError || apiError ? (
          <div className="flex gap-2 rounded-ui border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError ?? apiError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            autoFocus
            error={errors.name?.message}
            label="Nome"
            placeholder="Nome do cliente"
            {...form.register("name")}
          />
          <Select error={errors.status?.message} label="Status" {...form.register("status")}>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Input error={errors.phone?.message} label="Telefone" placeholder="(00) 0000-0000" {...form.register("phone")} />
          <Input error={errors.whatsapp?.message} label="WhatsApp" placeholder="(00) 00000-0000" {...form.register("whatsapp")} />
          <Input error={errors.email?.message} label="Email" placeholder="cliente@email.com" type="email" {...form.register("email")} />
          <Input error={errors.cpfCnpj?.message} label="CPF/CNPJ" placeholder="Somente se houver" {...form.register("cpfCnpj")} />
          <Input error={errors.city?.message} label="Cidade" placeholder="Cidade" {...form.register("city")} />
          <Input error={errors.state?.message} label="UF" maxLength={2} placeholder="UF" {...form.register("state")} />
          <Input error={errors.source?.message} label="Origem" placeholder="Indicacao, site, Instagram" {...form.register("source")} />
          <Input error={errors.address?.message} label="Endereco" placeholder="Endereco principal" {...form.register("address")} />
        </div>

        <Textarea error={errors.notes?.message} label="Observacoes" placeholder="Notas internas sobre o cliente" rows={4} {...form.register("notes")} />
      </form>
    </Modal>
  );
}
