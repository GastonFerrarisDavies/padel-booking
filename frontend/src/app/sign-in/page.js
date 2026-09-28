import { AuthPage } from "@/components/layout/AuthPage";
import { ClerkAuthForm } from "@/components/layout/ClerkAuthForm";

export const metadata = { title: "Ingresar" };

export default function SignInPage() {
  return (
    <AuthPage>
      <ClerkAuthForm variant="sign-in" />
    </AuthPage>
  );
}
