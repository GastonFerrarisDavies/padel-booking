"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/react";
import { useRouter } from "next/navigation";
import { clerkAppearance, clerkLocalization, SIGN_IN_URL, SIGN_UP_URL } from "@/config/clerk";

/**
 * Clerk para el export estático. Usa `@clerk/react` (no `@clerk/nextjs`): el provider
 * de App Router importa Server Actions, incompatibles con `output: 'export'`.
 * La navegación interna de Clerk se delega al router de Next.
 */
export function ClerkProvider({ children }) {
  const router = useRouter();

  return (
    <BaseClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={SIGN_IN_URL}
      signUpUrl={SIGN_UP_URL}
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
      appearance={clerkAppearance}
      localization={clerkLocalization}
    >
      {children}
    </BaseClerkProvider>
  );
}
