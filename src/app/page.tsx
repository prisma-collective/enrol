"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import SectionHeading from "@/components/SectionHeading";

const SLIDE_COUNT = 2;

const slides = [
  {
    id: "first-arrivals",
    mobileTab: "First arrivals",
    eyebrow: "Registration",
    title: "First arrivals",
    placeholder:
      "Please continue event enrolment by clicking here to select your role. The following pages contain forms to collect basic info.",
    secondary: "Choose your role and complete event enrolment",
    href: "/event",
  },
  {
    id: "returning",
    mobileTab: "Returning",
    eyebrow: "Identity",
    title: "Returning participant",
    placeholder:
      "Experienced participants may deepen their profile by connecting their wallet and registering a decentralised ID, used to sign verifiable claims.",
    secondary: "Create and verify your Cardano DID",
    href: "/identity/guide",
  },
] as const;

export default function Home() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(0);

  const goToPage = useCallback((next: number) => {
    setActivePage(Math.max(0, Math.min(next, SLIDE_COUNT - 1)));
  }, []);

  return (
    <section className="relative h-[100svh] overflow-hidden">
      {activePage > 0 ? (
        <button
          type="button"
          aria-label="Previous option"
          onClick={() => goToPage(activePage - 1)}
          className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 p-2 text-mute transition-colors duration-300 cursor-pointer hover:text-white md:block md:left-8"
        >
          <IoChevronBack size={20} aria-hidden />
        </button>
      ) : null}
      {activePage < SLIDE_COUNT - 1 ? (
        <button
          type="button"
          aria-label="Next option"
          onClick={() => goToPage(activePage + 1)}
          className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 p-2 text-mute/35 transition-colors duration-300 cursor-pointer hover:text-mute md:block md:right-8"
        >
          <IoChevronForward size={20} aria-hidden />
        </button>
      ) : null}

      <div
        className="absolute top-20 left-0 right-0 z-20 px-6 md:hidden"
        role="tablist"
        aria-label="Registration path"
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-start">
          <button
            type="button"
            role="tab"
            aria-selected={activePage === 0}
            tabIndex={activePage === 0 ? 0 : -1}
            onClick={() => goToPage(0)}
            className={
              activePage === 0
                ? "px-0 py-1 text-sm text-signal transition-colors duration-300 cursor-pointer"
                : "px-0 py-1 text-sm text-mute/25 transition-colors duration-300 cursor-pointer hover:text-mute/50"
            }
          >
            {slides[0].mobileTab}
          </button>
          <span className="mx-3 h-3.5 w-px shrink-0 bg-rule" aria-hidden />
          <button
            type="button"
            role="tab"
            aria-selected={activePage === 1}
            tabIndex={activePage === 1 ? 0 : -1}
            onClick={() => goToPage(1)}
            className={
              activePage === 1
                ? "px-0 py-1 text-sm text-signal transition-colors duration-300 cursor-pointer"
                : "px-0 py-1 text-sm text-mute/25 transition-colors duration-300 cursor-pointer hover:text-mute/50"
            }
          >
            {slides[1].mobileTab}
          </button>
        </div>
      </div>

      <div
        className="flex h-full transition-transform duration-500 ease-prisma motion-reduce:transition-none"
        style={{ transform: `translateX(-${activePage * 100}%)` }}
      >
        {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex h-full w-full shrink-0 items-center justify-center px-6 pt-32 pb-8 md:px-8 md:pt-16"
              aria-hidden={activePage !== index}
            >
              <button
                type="button"
                onClick={() => router.push(slide.href)}
                className="flex w-full max-w-[min(960px,92vw)] h-auto max-h-[min(720px,82svh)] md:h-full flex-col justify-between border border-rule bg-black/20 px-10 py-12 text-left transition-colors duration-300 cursor-pointer hover:border-mute/40 md:px-14 md:py-16"
              >
                <div>
                  <p className="mb-6 text-sm uppercase tracking-[0.2em] text-mute">
                    {slide.eyebrow}
                  </p>
                  <SectionHeading
                    as="h1"
                    className="mb-6 text-3xl sm:text-4xl"
                  >
                    {slide.title}
                  </SectionHeading>
                  <p className="mb-8 max-w-[540px] text-base leading-relaxed text-mute sm:text-lg">
                    {slide.placeholder}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-mute">
                  {slide.secondary}
                </p>
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}
