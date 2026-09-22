"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";
import { Alert } from "./Alert";

/**
 * Confirmación de acciones destructivas. `onConfirm` puede ser async;
 * el llamador maneja `loading` y `error` (normalmente vienen de `useMutation`).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  loading = false,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-400">{description}</p>
      {error && <Alert className="mt-4">{error.message}</Alert>}
    </Modal>
  );
}
