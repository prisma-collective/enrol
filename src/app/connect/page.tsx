"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiArrowRight, FiChevronDown, FiChevronUp, FiShield } from "react-icons/fi";
import { HelpTip } from "@/components/HelpTip";

export default function WalletConnect() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--color-void)]" />}>
      <WalletConnectContent />
    </Suspense>
  );
}

function WalletConnectContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const submissionId = searchParams.get("submission_id");
  const respondentId = searchParams.get("respondent_id");
  const stakeholderType = searchParams.get("type");
  const [showDetails, setShowDetails] = useState(false);

  const hasMeta = Boolean(submissionId || respondentId || stakeholderType);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <section className="hero-grad-sticky px-5 sm:px-8 py-5 border-b border-[var(--color-rule)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs sm:text-sm font-medium text-[var(--color-hub-soft)] tracking-[0.2em] uppercase">
            Wallet setup
          </div>
          <h1 className="display text-4xl sm:text-5xl leading-none uppercase text-white mt-2">
            {name ? `Welcome, ${name}` : "Connect your wallet"}
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-mute)] mt-2.5 max-w-2xl leading-relaxed">
            Link an existing Cardano wallet or follow our guide to set up your Decentralised ID.
          </p>
        </div>
      </section>

      <main className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-5 py-10">
        <div className="card w-full max-w-md p-6 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FiShield className="text-[var(--color-hub-soft)] text-lg shrink-0" />
              <h2 className="text-lg sm:text-xl font-medium tracking-tight text-white">
                Next step
              </h2>
              <HelpTip label="About wallet setup" title="Your Cardano identity" align="right">
                Use your existing Eternl or Lace wallet to verify your DID, or follow the step-by-step identity guide if you are setting one up for the first time.
              </HelpTip>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/identity/lookup" className="btn btn-primary w-full py-2.5">
              <span>Connect existing wallet</span>
              <FiArrowRight />
            </Link>
            <Link href="/identity/guide" className="btn w-full py-2.5">
              <span>New to Cardano DIDs? Follow the guide</span>
            </Link>
          </div>

          {hasMeta && (
            <div className="pt-2 border-t border-[var(--color-rule)]">
              <button
                type="button"
                onClick={() => setShowDetails((s) => !s)}
                className="w-full flex items-center justify-between text-xs text-[var(--color-mute)] hover:text-white transition-colors cursor-pointer"
              >
                <span>Submission details</span>
                {showDetails ? <FiChevronUp /> : <FiChevronDown />}
              </button>

              {showDetails && (
                <div className="mt-2.5 rounded-lg bg-[var(--color-void)] border border-[var(--color-rule)] p-3 space-y-1.5 text-xs text-[var(--color-secondary)] font-mono">
                  {stakeholderType && <div>Role: {stakeholderType}</div>}
                  {submissionId && <div className="break-all">Submission: {submissionId}</div>}
                  {respondentId && <div className="break-all">Respondent: {respondentId}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
