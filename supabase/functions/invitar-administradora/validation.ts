export function validateInvitation(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("email" in body)) return null;
  const email = body.email;
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && normalized.length <= 254
    ? normalized
    : null;
}

export function canInvite(roles: Array<{ role: string }> | null): boolean {
  return roles?.some(({ role }) => role === "admin") ?? false;
}