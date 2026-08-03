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

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new ApiError(response.status, `API request failed (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
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
