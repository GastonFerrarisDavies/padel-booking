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
/*  Almacenamiento del token (observable para useSyncExternalStore)           */
/* -------------------------------------------------------------------------- */

const TOKEN_KEY = "padel.token";
const tokenListeners = new Set();
let memoryToken = null; // fallback si localStorage no está disponible

function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

function notifyTokenChange() {
  tokenListeners.forEach((listener) => listener());
}

export const tokenStorage = {
  get() {
    return typeof window === "undefined" ? null : readToken();
  },
  set(token) {
    memoryToken = token;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* modo privado / storage bloqueado: queda en memoria */
    }
    notifyTokenChange();
  },
  clear() {
    memoryToken = null;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
    notifyTokenChange();
  },
  /** Compatible con `useSyncExternalStore`. */
  subscribe(listener) {
    tokenListeners.add(listener);
    const onStorage = (event) => event.key === TOKEN_KEY && listener();
    window.addEventListener("storage", onStorage);
    return () => {
      tokenListeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Interceptores                                                              */
/* -------------------------------------------------------------------------- */

/** @type {Array<(req: RequestContext) => RequestContext | void>} */
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

// Auth: agrega el Bearer token a cada request.
addRequestInterceptor((ctx) => {
  const token = tokenStorage.get();
  if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
});

// Sesión expirada: limpiar token => AuthProvider pasa a "unauthenticated".
addErrorInterceptor((error) => {
  if (error.isUnauthorized && tokenStorage.get()) tokenStorage.clear();
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
  requestInterceptors.forEach((intercept) => intercept(ctx));

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
