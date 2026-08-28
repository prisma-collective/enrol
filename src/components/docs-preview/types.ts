import type { ReactNode } from "react";
import type { DocsReadResponse } from "@/lib/docs/fetchDocsRead";

type PreviewPaneBase = {
  title: string;
  label?: string;
  place?: string;
  year?: string;
  summary?: string;
};

export type DocsPreviewPaneSource = PreviewPaneBase & {
  kind?: "docs";
  docsPath: string;
  embedUrl?: string | null;
};

export type EmbedPreviewPaneSource = PreviewPaneBase & {
  kind: "embed";
  embedUrl: string;
  externalUrl?: string;
};

export type PreviewPaneSource = DocsPreviewPaneSource | EmbedPreviewPaneSource;

export function isEmbedPreviewSource(
  source: PreviewPaneSource
): source is EmbedPreviewPaneSource {
  return source.kind === "embed";
}

export type DocsPreviewShellContext = {
  source: PreviewPaneSource;
  docs: DocsReadResponse | null;
  loading: boolean;
  error: string | null;
  displayMarkdown: string;
  rawMarkdown: string;
  youtubeEmbed: string | null;
};

export type DocsPreviewShellChildren = (ctx: DocsPreviewShellContext) => ReactNode;
