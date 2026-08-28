export type FetchDocsReadOptions = RequestInit & {
  withMedia?: boolean;
};

export type DocsReadResponse = {
  content: string;
  success: boolean;
  error?: string;
  media?: { src: string; alt?: string }[];
};

export async function fetchDocsRead(
  path: string,
  options?: FetchDocsReadOptions
): Promise<Response> {
  const { withMedia, ...init } = options ?? {};
  const params = new URLSearchParams();
  params.set("path", path);
  if (withMedia) params.set("withMedia", "true");

  return fetch(`/api/docs-read?${params.toString()}`, {
    ...init,
    method: init.method ?? "GET",
    headers: {
      Accept: "text/markdown, text/plain, application/json",
      "User-Agent": "Prisma-Enrol/1.0",
      ...(init.headers as HeadersInit | undefined),
    },
  });
}
