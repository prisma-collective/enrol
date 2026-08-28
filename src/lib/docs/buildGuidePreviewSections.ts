import { DOCS_ORIGIN } from "@/lib/docs/constants";
import { extractYoutubeEmbedFromMarkdown } from "@/lib/docs/extractYoutubeEmbed";
import {
  preprocessGuideSectionMarkdown,
  type DocsMediaItem,
} from "@/lib/docs/preprocessGuideSectionMarkdown";
import { splitMarkdownSections } from "@/lib/docs/splitMarkdownSections";

export type GuidePreviewSection = {
  markdown: string;
  media: DocsMediaItem[];
};

export function buildGuidePreviewSections(rawMarkdown: string): {
  youtubeEmbed: string | null;
  sections: GuidePreviewSection[];
} {
  const { embedUrl: youtubeEmbed, markdown } = extractYoutubeEmbedFromMarkdown(rawMarkdown);
  const sections = splitMarkdownSections(markdown).map((section) =>
    preprocessGuideSectionMarkdown(section, DOCS_ORIGIN)
  );

  return { youtubeEmbed, sections };
}
