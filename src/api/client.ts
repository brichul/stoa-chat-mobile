import { API_V1 } from './config';

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Set/clear the bearer token used for all subsequent requests. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** Register a callback invoked when the API returns 401 (e.g. to log out). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body; serialized automatically. Omit for GET/DELETE. */
  json?: unknown;
  /** Raw body (e.g. FormData); takes precedence over `json`. */
  body?: BodyInit;
  /** Skip attaching the Authorization header. */
  anonymous?: boolean;
  /** Query params appended to the URL. */
  query?: Record<string, unknown>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = path.startsWith('http') ? path : `${API_V1}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Core JSON request helper against the Stoa `/v1` API. */
export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, body, anonymous, query, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };
  if (json !== undefined && !body) finalHeaders['Content-Type'] = 'application/json';
  if (!anonymous && authToken) finalHeaders['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body: body ?? (json !== undefined ? JSON.stringify(json) : undefined),
  });

  if (res.status === 401) onUnauthorized?.();

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const detail = (data && (data as any).detail) ?? text;
    throw new ApiError(res.status, typeof detail === 'string' ? detail : `Request failed (${res.status})`, detail);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
