"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import PrismaLogo from "@/components/PrismaLogo";
import { getBackHref } from "@/lib/navigation/getBackHref";

const IDENTITY_BANNER_OFFSET_CLASS = "top-11 sm:top-0";

export default function SiteHeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFeedbackBanner =
    pathname === "/identity/guide" || pathname === "/identity/lookup";

  const shellClass = [
    "fixed left-0 z-50 p-6 print:hidden",
    hasFeedbackBanner ? IDENTITY_BANNER_OFFSET_CLASS : "top-0",
  ].join(" ");

  const returnUrl = searchParams.get("return");

  if (pathname === "/") {
    return (
      <>
        <div className={shellClass}>
          <PrismaLogo />
        </div>
        {returnUrl && (
          <a
            href={returnUrl}
            className="fixed right-0 top-0 z-50 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/20"
          >
            <IoChevronBack size={16} aria-hidden />
            Back to Console
          </a>
        )}
      </>
    );
  }

  const backHref = getBackHref(pathname);
  if (!backHref && !returnUrl) return null;

  // Prefer the external return URL (back to the console)
  if (returnUrl) {
    return (
      <>
        <div className={shellClass}>
          <a
            href={returnUrl}
            className="inline-flex items-center gap-0.5 text-sm text-white transition-colors duration-300 hover:text-signal bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-md"
          >
            <IoChevronBack size={16} aria-hidden />
            Back to Console
          </a>
        </div>
        {/* Also show a prominent fixed bar top-right */}
        <a
          href={returnUrl}
          className="fixed right-6 top-6 z-50 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-black/90"
        >
          <IoChevronBack size={18} aria-hidden />
          Back to Console
        </a>
      </>
    );
  }

  return (
    <div className={shellClass}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-0.5 text-sm text-mute transition-colors duration-300 hover:text-signal"
      >
        <IoChevronBack size={16} aria-hidden />
        Back
      </Link>
    </div>
  );
}