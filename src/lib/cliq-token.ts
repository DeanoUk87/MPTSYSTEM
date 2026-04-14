let cachedToken: string | null = null;
let tokenExpiry = 0;

export function cliqConfigured(): boolean {
  return !!(
    process.env.ZOHO_CLIQ_CLIENT_ID &&
    process.env.ZOHO_CLIQ_CLIENT_SECRET &&
    process.env.ZOHO_CLIQ_REFRESH_TOKEN
  );
}

export function cliqBaseUrl(): string {
  const domain = process.env.ZOHO_CLIQ_DOMAIN || "zoho.com";
  return `https://cliq.${domain}/api/v2`;
}

export async function getCliqToken(): Promise<string | null> {
  if (!cliqConfigured()) return null;
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;

  const domain = process.env.ZOHO_CLIQ_DOMAIN || "zoho.com";
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_CLIQ_REFRESH_TOKEN!,
    grant_type: "refresh_token",
    client_id: process.env.ZOHO_CLIQ_CLIENT_ID!,
    client_secret: process.env.ZOHO_CLIQ_CLIENT_SECRET!,
  });

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://accounts.${domain}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.access_token) return null;
    cachedToken = d.access_token as string;
    tokenExpiry = Date.now() + ((d.expires_in ?? 3600) * 1000);
    return cachedToken;
  } catch {
    return null;
  }
}
