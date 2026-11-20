"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { safeReturnUrl } from "@/lib/navigation/returnUrl";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-[var(--color-void)]" />}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = safeReturnUrl(sessionStorage.getItem("prisma_enrol_return"));
      setReturnUrl(saved);
    } catch {
      // ignore storage restrictions
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12">
      <div className="card w-full max-w-lg p-7 sm:p-8 text-center space-y-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.3)] text-[var(--color-ok)] mx-auto">
          <FiCheckCircle className="text-2xl" />
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-ok)]">
            Enrolment received
          </div>
          <h1 className="display text-4xl sm:text-5xl leading-none uppercase text-white mt-2">
            Registration complete
          </h1>
          <p className="text-base text-[var(--color-mute)] mt-3 leading-relaxed">
            {type
              ? `Thank you for registering as ${type}. Your enrolment has been recorded.`
              : "Thank you for registering with Prisma Events. Your enrolment has been recorded."}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {returnUrl ? (
            <a href={returnUrl} className="btn btn-primary">
              <FiArrowLeft /> Return to Console
            </a>
          ) : (
            <Link href="/" className="btn btn-primary">
              Back to Enrol home
            </Link>
          )}
          <Link href="/identity/lookup" className="btn">
            <span>Verify DID</span>
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
