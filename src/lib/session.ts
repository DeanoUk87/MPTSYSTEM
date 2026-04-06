// Client-side helper to get session info from our custom JWT cookie
// The cookie is httpOnly so we can't read it client-side directly.
// Instead we expose a lightweight /api/me endpoint.

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  roles: string[];
  permissions: string[];
}
