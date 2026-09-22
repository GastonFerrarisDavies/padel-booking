import { CalendarDays, LayoutDashboard, LandPlot, Users } from "lucide-react";
import { ADMIN_ROLES, ROLES } from "@/lib/constants";

export const publicNav = [
  { label: "Canchas", href: "/#canchas" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Para clubes", href: "/#clubes" },
];

/** `roles`: quién puede ver el ítem. */
export const dashboardNav = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard, roles: ADMIN_ROLES },
  { label: "Canchas", href: "/dashboard/courts", icon: LandPlot, roles: ADMIN_ROLES },
  { label: "Horarios", href: "/dashboard/schedule", icon: CalendarDays, roles: ADMIN_ROLES },
  { label: "Usuarios", href: "/dashboard/users", icon: Users, roles: [ROLES.OWNER, ROLES.ADMIN] },
];
