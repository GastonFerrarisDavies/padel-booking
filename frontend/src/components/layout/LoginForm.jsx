"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useMutation } from "@/hooks/useMutation";
import { useAuth } from "@/providers/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";

/** Formulario de acceso para Owner/Admin. Al autenticarse, AuthProvider cambia de estado y se redirige. */
export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const signIn = useMutation(login);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await signIn.mutate({ email: form.email.trim(), password: form.password });
    } catch {
      /* el error queda en signIn.error */
    }
  }

  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-white">
        Acceso <span className="text-brand-500">clubes</span>
      </h1>
      <p className="mt-1 text-sm text-slate-400">Ingresá para gestionar canchas, horarios y usuarios.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <Field label="Email">
          <Input required type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="admin@tuclub.com" />
        </Field>
        <Field label="Contraseña">
          <Input required type="password" autoComplete="current-password" value={form.password} onChange={update("password")} placeholder="••••••••" />
        </Field>

        {signIn.error && <Alert>{signIn.error.message}</Alert>}

        <Button type="submit" size="lg" loading={signIn.isPending || status === "loading"} leadingIcon={<LogIn className="size-5" />}>
          Ingresar
        </Button>
      </form>
    </Card>
  );
}
