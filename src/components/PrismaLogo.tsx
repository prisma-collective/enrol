import Link from "next/link";

export default function PrismaLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 shrink-0 transition-opacity hover:opacity-90"
      aria-label="Prisma Enrol home"
    >
      <img
        src="/Prisma_Logo_White.svg"
        alt=""
        aria-hidden
        className="h-6 w-6 shrink-0"
      />
      <img
        src="/prisma-name-text.svg"
        alt="Prisma"
        className="h-[24px] w-auto shrink-0 translate-y-[2px]"
      />
      <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--color-mute)] pl-0.5">
        Enrol
      </span>
    </Link>
  );
}
