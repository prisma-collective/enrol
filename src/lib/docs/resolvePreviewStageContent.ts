import { youtubeEmbedUrl } from "./youtubeEmbedUrl";

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;

export type PreviewStageImage = {
  src: string;
  alt?: string;
};

export type PreviewStageContent = {
  youtubeSrc: string | null;
  images: PreviewStageImage[];
};

function isImageAssetSrc(src: string): boolean {
  try {
    const pathname = /^https?:\/\//i.test(src)
      ? new URL(src).pathname
      : src.split("?")[0];
    return IMAGE_EXT_RE.test(pathname);
  } catch {
    return IMAGE_EXT_RE.test(src);
  }
}

export function resolvePreviewStageContent(options: {
  youtubeEmbed?: string | null;
  media?: PreviewStageImage[] | null;
}): PreviewStageContent {
  let youtubeSrc = options.youtubeEmbed ?? null;
  const images: PreviewStageImage[] = [];

  for (const item of options.media ?? []) {
    const normalizedYoutube = youtubeEmbedUrl(item.src);
    if (normalizedYoutube) {
      youtubeSrc ??= normalizedYoutube;
      continue;
    }
    if (isImageAssetSrc(item.src)) {
      images.push(item);
    }
  }

  return { youtubeSrc, images };
}

export function hasPreviewStageContent(content: PreviewStageContent): boolean {
  return Boolean(content.youtubeSrc || content.images.length);
}
