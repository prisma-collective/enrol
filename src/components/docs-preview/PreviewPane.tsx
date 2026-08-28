"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MdChevronLeft } from "react-icons/md";
import DocsMarkdown from "@/components/DocsMarkdown";
import { identityGuideDocsUrl } from "@/lib/docs/constants";
import { buildGuidePreviewSections } from "@/lib/docs/buildGuidePreviewSections";
import {
  hasPreviewStageContent,
  resolvePreviewStageContent,
} from "@/lib/docs/resolvePreviewStageContent";
import DocsPreviewShell from "./DocsPreviewShell";
import PreviewStageMedia from "./PreviewStageMedia";
import {
  isEmbedPreviewSource,
  type DocsPreviewShellContext,
  type PreviewPaneSource,
} from "./types";

interface PreviewPaneProps {
  source: PreviewPaneSource | null;
  onClose: () => void;
}

const YOUTUBE_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

const READ_MORE_CLASS =
  "ml-auto inline-flex items-center justify-center rounded-md border border-rule px-4 py-2 text-sm text-mute transition-colors duration-300 hover:border-white hover:text-signal";

function embedExternalUrl(source: Extract<PreviewPaneSource, { kind: "embed" }>): string {
  return source.externalUrl ?? source.embedUrl.replace("/embed/", "/r/");
}

function GuidePreviewStage({
  rawMarkdown,
  position,
  loading,
  error,
}: {
  rawMarkdown: string;
  position: number;
  loading: boolean;
  error: string | null;
}) {
  const { youtubeEmbed, sections } = useMemo(
    () => buildGuidePreviewSections(rawMarkdown),
    [rawMarkdown]
  );
  const section = sections[position - 1];
  const stageContent = resolvePreviewStageContent({
    youtubeEmbed: position === 1 ? youtubeEmbed : null,
    media: section?.media,
  });

  if (loading || error || !hasPreviewStageContent(stageContent)) return null;

  return (
    <div
      className="absolute z-[1] hidden md:block md:inset-y-0 md:left-0 md:w-[70%] md:px-8 md:py-10"
      onClick={(e) => e.stopPropagation()}
    >
      <PreviewStageMedia {...stageContent} />
    </div>
  );
}

function GuidePreviewBody({
  rawMarkdown,
  position,
}: {
  rawMarkdown: string;
  position: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(
    () => buildGuidePreviewSections(rawMarkdown).sections,
    [rawMarkdown]
  );
  const markdown = sections[position - 1]?.markdown ?? "";

  useEffect(() => {
    const scroller = rootRef.current?.closest("[data-preview-scroll]");
    if (scroller instanceof HTMLElement) scroller.scrollTop = 0;
  }, [position, markdown]);

  if (!markdown) return null;

  return (
    <div ref={rootRef}>
      <DocsMarkdown content={markdown} />
    </div>
  );
}

function GuidePreviewFooter({
  ctx,
  position,
  onBack,
  onContinue,
}: {
  ctx: DocsPreviewShellContext;
  position: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { rawMarkdown, loading, error } = ctx;
  if (loading || error || !rawMarkdown) return null;

  const sectionCount = buildGuidePreviewSections(rawMarkdown).sections.length;
  if (sectionCount < 1) return null;

  const atStart = position <= 1;
  const atEnd = position >= sectionCount;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={atStart}
        aria-label="Previous section"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-rule text-signal transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-rule hover:border-white"
      >
        <MdChevronLeft aria-hidden className="size-5" />
      </button>

      <button
        type="button"
        onClick={onContinue}
        disabled={atEnd}
        className="inline-flex items-center justify-center rounded-md border border-signal bg-signal px-4 py-2 text-sm text-void transition-opacity hover:opacity-90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:opacity-100"
      >
        Continue
      </button>

      <span className="text-sm tabular-nums text-mute" aria-live="polite">
        {position}/{sectionCount}
      </span>

      {atEnd ? (
        <a
          href={identityGuideDocsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={READ_MORE_CLASS}
        >
          Read more
        </a>
      ) : null}
    </div>
  );
}

function GuidePreviewMobileMedia({
  rawMarkdown,
  position,
}: {
  rawMarkdown: string;
  position: number;
}) {
  const { youtubeEmbed, sections } = useMemo(
    () => buildGuidePreviewSections(rawMarkdown),
    [rawMarkdown]
  );
  const stageContent = resolvePreviewStageContent({
    youtubeEmbed: position === 1 ? youtubeEmbed : null,
    media: sections[position - 1]?.media,
  });

  if (!stageContent.youtubeSrc) return null;

  return (
    <div className="mb-8 aspect-video w-full overflow-hidden rounded-md border border-rule bg-black/40 md:hidden">
      <iframe
        title="Guide video"
        src={stageContent.youtubeSrc}
        className="h-full w-full border-0"
        loading="lazy"
        allow={YOUTUBE_ALLOW}
        allowFullScreen
      />
    </div>
  );
}

export default function PreviewPane({ source, onClose }: PreviewPaneProps) {
  const isEmbed = source ? isEmbedPreviewSource(source) : false;
  const [position, setPosition] = useState(1);

  useEffect(() => {
    setPosition(1);
  }, [source]);

  return (
    <DocsPreviewShell
      source={source}
      onClose={onClose}
      panelClassName={isEmbed ? "max-w-2xl" : "w-full md:w-[30%] md:max-w-none"}
      stage={(ctx) => {
        if (isEmbedPreviewSource(ctx.source)) return null;

        return (
          <GuidePreviewStage
            rawMarkdown={ctx.rawMarkdown}
            position={position}
            loading={ctx.loading}
            error={ctx.error}
          />
        );
      }}
      footer={(ctx) => {
        if (isEmbedPreviewSource(ctx.source)) {
          return (
            <a
              href={embedExternalUrl(ctx.source)}
              target="_blank"
              rel="noopener noreferrer"
              className={READ_MORE_CLASS}
            >
              Open in new tab
            </a>
          );
        }

        return (
          <GuidePreviewFooter
            ctx={ctx}
            position={position}
            onBack={() => setPosition((n) => Math.max(1, n - 1))}
            onContinue={() => setPosition((n) => n + 1)}
          />
        );
      }}
    >
      {(ctx) => {
        if (isEmbedPreviewSource(ctx.source)) {
          return (
            <iframe
              title={ctx.source.title}
              src={ctx.source.embedUrl}
              className="h-full w-full border-0 bg-white"
              loading="lazy"
            />
          );
        }

        return (
          <>
            {ctx.source.summary ? (
              <p className="text-mute leading-relaxed mb-6">{ctx.source.summary}</p>
            ) : null}

            <GuidePreviewMobileMedia rawMarkdown={ctx.rawMarkdown} position={position} />

            <GuidePreviewBody rawMarkdown={ctx.rawMarkdown} position={position} />
          </>
        );
      }}
    </DocsPreviewShell>
  );
}
