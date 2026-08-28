import { DOCS_ORIGIN } from "@/lib/docs/constants";
import { preprocessThirdPartyMarkdown } from "@/lib/docs/preprocessThirdPartyMarkdown";

export type DocsMediaItem = { src: string; alt?: string };

const MEDIA_CAROUSEL_RE = /<MediaCarousel\b[\s\S]*?(?:\/>|<\/MediaCarousel>)/gi;
const MD_IMAGE_RE = /!\[([^\]]*)\]\(([^)]*)\)/g;
const OBSIDIAN_EMBED_RE = /!\[\[([^\]]+)]]/g;
const HTML_IMG_RE = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;

type MediaRange = {
  start: number;
  end: number;
  items: DocsMediaItem[];
};

function isImageAssetPath(pathOrUrl: string): boolean {
  const t = pathOrUrl.trim();
  if (!t) return false;
  try {
    const pathname = /^https?:\/\//i.test(t) ? new URL(t).pathname : t.split("?")[0];
    return IMAGE_EXT_RE.test(pathname);
  } catch {
    return IMAGE_EXT_RE.test(t);
  }
}

function resolveDocsAssetUrl(pathOrUrl: string, docsOrigin: string): string {
  const t = pathOrUrl.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  const base = docsOrigin.replace(/\/$/, "");
  return t.startsWith("/") ? `${base}${t}` : `${base}/${t}`;
}

function parseMediaCarouselImages(block: string): string[] {
  const m = block.match(/images=\{\[([\s\S]*?)\]\}/);
  if (!m) return [];
  const urls: string[] = [];
  const re = /['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(m[1])) !== null) {
    urls.push(match[1]);
  }
  return urls.filter(isImageAssetPath);
}

function overlaps(a: MediaRange, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

export function preprocessGuideSectionMarkdown(
  raw: string,
  docsLinkOrigin: string = DOCS_ORIGIN
): { markdown: string; media: DocsMediaItem[] } {
  const ranges: MediaRange[] = [];

  MEDIA_CAROUSEL_RE.lastIndex = 0;
  let carouselMatch: RegExpExecArray | null;
  while ((carouselMatch = MEDIA_CAROUSEL_RE.exec(raw)) !== null) {
    const paths = parseMediaCarouselImages(carouselMatch[0]);
    ranges.push({
      start: carouselMatch.index,
      end: carouselMatch.index + carouselMatch[0].length,
      items: paths.map((src) => ({
        src: resolveDocsAssetUrl(src, docsLinkOrigin),
      })),
    });
  }

  const pushImageRange = (start: number, end: number, src: string, alt?: string) => {
    if (!isImageAssetPath(src)) return;
    const candidate = { start, end };
    if (ranges.some((r) => overlaps(r, candidate))) return;
    const resolved = resolveDocsAssetUrl(src, docsLinkOrigin);
    if (!resolved) return;
    ranges.push({
      start,
      end,
      items: [{ src: resolved, alt }],
    });
  };

  MD_IMAGE_RE.lastIndex = 0;
  let mdMatch: RegExpExecArray | null;
  while ((mdMatch = MD_IMAGE_RE.exec(raw)) !== null) {
    pushImageRange(
      mdMatch.index,
      mdMatch.index + mdMatch[0].length,
      mdMatch[2],
      mdMatch[1] || undefined
    );
  }

  OBSIDIAN_EMBED_RE.lastIndex = 0;
  let obsidianMatch: RegExpExecArray | null;
  while ((obsidianMatch = OBSIDIAN_EMBED_RE.exec(raw)) !== null) {
    pushImageRange(
      obsidianMatch.index,
      obsidianMatch.index + obsidianMatch[0].length,
      obsidianMatch[1]
    );
  }

  HTML_IMG_RE.lastIndex = 0;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = HTML_IMG_RE.exec(raw)) !== null) {
    pushImageRange(htmlMatch.index, htmlMatch.index + htmlMatch[0].length, htmlMatch[1]);
  }

  ranges.sort((a, b) => a.start - b.start);

  const media: DocsMediaItem[] = [];
  const parts: string[] = [];
  let cursor = 0;
  let imageIndex = 0;

  for (const range of ranges) {
    parts.push(raw.slice(cursor, range.start));
    if (range.items.length === 0) {
      cursor = range.end;
      continue;
    }
    for (const item of range.items) {
      imageIndex += 1;
      media.push(item);
      parts.push(`\n\nImage ${imageIndex}\n\n`);
    }
    cursor = range.end;
  }
  parts.push(raw.slice(cursor));

  const markdown = preprocessThirdPartyMarkdown(parts.join(""), {
    stripImages: false,
    stripJsx: true,
    docsLinkOrigin,
  });

  return { markdown, media };
}
