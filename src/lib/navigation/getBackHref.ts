export function getBackHref(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";

  const isIdentityRoute =
    path === "/identity" || path.startsWith("/identity/");
  const isEventRoute = path === "/event" || path.startsWith("/event/");

  if (!isIdentityRoute && !isEventRoute) return null;
  if (path === "/event" || path === "/identity/guide") return "/";
  if (path === "/identity/lookup") return "/identity/guide";

  const segments = path.split("/").filter(Boolean);
  segments.pop();
  const parent = `/${segments.join("/")}`;
  if (parent === "/identity") return "/";
  return parent || "/";
}
