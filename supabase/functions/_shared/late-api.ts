/**
 * Late API helper functions for social media management.
 * Used by agent-conversation and verify-social-connection edge functions.
 */

function getConfig() {
  const apiKey = Deno.env.get("LATE_API_KEY");
  const apiBase = Deno.env.get("LATE_API_BASE") || "https://api.getlate.dev";
  const redirectUrl = Deno.env.get("LATE_REDIRECT_URL") || "";
  if (!apiKey) throw new Error("LATE_API_KEY not configured");
  return { apiKey, apiBase, redirectUrl };
}

function headers(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function createProfile(
  name: string,
  description?: string
): Promise<{ profileId: string }> {
  const { apiKey, apiBase } = getConfig();
  const res = await fetch(`${apiBase}/api/v1/profiles`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ name, description: description || `Social posting for ${name}` }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Late createProfile failed [${res.status}]: ${errText}`);
  }
  return await res.json();
}

export async function getConnectUrl(
  platform: string,
  profileId: string,
  redirectUrl: string
): Promise<{ authUrl: string }> {
  const { apiKey, apiBase } = getConfig();
  const params = new URLSearchParams({ profileId, redirect_url: redirectUrl });
  const res = await fetch(`${apiBase}/api/v1/connect/${platform}?${params}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Late getConnectUrl failed [${res.status}]: ${errText}`);
  }
  return await res.json();
}

export interface LateAccount {
  accountId: string;
  platform: string;
  displayName: string;
  isActive: boolean;
}

export async function getAccounts(
  profileId: string
): Promise<{ accounts: LateAccount[] }> {
  const { apiKey, apiBase } = getConfig();
  const res = await fetch(`${apiBase}/api/v1/accounts?profileId=${profileId}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Late getAccounts failed [${res.status}]: ${errText}`);
  }
  return await res.json();
}

export async function createPost(
  content: string,
  platforms: { platform: string; accountId: string }[],
  options?: { publishNow?: boolean; scheduledTime?: string }
): Promise<any> {
  const { apiKey, apiBase } = getConfig();
  const body: any = { content, platforms };
  if (options?.scheduledTime) {
    body.scheduledTime = options.scheduledTime;
  } else {
    body.publishNow = options?.publishNow ?? true;
  }
  const res = await fetch(`${apiBase}/api/v1/posts`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Late createPost failed [${res.status}]: ${errText}`);
  }
  return await res.json();
}

export function getRedirectUrl(): string {
  return getConfig().redirectUrl;
}
