const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function normalizeMatcherUrl(raw: string, isProduction: boolean): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (isProduction && url.protocol !== "https:" && !LOCAL_HOSTS.has(url.hostname)) return null;

  return url.origin + url.pathname.replace(/\/+$/, "");
}
