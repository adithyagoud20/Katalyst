export function passwordInputType(visible: boolean): "text" | "password" {
  return visible ? "text" : "password";
}

export function safeLoginDestination(value: string | null, origin: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return "/";
  try {
    const base = new URL(origin);
    const destination = new URL(value, base);
    if (destination.origin !== base.origin) return "/";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/";
  }
}
