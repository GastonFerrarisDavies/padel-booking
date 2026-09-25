"use client";

import { useEffect } from "react";
import { getUsersHealth } from "@api/entity/user";

/** Imprime en consola la respuesta de /api/users/health-check. No renderiza nada. */
export function HealthCheckLogger() {
  useEffect(() => {
    const controller = new AbortController();
    getUsersHealth({ signal: controller.signal })
      .then((data) => console.log("[health-check] /api/users/health-check", data))
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("[health-check] /api/users/health-check", err);
      });
    return () => controller.abort();
  }, []);

  return null;
}
