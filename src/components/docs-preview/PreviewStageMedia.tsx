"use client";

import type { PreviewStageContent } from "@/lib/docs/resolvePreviewStageContent";

const YOUTUBE_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

type PreviewStageMediaProps = PreviewStageContent;

export default function PreviewStageMedia({
  youtubeSrc,
  images,
}: PreviewStageMediaProps) {
  if (!youtubeSrc && !images.length) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col items-center justify-center gap-4">
      {youtubeSrc ? (
        <div className="flex w-full max-w-4xl flex-1 items-center justify-center">
          <div className="aspect-video w-full overflow-hidden rounded-md border border-rule bg-black/40">
            <iframe
              title="Guide video"
              src={youtubeSrc}
              className="h-full w-full border-0"
              loading="lazy"
              allow={YOUTUBE_ALLOW}
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {images.map((image) => (
        <div
          key={image.src}
          className="flex max-h-full w-full max-w-4xl flex-1 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt ?? ""}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}
