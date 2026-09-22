"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lectura de datos desde `@entity/*`.
 *
 * - `key`: array serializable; cuando cambia se vuelve a pedir (y se cancela la anterior).
 * - `fetcher`: recibe `{ signal }` y devuelve una Promise (una función de `@entity/*`).
 * - Mientras carga una key nueva, `data` conserva el valor anterior (evita parpadeos).
 *
 * `isLoading` es true solo cuando todavía no hay datos para la key actual.
 */
export function useQuery(key, fetcher, { enabled = true } = {}) {
  const cacheKey = JSON.stringify(key);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState({ id: null, data: undefined, error: null });

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const requestId = `${cacheKey}#${nonce}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetcherRef
      .current({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ id: requestId, data, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setResult((prev) => ({ id: requestId, data: prev.data, error }));
      });
    return () => controller.abort();
  }, [requestId, enabled]);

  const settled = result.id === requestId;
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: result.data,
    error: settled ? result.error : null,
    isLoading: enabled && !settled && result.data === undefined,
    isFetching: enabled && !settled,
    refetch,
  };
}
