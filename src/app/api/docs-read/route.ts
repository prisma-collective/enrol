import { NextResponse } from "next/server";

function getDocsApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_DOCS_API_ORIGIN?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "https://docs.prisma.events";
}

function getDocsApiToken(): string | null {
  const t = process.env.DOCS_API_TOKEN?.trim();
  return t || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const withMedia = searchParams.get("withMedia") === "true";

  try {
    if (!path) {
      return NextResponse.json(
        {
          content: "",
          success: false,
          error: "Path parameter is required. Use ?path=events/index or any path after /api/serve",
        },
        { status: 400 }
      );
    }

    const docsOrigin = getDocsApiOrigin();
    const serveQs = new URLSearchParams();
    if (withMedia) serveQs.set("format", "json");
    let docsUrl = `${docsOrigin}/api/serve/${path}`;
    const q = serveQs.toString();
    if (q) {
      docsUrl += docsUrl.includes("?") ? "&" : "?";
      docsUrl += q;
    }

    const headers: HeadersInit = {
      Accept: "text/markdown, text/plain, application/json",
      "User-Agent": "Prisma-Enrol/1.0",
    };
    const token = getDocsApiToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(docsUrl, {
      method: "GET",
      headers,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    let content: string;
    let media: { src: string; alt?: string }[] = [];

    if (contentType?.includes("application/json")) {
      const data = (await response.json()) as Record<string, unknown>;
      content =
        (typeof data.content === "string" && data.content) ||
        (typeof data.markdown === "string" && data.markdown) ||
        (typeof data.text === "string" && data.text) ||
        "";

      const raw = data.media;
      if (Array.isArray(raw)) {
        media = raw.flatMap((item): { src: string; alt?: string }[] => {
          if (!item || typeof item !== "object") return [];
          const o = item as Record<string, unknown>;
          const src =
            (typeof o.src === "string" && o.src) ||
            (typeof o.url === "string" && o.url) ||
            "";
          if (!src) return [];
          const alt = typeof o.alt === "string" ? o.alt : undefined;
          return [{ src, alt }];
        });
      }
    } else {
      content = await response.text();
    }

    return NextResponse.json({ content, success: true, media });
  } catch (error) {
    console.error("Error fetching docs content:", error);

    return NextResponse.json({
      content: "",
      success: false,
      media: [] as { src: string; alt?: string }[],
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
