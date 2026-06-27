import { env } from "@/env";

/** Thrown when the backend responds with a non-2xx status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

const API_BASE = `${env.NEXT_PUBLIC_API_URL}/api/v1`;

/**
 * Thin typed wrapper around `fetch` for talking to the Feedige backend.
 * JSON in, JSON (or text) out, with errors surfaced as {@link ApiError}.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Request to ${path} failed with status ${response.status}`,
      payload,
    );
  }

  return payload as T;
}
