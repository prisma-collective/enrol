"use client";

import { useCallback, useState } from "react";
import PreviewPane from "@/components/docs-preview/PreviewPane";
import type { PreviewPaneSource } from "@/components/docs-preview/types";
import {
  TALLY_FEEDBACK_EMBED_URL,
  TALLY_FEEDBACK_URL,
} from "@/lib/identity/constants";

const TALLY_PREVIEW: PreviewPaneSource = {
  kind: "embed",
  title: "Feedback",
  label: "Form",
  embedUrl: TALLY_FEEDBACK_EMBED_URL,
  externalUrl: TALLY_FEEDBACK_URL,
};

export default function IdentityFeedbackBanner() {
  const [preview, setPreview] = useState<PreviewPaneSource | null>(null);

  const onOpenTallyPreview = useCallback(() => {
    setPreview(TALLY_PREVIEW);
  }, []);

  const onClosePreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center px-6">
        <button
          type="button"
          onClick={onOpenTallyPreview}
          className="w-full max-w-2xl cursor-pointer rounded-b-lg border border-t-0 border-teal-600 bg-teal-600/20 px-4 py-2.5 text-center text-sm leading-snug text-teal-600 transition-colors duration-300 hover:bg-teal-600/30 md:rounded-b-xl"
        >
          This is an experimental feature and we&apos;d love to hear your feedback on it.
        </button>
      </div>

      <PreviewPane source={preview} onClose={onClosePreview} />
    </>
  );
}
