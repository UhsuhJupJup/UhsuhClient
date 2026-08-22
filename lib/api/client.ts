const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class SessionExpiredError extends ApiError {
  constructor(path: string) {
    super(401, `session expired: ${path}`);
    this.name = "SessionExpiredError";
  }
}

type TokenProvider = (forceRefresh?: boolean) => Promise<string | null>;
type SessionExpiredHandler = () => void;

let tokenProvider: TokenProvider | null = null;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function registerAuthHandlers(handlers: {
  getToken: TokenProvider;
  onSessionExpired: SessionExpiredHandler;
}): void {
  tokenProvider = handlers.getToken;
  sessionExpiredHandler = handlers.onSessionExpired;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { message?: unknown };
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    return null;
  }
  return null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message ?? `API request failed (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
}

async function apiSend<T>(path: string, method: "POST" | "PUT", body?: unknown): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message ?? `${method} ${path} (${response.status})`);
  }
  if (response.status === 204 || response.status === 202) {
    return null;
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

export function apiPost<T = null>(path: string, body?: unknown): Promise<T | null> {
  return apiSend<T>(path, "POST", body);
}

export function apiPut<T = null>(path: string, body?: unknown): Promise<T | null> {
  return apiSend<T>(path, "PUT", body);
}

function sendWithToken(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
}

function ensureOk(response: Response, path: string, init?: RequestInit): Response {
  if (!response.ok) {
    throw new ApiError(response.status, `${init?.method ?? "GET"} ${path} (${response.status})`);
  }
  return response;
}

export async function authedFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  let response = await sendWithToken(path, token, init);
  if (response.status !== 401) {
    return ensureOk(response, path, init);
  }

  const refreshed = tokenProvider ? await tokenProvider(true) : null;
  if (refreshed) {
    response = await sendWithToken(path, refreshed, init);
    if (response.status !== 401) {
      return ensureOk(response, path, init);
    }
  }

  sessionExpiredHandler?.();
  throw new SessionExpiredError(path);
}
