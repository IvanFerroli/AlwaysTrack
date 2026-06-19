import type { ApiResult } from "@alwaystrack/shared";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
export const appName = import.meta.env.VITE_APP_NAME?.trim() || "AlwaysTrack";
export const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
export const appMode = import.meta.env.VITE_APP_MODE ?? "local";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...options?.headers
    },
    ...options
  });
  const payload = (await response.json()) as ApiResult<T>;
  if (!payload.ok) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}

export async function uploadWikiImage(file: File, pageId?: string) {
  const search = new URLSearchParams();
  if (pageId) search.set("pageId", pageId);
  const result = await api<{ attachment: { id: string; fileName: string; markdownUrl: string } }>(`/v1/wiki/attachments?${search.toString()}`, {
    method: "POST",
    headers: {
      "content-type": file.type,
      "x-file-name": file.name
    },
    body: await file.arrayBuffer()
  });
  return `![${result.attachment.fileName}](${apiBaseUrl}${result.attachment.markdownUrl})`;
}

export async function uploadOperationalImage(file: File, surface: string, entityId?: string) {
  const search = new URLSearchParams({ surface });
  if (entityId) search.set("entityId", entityId);
  const result = await api<{ attachment: { id: string; fileName: string; markdownUrl: string } }>(`/v1/attachments/operational?${search.toString()}`, {
    method: "POST",
    headers: {
      "content-type": file.type,
      "x-file-name": file.name
    },
    body: await file.arrayBuffer()
  });
  return `![${result.attachment.fileName}](${apiBaseUrl}${result.attachment.markdownUrl})`;
}
