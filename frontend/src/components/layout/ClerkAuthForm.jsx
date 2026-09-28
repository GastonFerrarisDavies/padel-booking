"use client";

import { SignIn, SignUp } from "@clerk/react";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/config/clerk";

/**
 * Formularios de Clerk. Hash routing: el export estático no tiene rutas catch-all
 * para los pasos intermedios (verificación, factor 2, etc.).
 * `variant`: "sign-in" | "sign-up".
 */
export function ClerkAuthForm({ variant }) {
  return variant === "sign-up" ? (
    <SignUp routing="hash" signInUrl={SIGN_IN_URL} fallbackRedirectUrl="/" />
  ) : (
    <SignIn routing="hash" signUpUrl={SIGN_UP_URL} fallbackRedirectUrl="/" />
  );
}
