"use client";

import { useEffect } from "react";

/** Imprime en consola la respuesta de /api/users/health-check. No renderiza nada. */
export function HealthCheckLogger() {
  useEffect(() => {
    fetch("/api/users/health-check")
      .then(async (res) => {
        const body = await res.text();
        let data = body;
        try {
          data = JSON.parse(body);
        } catch {}
        console.log("[health-check] /api/users/health-check", res.status, data);
      })
      .catch((err) => console.error("[health-check] /api/users/health-check", err));
  }, []);

  return null;
}
