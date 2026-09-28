import { AuthPage } from "@/components/layout/AuthPage";
import { ClerkAuthForm } from "@/components/layout/ClerkAuthForm";

export const metadata = { title: "Crear cuenta" };

export default function SignUpPage() {
  return (
    <AuthPage>
      <ClerkAuthForm variant="sign-up" />
    </AuthPage>
  );
}
