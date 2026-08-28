import Image from "next/image";
import Link from "next/link";

export default function PrismaLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="Prisma Events home"
    >
      <Image
        src="/Prisma_Logo_White.svg"
        width={28}
        height={28}
        alt=""
        className="shrink-0"
        aria-hidden
      />
      <Image
        src="/prisma-name-text.svg"
        width={140}
        height={60}
        alt="Prisma"
        className="h-8 w-auto max-w-none shrink-0"
      />
    </Link>
  );
}
