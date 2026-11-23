"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import PrismaLogo from "@/components/PrismaLogo";
import { getBackHref } from "@/lib/navigation/getBackHref";
import { safeReturnUrl } from "@/lib/navigation/returnUrl";

const RETURN_KEY = "prisma_enrol_return";

export default function SiteHeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryReturn = safeReturnUrl(searchParams.get("return"));
  const [storedReturn, setStoredReturn] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (queryReturn) {
        sessionStorage.setItem(RETURN_KEY, queryReturn);
        setStoredReturn(queryReturn);
      } else {
        const saved = safeReturnUrl(sessionStorage.getItem(RETURN_KEY));
        setStoredReturn(saved);
      }
    } catch {
      // ignore storage restrictions
    }
  }, [queryReturn]);

  const returnUrl = queryReturn ?? storedReturn;
  const backHref = pathname === "/register" ? "/event" : getBackHref(pathname);
  const onEvent = pathname.startsWith("/event") || pathname.startsWith("/register");
  const onIdentity = pathname.startsWith("/identity");

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[var(--color-rule)] bg-[var(--color-void)] px-5 sm:px-8 flex items-center justify-between gap-4 print:hidden">
      <div className="flex items-center gap-5 min-w-0">
        <PrismaLogo />

        <nav
          aria-label="Enrol sections"
          className="hidden sm:inline-flex items-center rounded-lg bg-[var(--color-panel-2)] border border-[var(--color-rule)] p-1 gap-1"
        >
          <Link
            href="/event"
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors whitespace-nowrap ${
              onEvent
                ? "border-white text-white bg-transparent"
                : "border-transparent text-[var(--color-mute)] hover:text-white"
            }`}
          >
            Event enrolment
          </Link>
          <Link
            href="/identity/guide"
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors whitespace-nowrap ${
              onIdentity
                ? "border-white text-white bg-transparent"
                : "border-transparent text-[var(--color-mute)] hover:text-white"
            }`}
          >
            Identity &amp; DID
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {backHref && (
          <Link href={backHref} className="btn btn-ghost btn-sm">
            <IoChevronBack size={15} aria-hidden />
            <span>Back</span>
          </Link>
        )}
        {returnUrl && (
          <a href={returnUrl} className="btn btn-sm">
            <IoChevronBack size={15} aria-hidden />
            <span>Console</span>
          </a>
        )}
      </div>
    </header>
  );
}
