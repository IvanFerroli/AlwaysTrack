export const userRoles = ["ADMIN", "RT", "SUPERVISOR"] as const;
export type UserRole = (typeof userRoles)[number];

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}
