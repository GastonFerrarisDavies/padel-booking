"use client";

import { useDeferredValue, useState } from "react";
import { Search, UserRoundX } from "lucide-react";
import { getUsers, setUserActive, updateUserRole } from "@api/entity/user";
import { useMutation } from "@/hooks/useMutation";
import { useQuery } from "@/hooks/useQuery";
import { useAuth } from "@/providers/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { formatShortDate, initials } from "@/lib/format";

/** Vista "Usuarios": búsqueda, filtro por rol, cambio de rol (solo Owner) y activar/desactivar. */
export function UsersManager() {
  const { user: me } = useAuth();
  const canEditRoles = me.role === ROLES.OWNER;

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const term = useDeferredValue(search.trim());

  const users = useQuery(["users", term, role], ({ signal }) => getUsers({ search: term, role }, { signal }));
  const changeRole = useMutation(updateUserRole);
  const toggleActive = useMutation(setUserActive);
  const actionError = changeRole.error ?? toggleActive.error;

  async function run(mutation, ...args) {
    try {
      await mutation.mutate(...args);
      users.refetch();
    } catch {
      /* se muestra en actionError */
    }
  }

  const columns = [
    {
      key: "name",
      header: "Usuario",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-brand-300">
            {initials(u.name)}
          </span>
          <div>
            <p className="font-medium text-white">{u.name}</p>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cell: (u) =>
        canEditRoles && u.id !== me.id ? (
          <div className="w-32">
            <Select
              aria-label={`Rol de ${u.name}`}
              value={u.role}
              onChange={(event) => run(changeRole, u.id, event.target.value)}
              className="h-9 text-xs"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <Badge tone={u.role === ROLES.PLAYER ? "neutral" : "brand"}>{ROLE_LABELS[u.role]}</Badge>
        ),
    },
    {
      key: "active",
      header: "Estado",
      cell: (u) => <Badge tone={u.active ? "success" : "danger"}>{u.active ? "Activo" : "Inactivo"}</Badge>,
    },
    { key: "createdAt", header: "Alta", cell: (u) => <span className="capitalize">{formatShortDate(u.createdAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (u) =>
        u.id !== me.id &&
        u.role !== ROLES.OWNER && (
          <Button variant="ghost" size="sm" onClick={() => run(toggleActive, u.id, !u.active)}>
            {u.active ? "Desactivar" : "Activar"}
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        description={canEditRoles ? "Administrá jugadores, admins y sus permisos." : "Listado de jugadores y admins del club."}
        actions={
          <>
            <div className="w-64 max-sm:w-full">
              <Input
                type="search"
                aria-label="Buscar usuarios"
                placeholder="Buscar por nombre o email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                leadingIcon={<Search />}
              />
            </div>
            <div className="w-40">
              <Select aria-label="Filtrar por rol" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="">Todos los roles</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </>
        }
      />

      {actionError && <Alert className="mb-6">{actionError.message}</Alert>}

      <Card>
        <QueryBoundary
          query={users}
          skeleton={<Skeleton className="m-5 h-64" />}
          empty={<EmptyState icon={UserRoundX} title="No encontramos usuarios" description="Probá con otra búsqueda o rol." className="m-5" />}
        >
          {(data) => <DataTable columns={columns} rows={data} />}
        </QueryBoundary>
      </Card>
    </>
  );
}
