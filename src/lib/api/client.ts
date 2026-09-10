import { config } from "@/lib/config";

/** Shape NestJS uses for HttpException responses. */
interface NestErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Error carrying enough context for the UI to explain what went wrong, without
 * ever surfacing a stack trace.
 */
export class ApiError extends Error {
  readonly statusCode: number | null;
  /** Individual validation messages, when the backend returned a list. */
  readonly details: string[];

  constructor(message: string, statusCode: number | null, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }
}

function isNestErrorBody(value: unknown): value is NestErrorBody {
  return typeof value === "object" && value !== null;
}

function toApiError(status: number, body: unknown): ApiError {
  if (isNestErrorBody(body)) {
    const { message, error } = body;

    if (Array.isArray(message) && message.length > 0) {
      return new ApiError(message[0], status, message);
    }

    if (typeof message === "string" && message.length > 0) {
      return new ApiError(message, status, [message]);
    }

    if (typeof error === "string" && error.length > 0) {
      return new ApiError(error, status);
    }
  }

  return new ApiError(`Request failed with status ${status}.`, status);
}

interface RequestOptions {
  method?: "GET" | "POST";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Single entry point for every call to the microservice, so no component talks
 * to `fetch` directly and error handling stays in one place.
 */
export async function apiRequest<T>({
  method = "GET",
  path,
  body,
  headers,
  signal,
}: RequestOptions): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method,
      signal,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // A rejected fetch means the request never got an answer: the API is down,
    // the origin is wrong, or CORS refused it.
    throw new ApiError(
      `Could not reach the API at ${config.apiUrl}. Check that the backend is running.`,
      null,
      cause instanceof Error ? [cause.message] : [],
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  let parsed: unknown = null;

  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    throw toApiError(response.status, parsed);
  }

  return parsed as T;
}
