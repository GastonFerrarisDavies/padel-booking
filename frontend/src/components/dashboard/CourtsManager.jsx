"use client";

import { useState } from "react";
import { LandPlot, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCourt, getCourts, setCourtStatus } from "@entity/court";
import { useMutation } from "@/hooks/useMutation";
import { useQuery } from "@/hooks/useQuery";
import { CourtCard } from "@/components/court/CourtCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { COURT_STATUS } from "@/lib/constants";
import { CourtFormDialog } from "./CourtFormDialog";

/** Vista "Canchas": listado + alta/edición/baja. Reutiliza <CourtCard /> de la home. */
export function CourtsManager() {
  const courts = useQuery(["courts"], ({ signal }) => getCourts({}, { signal }));
  const [editing, setEditing] = useState(undefined); // undefined = cerrado · null = alta · court = edición
  const [deleting, setDeleting] = useState(null);

  const changeStatus = useMutation(setCourtStatus);
  const remove = useMutation(deleteCourt);

  async function handleStatusChange(court, status) {
    try {
      await changeStatus.mutate(court.id, status);
      courts.refetch();
    } catch {
      /* se muestra en changeStatus.error */
    }
  }

  async function handleDelete() {
    try {
      await remove.mutate(deleting.id);
      setDeleting(null);
      courts.refetch();
    } catch {
      /* se muestra en el diálogo */
    }
  }

  return (
    <>
      <PageHeader
        title="Canchas"
        description="Gestioná las canchas de tu complejo, sus precios y su disponibilidad."
        actions={
          <Button leadingIcon={<Plus className="size-4" />} onClick={() => setEditing(null)}>
            Nueva cancha
          </Button>
        }
      />

      {changeStatus.error && <Alert className="mb-6">{changeStatus.error.message}</Alert>}

      <QueryBoundary
        query={courts}
        skeleton={<CourtsSkeleton />}
        empty={
          <EmptyState
            icon={LandPlot}
            title="Todavía no cargaste canchas"
            description="Creá la primera para empezar a recibir reservas."
            action={<Button onClick={() => setEditing(null)}>Nueva cancha</Button>}
          />
        }
      >
        {(data) => (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((court) => (
              <li key={court.id}>
                <CourtCard
                  court={court}
                  showStatus
                  footer={
                    <>
                      <div className="min-w-0 flex-1">
                        <Select
                          aria-label={`Estado de ${court.name}`}
                          value={court.status}
                          onChange={(event) => handleStatusChange(court, event.target.value)}
                          className="h-9 text-xs"
                        >
                          {Object.entries(COURT_STATUS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <Button variant="secondary" size="icon" aria-label={`Editar ${court.name}`} onClick={() => setEditing(court)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="danger" size="icon" aria-label={`Eliminar ${court.name}`} onClick={() => setDeleting(court)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>

      <CourtFormDialog
        // `editing === undefined` es "cerrado"; la key fuerza estado limpio por cancha
        key={editing?.id ?? "new"}
        open={editing !== undefined}
        court={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSaved={courts.refetch}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar cancha"
        description={`Vas a eliminar "${deleting?.name}". Las reservas futuras de esta cancha quedarán sin asignar.`}
        confirmLabel="Eliminar"
        loading={remove.isPending}
        error={remove.error}
        onConfirm={handleDelete}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
      />
    </>
  );
}

function CourtsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-80 rounded-2xl" />
      ))}
    </div>
  );
}
