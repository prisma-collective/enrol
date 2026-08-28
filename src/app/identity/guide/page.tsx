"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PreviewPane from "@/components/docs-preview/PreviewPane";
import IdentityFeedbackBanner from "@/components/identity/IdentityFeedbackBanner";
import type { PreviewPaneSource } from "@/components/docs-preview/types";
import { IDENTITY_GUIDE_DOCS_PATH } from "@/lib/docs/constants";
import { DID_APP_URL } from "@/lib/did/client";

const GUIDE_PREVIEW: PreviewPaneSource = {
  kind: "docs",
  title: "Register a Decentralised ID",
  docsPath: IDENTITY_GUIDE_DOCS_PATH,
  label: "Guide",
};

export default function IdentityGuidePage() {
  const router = useRouter();
  const [preview, setPreview] = useState<PreviewPaneSource | null>(null);

  const openDashboard = () => {
    window.open(DID_APP_URL, "_blank", "noopener,noreferrer");
  };

  const onOpenGuidePreview = useCallback(() => {
    setPreview(GUIDE_PREVIEW);
  }, []);

  const onClosePreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className="flex min-h-[100svh] flex-col bg-black text-white">
      <IdentityFeedbackBanner />

      <div className="flex flex-1 items-center justify-center px-6 pb-10 pt-28 sm:pt-24">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-2xl font-semibold mb-6">Register Identity</h1>

          <p className="text-gray-300 mb-4 leading-relaxed">
            The following guide assists users in registering their Decentralised ID (DID) before
            continuing with enrolment. Follow the steps below.
          </p>

          <ol className="list-decimal list-inside text-gray-400 text-sm mb-8 space-y-2">
            <li>
              <button
                type="button"
                onClick={onOpenGuidePreview}
                className="text-white underline underline-offset-2 hover:text-gray-200 transition-colors cursor-pointer"
              >
                Read the guide
              </button>{" "}
              for background and instructions.
            </li>
            <li>Open the DIDs dashboard by clicking the image below.</li>
            <li>Create your DID in the dashboard.</li>
            <li>Return to this page when you are done.</li>
            <li>Proceed to verify your identity.</li>
          </ol>

          <div className="space-y-4">
            <button
              type="button"
              onClick={openDashboard}
              className="block w-full rounded-xl overflow-hidden border border-gray-600 hover:border-gray-400 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              aria-label="Open DIDs dashboard in a new tab"
            >
              <Image
                src="/dashboard_screenshot.png"
                alt="Open DIDs dashboard"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </button>

            <button
              type="button"
              onClick={() => router.push("/identity/lookup")}
              className="w-full bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>

      <PreviewPane source={preview} onClose={onClosePreview} />
    </div>
  );
}
