import { youtubeEmbedUrl } from "./youtubeEmbedUrl";

const YOUTUBE_IFRAME_RE =
  /<iframe\b[^>]*\bsrc=["']([^"']*(?:youtube\.com|youtu\.be)[^"']*)["'][^>]*>\s*<\/iframe>/gi;

const YOUTUBE_URL_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^&\s]+&)*v=|embed\/|shorts\/)|youtu\.be\/)[^\s"'<>)\]]+/gi;

export type YoutubeEmbedExtraction = {
  embedUrl: string | null;
  markdown: string;
};

export function extractYoutubeEmbedFromMarkdown(raw: string): YoutubeEmbedExtraction {
  let embedUrl: string | null = null;
  const removals: { start: number; end: number }[] = [];

  YOUTUBE_IFRAME_RE.lastIndex = 0;
  let iframeMatch: RegExpExecArray | null;
  while ((iframeMatch = YOUTUBE_IFRAME_RE.exec(raw)) !== null) {
    const normalized = youtubeEmbedUrl(iframeMatch[1]);
    if (!normalized) continue;
    embedUrl ??= normalized;
    removals.push({ start: iframeMatch.index, end: iframeMatch.index + iframeMatch[0].length });
  }

  YOUTUBE_URL_RE.lastIndex = 0;
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = YOUTUBE_URL_RE.exec(raw)) !== null) {
    const normalized = youtubeEmbedUrl(urlMatch[0]);
    if (!normalized) continue;
    embedUrl ??= normalized;
    const candidate = { start: urlMatch.index, end: urlMatch.index + urlMatch[0].length };
    if (!removals.some((r) => r.start <= candidate.start && candidate.end <= r.end)) {
      removals.push(candidate);
    }
  }

  if (!removals.length) {
    return { embedUrl, markdown: raw };
  }

  removals.sort((a, b) => a.start - b.start);
  const parts: string[] = [];
  let cursor = 0;
  for (const range of removals) {
    parts.push(raw.slice(cursor, range.start));
    cursor = range.end;
  }
  parts.push(raw.slice(cursor));

  const markdown = parts.join("").replace(/\n{3,}/g, "\n\n").trim();
  return { embedUrl, markdown };
}
