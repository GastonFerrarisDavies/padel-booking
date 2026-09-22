import { AuthGuard } from "@/components/layout/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ADMIN_ROLES } from "@/lib/constants";

export const metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

/**
 * Layout privado del panel (Server Component que compone los guards Client).
 * Solo Owner/Admin. Ver AuthGuard: protección de UX, la real está en el backend.
 */
export default function DashboardLayout({ children }) {
  return (
    <AuthGuard roles={ADMIN_ROLES}>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
