/**
 * Normalise YouTube watch, shorts, embed, or youtu.be URLs to a standard embed URL.
 */
export function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) {
      return buildYoutubeEmbedUrl(shortsMatch[1], parsed.search);
    }

    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      if (id) return buildYoutubeEmbedUrl(id, parsed.search);
    }

    const watchId = parsed.searchParams.get("v");
    if (watchId) return buildYoutubeEmbedUrl(watchId, parsed.search);

    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch?.[1]) return buildYoutubeEmbedUrl(embedMatch[1], parsed.search);
  } catch {
    return null;
  }
  return null;
}

function buildYoutubeEmbedUrl(videoId: string, search: string): string {
  const params = new URLSearchParams(search);
  params.delete("v");
  const qs = params.toString();
  return `https://www.youtube.com/embed/${videoId}${qs ? `?${qs}` : ""}`;
}

export function toPreviewEmbedUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  return youtubeEmbedUrl(trimmed) ?? (trimmed.startsWith("http") ? trimmed : null);
}
