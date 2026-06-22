/**
 * Base URL for the Stoa backend (FastAPI, see ../stoa-backend).
 * Override at build/run time with EXPO_PUBLIC_API_URL.
 * The API mounts its versioned routes under `/v1`.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export const API_V1 = `${API_BASE_URL}/v1`;

/** Derive the ws(s):// origin from the http(s):// base URL. */
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

/** Default tenant slug used at login when none is provided by the UI. */
export const DEFAULT_TENANT_SLUG = process.env.EXPO_PUBLIC_TENANT_SLUG ?? '';
