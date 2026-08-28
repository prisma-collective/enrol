"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import PrismaLogo from "@/components/PrismaLogo";
import { getBackHref } from "@/lib/navigation/getBackHref";

const IDENTITY_BANNER_OFFSET_CLASS = "top-11 sm:top-0";

export default function SiteHeaderNav() {
  const pathname = usePathname();
  const hasFeedbackBanner =
    pathname === "/identity/guide" || pathname === "/identity/lookup";

  const shellClass = [
    "fixed left-0 z-50 p-6 print:hidden",
    hasFeedbackBanner ? IDENTITY_BANNER_OFFSET_CLASS : "top-0",
  ].join(" ");

  if (pathname === "/") {
    return (
      <div className={shellClass}>
        <PrismaLogo />
      </div>
    );
  }

  const backHref = getBackHref(pathname);
  if (!backHref) return null;

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
