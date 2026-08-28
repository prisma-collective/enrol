"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import {
  docsReadPath,
  DOCS_ORIGIN,
} from "@/lib/docs/constants";
import { fetchDocsRead, type DocsReadResponse } from "@/lib/docs/fetchDocsRead";
import { extractYoutubeEmbedFromMarkdown } from "@/lib/docs/extractYoutubeEmbed";
import { preprocessThirdPartyMarkdown } from "@/lib/docs/preprocessThirdPartyMarkdown";
import {
  isEmbedPreviewSource,
  type DocsPreviewShellChildren,
  type DocsPreviewShellContext,
  type PreviewPaneSource,
} from "./types";

type DocsPreviewShellProps = {
  source: PreviewPaneSource | null;
  onClose: () => void;
  children: DocsPreviewShellChildren;
  footer?: (ctx: DocsPreviewShellContext) => ReactNode;
  stage?: (ctx: DocsPreviewShellContext) => ReactNode;
  panelClassName?: string;
};

export default function DocsPreviewShell({
  source,
  onClose,
  children,
  footer,
  stage,
  panelClassName,
}: DocsPreviewShellProps) {
  const open = Boolean(source);
  const isEmbed = source ? isEmbedPreviewSource(source) : false;
  const [docs, setDocs] = useState<DocsReadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const html = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverflowY = html.style.overflowY;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    html.style.overflowY = "hidden";
    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
      html.style.overflowY = prevHtmlOverflowY;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!source || isEmbedPreviewSource(source)) {
      setDocs(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const path = docsReadPath(source.docsPath);

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchDocsRead(path, { withMedia: true });
        const data = (await response.json()) as DocsReadResponse;
        if (cancelled) return;
        setDocs(data);
        if (!data.success) setError(data.error || "Failed to load content");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [source]);

  const rawMarkdown = docs?.content ?? "";

  const { embedUrl: youtubeEmbed, markdown: markdownWithoutYoutube } = useMemo(
    () => extractYoutubeEmbedFromMarkdown(rawMarkdown),
    [rawMarkdown]
  );

  const displayMarkdown = useMemo(() => {
    if (!markdownWithoutYoutube) return "";
    return preprocessThirdPartyMarkdown(markdownWithoutYoutube, {
      stripImages: true,
      stripJsx: true,
      docsLinkOrigin: DOCS_ORIGIN,
    });
  }, [markdownWithoutYoutube]);

  const ctx: DocsPreviewShellContext | null = source
    ? {
        source,
        docs,
        loading: isEmbed ? false : loading,
        error: isEmbed ? null : error,
        displayMarkdown,
        rawMarkdown,
        youtubeEmbed,
      }
    : null;

  const footerContent = ctx && footer ? footer(ctx) : null;
  const panelWidth = panelClassName ?? "max-w-xl";

  return (
    <div
      className={`fixed inset-0 z-[60] print:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close preview"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      {open && ctx && stage?.(ctx)}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={source ? `${source.title} preview` : "Preview"}
        className={`absolute inset-y-0 right-0 z-[2] flex w-full flex-col border-l border-rule bg-void shadow-2xl transition-transform duration-500 ease-prisma ${open ? "translate-x-0" : "translate-x-full"} ${panelWidth}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-rule px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {source && (
              <>
                {source.label && (
                  <p className="text-xs uppercase tracking-[0.16em] text-mute mb-2">
                    {source.label}
                  </p>
                )}
                <h2 className="font-sans text-xl text-signal tracking-tight">{source.title}</h2>
                {(source.place || source.year) && (
                  <p className="mt-1 text-sm text-mute">
                    {[source.place, source.year].filter(Boolean).join(" · ")}
                  </p>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-rule px-2.5 py-1 text-sm text-mute hover:border-white hover:text-signal transition-colors duration-300 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div
          data-preview-scroll
          className={
            isEmbed
              ? "min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6"
          }
        >
          {!isEmbed && loading && (
            <div className="flex flex-col items-center justify-center py-16 text-mute">
              <CgSpinnerTwoAlt className="animate-spin mb-3" size={22} />
              <p className="text-sm">Loading from docs…</p>
            </div>
          )}

          {!isEmbed && !loading && error && (
            <div className="mb-6 rounded-md border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {(isEmbed || (!loading && !error)) && ctx && children(ctx)}
        </div>

        {footerContent != null && (
          <footer className="shrink-0 border-t border-rule px-5 py-4 sm:px-6">
            {footerContent}
          </footer>
        )}
      </aside>
    </div>
  );
}
