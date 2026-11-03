const DEFAULT_RETURN_PATH = "/";

/**
 * Keeps authentication redirects inside this app. `from` is user-controlled
 * query-string data and must never become an open redirect.
 */
export function getSafeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_RETURN_PATH;
  }
  return value;
}

export function getLoginHref(returnPath: string): string {
  return `/login?from=${encodeURIComponent(getSafeReturnPath(returnPath))}`;
}
