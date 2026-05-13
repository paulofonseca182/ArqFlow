import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type DeleteModalProps = {
  open: boolean;
  itemName: string;
  impact?: string;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteModal({ confirming = false, impact, itemName, onClose, onConfirm, open }: DeleteModalProps) {
  return (
    <Modal
      footer={
        <>
          <Button disabled={confirming} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button className="bg-status-danger hover:bg-status-danger/80" disabled={confirming} onClick={onConfirm} type="button">
            {confirming ? "Excluindo..." : "Excluir"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      title="Confirmar exclusão"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
        <div className="space-y-2">
          <p>
            Confirme a exclusão permanente de <span className="font-medium text-text-primary">{itemName}</span>.
          </p>
          {impact ? <p className="text-text-muted">{impact}</p> : null}
        </div>
      </div>
    </Modal>
  );
}
