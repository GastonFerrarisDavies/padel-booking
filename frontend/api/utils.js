/**
 * Cliente HTTP base. ÚNICO lugar del proyecto que llama a `fetch`.
 * Los servicios de dominio (`/entity/*`) se apoyan en `http`; la UI nunca lo importa.
 */

// `||` (no `??`): un ARG de Docker vacío llega como "" y debe caer al default.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 15_000;

/* -------------------------------------------------------------------------- */
/*  Errores                                                                    */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  /**
   * @param {string} message Mensaje legible para el usuario.
   * @param {{ status?: number, code?: string, details?: unknown }} [meta]
   */
  constructor(message, { status = 0, code = "UNKNOWN", details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNetwork() {
    return this.code === "NETWORK";
  }
}

/* -------------------------------------------------------------------------- */
/*  Sesión (Clerk)                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Token de sesión de Clerk (JWT de ~60 s; Clerk lo renueva y cachea).
 * No espera a que Clerk cargue: las rutas protegidas solo se piden con la sesión
 * ya resuelta (AuthProvider / AuthGuard), y así las lecturas públicas no se demoran.
 */
async function getSessionToken() {
  const clerk = typeof window === "undefined" ? undefined : window.Clerk;
  if (!clerk?.loaded || !clerk.session) return null;
  try {
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Interceptores                                                              */
/* -------------------------------------------------------------------------- */

/** @type {Array<(req: RequestContext) => void | Promise<void>>} */
const requestInterceptors = [];
/** @type {Array<(error: ApiError) => void>} */
const errorInterceptors = [];

/** Registra un interceptor de request. Devuelve la función para removerlo. */
export function addRequestInterceptor(fn) {
  requestInterceptors.push(fn);
  return () => requestInterceptors.splice(requestInterceptors.indexOf(fn), 1);
}

/** Registra un interceptor de error. Devuelve la función para removerlo. */
export function addErrorInterceptor(fn) {
  errorInterceptors.push(fn);
  return () => errorInterceptors.splice(errorInterceptors.indexOf(fn), 1);
}

// Auth: agrega el token de sesión de Clerk a cada request.
addRequestInterceptor(async (ctx) => {
  const token = await getSessionToken();
  if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
});

/* -------------------------------------------------------------------------- */
/*  Request                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} RequestContext
 * @property {string} url
 * @property {string} path
 * @property {string} method
 * @property {Headers} headers
 * @property {unknown} body
 * @property {Record<string, unknown>} [params]
 */

function buildQuery(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function withTimeout(signal, timeoutMs) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * @param {string} method
 * @param {string} path Ruta relativa a la base, ej. `/courts`.
 * @param {{ params?: Record<string, unknown>, body?: unknown, signal?: AbortSignal, timeout?: number }} [options]
 */
async function request(method, path, { params, body, signal, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const ctx = {
    method,
    path,
    params,
    body,
    url: `${API_URL}${path}${buildQuery(params)}`,
    headers: new Headers({ Accept: "application/json" }),
  };
  if (body !== undefined) ctx.headers.set("Content-Type", "application/json");
  for (const intercept of requestInterceptors) await intercept(ctx);

  let payload;
  let status;
  try {
    const response = await fetch(ctx.url, {
      method,
      headers: ctx.headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: withTimeout(signal, timeout),
    });
    status = response.status;
    payload = await parseBody(response);
  } catch (cause) {
    if (cause?.name === "AbortError" && signal?.aborted) throw cause; // cancelación del caller
    const error =
      cause?.name === "TimeoutError"
        ? new ApiError("El servidor tardó demasiado en responder.", { code: "TIMEOUT" })
        : new ApiError("No pudimos conectar con el servidor.", { code: "NETWORK" });
    errorInterceptors.forEach((intercept) => intercept(error));
    throw error;
  }

  if (status >= 400) {
    const error = new ApiError(
      payload?.message ?? payload?.error ?? `Error inesperado (${status}).`,
      { status, code: payload?.code ?? "HTTP_ERROR", details: payload?.details ?? payload },
    );
    errorInterceptors.forEach((intercept) => intercept(error));
    throw error;
  }

  return payload;
}

export const http = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  delete: (path, options) => request("DELETE", path, options),
};
