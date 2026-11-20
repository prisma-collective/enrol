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
      <button
        type="button"
        onClick={onOpenTallyPreview}
        className="pill cursor-pointer border-[rgba(45,212,191,0.35)] bg-[rgba(45,212,191,0.08)] text-[#5eead4] hover:bg-[rgba(45,212,191,0.16)] transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" />
        <span>Experimental · Share feedback</span>
      </button>

      <PreviewPane source={preview} onClose={onClosePreview} />
    </>
  );
}
