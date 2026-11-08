import type { ApiResponse } from "@/types/api";

// Client-side fetch wrapper.

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!json) {
    throw new ApiError("Invalid response from server", res.status);
  }
  if (!json.success) {
    throw new ApiError(json.error, res.status);
  }

  return json.data;
}

export async function apiDownload(path: string): Promise<{ blob: Blob; fileName: string }> {
  const res = await fetch(path);

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new ApiError(json && !json.success ? json.error : "Download failed", res.status);
  }

  const match = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
  return { blob: await res.blob(), fileName: match?.[1] ?? "export.csv" };
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  upload: <T>(path: string, body: FormData) => apiFetch<T>(path, { method: "POST", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  download: apiDownload,
};
