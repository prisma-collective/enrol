"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowRight, FiArrowUpRight, FiBookOpen } from "react-icons/fi";
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Sticky solid-opaque page hero */}
      <section className="hero-grad-sticky px-5 sm:px-8 py-5 border-b border-[var(--color-rule)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs sm:text-sm font-medium text-[var(--color-hub-soft)] tracking-[0.2em] uppercase">
              Step 01 · Identity &amp; DID
            </div>
            <h1 className="display text-4xl sm:text-5xl leading-none uppercase text-white mt-2">
              Register your identity
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-mute)] mt-2.5 max-w-2xl leading-relaxed">
              Create your Cardano Decentralised ID (DID) before continuing with enrolment.
            </p>
          </div>
          <div className="shrink-0 self-start sm:self-center">
            <IdentityFeedbackBanner />
          </div>
        </div>
      </section>

      {/* Balanced 2-column guide & preview */}
      <main className="relative z-10 flex-1 px-5 sm:px-8 py-8 max-w-5xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Step checklist */}
          <section className="card p-6 lg:col-span-5 space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-medium tracking-tight text-white">
                How it works
              </h2>
              <p className="text-sm text-[var(--color-mute)] mt-1">
                Five short steps to set up and verify your DID.
              </p>
            </div>

            <ol className="space-y-3 text-sm text-[var(--color-secondary)]">
              <li className="flex items-start gap-3">
                <span className="pill text-xs font-mono shrink-0">01</span>
                <span>
                  <button
                    type="button"
                    onClick={onOpenGuidePreview}
                    className="text-[var(--color-flow)] hover:text-[var(--color-flow-hover)] underline underline-offset-4 cursor-pointer font-medium"
                  >
                    Read the setup guide
                  </button>{" "}
                  for background and instructions.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="pill text-xs font-mono shrink-0">02</span>
                <span>Open the Cardano DIDs dashboard on the right.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="pill text-xs font-mono shrink-0">03</span>
                <span>Create your DID using your Cardano wallet.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="pill text-xs font-mono shrink-0">04</span>
                <span>Return to this tab once confirmed on-chain.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="pill text-xs font-mono shrink-0">05</span>
                <span>Proceed to verify your DID status.</span>
              </li>
            </ol>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onOpenGuidePreview}
                className="btn btn-sm"
              >
                <FiBookOpen /> Read guide
              </button>
              <button
                type="button"
                onClick={() => router.push("/identity/lookup")}
                className="btn btn-primary btn-sm"
              >
                <span>Verify my DID</span>
                <FiArrowRight />
              </button>
            </div>
          </section>

          {/* Right: Interactive DIDs dashboard card */}
          <section className="card p-6 lg:col-span-7 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-medium tracking-tight text-white">
                  Cardano DIDs dashboard
                </h2>
                <p className="text-sm text-[var(--color-mute)] mt-1">
                  Opens in a new tab so you can keep your place here.
                </p>
              </div>
              <button
                type="button"
                onClick={openDashboard}
                className="btn btn-sm shrink-0"
              >
                Open <FiArrowUpRight />
              </button>
            </div>

            <button
              type="button"
              onClick={openDashboard}
              className="group block w-full rounded-xl overflow-hidden border border-[var(--color-rule-strong)] hover:border-white/35 transition-all cursor-pointer"
              aria-label="Open DIDs dashboard in a new tab"
            >
              <Image
                src="/dashboard_screenshot.png"
                alt="Open DIDs dashboard"
                width={720}
                height={460}
                className="w-full h-auto object-cover group-hover:scale-[1.015] transition-transform duration-300"
              />
            </button>

            <button
              type="button"
              onClick={() => router.push("/identity/lookup")}
              className="btn btn-primary w-full py-2.5"
            >
              <span>Already created? Proceed to verify DID</span>
              <FiArrowRight />
            </button>
          </section>
        </div>
      </main>

      <PreviewPane source={preview} onClose={onClosePreview} />
    </div>
  );
}
