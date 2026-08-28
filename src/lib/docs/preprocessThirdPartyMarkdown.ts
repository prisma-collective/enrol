const MD_IMAGE_RE = /!\[([^\]]*)\]\([^)]*\)/g;
const OBSIDIAN_EMBED_RE = /!\[\[[^\]]+]]/g;
const HTML_IMG_RE = /<img\b[^>]*>/gi;
const BR_TAG_RE = /<\/?\s*br\s*\/?>/gi;
const JSX_LIKE_TAG_RE = /<\/?[A-Za-z_][\w.-]*(?:\s[^<>\n]*)?\s*\/?>/g;
const RELATIVE_MD_LINK_TARGET_RE = /\]\(\/(?!\/)([^)]+)\)/g;

export type PreprocessThirdPartyMarkdownOptions = {
  stripImages?: boolean;
  stripJsx?: boolean;
  docsLinkOrigin: string;
};

function collectImageMatchRanges(markdown: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  const patterns = [MD_IMAGE_RE, OBSIDIAN_EMBED_RE, HTML_IMG_RE];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(markdown)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const r of ranges) {
    if (!merged.length || r.start >= merged[merged.length - 1].end) {
      merged.push({ ...r });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
    }
  }
  return merged;
}

function replaceImagesWithNumberedPlaceholders(markdown: string): string {
  const ranges = collectImageMatchRanges(markdown);
  if (!ranges.length) return markdown;
  const parts: string[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    parts.push(markdown.slice(cursor, r.start));
    parts.push(`\n\nImage ${i + 1}\n\n`);
    cursor = r.end;
  });
  parts.push(markdown.slice(cursor));
  return parts.join("");
}

function stripJsxLikeMarkup(markdown: string): string {
  return markdown.replace(BR_TAG_RE, "").replace(JSX_LIKE_TAG_RE, "");
}

function normalizeBlankLines(markdown: string): string {
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

function rewriteRelativeMarkdownLinks(markdown: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return markdown.replace(RELATIVE_MD_LINK_TARGET_RE, (_full, path: string) => `](${base}/${path})`);
}

export function preprocessThirdPartyMarkdown(
  markdown: string,
  options: PreprocessThirdPartyMarkdownOptions
): string {
  const { stripImages = false, stripJsx = false, docsLinkOrigin } = options;
  let s = markdown;
  if (stripImages) s = replaceImagesWithNumberedPlaceholders(s);
  s = rewriteRelativeMarkdownLinks(s, docsLinkOrigin);
  if (stripJsx) s = stripJsxLikeMarkup(s);
  if (stripImages || stripJsx) s = normalizeBlankLines(s);
  return s;
}
