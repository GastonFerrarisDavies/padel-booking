"use client";

import { useState } from "react";
import { createCourt, updateCourt } from "@entity/court";
import { useMutation } from "@/hooks/useMutation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { COURT_STATUS, SURFACES } from "@/lib/constants";

const EMPTY = { name: "", surface: "CRISTAL", indoor: false, pricePerHour: "", status: "ACTIVE" };

/** Alta / edición de cancha. `court` = null → alta. `onSaved` refresca el listado. */
export function CourtFormDialog({ open, court, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={court ? "Editar cancha" : "Nueva cancha"}
      description="Estos datos son los que ven los jugadores al reservar."
    >
      <CourtForm court={court} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function CourtForm({ court, onClose, onSaved }) {
  const [form, setForm] = useState(court ? { ...EMPTY, ...court } : EMPTY);
  const save = useMutation((data) => (court ? updateCourt(court.id, data) : createCourt(data)));

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await save.mutate({
        name: form.name.trim(),
        surface: form.surface,
        indoor: form.indoor,
        status: form.status,
        pricePerHour: Number(form.pricePerHour),
      });
      onSaved();
      onClose();
    } catch {
      /* el error queda en save.error y se muestra abajo */
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Nombre">
        <Input required value={form.name} onChange={update("name")} placeholder="Ej. Cancha 7 · Panorámica" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Superficie">
          <Select value={form.surface} onChange={update("surface")}>
            {Object.entries(SURFACES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Precio por hora">
          <Input required type="number" min="0" step="500" value={form.pricePerHour} onChange={update("pricePerHour")} placeholder="15000" />
        </Field>
      </div>
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <Field label="Estado">
          <Select value={form.status} onChange={update("status")}>
            {Object.entries(COURT_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox label="Cancha techada" checked={form.indoor} onChange={update("indoor")} className="h-11" />
      </div>

      {save.error && <Alert>{save.error.message}</Alert>}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {court ? "Guardar cambios" : "Crear cancha"}
        </Button>
      </div>
    </form>
  );
}
