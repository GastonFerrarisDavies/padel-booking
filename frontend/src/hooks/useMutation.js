"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Escritura de datos vía `@entity/*` (create/update/delete).
 * `mutate` devuelve el resultado y RELANZA el error (además de exponerlo en `error`),
 * para que el llamador decida si cierra un diálogo, refetchea, etc.
 */
export function useMutation(mutationFn) {
  const [state, setState] = useState({ isPending: false, error: null });

  const fnRef = useRef(mutationFn);
  useEffect(() => {
    fnRef.current = mutationFn;
  });

  const mutate = useCallback(async (...args) => {
    setState({ isPending: true, error: null });
    try {
      const result = await fnRef.current(...args);
      setState({ isPending: false, error: null });
      return result;
    } catch (error) {
      setState({ isPending: false, error });
      throw error;
    }
  }, []);

  const reset = useCallback(() => setState({ isPending: false, error: null }), []);

  return { mutate, reset, ...state };
}
